import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitHealthScore, LifecycleState } from './entities/unit-health-score.entity';
import { IotTelemetryLog } from '../iot/entities/iot-telemetry-log.entity';
import { Unit } from '../units/entities/unit.entity';
import { IotService } from '../iot/iot.service';

// ─── STATISTICAL HELPERS ──────────────────────────────────────────────────────
function getPercentile(arr: number[], q: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function getMedian(arr: number[]): number {
  return getPercentile(arr, 0.5);
}

function clamp(val: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, val));
}

function linearPenalty(value: number, safeLimit: number, criticalLimit: number): number {
  if (safeLimit < criticalLimit) {
    // Higher = worse (e.g. HDM, duty cycle)
    if (value <= safeLimit) return 0;
    if (value >= criticalLimit) return 1;
    return clamp((value - safeLimit) / (criticalLimit - safeLimit));
  } else {
    // Lower = worse (e.g. TIB, cooling rate)
    if (value >= safeLimit) return 0;
    if (value <= criticalLimit) return 1;
    return clamp((safeLimit - value) / (safeLimit - criticalLimit));
  }
}

// ─── CYCLE INTERFACE ──────────────────────────────────────────────────────────
interface Cycle {
  startIdx: number;
  endIdx: number;
  durationMin: number;
  isValid: boolean;
  maxCondenser: number;
  coolingRate: number;
  evapCoolingRate: number;
  evapDrop: number;
  cabEvapDiff: number;
  condRise: number;
  cabAmplitude: number;
}

// ─── SERVICE ─────────────────────────────────────────────────────────────────
@Injectable()
export class HealthScoreService {
  private readonly logger = new Logger(HealthScoreService.name);

  constructor(
    @InjectRepository(UnitHealthScore)
    private readonly healthScoreRepo: Repository<UnitHealthScore>,
    @InjectRepository(IotTelemetryLog)
    private readonly telemetryLogRepo: Repository<IotTelemetryLog>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    private readonly iotService: IotService,
  ) {}

  // ─── CRON: SETIAP JAM ──────────────────────────────────────────────────────
  @Cron(CronExpression.EVERY_HOUR)
  async calculateV4HealthScore() {
    this.logger.log('Starting hourly V4 Health Score calculation...');
    const units = await this.unitRepo.find({ where: { status: 'ACTIVE' } });

    for (const unit of units) {
      if (!unit.iot_unit_id) continue;
      try {
        await this.processUnitHealth(unit);
      } catch (error) {
        this.logger.error(`[V4] Error processing health for unit ${unit.serial_number}:`, error);
      }
    }
    this.logger.log(`[V4] Calculation complete for ${units.length} units.`);
  }

