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
      relations: ['warranties', 'service_logs'],
    });
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

  // L4 Admin — Full list with pagination
  async findAll(page: number = 1, limit: number = 10, search?: string, city?: string, client?: string) {
    const where: any = {};
    if (search) where.serial_number = ILike(`%${search}%`);
    if (city) where.city = city;
    if (client) where.current_client = { id: client };

    const [data, total] = await this.unitRepo.findAndCount({
      where,
      relations: ['current_client', 'warranties', 'service_logs'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

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
      relations: ['current_client', 'warranties', 'service_logs'],
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

    if (dto.model_name !== undefined) unit.model_name = dto.model_name;
    if (dto.specs !== undefined) unit.specs = dto.specs;
    if (dto.warranty_expiry !== undefined) (unit as any).warranty_expiry = dto.warranty_expiry;
    if (dto.status !== undefined) (unit as any).status = dto.status;
    if (dto.test_run_image_url !== undefined) unit.test_run_image_url = dto.test_run_image_url;
    if (dto.diagram_image_url !== undefined) unit.diagram_image_url = dto.diagram_image_url;
    if (dto.outlet_branch !== undefined) unit.outlet_branch = dto.outlet_branch;
    if (dto.city !== undefined) unit.city = dto.city;

    if (dto.current_client_id) {
      const newClient = await this.clientRepo.findOne({ where: { id: dto.current_client_id } });
      if (!newClient) throw new BadRequestException('Klien tidak ditemukan');
      unit.current_client = newClient;
    }

    return this.unitRepo.save(unit);
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
}
