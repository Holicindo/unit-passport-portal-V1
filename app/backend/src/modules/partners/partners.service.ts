import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from './entities/partner.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private partnerRepo: Repository<Partner>,
  ) {}

  async findAll() {
    return this.partnerRepo.find();
  }

  async create(data: any) {
    const partner = this.partnerRepo.create(data);
    return this.partnerRepo.save(partner);
  }

  async findOne(id: string) {
    return this.partnerRepo.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    await this.partnerRepo.update(id, data);
    return this.partnerRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.partnerRepo.delete(id);
    return { success: true };
  }
}
