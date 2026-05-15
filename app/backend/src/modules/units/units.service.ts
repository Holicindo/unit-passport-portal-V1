import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { OwnershipHistory } from '../ownership/entities/ownership-history.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(OwnershipHistory) private ownershipRepo: Repository<OwnershipHistory>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  // L1 Public — Limited view for guest scan
  async findByQrTokenPublic(qr_token: string) {
    const unit = await this.unitRepo.findOne({
      where: { qr_token },
      select: ['id', 'serial_number', 'model_name', 'specs', 'warranty_expiry', 'status'],
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
  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.unitRepo.findAndCount({
      relations: ['current_client', 'warranties', 'service_logs'],
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

    // Catat histori kepemilikan
    const history = this.ownershipRepo.create({
      unit,
      from_client: unit.current_client,
      to_client: newClient,
      reason,
      notes,
      transfer_date: new Date(),
    });
    await this.ownershipRepo.save(history);

    // Update pemilik saat ini
    unit.current_client = newClient;
    return this.unitRepo.save(unit);
  }

  async create(data: CreateUnitDto) {
    const { current_client_id, ...unitData } = data;
    
    const client = await this.clientRepo.findOne({ where: { id: current_client_id } });
    if (!client) throw new BadRequestException('Client tidak ditemukan');

    const unit = this.unitRepo.create({
      ...unitData,
      current_client: client,
    });
    return this.unitRepo.save(unit);
  }
}
