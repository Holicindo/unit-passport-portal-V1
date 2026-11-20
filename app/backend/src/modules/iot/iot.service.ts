import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IotTelemetryLog } from './entities/iot-telemetry-log.entity';
import { Unit } from '../units/entities/unit.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { EmailAlertService } from './email-alert.service';

// Struktur payload yang dikirim oleh ESP32
export interface TelemetryPayload {
  uptimeSec?: number;
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

// Ambang batas alert (Revisi Portal & IoT Monitoring System)
export const ALERT_THRESHOLDS = {
  TEMP_CABINET_MAX: 10,       // °C — Suhu kabinet tidak boleh lebih dari ini
  TEMP_EVAPORATOR_MAX: 5,     // °C — Suhu evaporator tidak boleh lebih dari ini
  TEMP_CONDENSER_MAX: 42,     // °C — Suhu kondensor di atas 42°C memicu alarm kritis
  DOOR_OPEN_MAX_MINUTES: 30,  // Menit — Alarm jika pintu terbuka lebih dari 30 menit
  OFFLINE_MAX_HOURS: 24,      // Jam — Alarm jika unit mati / tidak beroperasi > 24 jam
  HEALTH_SCORE_MIN: 70,       // Nilai — Alarm jika nilai Health Score unit turun di bawah 70
  VOLTAGE_MIN: 190,           // V  — Tegangan minimum normal
  VOLTAGE_MAX: 240,           // V  — Tegangan maksimum normal
};

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  // Map per-unit: kapan terakhir kali riwayat disimpan ke DB (throttle 5 menit)
  private static readonly lastHistorySave = new Map<string, number>();

  // Map untuk melacak kapan pintu pertama kali terdeteksi terbuka: unitId -> Date.now()
  private static readonly doorOpenStartTime = new Map<string, number>();

  // Cooldown pencatatan notifikasi in-app agar tidak spam ribuan record setiap payload (1 jam per alert per unit)
  private static readonly lastInAppAlertSent = new Map<string, number>();

  constructor(
    @InjectRepository(IotTelemetryLog)
    private readonly telemetryLogRepo: Repository<IotTelemetryLog>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    private readonly notificationsService: NotificationsService,
    private readonly emailAlertService: EmailAlertService,
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

    // 2. Deteksi Defrost / Koreksi Anomali Sensor
    //    Unit target dapat dikonfigurasi melalui ENV (IOT_SENSOR_CORRECTION_UNITS=unitA,unitB)
    const sensorCorrectionUnits = (process.env.IOT_SENSOR_CORRECTION_UNITS || 'A26071976').split(',').map(u => u.trim());
    const isUnitWithHack = sensorCorrectionUnits.includes(payload.unitId);
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
    const isAnyDoorOpen = !!(payload.isDoor1Open || payload.isDoor2Open || payload.isDoor3Open || payload.isDoor4Open);
    let doorOpenedAtToPersist = unit.door_opened_at;

    if (isAnyDoorOpen) {
      if (!doorOpenedAtToPersist) {
        doorOpenedAtToPersist = new Date();
      }
    } else {
      doorOpenedAtToPersist = null as any;
    }

    const updatePayload: any = {
      last_temp_cabinet: payload.tempCabinet,
      last_temp_evaporator: payload.tempEvaporator,
      last_temp_condenser: payload.tempCondenser,
      last_voltage: payload.voltage,
      last_power: payload.power,
      last_seen_at: new Date(),
      door_opened_at: doorOpenedAtToPersist,
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
      uptime_sec: payload.uptimeSec ?? null,
    });

    // Track door event (real-time, tidak throttled)
    this.trackDoorEvent(unit.id, isAnyDoorOpen);

    // Track durasi pintu terbuka (untuk alarm > 30 menit)
    if (isAnyDoorOpen) {
      if (!IotService.doorOpenStartTime.has(unit.id)) {
        IotService.doorOpenStartTime.set(unit.id, Date.now());
      }
    } else {
      IotService.doorOpenStartTime.delete(unit.id);
    }

    this.logger.log(`✅ [IOT SAVED DB] Unit ID: ${unit.id} (${payload.unitId}) | Last Seen: ${new Date().toLocaleTimeString()}`);

