import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { OwnershipHistory } from '../ownership/entities/ownership-history.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(OwnershipHistory) private ownershipRepo: Repository<OwnershipHistory>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  // L1 Public — Limited view for guest scan
  async findByQrTokenPublic(token_or_serial: string) {
    const unit = await this.unitRepo.findOne({
      where: [
        { qr_token: token_or_serial },
        { serial_number: token_or_serial }
      ],
      relations: ['current_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    return unit;
  }

  // L2 Client — Fleet list for specific client
  async findAllByClient(clientId: string) {
    return this.unitRepo.find({
      where: { current_client: { id: clientId } },
      relations: ['warranties', 'service_logs', 'current_client', 'ownership_history', 'ownership_history.from_client', 'ownership_history.to_client'],
    });
  }

  // L2 Client — Single unit detail with ownership check
  async findOneForClient(id: string, clientId: string) {
    const unit = await this.unitRepo.findOne({
      where: { id, current_client: { id: clientId } },
      relations: ['current_client', 'warranties', 'service_logs', 'service_logs.partner', 'ownership_history', 'ownership_history.from_client', 'ownership_history.to_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan atau tidak terdaftar atas nama perusahaan Anda.');
    return unit;
  }

  // L3 Partner — Technical view
  async findTechnicalById(id: string) {
    const unit = await this.unitRepo.findOne({
      where: { id },
      relations: ['current_client', 'warranties', 'service_logs'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    return unit;
  }

  // L4 Admin — Full list with pagination (IoT units diprioritaskan di paling atas)
  async findAll(page: number = 1, limit: number = 10, search?: string, city?: string, client?: string) {
    const qb = this.unitRepo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.current_client', 'current_client')
      .leftJoinAndSelect('unit.warranties', 'warranties')
      .leftJoinAndSelect('unit.service_logs', 'service_logs');

    // Join latest health score (latest date per unit)
    qb.leftJoinAndMapOne(
      'unit.latest_health_score',
      'unit_health_scores',
      'hs',
      `hs.unit_id = unit.id AND hs.date = (
        SELECT MAX(hs2.date) FROM unit_health_scores hs2 WHERE hs2.unit_id = unit.id
      )`,
    );

    if (search) {
      qb.andWhere('(unit.serial_number ILIKE :search OR unit.model_name ILIKE :search OR current_client.company_name ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (city) {
      qb.andWhere('(unit.city = :city OR current_client.city = :city)', { city });
    }

    if (client) {
      qb.andWhere('current_client.id = :client', { client });
    }

    // Prioritaskan unit yang terpasang IoT di baris paling atas halaman (CASE WHEN iot_unit_id IS NOT NULL THEN 0 ELSE 1 END), lalu created_at DESC
    qb.addSelect(
      `CASE WHEN unit.iot_unit_id IS NOT NULL AND unit.iot_unit_id != '' THEN 0 ELSE 1 END`,
      'has_iot'
    );
    qb.orderBy('has_iot', 'ASC')
      .addOrderBy('unit.created_at', 'DESC');

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, last_page: Math.ceil(total / limit) },
    };
  }

  async findOne(identifier: string) {
    const unit = await this.unitRepo.findOne({
      where: [
        { id: identifier },
        { serial_number: identifier }
      ],
      relations: ['current_client', 'warranties', 'service_logs', 'service_logs.partner', 'ownership_history', 'ownership_history.from_client', 'ownership_history.to_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    return unit;
  }

  // Transfer kepemilikan
  async transferOwnership(unitId: string, transferDto: TransferOwnershipDto) {
    const { toClientId, reason, notes } = transferDto;

    const unit = await this.unitRepo.findOne({
      where: { id: unitId },
      relations: ['current_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');

    const newClient = await this.clientRepo.findOne({ where: { id: toClientId } });
    if (!newClient) throw new BadRequestException('Klien tujuan tidak ditemukan');

    const history = this.ownershipRepo.create({
      unit,
      from_client: unit.current_client,
      to_client: newClient,
      reason,
      notes,
      transfer_date: new Date(),
    });
    await this.ownershipRepo.save(history);

    unit.current_client = newClient;
    return this.unitRepo.save(unit);
  }

  async create(data: CreateUnitDto) {
    const { current_client_id, ...unitData } = data;

    const client = await this.clientRepo.findOne({ where: { id: current_client_id } });
    if (!client) throw new BadRequestException('Client tidak ditemukan');

    // Generate QR token based on serial number
    const serialSlug = (unitData.serial_number || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let qr_token = `holi-cp-${serialSlug}`;
    const existing = await this.unitRepo.findOne({ where: { qr_token } });
    if (existing) {
      qr_token = `holi-cp-${serialSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const unit = this.unitRepo.create({
      ...unitData,
      qr_token,
      current_client: client,
    });

    const savedUnit = await this.unitRepo.save(unit);

    // Save initial ownership history
    const history = this.ownershipRepo.create({
      unit: savedUnit,
      to_client: client,
      reason: 'REGISTRASI_AWAL',
      notes: 'Initial unit passport registration and digital twin activation',
      transfer_date: new Date(),
    });
    await this.ownershipRepo.save(history);

    return savedUnit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    const unit = await this.unitRepo.findOne({
      where: { id },
      relations: ['current_client'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');

    if (dto.serial_number !== undefined) {
      const trimmedSn = dto.serial_number.trim();
      if (trimmedSn && trimmedSn !== unit.serial_number) {
        // Check uniqueness
        const existing = await this.unitRepo.findOne({ where: { serial_number: trimmedSn } });
        if (existing && existing.id !== unit.id) {
          throw new BadRequestException(`Nomor seri ${trimmedSn} sudah digunakan oleh unit lain.`);
        }
        unit.serial_number = trimmedSn;
      }
    }
    if (dto.model_name !== undefined) unit.model_name = dto.model_name;
    if (dto.specs !== undefined) unit.specs = dto.specs;
    if (dto.warranty_expiry !== undefined) (unit as any).warranty_expiry = dto.warranty_expiry;
    if (dto.status !== undefined) (unit as any).status = dto.status;
    if (dto.test_run_image_url !== undefined) unit.test_run_image_url = dto.test_run_image_url;
    if (dto.diagram_image_url !== undefined) unit.diagram_image_url = dto.diagram_image_url;
    if (dto.outlet_branch !== undefined) unit.outlet_branch = dto.outlet_branch;
    if (dto.city !== undefined) unit.city = dto.city;

    if (dto.current_client_id !== undefined) {
      if (dto.current_client_id === null || dto.current_client_id === '') {
        (unit as any).current_client = null;
      } else {
        const newClient = await this.clientRepo.findOne({ where: { id: dto.current_client_id } });
        if (!newClient) throw new BadRequestException('Klien tidak ditemukan');
        unit.current_client = newClient;
      }
    }

    try {
      return await this.unitRepo.save(unit);
    } catch (e: any) {
      console.error('Update Unit Error:', e);
      throw new BadRequestException('Database error: ' + (e.message || 'Unknown error'));
    }
  }

  // Regenerate QR tokens for all units
  async regenerateAllQrTokens() {
    const units = await this.unitRepo.find();
    const results: { id: string; serial_number: string; old_token: string; new_token: string }[] = [];

    for (const unit of units) {
      const oldToken = unit.qr_token;

      // Skip if already in correct format
      if (oldToken && oldToken.startsWith('holi-cp-') && oldToken.length > 12) {
        const tokenSuffix = oldToken.replace('holi-cp-', '');
        if (tokenSuffix.includes('-') && tokenSuffix.length > 8) {
          results.push({ id: unit.id, serial_number: unit.serial_number, old_token: oldToken, new_token: oldToken });
          continue;
        }
      }

      const serialSlug = (unit.serial_number || unit.id)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      let newToken = `holi-cp-${serialSlug}`;
      const collision = await this.unitRepo.findOne({ where: { qr_token: newToken } });
      if (collision && collision.id !== unit.id) {
        newToken = `holi-cp-${serialSlug}-${Math.random().toString(36).substring(2, 5)}`;
      }

      unit.qr_token = newToken;
      await this.unitRepo.save(unit);
      results.push({ id: unit.id, serial_number: unit.serial_number, old_token: oldToken, new_token: newToken });
    }

    return {
      success: true,
      total: units.length,
      updated: results.filter(r => r.old_token !== r.new_token).length,
      results,
    };
  }

  async updateCalibration(id: string, calibrationData: Partial<Unit>) {
    const unit = await this.unitRepo.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');

    // Update field-field kalibrasi dan ambang batas
    if (calibrationData.cal_temp_cabinet_offset !== undefined) unit.cal_temp_cabinet_offset = calibrationData.cal_temp_cabinet_offset;
    if (calibrationData.cal_temp_evap_offset !== undefined) unit.cal_temp_evap_offset = calibrationData.cal_temp_evap_offset;
    if (calibrationData.cal_temp_condenser_offset !== undefined) unit.cal_temp_condenser_offset = calibrationData.cal_temp_condenser_offset;
    if (calibrationData.cal_voltage_offset !== undefined) unit.cal_voltage_offset = calibrationData.cal_voltage_offset;
    if (calibrationData.cal_power_slope !== undefined) unit.cal_power_slope = calibrationData.cal_power_slope;
    if (calibrationData.target_temp_min !== undefined) unit.target_temp_min = calibrationData.target_temp_min;
    if (calibrationData.target_temp_max !== undefined) unit.target_temp_max = calibrationData.target_temp_max;
    if (calibrationData.compressor_normal_ampere !== undefined) unit.compressor_normal_ampere = calibrationData.compressor_normal_ampere;
    if (calibrationData.ampere_tolerance !== undefined) unit.ampere_tolerance = calibrationData.ampere_tolerance;

    return this.unitRepo.save(unit);
  }

  async remove(id: string) {
    const unit = await this.unitRepo.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');

    await this.unitRepo.manager.transaction(async (manager) => {
      // Delete related records first to avoid foreign key constraints
      await manager.delete('service_logs', { unit: { id } });
      await manager.delete('warranties', { unit: { id } });
      await manager.delete('ownership_history', { unit: { id } });
      // Finally, delete the unit
      await manager.delete(Unit, id);
    });

    return { success: true, message: 'Unit berhasil dihapus' };
  }
}
