import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceReport, FormType, ReportStatus } from './entities/service-report.entity';
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
    const { unitId, baseReportId, ...reportData } = dto;
    
    // Find latest version for this unit and form type
    const latest = await this.reportRepo.findOne({
      where: { unit: { id: unitId }, form_type: dto.form_type },
      order: { version: 'DESC' },
    });
    
    const nextVersion = latest ? latest.version + 1 : 1;
    
    let reportId: string;
    if (dto.baseReportId) {
      // Strip existing prefixes (REP-, REP-REV-, REP-REV2-, etc) to get the core ID
      const coreId = dto.baseReportId.replace(/^(REP-REV\d*-|REP-)/, '');
      reportId = `REP-REV${nextVersion > 2 ? nextVersion : ''}-${coreId}`;
    } else {
      reportId = generatePrefixedId('REP');
    }

    // Default status to PENDING for Partner role, APPROVED for Admin
    const defaultStatus = (user as any).role === 'PARTNER' ? 'PENDING' : 'APPROVED';

    const report = this.reportRepo.create({
      ...reportData,
      id: reportId,
      unit: { id: unitId } as any,
      created_by: { id: (user as any).userId } as any,
      version: nextVersion,
      photo_urls: dto.photo_urls || [],
      status: dto.status || defaultStatus,
      service_log_id: dto.service_log_id,
    });

    try {
      return await this.reportRepo.save(report);
    } catch (err: any) {
      console.error('[ReportsService] Save Error:', err);
      throw new InternalServerErrorException(`Gagal menyimpan: ${err.detail || err.message}`);
    }
  }

  async findByUnit(unitId: string, statusOnlyApproved: boolean = false) {
    const where: any = { unit: { id: unitId } };
    if (statusOnlyApproved) {
      where.status = ReportStatus.APPROVED;
    }
    return this.reportRepo.find({
      where,
      relations: ['created_by'],
      order: { created_at: 'DESC' },
    });
  }

  async findByServiceLog(serviceLogId: string) {
    return this.reportRepo.find({
      where: { service_log_id: serviceLogId },
      relations: ['created_by', 'unit'],
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

  async findAll(page: number = 1, limit: number = 10, type?: FormType | 'REVISED', status?: string) {
    const query = this.reportRepo.createQueryBuilder('report')
      .leftJoinAndSelect('report.unit', 'unit')
      .leftJoinAndSelect('report.created_by', 'user')
      .orderBy('report.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (type) {
      if (type === 'REVISED') {
        query.andWhere("report.id LIKE '%-REV%'");
      } else {
        query.andWhere('report.form_type = :type', { type });
      }
    }

    if (status) {
      query.andWhere('report.status = :status', { status });
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

  async update(id: string, updateData: any) {
    const report = await this.findOne(id);
    
    if (updateData.data) {
      report.data = updateData.data;
    }
    if (updateData.photo_urls && updateData.photo_urls.length > 0) {
      report.photo_urls = updateData.photo_urls;
    }
    if (updateData.status) {
      report.status = updateData.status;
    }
    if (updateData.revision_note !== undefined) {
      report.revision_note = updateData.revision_note;
    }
    
    try {
      return await this.reportRepo.save(report);
    } catch (err: any) {
      console.error('[ReportsService] Update Error:', err);
      throw new InternalServerErrorException(`Gagal mengupdate laporan: ${err.message}`);
    }
  }
}
