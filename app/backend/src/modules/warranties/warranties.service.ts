import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warranty } from './entities/warranty.entity';

@Injectable()
export class WarrantiesService {
  constructor(
    @InjectRepository(Warranty)
    private warrantyRepo: Repository<Warranty>,
  ) {}

  async findAll() {
    return this.warrantyRepo.find({ relations: ['unit'] });
  }

  async create(data: any) {
    const warranty = this.warrantyRepo.create(data);
    return this.warrantyRepo.save(warranty);
  }
}
