import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.clientRepo.findAndCount({
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

  async create(data: Partial<Client>) {
    const client = this.clientRepo.create(data);
    return this.clientRepo.save(client);
  }

  async findOne(id: string) {
    return this.clientRepo.findOne({ where: { id }, relations: ['units'] });
  }
}
