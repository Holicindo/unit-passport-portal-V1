import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceLog } from './entities/service-log.entity';
import { ServiceLogAttachment } from './entities/service-log-attachment.entity';
import { CreateServiceLogDto } from './dto/create-service-log.dto';
import { StorageService } from '../storage/storage.service';
import { User } from '../auth/entities/user.entity';
import { Notification, NotificationType } from '../notifications/entities/notification.entity';


@Injectable()
export class ServiceLogsService {
  constructor(
    @InjectRepository(ServiceLog)
    private logRepo: Repository<ServiceLog>,
    @InjectRepository(ServiceLogAttachment)
    private attachmentRepo: Repository<ServiceLogAttachment>,
    private storageService: StorageService,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.logRepo.findAndCount({
      relations: ['unit', 'unit.current_client', 'partner', 'attachments'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateServiceLogDto) {
    const { unitId, partnerId, ...logData } = data;
    const log = this.logRepo.create({
      ...logData,
      unit: { id: unitId } as any,
      partner: partnerId ? { id: partnerId } as any : undefined,
      scheduled_date: logData.scheduled_date ? new Date(logData.scheduled_date) : undefined,
      delivery_date: logData.delivery_date ? new Date(logData.delivery_date) : undefined,
    });
    return this.logRepo.save(log);
  }

  async findByUnit(unitId: string) {
    return this.logRepo.find({
      where: { unit: { id: unitId } },
      relations: ['partner', 'attachments'],
      order: { service_date: 'DESC' },
    });
  }

  async addAttachment(logId: string, file: Express.Multer.File) {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) throw new NotFoundException('Service Log tidak ditemukan');

    const { url, key } = await this.storageService.uploadFile(file, `logs/${logId}`);

    const attachment = this.attachmentRepo.create({
      service_log: log,
      file_url: url,
      file_name: file.originalname,
      file_type: file.mimetype,
    });

    return this.attachmentRepo.save(attachment);
  }

  async update(id: string, data: any) {
    const log = await this.logRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Service Log tidak ditemukan');

    if (data.technician_name !== undefined) log.technician_name = data.technician_name;
    if (data.issue_description !== undefined) log.issue_description = data.issue_description;
    if (data.action_taken !== undefined) log.action_taken = data.action_taken;
    if (data.status !== undefined) log.status = data.status;
    if (data.partnerId !== undefined) {
      log.partner = data.partnerId ? { id: data.partnerId } as any : null;
    }
    if (data.service_date !== undefined) {
      log.service_date = new Date(data.service_date);
    }
    if (data.scheduled_date !== undefined) {
      log.scheduled_date = data.scheduled_date ? new Date(data.scheduled_date) : null;
    }
    if (data.delivery_date !== undefined) {
      log.delivery_date = data.delivery_date ? new Date(data.delivery_date) : null;
    }
    if (data.planning_notes !== undefined) log.planning_notes = data.planning_notes;
    if (data.internal_notes !== undefined) log.internal_notes = data.internal_notes;
    if (data.replaced_sparepart !== undefined) log.replaced_sparepart = data.replaced_sparepart;
    if (data.is_allocated !== undefined) log.is_allocated = data.is_allocated;
    if (data.task_type !== undefined) log.task_type = data.task_type;
    if (data.status === 'COMPLETED') {
      log.completed_at = new Date();
    }

    const saved = await this.logRepo.save(log);

    // Kirim notifikasi lonceng ke akun Klien yang memiliki unit ini
    await this.notifyClientServiceUpdate(saved.id, saved.status, saved.technician_name, saved.scheduled_date);

    return saved;
  }

  private async notifyClientServiceUpdate(logId: string, status: string, techName?: string, schedDate?: Date | null) {
    try {
      const fullLog = await this.logRepo.findOne({
        where: { id: logId },
        relations: ['unit', 'unit.current_client'],
      });
      const clientId = fullLog?.unit?.current_client?.id;
      if (!clientId) return;

      const userRepo = this.logRepo.manager.getRepository(User);
      const notifRepo = this.logRepo.manager.getRepository(Notification);

      const clientUsers = await userRepo.find({
        where: { client_id: clientId },
      });

      const sn = fullLog.unit.serial_number;
      const model = fullLog.unit.model_name;
      const schedStr = schedDate
        ? new Date(schedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

      let title = 'Update Permintaan Servis';
      let content = `Status servis unit ${sn} (${model}) diperbarui menjadi "${status}".`;

      if (techName && !techName.toLowerCase().includes('pending') && !techName.toLowerCase().includes('alokasi')) {
        content += ` Teknisi yang ditugaskan: ${techName}.`;
      }
      if (schedStr) {
        content += ` Rencana kunjungan: ${schedStr}.`;
      }
      if (status === 'COMPLETED') {
        title = 'Servis Selesai';
        content = `Pengerjaan servis unit ${sn} (${model}) telah selesai. Laporan servis telah tercatat di sistem Holicindo.`;
      }

      for (const cu of clientUsers) {
        const notif = notifRepo.create({
          user_id: cu.id,
          type: NotificationType.ALERT,
          sender_name: 'Holicindo HQ',
          title,
          content,
          is_read: false,
        });
        await notifRepo.save(notif);
      }
    } catch (err) {
      console.error('Failed to notify client user on service log update:', err);
    }
  }

  async bulkReschedule(ids: string[], newDate: string, newDeliveryDate?: string) {
    const logs = await this.logRepo.findByIds(ids);
    const updated = logs.map(log => {
      log.scheduled_date = new Date(newDate);
      log.service_date = new Date(newDate);
      if (newDeliveryDate) log.delivery_date = new Date(newDeliveryDate);
      return log;
    });
    return this.logRepo.save(updated);
  }
}
