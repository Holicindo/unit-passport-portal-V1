import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../entities/delivery.entity';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'UNT-XXXXXXX' })
  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @ApiProperty({ example: 'PRT-XXXXXXX', required: false })
  @IsString()
  @IsOptional()
  partnerId?: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  delivery_date?: string;

  @ApiProperty({ example: 'Jl. Sudirman No.1, Jakarta', required: false })
  @IsString()
  @IsOptional()
  destination_address?: string;

  @ApiProperty({ example: 'Handle with care', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: DeliveryStatus.PENDING, enum: DeliveryStatus, required: false })
  @IsEnum(DeliveryStatus)
  @IsOptional()
  status?: DeliveryStatus;
}
