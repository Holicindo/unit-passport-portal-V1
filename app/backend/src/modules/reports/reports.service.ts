import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceReport, FormType } from './entities/service-report.entity';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { User } from '../auth/entities/user.entity';

import { generatePrefixedId } from '../../common/utils/id-generator';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ServiceReport)
    private reportRepo: Repository<ServiceReport>,
  ) {}

  async create(dto: CreateServiceReportDto, user: User) {
    const { unitId, ...reportData } = dto;
    
    // Find latest version for this unit and form type
    const latest = await this.reportRepo.findOne({
      where: { unit: { id: unitId }, form_type: dto.form_type },
      order: { version: 'DESC' },
    });
    
    const nextVersion = latest ? latest.version + 1 : 1;
    
    // Revision Logic: 
    let reportId: string;
    if (dto.baseReportId) {
      // If original is REP-HQ8OJWK, revision should be REP-REV-HQ8OJWK
      // Strip existing prefixes to get the core ID
      const coreId = dto.baseReportId.replace(/^(REP-REV-|REP-)/, '');
      reportId = `REP-REV-${coreId}`;
    } else {
      reportId = generatePrefixedId('REP');
    }

    const report = this.reportRepo.create({
      ...reportData,
      id: reportId,
      unit: { id: unitId } as any,
      created_by: { id: (user as any).userId } as any,
      version: nextVersion,
      photo_urls: dto.photo_urls || [],
    });

    try {
      return await this.reportRepo.save(report);
    } catch (err: any) {
      console.error('[ReportsService] Save Error:', err);
      throw new InternalServerErrorException(`Gagal menyimpan: ${err.detail || err.message}`);
    }
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

  async findAll(page: number = 1, limit: number = 10, type?: FormType) {
    const query = this.reportRepo.createQueryBuilder('report')
      .leftJoinAndSelect('report.unit', 'unit')
      .leftJoinAndSelect('report.created_by', 'user')
      .orderBy('report.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (type) {
      query.andWhere('report.form_type = :type', { type });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async removeBulk(ids: string[]) {
    try {
      return await this.reportRepo.delete(ids);
    } catch (err: any) {
      console.error('[ReportsService] Delete Error:', err);
      throw new InternalServerErrorException(`Gagal menghapus laporan: ${err.message}`);
    }
  }
}
