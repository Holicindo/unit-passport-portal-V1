import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceLog } from './entities/service-log.entity';
import { ServiceLogAttachment } from './entities/service-log-attachment.entity';
import { CreateServiceLogDto } from './dto/create-service-log.dto';
import { StorageService } from '../storage/storage.service';

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
    if (data.action_taken !== undefined) log.action_taken = data.action_taken;
    if (data.status !== undefined) log.status = data.status;
    if (data.partnerId !== undefined) {
      log.partner = data.partnerId ? { id: data.partnerId } as any : null;
    }
    if (data.service_date !== undefined) {
      log.service_date = new Date(data.service_date);
    }
    if (data.status === 'COMPLETED') {
      log.completed_at = new Date();
    }

    return this.logRepo.save(log);
  }
}
