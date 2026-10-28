import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.deliveryRepo.findAndCount({
      relations: ['unit', 'unit.current_client', 'partner'],
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

  async create(dto: CreateDeliveryDto) {
    const { unitId, partnerId, delivery_date, ...rest } = dto;
    const delivery = this.deliveryRepo.create({
      ...rest,
      unit: { id: unitId } as any,
      partner: partnerId ? ({ id: partnerId } as any) : null,
      delivery_date: delivery_date ? new Date(delivery_date) : null,
    });
    return this.deliveryRepo.save(delivery);
  }

  async findByUnit(unitId: string) {
    return this.deliveryRepo.find({
      where: { unit: { id: unitId } },
      relations: ['partner'],
      order: { created_at: 'DESC' },
    });
  }

  async update(id: string, data: any) {
    const delivery = await this.deliveryRepo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery tidak ditemukan');

    if (data.destination_address !== undefined) delivery.destination_address = data.destination_address;
    if (data.notes !== undefined) delivery.notes = data.notes;
    if (data.status !== undefined) delivery.status = data.status;
    if (data.delivery_date !== undefined) {
      delivery.delivery_date = data.delivery_date ? new Date(data.delivery_date) : null;
    }
    if (data.partnerId !== undefined) {
      delivery.partner = data.partnerId ? ({ id: data.partnerId } as any) : null;
    }
    if (data.unitId !== undefined) {
      delivery.unit = { id: data.unitId } as any;
    }

    return this.deliveryRepo.save(delivery);
  }

  async delete(id: string) {
    const delivery = await this.deliveryRepo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery tidak ditemukan');
    await this.deliveryRepo.remove(delivery);
    return { message: 'Delivery berhasil dihapus' };
  }
}
