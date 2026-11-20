import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../entities/delivery.entity';

export class UpdateDeliveryDto {
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

  @ApiProperty({ example: 'UNIT', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}
