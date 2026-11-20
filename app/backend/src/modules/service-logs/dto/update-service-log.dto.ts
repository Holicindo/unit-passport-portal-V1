import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceLogDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  complaint?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  action_taken?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  technician_notes?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  service_date?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  completed_at?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  delivery_date?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  priority?: string;
}
