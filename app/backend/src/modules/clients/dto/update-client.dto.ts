import { IsString, IsOptional, IsUrl, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiProperty({ example: 'Maxx Coffee', required: false })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiProperty({ example: 'C.00086', required: false })
  @IsString()
  @IsOptional()
  bp_code?: string;

  @ApiProperty({ example: 'F&B', required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsUrl()
  @IsOptional()
  logo_url?: string;

  @ApiProperty({ example: 'Jakarta', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'contact@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  unit_count?: number;
}
