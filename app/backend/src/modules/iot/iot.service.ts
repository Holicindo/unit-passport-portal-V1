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

  constructor(
    @InjectRepository(IotTelemetryLog)
    private readonly telemetryLogRepo: Repository<IotTelemetryLog>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Fungsi utama: dipanggil oleh MqttService setiap kali ada data baru dari ESP32.
   */
  async processTelemetry(payload: TelemetryPayload): Promise<void> {
    // 1. Cari unit yang punya iot_unit_id cocok dengan payload.unitId
    const unit = await this.unitRepo.findOne({
      where: { iot_unit_id: payload.unitId } as any,
    });

    if (!unit) {
      this.logger.warn(`⚠️ Tidak ada unit dengan iot_unit_id="${payload.unitId}" di database. Data diabaikan.`);
      return;
    }

    // 2. Simpan ke tabel riwayat (iot_telemetry_logs)
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
    });
    await this.telemetryLogRepo.save(log);

    // 3. Update kondisi terkini di tabel units
    await this.unitRepo.update(unit.id, {
      last_temp_cabinet: payload.tempCabinet,
      last_temp_evaporator: payload.tempEvaporator,
      last_temp_condenser: payload.tempCondenser,
      last_voltage: payload.voltage,
      last_power: payload.power,
      last_seen_at: new Date(),
      is_door1_open: payload.isDoor1Open,
      is_door2_open: payload.isDoor2Open,
    } as any);

    this.logger.debug(`✅ Data tersimpan untuk unit ${unit.id} (${payload.unitId})`);

    // 4. Periksa kondisi alert
    await this.checkAlerts(unit, payload);
  }

  /**
   * Memeriksa apakah ada kondisi abnormal dan membuat notifikasi jika ada.
   */
  private async checkAlerts(unit: Unit, payload: TelemetryPayload): Promise<void> {
    const alerts: { title: string; content: string }[] = [];

    // Cek suhu kabinet (abaikan nilai -127 = sensor tidak terbaca)
    if (payload.tempCabinet > ALERT_THRESHOLDS.TEMP_CABINET_MAX && payload.tempCabinet !== -127) {
      alerts.push({
        title: `🌡️ Suhu Kabinet Tinggi: ${unit.model_name}`,
        content: `Suhu kabinet unit ${unit.serial_number} (${unit.outlet_branch}) mencapai ${payload.tempCabinet}°C, melebihi batas normal ${ALERT_THRESHOLDS.TEMP_CABINET_MAX}°C.`,
      });
    }

    // Cek suhu evaporator
    if (payload.tempEvaporator > ALERT_THRESHOLDS.TEMP_EVAPORATOR_MAX && payload.tempEvaporator !== -127) {
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
   * Mengambil data kondisi terkini sebuah unit (untuk widget real-time).
   */
  async getLatestTelemetry(unitId: string) {
    return this.telemetryLogRepo.findOne({
      where: { unit_id: unitId },
      order: { recorded_at: 'DESC' },
    });
  }

  /**
   * Mengambil riwayat data sensor dalam N jam terakhir (untuk grafik tren).
   */
  async getTelemetryHistory(unitId: string, hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.telemetryLogRepo
      .createQueryBuilder('log')
      .where('log.unit_id = :unitId', { unitId })
      .andWhere('log.recorded_at >= :since', { since })
      .orderBy('log.recorded_at', 'ASC')
      .getMany();
  }
}
