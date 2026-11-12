import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from './entities/partner.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private partnerRepo: Repository<Partner>,
  ) {}

  async findAll() {
    const partners = await this.partnerRepo.find({
      relations: ['service_logs'],
    });

    return partners.map((partner) => {
      const logs = partner.service_logs || [];
      const totalTickets = logs.length;
      const completedLogs = logs.filter((l) => l.status === 'COMPLETED' || l.completed_at);
      
      let totalResolutionHours = 0;
      let onTimeCount = 0;

      completedLogs.forEach((log) => {
        const start = new Date(log.created_at || log.service_date).getTime();
        const end = log.completed_at ? new Date(log.completed_at).getTime() : new Date().getTime();
        const diffHours = Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));
        totalResolutionHours += diffHours;
        if (diffHours <= 48) {
          onTimeCount++;
        }
      });

      const avgResolutionHours = completedLogs.length > 0 
        ? Math.round(totalResolutionHours / completedLogs.length) 
        : 18;
      
      const slaScore = completedLogs.length > 0
        ? Math.round((onTimeCount / completedLogs.length) * 100)
        : 95;

      return {
        ...partner,
        service_logs: undefined,
        sla_metrics: {
          total_tickets: totalTickets,
          completed_tickets: completedLogs.length,
          avg_resolution_hours: avgResolutionHours,
          sla_score: slaScore,
          status_label: slaScore >= 90 ? 'EXCELLENT' : slaScore >= 75 ? 'GOOD' : 'NEEDS_ATTENTION',
        },
      };
    });
  }

  async create(data: any) {
    const partner = this.partnerRepo.create(data);
    return this.partnerRepo.save(partner);
  }

  async findOne(id: string) {
    return this.partnerRepo.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.partnerRepo.update(id, data);
    return this.partnerRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    // Unlink all foreign keys referencing this partner before deleting
    await this.partnerRepo.manager.transaction(async (manager) => {
      // 1. Unlink service_logs (kolomnya adalah "partnerId")
      await manager.query(`UPDATE service_logs SET "partnerId" = NULL WHERE "partnerId" = $1`, [id]);
      // 2. Unlink users (kolomnya adalah partner_id)
      await manager.query(`UPDATE users SET partner_id = NULL WHERE partner_id = $1`, [id]);
      // 3. Unlink operational tables (deliveries, installations, invoices)
      await manager.query(`UPDATE deliveries SET "partnerId" = NULL WHERE "partnerId" = $1`, [id]);
      await manager.query(`UPDATE installations SET "partnerId" = NULL WHERE "partnerId" = $1`, [id]);
      await manager.query(`UPDATE invoices SET "partnerId" = NULL WHERE "partnerId" = $1`, [id]);

      // 4. Delete the partner record
      await manager.delete(Partner, id);
    });

    return { success: true, message: 'Mitra berhasil dihapus' };
  }
}
