import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../entities/invoice.entity';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'SJ-2026/08/001', required: false })
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @ApiProperty({ example: 'UNT-XXXXXXX', required: false })
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ example: 'PRT-XXXXXXX', required: false })
  @IsString()
  @IsOptional()
  partnerId?: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  invoice_date?: string;

  @ApiProperty({ example: 'Perbaikan kompresor dan penggantian spare part', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Tukar faktur bulan Agustus 2026', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: InvoiceStatus.PENDING, enum: InvoiceStatus, required: false })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}