  // ─── MAIN PROCESSING ───────────────────────────────────────────────────────
  private async processUnitHealth(unit: Unit) {
    // 1. Lifecycle State
    let state = LifecycleState.LEARNING;
    if (unit.commissioning_date) {
      const daysActive = (Date.now() - new Date(unit.commissioning_date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysActive > 6) state = LifecycleState.ACTIVE;
      else if (daysActive > 2) state = LifecycleState.PROVISIONAL;
    }

    const targetMin = unit.target_temp_min ?? -2;
    const targetMax = unit.target_temp_max ?? 10;

    // 2. Fetch last 24h telemetry
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logs = await this.telemetryLogRepo
      .createQueryBuilder('log')
      .where('log.unit_id = :unitId', { unitId: unit.id })
      .andWhere('log.recorded_at >= :yesterday', { yesterday })
      .orderBy('log.recorded_at', 'ASC')
      .getMany();

    if (logs.length === 0) {
      this.logger.debug(`[V4] No data for unit ${unit.serial_number} in the last 24h.`);
      return;
    }

    // 3. Kalibrasi Sensor (1-point offset)
    const calLogs = logs.map(log => ({
      ...log,
      temp_cabinet:   (log.temp_cabinet   ?? 0) + (unit.cal_temp_cabinet_offset   || 0),
      temp_evap:      (log.temp_evaporator ?? 0) + (unit.cal_temp_evap_offset      || 0),
      temp_condenser: (log.temp_condenser  ?? 0) + (unit.cal_temp_condenser_offset || 0),
      voltage:        (log.voltage         ?? 0) + (unit.cal_voltage_offset         || 0),
      current:        (log.current         ?? 0),
    }));

    // ─── KONSTANTA STANDAR KELISTRIKAN REFRIGERASI ─────────────────────────
    // Fan Evaporator umumnya tetap menyala saat kompresor istirahat (0.03A – 0.30A).
    // Arus <= 0.35A dikategorikan sebagai STANDBY (Kompresor OFF, Fan Evap ON), BUKAN kompresor berjalan!
    const STANDBY_FAN_MAX_CURRENT = 2.0; // Arus <= 2.0A = Standby (Kompresor OFF / Fan Evap Standby / Defrost)

    // ─── BAGIAN A: METRIK DASAR ─────────────────────────────────────────────
    let validTIBCount = 0, totalValidCount = 0, hdmAcc = 0;
    let onTimeMs = 0, validTimeMs = 0;

    // Voltage: Batas aman tegangan kerja kompresor 195V – 245V (PLN standar 220V ±10%)
    let voltAnomalyCount = 0, voltTotalCount = 0;
    const VOLT_MIN = 195, VOLT_MAX = 245;

    calLogs.forEach(log => {
      const isDoorOpen = !!(log.is_door1_open || log.is_door2_open || log.is_door3_open || log.is_door4_open);
      const current = log.current ?? 0;

      if (!isDoorOpen) {
        validTimeMs += 10000;
        // Kompresor hanya dihitung ON jika arus melebihi threshold fan evaporator standby
        if (current > STANDBY_FAN_MAX_CURRENT) onTimeMs += 10000;
      }

      if (!isDoorOpen && log.temp_cabinet !== -127 && log.temp_cabinet !== null) {
        totalValidCount++;
        if (log.temp_cabinet >= targetMin && log.temp_cabinet <= targetMax) validTIBCount++;
        hdmAcc += Math.max(0, log.temp_cabinet - targetMax) * (10 / 60);
      }

      // Voltage anomaly check (fluktuasi tegangan yang membebani motor kompresor)
      const v = log.voltage ?? 0;
      if (v > 10) { // ignore 0 (no sensor reading)
        voltTotalCount++;
        if (v < VOLT_MIN || v > VOLT_MAX) voltAnomalyCount++;
      }
    });

    const tibPercentage = totalValidCount > 0 ? (validTIBCount / totalValidCount) * 100 : 0;
    const validHours = totalValidCount * (10 / 3600);
    const hdmPerHour = validHours > 0 ? hdmAcc / validHours : 0;
    const dutyCyclePercentage = validTimeMs > 0 ? (onTimeMs / validTimeMs) * 100 : 0;
    const voltageAnomalyRatio = voltTotalCount > 0 ? voltAnomalyCount / voltTotalCount : 0;

    // ─── BAGIAN B: CYCLE SEGMENTATION ──────────────────────────────────────
    const cycles: Cycle[] = [];
    let currentCycle: Partial<Cycle> | null = null;
    let isOn = false;
    let onStartTime = 0;

    calLogs.forEach((log, i) => {
      const current = log.current ?? 0;
      const logTime = log.recorded_at.getTime();

      // Kompresor ON jika arus > STANDBY_FAN_MAX_CURRENT
      if (current > STANDBY_FAN_MAX_CURRENT && !isOn) {
        isOn = true;
        onStartTime = logTime;
        currentCycle = { startIdx: i };
      } else if (current <= STANDBY_FAN_MAX_CURRENT && isOn) {
        isOn = false;
        if (currentCycle) {
          currentCycle.endIdx = i;
          currentCycle.durationMin = (logTime - onStartTime) / 60000;
          cycles.push(currentCycle as Cycle);
          currentCycle = null;
        }
      }
    });

    // ─── BAGIAN C: PER-CYCLE FEATURE EXTRACTION ────────────────────────────
    let validCyclesCount = 0, shortCycles = 0, longCyclesCount = 0;
    let sumCoolingRate = 0, validCoolingRateCount = 0;
    let sumCondenserPeak = 0;
    let sumEvapCoolingRate = 0, sumEvapDrop = 0, sumCabEvapDiff = 0;
    let sumCondRise = 0, sumCabAmplitude = 0;

    cycles.forEach(cycle => {
      let isDoorOpen = false;
      let maxCond = -999;
      for (let i = cycle.startIdx; i <= (cycle.endIdx ?? calLogs.length - 1); i++) {
        const l = calLogs[i];
        if (!!(l.is_door1_open || l.is_door2_open || l.is_door3_open || l.is_door4_open)) isDoorOpen = true;
        if (l.temp_condenser !== null && l.temp_condenser > maxCond) maxCond = l.temp_condenser;
      }
      cycle.isValid = !isDoorOpen;
      cycle.maxCondenser = maxCond;

      if (!cycle.isValid) return;

      validCyclesCount++;
      if (cycle.durationMin < 5) shortCycles++;
      // Kompresor normalnya mati tiap 2 jam (120 menit).
      // Jika jalan > 120 menit non-stop = anomali durasi kerja (kondensor kotor / freon kurang / ruang sempit)
      if (cycle.durationMin > 120) longCyclesCount++;
      if (maxCond > -999) sumCondenserPeak += maxCond;

      const startT = calLogs[cycle.startIdx].recorded_at.getTime();

      // Cabinet Cooling Rate (regresi 2–12 menit)
      let sT = 0, sY = 0, sTY = 0, sT2 = 0, ptC = 0;
      for (let i = cycle.startIdx; i <= (cycle.endIdx ?? calLogs.length - 1); i++) {
        const l = calLogs[i];
        const dtMin = (l.recorded_at.getTime() - startT) / 60000;
        if (dtMin >= 2 && dtMin <= 12 && l.temp_cabinet !== null && l.temp_cabinet !== -127) {
          sT += dtMin; sY += l.temp_cabinet; sTY += dtMin * l.temp_cabinet; sT2 += dtMin * dtMin; ptC++;
        }
      }
      if (ptC >= 3) {
        const meanT = sT / ptC, meanY = sY / ptC;
        const denom = sT2 - ptC * meanT * meanT;
        const slope = denom === 0 ? 0 : (sTY - ptC * meanT * meanY) / denom;
        cycle.coolingRate = Math.max(0, -slope);
        sumCoolingRate += cycle.coolingRate;
        validCoolingRateCount++;
      } else {
        cycle.coolingRate = 0;
      }

      // V3/V4 Evaporator & Condenser Features
      let evapPreArr: number[] = [], condPreArr: number[] = [];
      let evapDuringArr: number[] = [], cabDuringArr: number[] = [], condDuringArr: number[] = [];
      let cabCycleArr: number[] = [];
      let sT_e = 0, sY_e = 0, sTY_e = 0, sT2_e = 0, ptC_e = 0;

      for (let i = Math.max(0, cycle.startIdx - 15); i < cycle.startIdx; i++) {
        const l = calLogs[i];
        const dtS = (l.recorded_at.getTime() - startT) / 1000;
        if (dtS >= -120 && dtS <= -20) {
          if (l.temp_evaporator !== null && l.temp_evaporator !== undefined && l.temp_evaporator !== -127)
            evapPreArr.push(l.temp_evaporator);
          if (l.temp_condenser !== null && l.temp_condenser !== undefined && l.temp_condenser !== -127)
            condPreArr.push(l.temp_condenser);
        }
      }

      for (let i = cycle.startIdx; i <= (cycle.endIdx ?? calLogs.length - 1); i++) {
        const l = calLogs[i];
        const dtS = (l.recorded_at.getTime() - startT) / 1000;
        const dtMin = dtS / 60;
        const eV = l.temp_evaporator, cV = l.temp_condenser, cabV = l.temp_cabinet;

        if (dtS >= 30 && dtS <= 180 && eV !== null && eV !== undefined && eV !== -127) {
          sT_e += dtMin; sY_e += eV; sTY_e += dtMin * eV; sT2_e += dtMin * dtMin; ptC_e++;
        }

        const midWindow = dtS >= 30 && dtS <= (cycle.durationMin * 60) - 30;
        if (midWindow) {
          if (eV !== null && eV !== undefined && eV !== -127) evapDuringArr.push(eV);
          if (cabV !== null && cabV !== undefined && cabV !== -127) cabDuringArr.push(cabV);
          if (cV !== null && cV !== undefined && cV !== -127) condDuringArr.push(cV);
        }
        if (cabV !== null && cabV !== undefined && cabV !== -127) cabCycleArr.push(cabV);
      }

      if (ptC_e >= 3) {
        const meanT = sT_e / ptC_e, meanY = sY_e / ptC_e;
        const denom = sT2_e - ptC_e * meanT * meanT;
        const slope = denom === 0 ? 0 : (sTY_e - ptC_e * meanT * meanY) / denom;
        cycle.evapCoolingRate = Math.max(0, -slope);
      } else cycle.evapCoolingRate = 0;

      cycle.evapDrop    = getMedian(evapPreArr) - getPercentile(evapDuringArr, 0.10);
      cycle.cabEvapDiff = getMedian(cabDuringArr) - getMedian(evapDuringArr);
      cycle.condRise    = getMedian(condDuringArr) - getMedian(condPreArr);
      cycle.cabAmplitude= getPercentile(cabCycleArr, 0.95) - getPercentile(cabCycleArr, 0.05);

      sumEvapCoolingRate += cycle.evapCoolingRate;
      sumEvapDrop        += cycle.evapDrop;
      sumCabEvapDiff     += cycle.cabEvapDiff;
      sumCondRise        += cycle.condRise;
      sumCabAmplitude    += cycle.cabAmplitude;
    });

    const startsPerHour      = validHours > 0 ? cycles.length / validHours : 0;
    const shortCycleFraction = validCyclesCount > 0 ? shortCycles / validCyclesCount : 0;
    const avgCoolingRate     = validCoolingRateCount > 0 ? sumCoolingRate / validCoolingRateCount : 0;
    const avgCondenserPeak   = validCyclesCount > 0 ? sumCondenserPeak / validCyclesCount : 0;
    const avgEvapCoolingRate = validCyclesCount > 0 ? sumEvapCoolingRate / validCyclesCount : 0;
    const avgEvapDrop        = validCyclesCount > 0 ? sumEvapDrop / validCyclesCount : 0;
    const avgCabEvapDiff     = validCyclesCount > 0 ? sumCabEvapDiff / validCyclesCount : 0;
    const avgCondRise        = validCyclesCount > 0 ? sumCondRise / validCyclesCount : 0;
    const avgCabAmplitude    = validCyclesCount > 0 ? sumCabAmplitude / validCyclesCount : 0;

    // ─── BAGIAN D [V4 BARU]: DOOR RECOVERY ────────────────────────────────
    let doorWasOpen = false;
    const doorCloseEvents: { idx: number; closeTime: number }[] = [];

    calLogs.forEach((log, i) => {
      const isOpen = !!(log.is_door1_open || log.is_door2_open || log.is_door3_open || log.is_door4_open);
      if (doorWasOpen && !isOpen) {
        doorCloseEvents.push({ idx: i, closeTime: log.recorded_at.getTime() });
      }
      doorWasOpen = isOpen;
    });

    // Ambil jumlah event pintu dari IotService real-time counter (lebih akurat dari log DB throttled 5mnt)
    const doorEventCount = this.iotService.getDoorEventCountToday(unit.id);

    let totalRecoveryMin = 0, recoveryCount = 0;
    doorCloseEvents.forEach(event => {
      for (let i = event.idx; i < calLogs.length; i++) {
        const l = calLogs[i];
        const dtMin = (l.recorded_at.getTime() - event.closeTime) / 60000;
        if (dtMin > 60) break; // max tunggu 60 menit
        if (l.temp_cabinet !== null && l.temp_cabinet !== undefined && l.temp_cabinet <= targetMax) {
          totalRecoveryMin += dtMin;
          recoveryCount++;
          break;
        }
      }
    });
    const avgDoorRecoveryMin = recoveryCount > 0 ? totalRecoveryMin / recoveryCount : 0;
    // Penalti: ≤10 menit aman, ≥30 menit kritis
    const pDoorRecovery = linearPenalty(avgDoorRecoveryMin, 10, 30);

    // ─── BAGIAN E [V4 BARU]: DEFROST DETECTION ────────────────────────────
    // Deteksi defrost dengan 2 metode:
    // Metode 1: Kompresor OFF (current <= 0.5) + evap naik > 3°C (butuh sensor arus)
    // Metode 2 (fallback): evap naik > 4°C dalam window 5+ menit berturut-turut
    //   (digunakan jika current selalu 0 = tidak ada PZEM)
    interface DefrostSeg { durationMin: number; evapRise: number; isAbnormal: boolean; }
    const defrostSegs: DefrostSeg[] = [];

    // Deteksi apakah ada data arus yang valid (sensor arus terpasang)
    const hasCurrentSensor = calLogs.some(l => (l.current ?? 0) > 0.1);

    if (hasCurrentSensor) {
      // ── Metode 1: Berbasis kompresor OFF ──
      let offStart: number | null = null;
      let offStartIdx: number | null = null;

      calLogs.forEach((log, i) => {
        const current = log.current ?? 0;
        if (current <= STANDBY_FAN_MAX_CURRENT && offStart === null) {
          offStart = log.recorded_at.getTime();
          offStartIdx = i;
        } else if (current > STANDBY_FAN_MAX_CURRENT && offStart !== null && offStartIdx !== null) {
          const durationMin = (log.recorded_at.getTime() - offStart) / 60000;
          if (durationMin >= 5) {
            const evapTemps = calLogs.slice(offStartIdx, i)
              .map(l => l.temp_evaporator)
              .filter((t): t is number => t !== null && t !== undefined && t !== -127);

            if (evapTemps.length >= 3) {
              const evapRise = evapTemps[evapTemps.length - 1] - evapTemps[0];
              if (evapRise > 3) {
                const isAbnormal = durationMin > 60 || evapRise > 25;
                defrostSegs.push({ durationMin, evapRise, isAbnormal });
              }
            }
          }
          offStart = null;
          offStartIdx = null;
        }
      });
    } else {
      // ── Metode 2 (fallback): Berbasis suhu evap langsung, tanpa sensor arus ──
      // Scan window geser 5 menit: cari titik di mana evap naik > 4°C
      const WINDOW_ROWS = 6; // ~5 menit jika log tiap ~50 detik
      const EVAP_RISE_THRESHOLD = 4.0; // °C kenaikan minimum untuk dianggap defrost
      let inDefrost = false;
      let defrostStart = 0;
      let defrostStartIdx = 0;

      for (let i = WINDOW_ROWS; i < calLogs.length; i++) {
        const cur = calLogs[i];
        const ref = calLogs[i - WINDOW_ROWS];
        const curEvap = cur.temp_evaporator;
        const refEvap = ref.temp_evaporator;

        if (curEvap === null || curEvap === undefined || curEvap === -127) continue;
        if (refEvap === null || refEvap === undefined || refEvap === -127) continue;

        const evapRise = curEvap - refEvap;

        if (!inDefrost && evapRise >= EVAP_RISE_THRESHOLD) {
          inDefrost = true;
          defrostStart = ref.recorded_at.getTime();
          defrostStartIdx = i - WINDOW_ROWS;
        } else if (inDefrost && evapRise < 1.0) {
          // Defrost selesai saat evap berhenti naik
          const durationMin = (cur.recorded_at.getTime() - defrostStart) / 60000;
          // Ambil evapRise total selama segmen
          const segTemps = calLogs.slice(defrostStartIdx, i)
            .map(l => l.temp_evaporator)
            .filter((t): t is number => t !== null && t !== undefined && t !== -127);
          const totalEvapRise = segTemps.length > 1 ? segTemps[segTemps.length - 1] - segTemps[0] : 0;
          const isAbnormal = durationMin > 60 || totalEvapRise > 25;
          defrostSegs.push({ durationMin, evapRise: totalEvapRise, isAbnormal });
          inDefrost = false;
        }
      }
      // Tutup segmen yang masih terbuka di akhir data
      if (inDefrost) {
        const last = calLogs[calLogs.length - 1];
        const durationMin = (last.recorded_at.getTime() - defrostStart) / 60000;
        defrostSegs.push({ durationMin, evapRise: EVAP_RISE_THRESHOLD, isAbnormal: durationMin > 60 });
      }
    }

    const defrostCycleCount      = defrostSegs.length;
    const defrostAnomalyFraction = defrostCycleCount > 0
      ? defrostSegs.filter(d => d.isAbnormal).length / defrostCycleCount : 0;
    // Penalti: ≤10% anomali aman, ≥60% kritis
    const pDefrost = linearPenalty(defrostAnomalyFraction, 0.1, 0.6);

    // ─── BAGIAN F [V4 BARU]: BASELINE COMMISSIONING ───────────────────────
    // Ambil 14 catatan pertama (hari pertama unit aktif) sebagai baseline
    const baselineScores = await this.healthScoreRepo.find({
      where: { unit_id: unit.id },
      order: { date: 'ASC' },
      take: 14,
    });

    let subBaselineScore = 100; // Default full score jika belum ada baseline
    let baselineTIBDelta = 0, baselineCoolingDelta = 0;

    if (baselineScores.length >= 7) { // Butuh minimal 7 hari untuk perbandingan
      const blTIB  = baselineScores.reduce((s, r) => s + (r.tib_percentage ?? tibPercentage), 0) / baselineScores.length;
      const blCool = baselineScores.reduce((s, r) => s + (r.cabinet_cooling_rate ?? avgCoolingRate), 0) / baselineScores.length;

      baselineTIBDelta     = Math.max(0, blTIB - tibPercentage);   // degradasi TIB
      baselineCoolingDelta = Math.max(0, blCool - avgCoolingRate); // degradasi cooling

      // Penalti: TIB turun >5% = penalti, >15% = kritis. Cooling turun >0.05 = penalti, >0.20 = kritis
      const pBLTIB  = linearPenalty(baselineTIBDelta, 5, 15);
      const pBLCool = linearPenalty(baselineCoolingDelta, 0.05, 0.20);
      const baselinePenalty = (pBLTIB * 0.6) + (pBLCool * 0.4);
      subBaselineScore = 100 * (1 - baselinePenalty);
    }

    // ─── BAGIAN G: KOMPRESSOR ANOMALI (ARUS) ──────────────────────────────
    const normalAmpere = unit.compressor_normal_ampere || 1.5;
    const tolerance    = unit.ampere_tolerance || 0.3;
    let compressorAnomalyCount = 0, totalCompressorOnCount = 0;
    let criticalOverAmpCount = 0; // Lonjakan ekstrem > 12A atau kompresor melemah

    calLogs.forEach(log => {
      const current = log.current ?? 0;
      // Kompresor dievaluasi HANYA saat ON (di atas batas standby Fan Evap 0.35A)
      // Arus <= 0.35A adalah Standby Fan Evaporator normal, BUKAN kebocoran arus kompresor!
      if (current > STANDBY_FAN_MAX_CURRENT) {
        totalCompressorOnCount++;
        // Deteksi lonjakan arus ekstrem / kompresor melemah (> 12A atau melebihi 2x normal ampere)
        if (current >= 12.0 || current > Math.max(8.0, normalAmpere * 2.2)) {
          criticalOverAmpCount++;
          compressorAnomalyCount += 2; // Beri bobot dobel untuk lonjakan ekstrem
        } else if (current < (normalAmpere - tolerance) || current > (normalAmpere + tolerance)) {
          compressorAnomalyCount++;
        }
      }
    });
    const compressorAnomalyRatio = totalCompressorOnCount > 0
      ? Math.min(1.0, compressorAnomalyCount / totalCompressorOnCount)
      : 0;

    // ─── BAGIAN H: HITUNG SEMUA PENALTI V4 ───────────────────────────────

    // -- Kabinet (bobot 28%) --
    // TIB: ≥95% aman, ≤70% kritis
    const pTIB  = linearPenalty(tibPercentage, 95, 70);
    // HDM: ≤1.0 aman, ≥5.0 kritis
    const pHDM  = linearPenalty(hdmPerHour, 1.0, 5.0);
    // Cabinet Cooling Rate: ≥0.20 aman, ≤0.05 kritis
    const pCool = (validCoolingRateCount === 0) ? 0 : linearPenalty(avgCoolingRate, 0.20, 0.05);
    // Door Recovery: ≤10 menit aman, ≥30 menit kritis (sudah dihitung di atas)

    const subCabinetPenalty = (pTIB * 0.30) + (pHDM * 0.30) + (pCool * 0.15) + (pDoorRecovery * 0.25);
    const subCabinetScore   = 100 * (1 - subCabinetPenalty);

    // -- Evaporator (bobot 20%) --
    // Evap Cooling Rate: ≥0.50 aman, ≤0.10 kritis
    const pEvapCool    = (avgEvapCoolingRate === 0) ? 0 : linearPenalty(avgEvapCoolingRate, 0.30, 0.05); // Skip penalty jika tidak ada data siklus evap valid
    // Evap Drop: ≥15°C aman, ≤5°C kritis
    const pEvapDrop    = linearPenalty(avgEvapDrop, 8, 2); // Chiller 2-4C, evap -10C: drop ~8C/siklus adalah NORMAL
    // Cab-Evap Diff: ≤15°C aman, ≥25°C kritis
    const pCabEvapDiff = linearPenalty(avgCabEvapDiff, 15, 25);
    // Defrost Anomaly: ≤10% aman, ≥60% kritis (sudah dihitung)

    const subEvapPenalty = (pEvapCool * 0.35) + (pEvapDrop * 0.25) + (pCabEvapDiff * 0.25) + (pDefrost * 0.15);
    const subEvapScore   = 100 * (1 - subEvapPenalty);

    // -- Kondensor (bobot 17%) --
    // Peak: ≤45°C aman, ≥55°C kritis
    const pCondPeak = linearPenalty(avgCondenserPeak, 45, 60); // Unit tanpa AC ruangan, peak 60C baru kritis
    // Rise per siklus: ≤15°C aman, ≥25°C kritis
    const pCondRise = linearPenalty(avgCondRise, 35, 50); // Ambient pabrik 28-35C, rise 35C NORMAL

    const subCondenserScore = 100 * (1 - ((pCondPeak * 0.55) + (pCondRise * 0.45)));

    // -- Elektrikal & Kompresor (bobot 22%) --
    // Duty Cycle: ≤60% aman, ≥80% kritis
    const pDuty   = linearPenalty(dutyCyclePercentage, 75, 92); // Pabrik ambient tinggi, duty 75% masih aman
    // Starts/Hour: ≤4x aman, ≥6x kritis
    const pStarts = linearPenalty(startsPerHour, 8, 20); // 33.8x/jam saat startup = anomali, steady state 4-8x/jam
    // Short Cycle: ≤10% aman, ≥30% kritis
    const pShort  = linearPenalty(shortCycleFraction, 0.10, 0.30);
    // Anomali Arus & Lonjakan Kompresor: ≤5% aman, ≥40% kritis
    const pAmp    = linearPenalty(compressorAnomalyRatio, 0.05, 0.40);
    // Voltage Anomali: ≤2% aman, ≥15% kritis (tegangan tidak stabil bikin kompresor narik arus besar)
    const pVolt   = linearPenalty(voltageAnomalyRatio, 0.05, 0.20); // PLN Indonesia toleransi 5%, 20% baru kritis
    // Durasi kompresor jalan > 2 jam non-stop (normalnya cut-off tiap 2 jam)
    const pLongCycle = linearPenalty(longCyclesCount, 0, 2);

    const subElecPenalty = (pDuty * 0.20) + (pStarts * 0.08) + (pShort * 0.12) + (pAmp * 0.30) + (pVolt * 0.18) + (pLongCycle * 0.12); // pStarts diturunkan (anomali startup), pAmp lebih akurat
    const subElecScore   = 100 * (1 - subElecPenalty);

    // -- Baseline (bobot 13%) -- sudah dihitung di atas

    // ─── OVERALL SCORE V4 ────────────────────────────────────────────────
    // Kabinet(28%) + Evap(20%) + Cond(17%) + Elec(22%) + Baseline(13%) = 100%
    const overallScore = clamp(
      (subCabinetScore   * 0.28) +
      (subEvapScore      * 0.20) +
      (subCondenserScore * 0.17) +
      (subElecScore      * 0.22) +
      (subBaselineScore  * 0.13),
      0, 100,
    );

    // ─── DIAGNOSTIC EVIDENCE (0–1) ────────────────────────────────────────
    // Kondensor Kotor / Ventilasi Bermasalah: kenaikan suhu kondensor + kompresor jalan > 2 jam + duty cycle tinggi
    const evidenceCondenser  = clamp((0.25 * pCondRise) + (0.20 * pCondPeak) + (0.20 * pDuty) + (0.15 * pLongCycle) + (0.10 * pHDM) + (0.10 * pVolt), 0, 1);
    // Evaporator Masalah: beda suhu cab-evap + defrost abnormal + laju drop lambat
    const evidenceEvaporator = clamp((0.30 * pCabEvapDiff) + (0.20 * pHDM) + (0.20 * pDuty) + (0.15 * pEvapCool) + (0.15 * pDefrost), 0, 1);
    // Pendinginan Lemah / Freon Kurang / Kompresi Melemah: suhu tidak turun + kompresor jalan terus + arus kerja abnormal
    const evidenceWeak       = clamp((0.25 * pHDM) + (0.20 * pCool) + (0.20 * pDuty) + (0.15 * pLongCycle) + (0.10 * pAmp) + (0.10 * pEvapDrop), 0, 1);

    // ─── SIMPAN KE DATABASE ───────────────────────────────────────────────
    const dateStr = new Date().toISOString().split('T')[0];
    let healthScore = await this.healthScoreRepo.findOne({ where: { unit_id: unit.id, date: dateStr } });

    if (!healthScore) {
      healthScore = this.healthScoreRepo.create({ unit_id: unit.id, date: dateStr });
    }

    // Lifecycle & overall
    healthScore.lifecycle_state  = state;
    healthScore.overall_score    = overallScore;
    healthScore.confidence_score = totalValidCount > (24 * 360) ? 1.0 : totalValidCount / (24 * 360);

    // Subsystem scores
    healthScore.sub_cabinet_score    = subCabinetScore;
    healthScore.sub_evaporator_score = subEvapScore;
    healthScore.sub_condenser_score  = subCondenserScore;
    healthScore.sub_electrical_score = subElecScore;
    healthScore.sub_baseline_score   = subBaselineScore;

    // Base metrics
    healthScore.tib_percentage        = tibPercentage;
    healthScore.hdm_value             = hdmPerHour;
    healthScore.cabinet_cooling_rate  = avgCoolingRate;
    healthScore.condenser_peak        = avgCondenserPeak;
    healthScore.duty_cycle_percentage = dutyCyclePercentage;
    healthScore.starts_per_hour       = startsPerHour;

    // V3 features
    healthScore.evap_cooling_rate  = avgEvapCoolingRate;
    healthScore.evap_drop_amplitude= avgEvapDrop;
    healthScore.cab_evap_diff      = avgCabEvapDiff;
    healthScore.condenser_rise     = avgCondRise;
    healthScore.cabinet_amplitude  = avgCabAmplitude;

    // Evidence
    healthScore.evidence_condenser_issue  = evidenceCondenser;
    healthScore.evidence_evaporator_issue = evidenceEvaporator;
    healthScore.evidence_weak_cooling     = evidenceWeak;

    // V4 NEW
    healthScore.door_avg_recovery_min   = avgDoorRecoveryMin;
    healthScore.door_event_count        = doorEventCount;
    healthScore.voltage_anomaly_ratio   = voltageAnomalyRatio;
    healthScore.defrost_cycle_count     = defrostCycleCount;
    healthScore.defrost_anomaly_fraction= defrostAnomalyFraction;
    healthScore.baseline_tib_delta      = baselineTIBDelta;
    healthScore.baseline_cooling_delta  = baselineCoolingDelta;

    await this.healthScoreRepo.save(healthScore);

    this.logger.log(
      `[V4] ${unit.serial_number}: Overall=${overallScore.toFixed(1)} ` +
      `Cab=${subCabinetScore.toFixed(1)} Evap=${subEvapScore.toFixed(1)} ` +
      `Cond=${subCondenserScore.toFixed(1)} Elec=${subElecScore.toFixed(1)} ` +
      `Base=${subBaselineScore.toFixed(1)} ` +
      `| DoorRec=${avgDoorRecoveryMin.toFixed(1)}min Defrost=${defrostCycleCount}x VoltAnomaly=${(voltageAnomalyRatio*100).toFixed(1)}%`,
    );

    return healthScore;
  }

  // ─── PUBLIC API METHODS ───────────────────────────────────────────────────
  async calculateSingleUnitHealth(unitId: string) {
    const unit = await this.unitRepo.findOne({ where: { id: unitId } });
    if (!unit) throw new Error('Unit tidak ditemukan');
    return this.processUnitHealth(unit);
  }

  async getActiveHealthScores() {
    return this.healthScoreRepo
      .createQueryBuilder('score')
      .innerJoinAndSelect('score.unit', 'unit')
      .where('score.date = (SELECT MAX(s2.date) FROM unit_health_scores s2 WHERE s2.unit_id = score.unit_id)')
      .getMany();
  }

  async getUnitHealthScore(unitId: string) {
    return this.healthScoreRepo.findOne({
      where: { unit_id: unitId },
      order: { date: 'DESC' },
    });
  }
}
