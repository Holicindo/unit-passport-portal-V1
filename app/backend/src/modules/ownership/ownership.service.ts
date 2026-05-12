import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OwnershipHistory } from './entities/ownership-history.entity';

@Injectable()
export class OwnershipService {
  constructor(
    @InjectRepository(OwnershipHistory)
    private historyRepo: Repository<OwnershipHistory>,
  ) {}

  async findHistoryByUnit(unitId: string) {
    return this.historyRepo.find({
      where: { unit: { id: unitId } },
      relations: ['from_client', 'to_client'],
      order: { transfer_date: 'DESC' },
    });
  }
}
