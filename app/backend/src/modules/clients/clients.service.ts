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

  async findAll() {
    return this.clientRepo.find();
  }

  async create(data: any) {
    const client = this.clientRepo.create(data);
    return this.clientRepo.save(client);
  }
}