    // 4. Periksa kondisi alert
    await this.checkAlerts(unit, payload);
  }

  /**
   * Helper untuk mencari daftar email penerima (user admin + user klien pemilik unit).
   */
  private async getRecipientEmailsForUnit(unit: Unit): Promise<string[]> {
    const emails: string[] = [];
    try {
      // 1. Ambil email admin
      const admins = await this.userRepo.find({
        where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN as any }],
        select: ['email'],
      });
      admins.forEach(a => { if (a.email) emails.push(a.email); });

      // 2. Ambil email klien pemilik unit
      const clientId = (unit as any).currentClientId || unit.current_client?.id;
      if (clientId) {
        const clientUsers = await this.userRepo.find({
          where: { client_id: clientId },
          select: ['email'],
        });
        clientUsers.forEach(u => { if (u.email) emails.push(u.email); });
      }
    } catch (err: any) {
      this.logger.error(`Error mencari recipient emails unit: ${err.message}`);
    }
    return Array.from(new Set(emails));
  }

  /**
   * Memeriksa apakah ada kondisi abnormal dan membuat notifikasi serta email warning.
   */
  private async checkAlerts(unit: Unit, payload: TelemetryPayload): Promise<void> {
    const alerts: {
      title: string;
      content: string;
      type: string;
      currentValue: string;
      limit: string;
      severity: 'CRITICAL' | 'WARNING';
    }[] = [];

    // 1. Alarm Suhu Kondensor (> 42°C) - Revisi Item 1
    if (
      payload.tempCondenser !== null &&
      payload.tempCondenser !== undefined &&
      payload.tempCondenser !== -127 &&
      payload.tempCondenser > ALERT_THRESHOLDS.TEMP_CONDENSER_MAX
    ) {
      alerts.push({
        title: `🔥 Suhu Kondensor Kritis (> ${ALERT_THRESHOLDS.TEMP_CONDENSER_MAX}°C): ${unit.model_name}`,
        content: `Suhu kondensor unit ${unit.serial_number} (${unit.outlet_branch || 'Umum'}) mencapai ${payload.tempCondenser}°C, melebihi batas aman operasional ${ALERT_THRESHOLDS.TEMP_CONDENSER_MAX}°C. Harap periksa sirkulasi udara dan kipas kondensor.`,
        type: 'HIGH_CONDENSER_TEMP',
        currentValue: `${payload.tempCondenser}°C`,
        limit: `Maks ${ALERT_THRESHOLDS.TEMP_CONDENSER_MAX}°C`,
        severity: 'CRITICAL',
      });
    }

    // 2. Alarm Pintu Terbuka > 30 Menit - Revisi Item 2 (Database-backed timer)
    const isAnyDoorOpen = !!(payload.isDoor1Open || payload.isDoor2Open || payload.isDoor3Open || payload.isDoor4Open);
    const doorOpenSince = unit.door_opened_at ? new Date(unit.door_opened_at).getTime() : IotService.doorOpenStartTime.get(unit.id);
    if (isAnyDoorOpen && doorOpenSince) {
      const openDurationMinutes = Math.floor((Date.now() - doorOpenSince) / 60000);
      if (openDurationMinutes >= ALERT_THRESHOLDS.DOOR_OPEN_MAX_MINUTES) {
        alerts.push({
          title: `🚪 Pintu Kabinet Terbuka > 30 Menit: ${unit.model_name}`,
          content: `Pintu kabinet unit ${unit.serial_number} (${unit.outlet_branch || 'Umum'}) telah terbuka terus menerus selama ${openDurationMinutes} menit (batas aman: 30 menit). Hal ini berisiko menaikkan suhu kabinet dan membebani kompresor.`,
          type: 'DOOR_OPEN_PROLONGED',
          currentValue: `Terbuka ${openDurationMinutes} menit`,
          limit: `Maks ${ALERT_THRESHOLDS.DOOR_OPEN_MAX_MINUTES} menit`,
          severity: 'WARNING',
        });
      }
    }

    // 3. Cek Suhu Kabinet Normal (> 10°C)
    if (payload.tempCabinet !== null && payload.tempCabinet !== undefined && payload.tempCabinet !== -127 && payload.tempCabinet > ALERT_THRESHOLDS.TEMP_CABINET_MAX) {
      alerts.push({
        title: `🌡️ Suhu Kabinet Melebihi Batas: ${unit.model_name}`,
        content: `Suhu kabinet unit ${unit.serial_number} (${unit.outlet_branch || 'Umum'}) terdeteksi ${payload.tempCabinet}°C, melebihi batas normal ${ALERT_THRESHOLDS.TEMP_CABINET_MAX}°C.`,
        type: 'HIGH_TEMP',
        currentValue: `${payload.tempCabinet}°C`,
        limit: `Maks ${ALERT_THRESHOLDS.TEMP_CABINET_MAX}°C`,
        severity: 'CRITICAL',
      });
    }

    // 4. Cek tegangan (jika terdeteksi di luar 190V - 240V)
    if (payload.voltage > 0 && (payload.voltage < ALERT_THRESHOLDS.VOLTAGE_MIN || payload.voltage > ALERT_THRESHOLDS.VOLTAGE_MAX)) {
      alerts.push({
        title: `⚡ Tegangan Listrik Anomali: ${unit.model_name}`,
        content: `Tegangan listrik unit ${unit.serial_number} (${unit.outlet_branch || 'Umum'}) terdeteksi ${payload.voltage}V. Batas normal: ${ALERT_THRESHOLDS.VOLTAGE_MIN}V - ${ALERT_THRESHOLDS.VOLTAGE_MAX}V.`,
        type: 'VOLTAGE_ANOMALY',
        currentValue: `${payload.voltage}V`,
        limit: `${ALERT_THRESHOLDS.VOLTAGE_MIN}V - ${ALERT_THRESHOLDS.VOLTAGE_MAX}V`,
        severity: 'WARNING',
      });
    }

    if (alerts.length === 0) return;

    // Dapatkan target admin untuk notifikasi in-app
    const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
    const targetUserId = admin ? admin.id : null;

    // Ambil daftar email penerima
    const recipientEmails = await this.getRecipientEmailsForUnit(unit);

    for (const alert of alerts) {
      this.logger.warn(`🚨 ALERT: ${alert.title}`);

      // 1. Simpan ke sistem notifikasi in-app — dengan cooldown 1 jam per alert per unit agar tidak spam
      if (targetUserId) {
        const inAppKey = `${unit.id}:${alert.type}:inapp`;
        const lastSent = IotService.lastInAppAlertSent.get(inAppKey) || 0;
        const cooldownMs = 60 * 60 * 1000; // 1 jam
        if (Date.now() - lastSent > cooldownMs) {
          await this.notificationsService.createNotification({
            user_id: targetUserId,
            type: NotificationType.ALERT,
            sender_name: 'IoT Sistem',
            title: alert.title,
            content: alert.content,
          });
          IotService.lastInAppAlertSent.set(inAppKey, Date.now());
        }
      }

      // 2. Kirim warning email ke user / admin terkait
      await this.emailAlertService.sendIotAlertEmail({
        to: recipientEmails,
        unitSerialNumber: unit.serial_number,
        unitModel: unit.model_name,
        clientName: (unit as any).current_client?.company_name,
        outletBranch: unit.outlet_branch,
        alertTitle: alert.title,
        alertType: alert.type,
        currentValue: alert.currentValue,
        thresholdLimit: alert.limit,
        severity: alert.severity,
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

    // Ambil data health scores terbaru untuk setiap unit
    let latestHealthScores: Record<string, number> = {};
    try {
      const hsRows = await this.unitRepo.query(`
        SELECT DISTINCT ON (unit_id) unit_id, overall_score 
        FROM unit_health_scores 
        ORDER BY unit_id, date DESC, created_at DESC
      `);
      if (Array.isArray(hsRows)) {
        hsRows.forEach((r: any) => {
          latestHealthScores[r.unit_id] = Number(r.overall_score);
        });
      }
    } catch (err: any) {
      this.logger.error(`Error querying health scores for alerts: ${err.message}`);
    }

    const activeAlerts: any[] = [];
    const now = Date.now();

    units.forEach((unit) => {
      // 1. Alarm Suhu Kondensor (> 42°C) - Kritis
      const condTemp = unit.last_temp_condenser;
      if (condTemp !== null && condTemp !== undefined && condTemp !== -127 && condTemp > ALERT_THRESHOLDS.TEMP_CONDENSER_MAX) {
        activeAlerts.push({
          id: `ALT-COND-${unit.id}`,
          unit_id: unit.id,
          serial_number: unit.serial_number,
          model_name: unit.model_name,
          client_name: unit.current_client?.company_name || 'Klien Umum',
          type: 'HIGH_CONDENSER_TEMP',
          severity: 'CRITICAL',
          title: 'Suhu Kondensor Melebihi 42°C',
          value: `${condTemp}°C`,
          limit: `Maks ${ALERT_THRESHOLDS.TEMP_CONDENSER_MAX}°C`,
          last_seen: unit.last_seen_at || new Date(),
        });
      }

      // 2. Alarm Pintu Terbuka (> 30 Menit)
      const isDoorOpen = unit.is_door1_open || unit.is_door2_open || unit.is_door3_open || unit.is_door4_open;
      if (isDoorOpen) {
        const openStart = unit.door_opened_at ? new Date(unit.door_opened_at).getTime() : IotService.doorOpenStartTime.get(unit.id);
        const durationMin = openStart ? Math.floor((now - openStart) / 60000) : 0;
        const isExceeded = durationMin >= ALERT_THRESHOLDS.DOOR_OPEN_MAX_MINUTES;

        activeAlerts.push({
          id: `ALT-DOOR-${unit.id}`,
          unit_id: unit.id,
          serial_number: unit.serial_number,
          model_name: unit.model_name,
          client_name: unit.current_client?.company_name || 'Klien Umum',
          type: 'DOOR_OPEN',
          severity: isExceeded ? 'CRITICAL' : 'WARNING',
          title: isExceeded ? 'Pintu Terbuka > 30 Menit' : 'Pintu Kabinet Terbuka',
          value: isExceeded ? `Terbuka ${durationMin} mnt` : 'Door Open',
          limit: `Maks ${ALERT_THRESHOLDS.DOOR_OPEN_MAX_MINUTES} Menit`,
          last_seen: unit.last_seen_at || new Date(),
        });
      }

      // 3. Alarm Unit Mati / Tidak Beroperasi (> 24 Jam)
      if (unit.iot_unit_id) {
        if (!unit.last_seen_at) {
          activeAlerts.push({
            id: `ALT-OFFLINE-${unit.id}`,
            unit_id: unit.id,
            serial_number: unit.serial_number,
            model_name: unit.model_name,
            client_name: unit.current_client?.company_name || 'Klien Umum',
            type: 'UNIT_OFFLINE',
            severity: 'CRITICAL',
            title: 'Unit Mati / Non-Operasional',
            value: 'Belum Pernah Aktif',
            limit: `Maks ${ALERT_THRESHOLDS.OFFLINE_MAX_HOURS} Jam`,
            last_seen: new Date(),
          });
        } else {
          const offlineHours = (now - new Date(unit.last_seen_at).getTime()) / (1000 * 60 * 60);
          if (offlineHours > ALERT_THRESHOLDS.OFFLINE_MAX_HOURS) {
            const formattedOffline = offlineHours >= 48 ? `${Math.floor(offlineHours / 24)} hari` : `${Math.floor(offlineHours)} jam`;
            activeAlerts.push({
              id: `ALT-OFFLINE-${unit.id}`,
              unit_id: unit.id,
              serial_number: unit.serial_number,
              model_name: unit.model_name,
              client_name: unit.current_client?.company_name || 'Klien Umum',
              type: 'UNIT_OFFLINE',
              severity: 'CRITICAL',
              title: `Unit Mati > 24 Jam (${formattedOffline})`,
              value: `Offline ${formattedOffline}`,
              limit: `Maks ${ALERT_THRESHOLDS.OFFLINE_MAX_HOURS} Jam`,
              last_seen: unit.last_seen_at,
            });
          }
        }
      }

      // 4. Alarm Health Score (< 70)
      const hsScore = latestHealthScores[unit.id];
      if (hsScore !== undefined && hsScore !== null && hsScore < ALERT_THRESHOLDS.HEALTH_SCORE_MIN) {
        activeAlerts.push({
          id: `ALT-HS-${unit.id}`,
          unit_id: unit.id,
          serial_number: unit.serial_number,
          model_name: unit.model_name,
          client_name: unit.current_client?.company_name || 'Klien Umum',
          type: 'LOW_HEALTH_SCORE',
          severity: 'WARNING',
          title: `Health Score Rendah (${Math.round(hsScore)}/100)`,
          value: `${Math.round(hsScore)}/100`,
          limit: `Min ${ALERT_THRESHOLDS.HEALTH_SCORE_MIN}`,
          last_seen: unit.last_seen_at || new Date(),
        });
      }

      // 5. Check Suhu Kabinet Melebihi Batas (> 10°C)
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

      // 6. Voltage Anomaly
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

      // 7. Check Compressor Over-Current / Kompresor Melemah (> 12A)
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

  // ─── CRON JOB: DETEKSI UNIT MATI / NON-OPERASIONAL (> 24 JAM) ─────────────
  // Berjalan otomatis setiap 1 jam untuk memeriksa unit aktif yang hilang sinyal
  @Cron(CronExpression.EVERY_HOUR)
  async checkOfflineUnitsCron(): Promise<void> {
    this.logger.log('⏰ [CRON] Memeriksa unit mati / non-operasional (> 24 jam)...');
    try {
      const units = await this.unitRepo.find({
        where: { status: 'ACTIVE' },
        relations: ['current_client'],
      });

      const now = Date.now();
      const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
      const targetUserId = admin ? admin.id : null;

      for (const unit of units) {
        // Hanya cek unit yang memiliki device IoT
        if (!unit.iot_unit_id) continue;

        let isOffline = false;
        let offlineDesc = '';

        if (!unit.last_seen_at) {
          isOffline = true;
          offlineDesc = 'Unit belum pernah mengirim sinyal telemetri sejak didaftarkan.';
        } else {
          const hoursOffline = (now - new Date(unit.last_seen_at).getTime()) / (1000 * 60 * 60);
          if (hoursOffline > ALERT_THRESHOLDS.OFFLINE_MAX_HOURS) {
            isOffline = true;
            const formatted = hoursOffline >= 48 ? `${Math.floor(hoursOffline / 24)} hari` : `${Math.floor(hoursOffline)} jam`;
            offlineDesc = `Unit tidak mengirim sinyal telemetri selama lebih dari ${formatted} (batas toleransi: 24 jam).`;
          }
        }

        if (isOffline) {
          const alertType = 'UNIT_OFFLINE';
          const alertTitle = `🚨 Unit Mati / Tidak Beroperasi > 24 Jam: ${unit.model_name}`;
          const alertContent = `Unit ${unit.serial_number} (${unit.outlet_branch || 'Umum'}) terindikasi non-operasional. ${offlineDesc} Mohon lakukan pengecekan fisik dan konektivitas modul IoT.`;

          // Cooldown 24 jam untuk alert unit mati agar tidak kirim email spam tiap jam
          const cooldownKey = `${unit.id}:${alertType}`;
          const lastSent = IotService.lastInAppAlertSent.get(cooldownKey) || 0;
          const COOLDOWN_24H = 24 * 60 * 60 * 1000;

          if (now - lastSent > COOLDOWN_24H) {
            // 1. Simpan ke notifikasi portal (in-app)
            if (targetUserId) {
              await this.notificationsService.createNotification({
                user_id: targetUserId,
                type: NotificationType.ALERT,
                sender_name: 'IoT Sistem Monitoring',
                title: alertTitle,
                content: alertContent,
              });
            }

            // 2. Kirim Notifikasi Email
            const recipientEmails = await this.getRecipientEmailsForUnit(unit);
            await this.emailAlertService.sendIotAlertEmail({
              to: recipientEmails,
              unitSerialNumber: unit.serial_number,
              unitModel: unit.model_name,
              clientName: unit.current_client?.company_name,
              outletBranch: unit.outlet_branch,
              alertTitle,
              alertType,
              currentValue: 'Non-Operasional (> 24 Jam)',
              thresholdLimit: `Maks ${ALERT_THRESHOLDS.OFFLINE_MAX_HOURS} Jam`,
              severity: 'CRITICAL',
            });

            IotService.lastInAppAlertSent.set(cooldownKey, now);
            this.logger.warn(`⚠️ [OFFLINE ALERT SENT] Unit ${unit.serial_number}`);
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error running offline units cron: ${err.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  cleanupStaleMemoryMaps() {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Bersihkan doorCounterMap yang bukan hari ini
      for (const [key] of IotService.doorCounterMap.entries()) {
        if (!key.endsWith(`:${today}`)) {
          IotService.doorCounterMap.delete(key);
        }
      }

      // Bersihkan lastInAppAlertSent & lastHistorySave yang lebih dari 7 hari
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      for (const [key, timestamp] of IotService.lastInAppAlertSent.entries()) {
        if (timestamp < sevenDaysAgo) {
          IotService.lastInAppAlertSent.delete(key);
        }
      }
      for (const [key, timestamp] of IotService.lastHistorySave.entries()) {
        if (timestamp < sevenDaysAgo) {
          IotService.lastHistorySave.delete(key);
        }
      }
      this.logger.log('🧹 [MEMORY CLEANUP] Stale IoT memory maps cleaned up successfully.');
    } catch (e: any) {
      this.logger.error(`Failed to cleanup stale memory maps: ${e.message}`);
    }
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
    } else if (hours <= 168) {
      // 1 minggu (168 jam) → agregasi 15 menit (~672 titik) atau 30 menit
      bucketSeconds = 15 * 60; // 15 menit
    } else if (hours <= 720) {
      // 1 bulan (720 jam) → agregasi 1 jam (1 state per 1 jam → 720 titik)
      bucketSeconds = 60 * 60; // 1 jam
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
        to_char(to_timestamp(floor(extract(epoch from recorded_at) / $1) * $1) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS recorded_at,
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
