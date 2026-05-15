import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceReport, FormType } from './entities/service-report.entity';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ServiceReport)
    private reportRepo: Repository<ServiceReport>,
  ) {}

  async create(dto: CreateServiceReportDto, user: User) {
    const { unitId, ...reportData } = dto;
    
    // Find latest version for this unit and form type to increment version
    const latest = await this.reportRepo.findOne({
      where: { unit: { id: unitId }, form_type: dto.form_type },
      order: { version: 'DESC' },
    });

    const nextVersion = latest ? latest.version + 1 : 1;

    const report = this.reportRepo.create({
      ...reportData,
      unit: { id: unitId } as any,
      created_by: user,
      version: nextVersion,
    });

    return this.reportRepo.save(report);
  }

  async findByUnit(unitId: string) {
    return this.reportRepo.find({
      where: { unit: { id: unitId } },
      relations: ['created_by'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ['unit', 'created_by'],
    });
    if (!report) throw new NotFoundException('Report tidak ditemukan');
    return report;
  }
}
