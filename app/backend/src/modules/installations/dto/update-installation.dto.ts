import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInstallationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  installation_date?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location_address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  technician_name?: string;
}
