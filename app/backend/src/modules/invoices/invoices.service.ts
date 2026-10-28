import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.invoiceRepo.findAndCount({
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

  async create(dto: CreateInvoiceDto) {
    const { unitId, partnerId, invoice_date, ...rest } = dto;
    const invoice = this.invoiceRepo.create({
      ...rest,
      unit: unitId ? ({ id: unitId } as any) : null,
      partner: partnerId ? ({ id: partnerId } as any) : null,
      invoice_date: invoice_date ? new Date(invoice_date) : null,
    });
    return this.invoiceRepo.save(invoice);
  }

  async update(id: string, data: any) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');

    if (data.invoice_number !== undefined) invoice.invoice_number = data.invoice_number;
    if (data.description !== undefined) invoice.description = data.description;
    if (data.notes !== undefined) invoice.notes = data.notes;
    if (data.status !== undefined) invoice.status = data.status;
    if (data.invoice_date !== undefined) {
      invoice.invoice_date = data.invoice_date ? new Date(data.invoice_date) : null;
    }
    if (data.unitId !== undefined) {
      invoice.unit = data.unitId ? ({ id: data.unitId } as any) : null;
    }
    if (data.partnerId !== undefined) {
      invoice.partner = data.partnerId ? ({ id: data.partnerId } as any) : null;
    }

    return this.invoiceRepo.save(invoice);
  }

  async delete(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');
    await this.invoiceRepo.remove(invoice);
    return { message: 'Invoice berhasil dihapus' };
  }
}
