import { IsString, IsOptional, IsObject, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUnitDto {
  @ApiProperty({ example: 'Undercounter Chiller B610', required: false })
  @IsString()
  @IsOptional()
  model_name?: string;

  @ApiProperty({ example: { type: 'SHOWCASE', compressor: 'Embraco 1/2 HP' }, required: false })
  @IsObject()
  @IsOptional()
  specs?: any;

  @ApiProperty({ example: '2026-05-13', required: false })
  @IsDateString()
  @IsOptional()
  warranty_expiry?: string;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'CLI-XXXXXXX', required: false })
  @IsString()
  @IsOptional()
  current_client_id?: string;
}
