import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InstallationStatus } from '../entities/installation.entity';

export class CreateInstallationDto {
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
  installation_date?: string;

  @ApiProperty({ example: 'Lantai 3, Gedung A, Jl. Sudirman', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Budi Teknisi', required: false })
  @IsString()
  @IsOptional()
  technician_name?: string;

  @ApiProperty({ example: 'Pemasangan unit baru sesuai SPK', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: InstallationStatus.SCHEDULED, enum: InstallationStatus, required: false })
  @IsEnum(InstallationStatus)
  @IsOptional()
  status?: InstallationStatus;
}
