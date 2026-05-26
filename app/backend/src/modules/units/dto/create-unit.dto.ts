import { IsString, IsNotEmpty, IsOptional, IsObject, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ example: 'SN-123456789' })
  @IsString()
  @IsNotEmpty()
  serial_number!: string;

  @ApiProperty({ example: 'Showcase NSA 150' })
  @IsString()
  @IsNotEmpty()
  model_name!: string;

  @ApiProperty({ example: { item_code: 'IC-001', color: 'Black' }, required: false })
  @IsObject()
  @IsOptional()
  specs?: any;

  @ApiProperty({ example: '2024-05-13', required: false })
  @IsDateString()
  @IsOptional()
  production_date?: Date;

  @ApiProperty({ example: '2025-05-13', required: false })
  @IsDateString()
  @IsOptional()
  warranty_expiry?: Date;

  @ApiProperty({ example: 'CLI-XXXXXXX' })
  @IsString()
  @IsNotEmpty()
  current_client_id!: string;

  @ApiProperty({ example: 'https://example.com/test_run.jpg', required: false })
  @IsString()
  @IsOptional()
  test_run_image_url?: string;

  @ApiProperty({ example: 'https://example.com/diagram.jpg', required: false })
  @IsString()
  @IsOptional()
  diagram_image_url?: string;
}
