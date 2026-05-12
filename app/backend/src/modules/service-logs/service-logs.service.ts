import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceLog } from './entities/service-log.entity';

@Injectable()
export class ServiceLogsService {
  constructor(
    @InjectRepository(ServiceLog)
    private logRepo: Repository<ServiceLog>,
  ) {}

  async findAll() {
    return this.logRepo.find({ relations: ['unit', 'partner', 'attachments'] });
  }

  async create(data: any) {
    const log = this.logRepo.create(data);
    return this.logRepo.save(log);
  }
}
