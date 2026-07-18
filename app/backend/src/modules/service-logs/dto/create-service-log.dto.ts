import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceStatus, TaskType } from '../entities/service-log.entity';

export class CreateServiceLogDto {
  @ApiProperty({ example: 'UNT-XXXXXXX' })
  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @ApiProperty({ example: 'PRT-XXXXXXX', required: false })
  @IsString()
  @IsOptional()
  partnerId?: string;

  @ApiProperty({ example: 'LOG-XXXXXXX', required: false })
  @IsString()
  @IsOptional()
  call_id?: string;

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

  @ApiProperty({ example: 'CORRECTIVE', enum: TaskType, required: false })
  @IsEnum(TaskType)
  @IsOptional()
  task_type?: TaskType;

  @ApiProperty({ example: 'Budi Technician', required: false })
  @IsString()
  @IsOptional()
  technician_name?: string;

  @ApiProperty({ example: '2026-08-18T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  service_date?: string;

  @ApiProperty({ example: '2026-08-18T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  scheduled_date?: string;

  @ApiProperty({ example: '2026-08-20T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  delivery_date?: string;

  @ApiProperty({ example: 'Catatan internal teknisi.', required: false })
  @IsString()
  @IsOptional()
  planning_notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  is_allocated?: boolean;

  @ApiProperty({ example: 'Ganti Lampu; Ganti Thermostat', required: false })
  @IsString()
  @IsOptional()
  replaced_sparepart?: string;
}
