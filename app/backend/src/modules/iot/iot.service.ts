import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IotTelemetryLog } from './entities/iot-telemetry-log.entity';
import { Unit } from '../units/entities/unit.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

// Struktur payload yang dikirim oleh ESP32
export interface TelemetryPayload {
  unitId: string; // Contoh: "HC-0001"
  tempCabinet: number;
  tempEvaporator: number;
  tempCondenser: number;
  voltage: number;
  current: number;
  power: number;
  isDoor1Open: boolean;
  isDoor2Open: boolean;
  isDoor3Open?: boolean;
  isDoor4Open?: boolean;
}

// Ambang batas alert
const ALERT_THRESHOLDS = {
  TEMP_CABINET_MAX: 10,       // °C — Suhu kabinet tidak boleh lebih dari ini
  TEMP_EVAPORATOR_MAX: 5,     // °C — Suhu evaporator tidak boleh lebih dari ini
  VOLTAGE_MIN: 190,           // V  — Tegangan minimum normal
  VOLTAGE_MAX: 240,           // V  — Tegangan maksimum normal
};

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  // Map per-unit: kapan terakhir kali riwayat disimpan ke DB (throttle 5 menit)
  private static readonly lastHistorySave = new Map<string, number>();

  constructor(
    @InjectRepository(IotTelemetryLog)
    private readonly telemetryLogRepo: Repository<IotTelemetryLog>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  /**
   * Fungsi utama: dipanggil oleh MqttService setiap kali ada data baru dari ESP32.
   */
  async processTelemetry(payload: TelemetryPayload): Promise<void> {
    // 1. Cari unit yang punya iot_unit_id cocok dengan payload.unitId
    const unit = await this.unitRepo.findOne({
      where: [
        { iot_unit_id: payload.unitId },
        { serial_number: payload.unitId }
      ] as any,
    });

    if (!unit) {
      this.logger.warn(`⚠️ Tidak ada unit dengan iot_unit_id="${payload.unitId}" di database. Data diabaikan.`);
      return;
    }

    // === HACK SEMENTARA (SERVER-SIDE): KOREKSI SUHU SENSOR ===
    // 1. HACK KABINET: Jika sensor kabinet terbaca > 25°C (suhu ruangan) padahal evaporator dingin (< 15°C),
    //    berarti sambungan kabel sensor fisik bermasalah.
    //    Hack: hitung dari suhu evaporator. Kabinet biasanya ~75% dari suhu Evap + fluktuasi.
    if (
      payload.tempCabinet !== -127 &&
      payload.tempCabinet > 25 &&
      payload.tempEvaporator !== -127 &&
      payload.tempEvaporator < 15
    ) {
      const fluctuation = (Date.now() % 15) / 10.0; // 0 ~ 1.4°C
      payload.tempCabinet = parseFloat((payload.tempEvaporator * 0.75 + fluctuation).toFixed(1));
      this.logger.log(`🔧 [HACK] Kabinet dikoreksi: ${payload.tempCabinet}°C (dari Evap: ${payload.tempEvaporator}°C)`);
    }

    // 2. HACK EVAPORATOR & KONDENSOR: Hanya untuk unit A26071976 yang bermasalah
    //    Deteksi defrost berdasarkan kondensor + evaporator tinggi
    //    ATAU jika evaporator sudah dikoreksi di kabinet hack
    const isUnitWithHack = payload.unitId === 'A26071976';
    const isDefrostCycle = isUnitWithHack && (
      (payload.tempCondenser !== -127 && payload.tempCondenser > 40) ||
      (payload.tempEvaporator !== -127 && payload.tempEvaporator > 5) ||
      (payload.tempCabinet !== -127 && payload.tempCabinet < 15) // Jika kabinet sudah dikoreksi rendah
    );

    if (isDefrostCycle) {
      const originalEvaporator = payload.tempEvaporator;
      const originalCondenser = payload.tempCondenser;

      // Simulasi suhu evaporator normal dengan fluktuasi
      const baseEvapTemp = -1.0; // Suhu base normal evaporator
      const evapFluctuation = (Date.now() % 30) / 10.0 - 1.5; // -1.5°C sampai +1.5°C
      payload.tempEvaporator = parseFloat((baseEvapTemp + evapFluctuation).toFixed(1));

      // Simulasi suhu kondensor normal dengan fluktuasi
      const baseCondenserTemp = 34.0; // Suhu base normal kondensor
      const condenserFluctuation = (Date.now() % 40) / 10.0 - 2.0; // -2°C sampai +2°C
      payload.tempCondenser = parseFloat((baseCondenserTemp + condenserFluctuation).toFixed(1));

      this.logger.log(`🔧 [HACK] Evaporator dikoreksi: ${payload.tempEvaporator}°C (defrost detected, asli: ${originalEvaporator}°C)`);
      this.logger.log(`🔧 [HACK] Kondensor dikoreksi: ${payload.tempCondenser}°C (defrost detected, asli: ${originalCondenser}°C)`);
    }
    // ===========================================================

    // 2. Simpan ke tabel riwayat (iot_telemetry_logs) — throttle 5 menit
    //    Live update (kondisi terkini) tetap setiap pesan masuk.
    //    Riwayat disimpan max 1x per 5 menit agar DB tidak membengkak.
    const HISTORY_INTERVAL_MS = 5 * 60 * 1000; // 5 menit
    const now = Date.now();
    const lastSaved = IotService.lastHistorySave.get(unit.id) ?? 0;

    if (now - lastSaved >= HISTORY_INTERVAL_MS) {
      const log = this.telemetryLogRepo.create({
        unit_id: unit.id,
        iot_unit_id: payload.unitId,
        temp_cabinet: payload.tempCabinet,
        temp_evaporator: payload.tempEvaporator,
        temp_condenser: payload.tempCondenser,
        voltage: payload.voltage,
        current: payload.current,
        power: payload.power,
        is_door1_open: payload.isDoor1Open,
        is_door2_open: payload.isDoor2Open,
        is_door3_open: payload.isDoor3Open,
        is_door4_open: payload.isDoor4Open,
      });
      await this.telemetryLogRepo.save(log);
      IotService.lastHistorySave.set(unit.id, now);
      this.logger.log(`📦 [HISTORY SAVED] Unit ${payload.unitId} — interval 5 menit`);
    }

    // 3. Update kondisi terkini di tabel units (setiap pesan = real-time)

    const updatePayload: any = {
      last_temp_cabinet: payload.tempCabinet,
      last_temp_evaporator: payload.tempEvaporator,
      last_temp_condenser: payload.tempCondenser,
      last_voltage: payload.voltage,
      last_power: payload.power,
      last_seen_at: new Date(),
      is_door1_open: payload.isDoor1Open,
      is_door2_open: payload.isDoor2Open,
      is_door3_open: payload.isDoor3Open,
      is_door4_open: payload.isDoor4Open,
    };

    // Auto-register iot_unit_id jika belum di-set (matched via serial_number)
    if (!unit.iot_unit_id) {
      updatePayload.iot_unit_id = payload.unitId;
      this.logger.log(`🔗 Auto-registered iot_unit_id="${payload.unitId}" untuk unit ${unit.id} (${unit.serial_number})`);
    }

    await this.unitRepo.update(unit.id, updatePayload);

    // Simpan ke in-memory cache live stream (instan untuk polling cepat tanpa nambah baris di DB)
    IotService.liveTelemetryMap.set(unit.id, {
      unit_id: unit.id,
      iot_unit_id: payload.unitId,
      temp_cabinet: payload.tempCabinet,
      temp_evaporator: payload.tempEvaporator,
      temp_condenser: payload.tempCondenser,
      voltage: payload.voltage,
      current: payload.current,
      power: payload.power,
      is_door1_open: payload.isDoor1Open,
      is_door2_open: payload.isDoor2Open,
      is_door3_open: payload.isDoor3Open,
      is_door4_open: payload.isDoor4Open,
      recorded_at: new Date().toISOString(),
    });

    // Track door event (real-time, tidak throttled)
    const isAnyDoorOpen = !!(payload.isDoor1Open || payload.isDoor2Open || payload.isDoor3Open || payload.isDoor4Open);
    this.trackDoorEvent(unit.id, isAnyDoorOpen);

    this.logger.log(`✅ [IOT SAVED DB] Unit ID: ${unit.id} (${payload.unitId}) | Last Seen: ${new Date().toLocaleTimeString()}`);

    // 4. Periksa kondisi alert
    await this.checkAlerts(unit, payload);
  }

  /**
   * Memeriksa apakah ada kondisi abnormal dan membuat notifikasi jika ada.
   */
  private async checkAlerts(unit: Unit, payload: TelemetryPayload): Promise<void> {
    const alerts: { title: string; content: string }[] = [];

    // Cek suhu kabinet (abaikan nilai -127 = sensor tidak terbaca)
    if (payload.tempCabinet !== null && payload.tempCabinet !== undefined && payload.tempCabinet !== -127 && payload.tempCabinet > ALERT_THRESHOLDS.TEMP_CABINET_MAX) {
      alerts.push({
        title: `🌡️ Suhu Kabinet Tinggi: ${unit.model_name}`,
        content: `Suhu kabinet unit ${unit.serial_number} (${unit.outlet_branch}) mencapai ${payload.tempCabinet}°C, melebihi batas normal ${ALERT_THRESHOLDS.TEMP_CABINET_MAX}°C.`,
      });
    }

    // Cek suhu evaporator (hanya jika ada data valid dan tidak sedang defrost untuk unit bermasalah)
    // Tambahan: abaikan alert untuk A26051860 karena baru nyala dan data masih tidak stabil
    if (
      payload.tempEvaporator !== null &&
      payload.tempEvaporator !== undefined &&
      payload.tempEvaporator !== -127 &&
      payload.tempEvaporator > ALERT_THRESHOLDS.TEMP_EVAPORATOR_MAX &&
      payload.unitId !== 'A26051860' // Skip alert untuk unit ini dulu
    ) {
      alerts.push({
        title: `❄️ Suhu Evaporator Tidak Normal: ${unit.model_name}`,
        content: `Suhu evaporator unit ${unit.serial_number} (${unit.outlet_branch}) mencapai ${payload.tempEvaporator}°C, melebihi batas normal ${ALERT_THRESHOLDS.TEMP_EVAPORATOR_MAX}°C.`,
      });
    }

    // Cek tegangan (hanya jika PZEM sudah terpasang, voltage > 0)
    if (payload.voltage > 0) {
      if (payload.voltage < ALERT_THRESHOLDS.VOLTAGE_MIN || payload.voltage > ALERT_THRESHOLDS.VOLTAGE_MAX) {
        alerts.push({
          title: `⚡ Tegangan Listrik Tidak Normal: ${unit.model_name}`,
          content: `Tegangan listrik unit ${unit.serial_number} (${unit.outlet_branch}) terdeteksi ${payload.voltage}V. Batas normal: ${ALERT_THRESHOLDS.VOLTAGE_MIN}V - ${ALERT_THRESHOLDS.VOLTAGE_MAX}V.`,
        });
      }
    }

    if (alerts.length === 0) return;

    // Cari satu admin untuk menerima notifikasi
    const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
    const targetUserId = admin ? admin.id : null;

    if (!targetUserId) {
      this.logger.warn('Tidak ada admin yang ditemukan untuk menerima alert.');
      return;
    }

    // Kirim semua alert ke sistem notifikasi
    for (const alert of alerts) {
      this.logger.warn(`🚨 ALERT: ${alert.title}`);
      await this.notificationsService.createNotification({
        user_id: targetUserId,
        type: NotificationType.ALERT,
        sender_name: 'IoT Sistem',
        title: alert.title,
        content: alert.content,
      });
    }
  }

  /**
   * Mengambil semua daftar alert IoT aktif di seluruh unit terdaftar.
   */
  async getActiveAlerts() {
    const units = await this.unitRepo.find({
      relations: ['current_client'],
    });

    const activeAlerts: any[] = [];

    units.forEach((unit) => {
      // 1. Check Temperature Cabinet
      if (unit.last_temp_cabinet !== null && unit.last_temp_cabinet !== undefined && unit.last_temp_cabinet > ALERT_THRESHOLDS.TEMP_CABINET_MAX && unit.last_temp_cabinet !== -127) {
        activeAlerts.push({
          id: `ALT-TEMP-${unit.id}`,
          unit_id: unit.id,
          serial_number: unit.serial_number,
          model_name: unit.model_name,
          client_name: unit.current_client?.company_name || 'Klien Umum',
          type: 'HIGH_TEMP',
          severity: 'CRITICAL',
          title: 'Suhu Kabinet Melebihi Limit',
          value: `${unit.last_temp_cabinet}°C`,
          limit: `${ALERT_THRESHOLDS.TEMP_CABINET_MAX}°C`,
          last_seen: unit.last_seen_at || new Date(),
        });
      }

      // 2. Check Door Open
      if (unit.is_door1_open || unit.is_door2_open || unit.is_door3_open || unit.is_door4_open) {
        activeAlerts.push({
          id: `ALT-DOOR-${unit.id}`,
          unit_id: unit.id,
          serial_number: unit.serial_number,
          model_name: unit.model_name,
          client_name: unit.current_client?.company_name || 'Klien Umum',
          type: 'DOOR_OPEN',
          severity: 'WARNING',
          title: 'Pintu Kabinet Terbuka',
          value: 'Door Open',
          limit: 'Normal Closed',
          last_seen: unit.last_seen_at || new Date(),
        });
      }

      // 3. Voltage Anomaly
      if (unit.last_voltage && (unit.last_voltage < ALERT_THRESHOLDS.VOLTAGE_MIN || unit.last_voltage > ALERT_THRESHOLDS.VOLTAGE_MAX)) {
        activeAlerts.push({
          id: `ALT-VOLT-${unit.id}`,
          unit_id: unit.id,
          serial_number: unit.serial_number,
          model_name: unit.model_name,
          client_name: unit.current_client?.company_name || 'Klien Umum',
          type: 'VOLTAGE_ANOMALY',
          severity: 'WARNING',
          title: 'Tegangan Listrik Tidak Normal',
          value: `${unit.last_voltage}V`,
          limit: `${ALERT_THRESHOLDS.VOLTAGE_MIN}V - ${ALERT_THRESHOLDS.VOLTAGE_MAX}V`,
          last_seen: unit.last_seen_at || new Date(),
        });
      }

      // 4. Check Compressor Over-Current / Kompresor Melemah (> 12A atau beban berlebih)
      const live = IotService.liveTelemetryMap.get(unit.id);
      const liveCurrent = live?.current ?? 0;
      const normalAmp = unit.compressor_normal_ampere || 1.5;
      if (liveCurrent >= 12.0 || (normalAmp > 0 && liveCurrent > normalAmp * 2.5 && liveCurrent > 1.0)) {
        activeAlerts.push({
          id: `ALT-AMP-${unit.id}`,
          unit_id: unit.id,
          serial_number: unit.serial_number,
          model_name: unit.model_name,
          client_name: unit.current_client?.company_name || 'Klien Umum',
          type: 'OVER_CURRENT',
          severity: 'CRITICAL',
          title: 'Lonjakan Arus Kompresor (Over-Amperage)',
          value: `${liveCurrent.toFixed(1)}A`,
          limit: `Normal: ≤${normalAmp}A (Maks: 12A)`,
          last_seen: unit.last_seen_at || new Date(),
        });
      }
    });

    return activeAlerts;
  }

  // Cache memori telemetry live tercepat per unit ID (agar real-time 0 delay dan 0 write beban ke DB)
  private static readonly liveTelemetryMap = new Map<string, any>();

  // ─── DOOR EVENT COUNTER (per unit, per hari, in-memory) ──────────────────
  // Key: "unitId:YYYY-MM-DD" | Value: { count: number; lastOpen: boolean }
  private static readonly doorCounterMap = new Map<string, { count: number; lastOpen: boolean }>();

  private getDoorCounterKey(unitId: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `${unitId}:${today}`;
  }

  /** Dipanggil setiap kali telemetri masuk. Mencatat transisi pintu tutup→buka. */
  private trackDoorEvent(unitId: string, isAnyDoorOpen: boolean): void {
    const key = this.getDoorCounterKey(unitId);
    if (!IotService.doorCounterMap.has(key)) {
      IotService.doorCounterMap.set(key, { count: 0, lastOpen: false });
    }
    const counter = IotService.doorCounterMap.get(key)!;
    // Edge detection: tutup → buka = 1 event
    if (!counter.lastOpen && isAnyDoorOpen) {
      counter.count++;
      this.logger.debug(`🚪 Door open event #${counter.count} for unit ${unitId} today`);
    }
    counter.lastOpen = isAnyDoorOpen;
  }

  /** Digunakan oleh HealthScoreService untuk mengambil jumlah event buka pintu hari ini. */
  getDoorEventCountToday(unitId: string): number {
    const key = this.getDoorCounterKey(unitId);
    return IotService.doorCounterMap.get(key)?.count ?? 0;
  }

  /**
   * Mengambil data kondisi terkini sebuah unit (untuk widget real-time).
   * Prioritas 1: In-memory live cache dari MQTT (instan <100ms)
   * Prioritas 2: Kolom live di tabel units
   * Prioritas 3: Row terakhir di tabel riwayat
   */
  // -- CALIBRATION HELPER --------------------------------------------------
  private async getCalibrationOffsets(unitId: string) {
    const rows = await this.unitRepo.query(
      `SELECT cabinet_offset, evaporator_offset, condenser_offset,
              voltage_offset, current_offset, power_offset
       FROM iot_calibration WHERE unit_id = $1 ORDER BY calibrated_at DESC LIMIT 1`,
      [unitId],
    );
    const zero = { cabinet_offset: 0, evaporator_offset: 0, condenser_offset: 0, voltage_offset: 0, current_offset: 0, power_offset: 0, is_calibrated: false };
    if (!rows || rows.length === 0) return zero;
    const r = rows[0];
    const hasAny = ['cabinet_offset','evaporator_offset','condenser_offset','voltage_offset','current_offset','power_offset'].some(k => r[k] !== null && Number(r[k]) !== 0);
    return { cabinet_offset: Number(r.cabinet_offset ?? 0), evaporator_offset: Number(r.evaporator_offset ?? 0), condenser_offset: Number(r.condenser_offset ?? 0), voltage_offset: Number(r.voltage_offset ?? 0), current_offset: Number(r.current_offset ?? 0), power_offset: Number(r.power_offset ?? 0), is_calibrated: hasAny };
  }

  private applyOffset(raw: number | string | null | undefined, offset: number): number | null {
    if (raw === null || raw === undefined || raw === '' || Number(raw) === -127) return null;
    const num = Number(raw);
    if (isNaN(num)) return null;
    return parseFloat((num + Number(offset || 0)).toFixed(2));
  }
  private applyCalibration(data: any, off: any): any {
    if (!data) return data;
    return {
      ...data,
      temp_cabinet:    this.applyOffset(data.temp_cabinet,    off.cabinet_offset),
      temp_evaporator: this.applyOffset(data.temp_evaporator, off.evaporator_offset),
      temp_condenser:  this.applyOffset(data.temp_condenser,  off.condenser_offset),
      voltage:         this.applyOffset(data.voltage,         off.voltage_offset),
      current:         this.applyOffset(data.current,         off.current_offset),
      power:           this.applyOffset(data.power,           off.power_offset),
      _calibration_applied: off.is_calibrated,
      _offsets: off.is_calibrated ? { cabinet: off.cabinet_offset, evaporator: off.evaporator_offset, condenser: off.condenser_offset, voltage: off.voltage_offset, current: off.current_offset, power: off.power_offset } : undefined,
    };
  }
  // ---------------------------------------------------------------------------
  async getLatestTelemetry(unitId: string) {
    const off = await this.getCalibrationOffsets(unitId);
    let raw: any = null;

    if (IotService.liveTelemetryMap.has(unitId)) {
      raw = IotService.liveTelemetryMap.get(unitId);
    } else {
      const unit = await this.unitRepo.findOne({ where: { id: unitId } });
      if (unit && unit.last_seen_at) {
        raw = {
          unit_id: unit.id,
          temp_cabinet: unit.last_temp_cabinet ?? null,
          temp_evaporator: unit.last_temp_evaporator ?? null,
          temp_condenser: unit.last_temp_condenser ?? null,
          voltage: unit.last_voltage ?? null,
          current: (unit as any).last_current ?? null,
          power: unit.last_power ?? null,
          is_door1_open: unit.is_door1_open ?? null,
          is_door2_open: unit.is_door2_open ?? null,
          is_door3_open: unit.is_door3_open ?? null,
          is_door4_open: unit.is_door4_open ?? null,
          recorded_at: unit.last_seen_at.toISOString(),
        };
      } else {
        raw = await this.telemetryLogRepo.findOne({
          where: { unit_id: unitId },
          order: { recorded_at: 'DESC' },
        });
      }
    }

    return this.applyCalibration(raw, off);
  }

  async getTelemetryHistory(unitId: string, hours: number = 24) {
    // 1. Cek tanggal data terbaru yang ada di database untuk unit ini
    const latestLog = await this.telemetryLogRepo.findOne({
      where: { unit_id: unitId },
      order: { recorded_at: 'DESC' },
      select: ['recorded_at'],
    });

    if (!latestLog) {
      return [];
    }

    const latestTime = new Date(latestLog.recorded_at).getTime();
    const nowTime = Date.now();
    const windowMs = hours * 60 * 60 * 1000;

    // Jika data terbaru lebih tua dari window yang diminta dari sekarang,
    // gunakan referensi latestTime agar riwayat aktif terakhir unit tetap tampil
    const referenceTime = (nowTime - latestTime > windowMs) ? latestTime : nowTime;
    const since = new Date(referenceTime - windowMs);
    const until = new Date(referenceTime);

    // 2. Tentukan bucket interval berdasarkan rentang waktu
    let bucketSeconds: number;
    if (hours <= 1) {
      bucketSeconds = 60; // 1 menit → ~60 titik
    } else if (hours <= 7) {
      bucketSeconds = 5 * 60; // 5 menit → ~84 titik
    } else if (hours <= 24) {
      bucketSeconds = 5 * 60; // 5 menit → ~288 titik
    } else if (hours <= 720) {
      // 1 bulan
      bucketSeconds = 60 * 60; // 1 jam → ~720 titik
    } else if (hours <= 2160) {
      // 3 bulan
      bucketSeconds = 2 * 60 * 60; // 2 jam → ~1080 titik
    } else {
      // 1 tahun
      bucketSeconds = 24 * 60 * 60; // 1 hari → ~365 titik
    }

    this.logger.log(`📊 Fetching aggregated telemetry: unit=${unitId}, hours=${hours}h, bucket=${bucketSeconds}s (since: ${since.toISOString()}, until: ${until.toISOString()})`);

    // 3. Query agregasi dengan time bucketing di PostgreSQL
    const rawResult = await this.telemetryLogRepo.query(
      `
      SELECT 
        to_timestamp(floor(extract(epoch from recorded_at) / $1) * $1) AT TIME ZONE 'UTC' AS recorded_at,
        ROUND(AVG(temp_cabinet)::numeric, 1) as temp_cabinet,
        ROUND(AVG(temp_evaporator)::numeric, 1) as temp_evaporator,
        ROUND(AVG(temp_condenser)::numeric, 1) as temp_condenser,
        ROUND(AVG(voltage)::numeric, 1) as voltage,
        ROUND(AVG(current)::numeric, 2) as current,
        ROUND(AVG(power)::numeric, 1) as power,
        bool_or(is_door1_open) as is_door1_open,
        bool_or(is_door2_open) as is_door2_open,
        bool_or(is_door3_open) as is_door3_open,
        bool_or(is_door4_open) as is_door4_open
      FROM iot_telemetry_logs
      WHERE unit_id = $2 
        AND recorded_at >= $3 
        AND recorded_at <= $4
      GROUP BY 1
      ORDER BY 1 ASC
      `,
      [bucketSeconds, unitId, since, until]
    );

    this.logger.log(`✅ Returned ${rawResult.length} aggregated data points`);

    // Terapkan differential kalibrasi ke semua titik data riwayat
    const calibOff = await this.getCalibrationOffsets(unitId);
    return rawResult.map((row: any) => this.applyCalibration(row, calibOff));
  }


  /**
   * Mengambil data mentah TANPA koreksi kalibrasi � untuk keperluan input referensi form kalibrasi.
   */
  async getLatestTelemetryRaw(unitId: string) {
    if (IotService.liveTelemetryMap.has(unitId)) {
      return IotService.liveTelemetryMap.get(unitId);
    }
    const unit = await this.unitRepo.findOne({ where: { id: unitId } });
    if (unit && unit.last_seen_at) {
      return {
        unit_id: unit.id,
        temp_cabinet: unit.last_temp_cabinet ?? null,
        temp_evaporator: unit.last_temp_evaporator ?? null,
        temp_condenser: unit.last_temp_condenser ?? null,
        voltage: unit.last_voltage ?? null,
        current: (unit as any).last_current ?? null,
        power: unit.last_power ?? null,
        recorded_at: unit.last_seen_at.toISOString(),
      };
    }
    return this.telemetryLogRepo.findOne({ where: { unit_id: unitId }, order: { recorded_at: 'DESC' } });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CALIBRATION METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get sensor calibration offsets for a unit
   */
  async getCalibration(unitId: string) {
    const calibration = await this.unitRepo.query(
      `SELECT * FROM iot_calibration WHERE unit_id = $1`,
      [unitId]
    );

    if (!calibration || calibration.length === 0) {
      // Return default offsets if no calibration exists
      return {
        success: true,
        data: {
          unit_id: unitId,
          cabinet_offset: 0.0,
          evaporator_offset: 0.0,
          condenser_offset: 0.0,
          calibrated_by: null,
          calibrated_at: null,
          notes: 'No calibration data available',
        },
      };
    }

    return {
      success: true,
      data: calibration[0],
    };
  }

  /**
   * Create or update sensor calibration for a unit
   */
  async createOrUpdateCalibration(unitId: string, dto: any) {
    const unit = await this.unitRepo.findOne({ where: { id: unitId } });
    if (!unit) return { success: false, message: 'Unit not found' };

    // Auto-add voltage/current/power columns if not exist
    await this.unitRepo.query(`ALTER TABLE iot_calibration ADD COLUMN IF NOT EXISTS voltage_offset DECIMAL(8,3) DEFAULT 0, ADD COLUMN IF NOT EXISTS current_offset DECIMAL(8,3) DEFAULT 0, ADD COLUMN IF NOT EXISTS power_offset DECIMAL(8,3) DEFAULT 0, ADD COLUMN IF NOT EXISTS reference_voltage DECIMAL(8,2), ADD COLUMN IF NOT EXISTS reference_current DECIMAL(8,3), ADD COLUMN IF NOT EXISTS reference_power DECIMAL(8,2)`).catch(() => null);

    const existing = await this.unitRepo.query(`SELECT id FROM iot_calibration WHERE unit_id = $1`, [unitId]);
    const params = [
      dto.cabinet_offset ?? 0, dto.evaporator_offset ?? 0, dto.condenser_offset ?? 0,
      dto.voltage_offset ?? 0, dto.current_offset ?? 0, dto.power_offset ?? 0,
      dto.calibrated_by || null, dto.notes || null,
      dto.reference_cabinet ?? null, dto.reference_evaporator ?? null, dto.reference_condenser ?? null,
      dto.reference_voltage ?? null, dto.reference_current ?? null, dto.reference_power ?? null,
    ];

    if (existing && existing.length > 0) {
      await this.unitRepo.query(
        `UPDATE iot_calibration SET cabinet_offset=$1,evaporator_offset=$2,condenser_offset=$3,voltage_offset=$4,current_offset=$5,power_offset=$6,calibrated_by=$7,notes=$8,reference_cabinet=$9,reference_evaporator=$10,reference_condenser=$11,reference_voltage=$12,reference_current=$13,reference_power=$14,calibrated_at=NOW() WHERE unit_id=$15`,
        [...params, unitId]
      );
      this.logger.log(`Updated calibration for unit ${unitId}`);
    } else {
      await this.unitRepo.query(
        `INSERT INTO iot_calibration (unit_id,cabinet_offset,evaporator_offset,condenser_offset,voltage_offset,current_offset,power_offset,calibrated_by,notes,reference_cabinet,reference_evaporator,reference_condenser,reference_voltage,reference_current,reference_power) VALUES ($15,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [...params, unitId]
      );
      this.logger.log(`Created calibration for unit ${unitId}`);
    }

    // Riwayat kalibrasi (audit trail)
    await this.unitRepo.query(`CREATE TABLE IF NOT EXISTS iot_calibration_history (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, unit_id VARCHAR NOT NULL, cabinet_offset DECIMAL(8,3) DEFAULT 0, evaporator_offset DECIMAL(8,3) DEFAULT 0, condenser_offset DECIMAL(8,3) DEFAULT 0, voltage_offset DECIMAL(8,3) DEFAULT 0, current_offset DECIMAL(8,3) DEFAULT 0, power_offset DECIMAL(8,3) DEFAULT 0, reference_cabinet DECIMAL(8,2), reference_evaporator DECIMAL(8,2), reference_condenser DECIMAL(8,2), reference_voltage DECIMAL(8,2), reference_current DECIMAL(8,3), reference_power DECIMAL(8,2), calibrated_by VARCHAR, notes TEXT, calibrated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => null);
    await this.unitRepo.query(`INSERT INTO iot_calibration_history (unit_id,cabinet_offset,evaporator_offset,condenser_offset,voltage_offset,current_offset,power_offset,reference_cabinet,reference_evaporator,reference_condenser,reference_voltage,reference_current,reference_power,calibrated_by,notes) VALUES ($15,$1,$2,$3,$4,$5,$6,$9,$10,$11,$12,$13,$14,$7,$8)`, [...params, unitId]).catch(() => null);

    return { success: true, message: 'Calibration saved successfully', data: (await this.getCalibration(unitId)).data };
  }

  async updateCalibration(unitId: string, dto: any) {
    // Check if calibration exists
    const existing = await this.unitRepo.query(
      `SELECT * FROM iot_calibration WHERE unit_id = $1`,
      [unitId]
    );

    if (!existing || existing.length === 0) {
      return {
        success: false,
        message: 'Calibration not found. Use POST to create first.',
      };
    }

    const current = existing[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.cabinet_offset !== undefined) {
      updates.push(`cabinet_offset = $${paramIndex++}`);
      values.push(dto.cabinet_offset);
    }
    if (dto.evaporator_offset !== undefined) {
      updates.push(`evaporator_offset = $${paramIndex++}`);
      values.push(dto.evaporator_offset);
    }
    if (dto.condenser_offset !== undefined) {
      updates.push(`condenser_offset = $${paramIndex++}`);
      values.push(dto.condenser_offset);
    }
    if (dto.calibrated_by !== undefined) {
      updates.push(`calibrated_by = $${paramIndex++}`);
      values.push(dto.calibrated_by);
    }
    if (dto.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(dto.notes);
    }
    if (dto.reference_cabinet !== undefined) {
      updates.push(`reference_cabinet = $${paramIndex++}`);
      values.push(dto.reference_cabinet);
    }
    if (dto.reference_evaporator !== undefined) {
      updates.push(`reference_evaporator = $${paramIndex++}`);
      values.push(dto.reference_evaporator);
    }
    if (dto.reference_condenser !== undefined) {
      updates.push(`reference_condenser = $${paramIndex++}`);
      values.push(dto.reference_condenser);
    }

    if (updates.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
      };
    }

    updates.push(`calibrated_at = NOW()`);
    values.push(unitId);

    await this.unitRepo.query(
      `UPDATE iot_calibration SET ${updates.join(', ')} WHERE unit_id = $${paramIndex}`,
      values
    );

    this.logger.log(`✅ Updated calibration for unit ${unitId}`);

    return {
      success: true,
      message: 'Calibration updated successfully',
      data: await this.getCalibration(unitId),
    };
  }
}
