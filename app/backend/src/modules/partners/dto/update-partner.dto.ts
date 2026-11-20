import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePartnerDto {
  @ApiProperty({ example: 'PT. Teknisi Jaya', required: false })
  @IsString()
  @IsOptional()
  partner_name?: string;

  @ApiProperty({ example: 'Bandung', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: '+628112345678', required: false })
  @IsString()
  @IsOptional()
  contact_wa?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
