import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarrantyDto {
  @ApiProperty({ example: 'UNT-XXXXXXX' })
  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @ApiProperty({ example: 'GENERAL', description: 'Tipe garansi: GENERAL, COMPRESSOR, dll' })
  @IsString()
  @IsNotEmpty()
  warranty_type!: string;

  @ApiProperty({ example: '1_TAHUN' })
  @IsString()
  @IsNotEmpty()
  duration_label!: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  @IsNotEmpty()
  start_date!: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  @IsNotEmpty()
  end_date!: string;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  voided_reason?: string;
}
