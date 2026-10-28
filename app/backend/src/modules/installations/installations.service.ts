import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation } from './entities/installation.entity';
import { CreateInstallationDto } from './dto/create-installation.dto';

@Injectable()
export class InstallationsService {
  constructor(
    @InjectRepository(Installation)
    private installationRepo: Repository<Installation>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.installationRepo.findAndCount({
      relations: ['unit', 'unit.current_client', 'partner'],
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

  async create(dto: CreateInstallationDto) {
    const { unitId, partnerId, installation_date, ...rest } = dto;
    const installation = this.installationRepo.create({
      ...rest,
      unit: { id: unitId } as any,
      partner: partnerId ? ({ id: partnerId } as any) : null,
      installation_date: installation_date ? new Date(installation_date) : null,
    });
    return this.installationRepo.save(installation);
  }

  async findByUnit(unitId: string) {
    return this.installationRepo.find({
      where: { unit: { id: unitId } },
      relations: ['partner'],
      order: { created_at: 'DESC' },
    });
  }

  async update(id: string, data: any) {
    const installation = await this.installationRepo.findOne({ where: { id } });
    if (!installation) throw new NotFoundException('Installation tidak ditemukan');

    if (data.location !== undefined) installation.location = data.location;
    if (data.technician_name !== undefined) installation.technician_name = data.technician_name;
    if (data.notes !== undefined) installation.notes = data.notes;
    if (data.status !== undefined) installation.status = data.status;
    if (data.installation_date !== undefined) {
      installation.installation_date = data.installation_date ? new Date(data.installation_date) : null;
    }
    if (data.partnerId !== undefined) {
      installation.partner = data.partnerId ? ({ id: data.partnerId } as any) : null;
    }
    if (data.unitId !== undefined) {
      installation.unit = { id: data.unitId } as any;
    }

    return this.installationRepo.save(installation);
  }

  async delete(id: string) {
    const installation = await this.installationRepo.findOne({ where: { id } });
    if (!installation) throw new NotFoundException('Installation tidak ditemukan');
    await this.installationRepo.remove(installation);
    return { message: 'Installation berhasil dihapus' };
  }
}
