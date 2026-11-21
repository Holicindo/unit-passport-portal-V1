import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface AlertEmailPayload {
  to?: string[];
  unitSerialNumber: string;
  unitModel: string;
  clientName?: string;
  outletBranch?: string;
  alertTitle: string;
  alertType: string;
  currentValue: string;
  thresholdLimit: string;
  severity: 'CRITICAL' | 'WARNING';
  timestamp?: Date;
}

@Injectable()
export class EmailAlertService {
  private readonly logger = new Logger(EmailAlertService.name);
  private transporter: nodemailer.Transporter | null = null;
  // Anti-spam cooldown map per unit: key: unitSerialNumber => timestamp (ms)
  private readonly alertCooldownMap = new Map<string, number>();
  // Cooldown 7 jam per unit agar tidak flooding email spam
  private readonly COOLDOWN_MS = 7 * 60 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure,
        auth: { user, pass },
      });
      this.logger.log(`📧 Transporter email aktif dengan host: ${host}:${port}`);
    } else {
      this.logger.warn(`⚠️ Kredensial SMTP belum lengkap di .env (SMTP_HOST, SMTP_USER, SMTP_PASS). Mode simulasi log email diaktifkan.`);
    }
  }

  /**
   * Kirim email warning ke admin & user terkait jika ambang batas IoT terlampaui.
   * Hanya mengirim jika severity === 'CRITICAL' dengan cooldown 7 jam per unit.
   */
  async sendIotAlertEmail(payload: AlertEmailPayload): Promise<boolean> {
    // 1. FILTER KETAT: Hanya kirim email untuk alert yang benar-benar SANGAT KRITIKAL
    if (payload.severity !== 'CRITICAL') {
      this.logger.debug(`ℹ️ Email diabaikan untuk alert ${payload.alertType} (severity: ${payload.severity} bukan CRITICAL)`);
      return false;
    }

    // 2. Cooldown 7 jam per unit (global per unit)
    const cooldownKey = payload.unitSerialNumber;
    const now = Date.now();
    const lastSent = this.alertCooldownMap.get(cooldownKey) || 0;

    if (now - lastSent < this.COOLDOWN_MS) {
      const remainingMin = Math.round((this.COOLDOWN_MS - (now - lastSent)) / 60000);
      const remainingHours = (remainingMin / 60).toFixed(1);
      this.logger.debug(`⏳ Email alert untuk unit ${cooldownKey} sedang dalam cooldown 7 jam (${remainingHours} jam tersisa)`);
      return false;
    }

    const defaultAdminEmail = this.configService.get<string>('ADMIN_ALERT_EMAIL') || this.configService.get<string>('ADMIN_EMAIL') || 'admin@holicindo.com';
    
    // Daftar email yang dikecualikan dari penerimaan alert IoT
    const EXCLUDED_EMAILS = [
      'mp@holicindo.com',
      'follow-up03@holicindo.com',
    ].map(e => e.toLowerCase().trim());

    const recipients = Array.from(new Set([...(payload.to || []), defaultAdminEmail]))
      .filter(Boolean)
      .filter(email => !EXCLUDED_EMAILS.includes(email.toLowerCase().trim()));

    if (recipients.length === 0) {
      this.logger.warn(`Tidak ada alamat email penerima untuk unit ${payload.unitSerialNumber}`);
      return false;
    }

    const isCritical = payload.severity === 'CRITICAL';
    const badgeColor = isCritical ? '#DC2626' : '#D97706';
    const badgeBg = isCritical ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)';
    const headerTitle = isCritical ? 'PERINGATAN KRITIS SISTEM IOT' : 'PERINGATAN SISTEM IOT';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        <!-- Header -->
        <div style="background: #0B192C; padding: 24px; text-align: center; border-bottom: 3px solid ${badgeColor};">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px;">PT. Holicindo Dasa Anugerah</h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Unit Passport & IoT Monitoring Alert System</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <div style="display: inline-block; padding: 6px 14px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 16px;">
            🚨 ${headerTitle}
          </div>

          <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 8px; font-size: 18px;">
            ${payload.alertTitle}
          </h3>
          <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-top: 0;">
            Sistem telemetri mendeteksi parameter unit berada di luar batas operasional normal yang telah ditentukan. Mohon segera lakukan pengecekan teknis.
          </p>

          <!-- Table Info -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; background: #f8fafc; border-radius: 8px; overflow: hidden;">
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569; width: 35%;">Serial Number</td>
                <td style="padding: 10px 14px; color: #0f172a; font-weight: bold;">${payload.unitSerialNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Model Unit</td>
                <td style="padding: 10px 14px; color: #0f172a;">${payload.unitModel}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Klien / Cabang</td>
                <td style="padding: 10px 14px; color: #0f172a;">${payload.clientName || 'Holicindo Partner'}${payload.outletBranch ? ` (${payload.outletBranch})` : ''}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Nilai Terdeteksi</td>
                <td style="padding: 10px 14px; color: ${badgeColor}; font-weight: bold; font-size: 14px;">${payload.currentValue}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Ambang Batas (Limit)</td>
                <td style="padding: 10px 14px; color: #334155;">${payload.thresholdLimit}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Waktu Deteksi</td>
                <td style="padding: 10px 14px; color: #334155;">${(payload.timestamp || new Date()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 24px;">
            <a href="http://portal.holicindo.com/id/${payload.unitSerialNumber}" style="display: inline-block; padding: 12px 24px; background: #2E5BFF; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
              Buka Detail Telemetri Unit &rarr;
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          Email ini dibuat secara otomatis oleh Holicindo IoT Monitoring System.<br/>
          &copy; ${new Date().getFullYear()} PT. Holicindo Dasa Anugerah. All rights reserved.
        </div>
      </div>
    `;

    const subject = `[${payload.severity}] ${payload.alertTitle} - Unit ${payload.unitSerialNumber}`;

    if (this.transporter) {
      try {
        const fromEmail = this.configService.get<string>('SMTP_FROM') || '"Holicindo IoT Alert" <no-reply@holicindo.com>';
        await this.transporter.sendMail({
          from: fromEmail,
          to: recipients,
          subject,
          html: htmlContent,
        });
        this.logger.log(`✅ [EMAIL SENT] Berhasil mengirim alert email (${subject}) ke: ${recipients.join(', ')}`);
        this.alertCooldownMap.set(cooldownKey, now);
        return true;
      } catch (err: any) {
        this.logger.error(`❌ [EMAIL ERROR] Gagal mengirim alert email: ${err.message}`);
        return false;
      }
    } else {
      // Simulasi log jika SMTP belum diisi di .env
      this.logger.warn(`📢 [SIMULASI EMAIL] Alert terpicu untuk ${recipients.join(', ')}: "${subject}" (Aktifkan SMTP_HOST di .env untuk live delivery)`);
      this.alertCooldownMap.set(cooldownKey, now);
      return true;
    }
  }
}
