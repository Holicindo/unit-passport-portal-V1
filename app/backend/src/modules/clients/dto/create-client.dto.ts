import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'Maxx Coffee' })
  @IsString()
  @IsNotEmpty()
  company_name!: string;

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
  @IsOptional()
  unit_count?: number;
}
