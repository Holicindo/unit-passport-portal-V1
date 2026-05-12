import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from '../entities/unit.entity';
import { OwnershipHistory } from '../entities/ownership-history.entity';
import { Client } from '../entities/client.entity';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(OwnershipHistory) private ownershipRepo: Repository<OwnershipHistory>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  // L1 Public — passport view via QR scan
  async findByQrToken(qr_token: string) {
    const unit = await this.unitRepo.findOne({
      where: { qr_token },
      relations: ['current_client', 'warranties', 'service_logs', 'service_logs.attachments'],
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    return unit;
  }

  // L2 Client — fleet list
  async findAll() {
    return this.unitRepo.find({ relations: ['current_client', 'warranties'] });
  }

  // Transfer kepemilikan — riwayat servis TETAP melekat pada unit
  async transferOwnership(unitId: string, toClientId: string, reason: string, notes?: string) {
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

  async create(data: Partial<Unit>) {
    const unit = this.unitRepo.create(data);
    return this.unitRepo.save(unit);
  }
}
