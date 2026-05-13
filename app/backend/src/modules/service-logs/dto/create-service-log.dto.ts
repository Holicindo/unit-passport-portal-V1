import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceStatus } from '../entities/service-log.entity';

export class CreateServiceLogDto {
  @ApiProperty({ example: 'UNT-XXXXXXX' })
  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @ApiProperty({ example: 'PRT-XXXXXXX', required: false })
  @IsString()
  @IsOptional()
  partnerId?: string;

  @ApiProperty({ example: 'Compressor leaking gas' })
  @IsString()
  @IsNotEmpty()
  issue_description!: string;

  @ApiProperty({ example: 'Recharged gas and fixed leak' })
  @IsString()
  @IsNotEmpty()
  action_taken!: string;

  @ApiProperty({ example: ServiceStatus.COMPLETED, enum: ServiceStatus })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @ApiProperty({ example: 'Budi Technician', required: false })
  @IsString()
  @IsOptional()
  technician_name?: string;
}
