import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Partner } from '../partners/entities/partner.entity';
import { ServiceLog } from '../service-logs/entities/service-log.entity';
import { Notification, NotificationType } from '../notifications/entities/notification.entity';
import { User, UserRole } from '../auth/entities/user.entity';

@Injectable()
export class UnitsSmartRoutingService {
  constructor(
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
  ) {}

  async requestServiceSmartRouting(unitId: string, body: { city?: string; notes?: string; contact_phone?: string; contact_name?: string }) {
    const unit = await this.unitRepo.findOne({
      where: { id: unitId },
      relations: ['current_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');

    const targetCity = body.city || unit.specs?.city || 'Jakarta';

    // Cari partner lokal di kota tersebut yang aktif
    const partner = await this.unitRepo.manager.getRepository(Partner).findOne({
      where: { city: targetCity, is_active: true }
    });

    if (partner) {
      return this.routeToPartner(unit, partner, targetCity, body);
    } else {
      return this.routeToHqFallback(unit, targetCity, body);
    }
  }

  private async notifyAdminsNewRequest(unit: Unit, body: any, isPartner: boolean, partnerName?: string) {
    try {
      const userRepo = this.unitRepo.manager.getRepository(User);
      const notifRepo = this.unitRepo.manager.getRepository(Notification);
      const admins = await userRepo.find({
        where: [
          { role: UserRole.ADMIN },
          { role: UserRole.SUPER_ADMIN },
        ],
      });

      const clientName = unit.current_client?.company_name || 'Klien';
      const destination = isPartner ? `Partner: ${partnerName}` : 'Holicindo HQ';
      const content = `Permintaan servis baru untuk unit SN: ${unit.serial_number} (${unit.model_name}) dari ${clientName}. Masalah: ${body.notes || '-'}. Kontak: ${body.contact_name || '-'} (${body.contact_phone || '-'}). Alokasi: ${destination}.`;

      for (const admin of admins) {
        const notif = notifRepo.create({
          user_id: admin.id,
          type: NotificationType.ALERT,
          sender_name: clientName,
          title: 'Permintaan Servis Baru',
          content,
          is_read: false,
        });
        await notifRepo.save(notif);
      }
    } catch (err) {
      console.error('Failed to notify admins of new service request:', err);
    }
  }

  private async routeToPartner(unit: Unit, partner: Partner, targetCity: string, body: any) {
    const logRepo = this.unitRepo.manager.getRepository(ServiceLog);
    const newLog = logRepo.create({
      unit,
      partner,
      service_date: new Date(),
      technician_name: 'Pending Assignment',
      issue_description: `${body.notes || '-'} (Kontak: ${body.contact_name || 'Outlet'} - ${body.contact_phone || '-'})`,
      action_taken: 'Menunggu penugasan teknisi dan konfirmasi jadwal servis.',
      status: 'PENDING',
    } as any);
    await logRepo.save(newLog);

    // Kirim notifikasi lonceng ke Admin
    await this.notifyAdminsNewRequest(unit, body, true, partner.partner_name);

    return {
      success: true,
      routed_to: 'PARTNER',
      partner_name: partner.partner_name,
      city: partner.city,
      contact_wa: partner.contact_wa,
      message: `Permintaan servis berhasil diarahkan ke partner regional kami di ${partner.city} (${partner.partner_name}). Tembusan (CC) telah dikirim ke Holicindo HQ.`,
    };
  }

  private async routeToHqFallback(unit: Unit, targetCity: string, body: any) {
    const logRepo = this.unitRepo.manager.getRepository(ServiceLog);
    const newLog = logRepo.create({
      unit,
      service_date: new Date(),
      technician_name: 'Pending HQ Assignment',
      issue_description: `${body.notes || '-'} (Kontak: ${body.contact_name || 'Outlet'} - ${body.contact_phone || '-'})`,
      action_taken: 'Menunggu penugasan teknisi dari Holicindo HQ.',
      status: 'PENDING',
    } as any);
    await logRepo.save(newLog);

    // Kirim notifikasi lonceng ke Admin
    await this.notifyAdminsNewRequest(unit, body, false);

    const hqWaNumber = '+6281-2871-20358';
    const waText = `Halo Holicindo HQ, saya ingin meminta servis untuk:\n\n*Serial Number:* ${unit.serial_number}\n*Model:* ${unit.model_name}\n*Lokasi:* ${targetCity}\n*Catatan Kendala:* ${body.notes || '-'}\n\nMohon bantuannya untuk assign teknisi secara manual. Terima kasih!`;
    const waLink = `https://wa.me/${hqWaNumber}?text=${encodeURIComponent(waText)}`;

    return {
      success: true,
      routed_to: 'HQ_FALLBACK',
      whatsapp_link: waLink,
      message: `Layanan di kota ${targetCity} belum memiliki partner regional yang aktif. Permintaan Anda telah dicatat di sistem dan akan diteruskan ke Holicindo HQ via WhatsApp.`,
    };
  }
}
