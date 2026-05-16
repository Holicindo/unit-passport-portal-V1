import { IsString, IsNotEmpty, IsEnum, IsObject, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FormType } from '../entities/service-report.entity';

export class CreateServiceReportDto {
  @ApiProperty({ example: 'UNT-XXXXXXX' })
  @IsString()
  @IsNotEmpty()
  unitId!: string;

  @ApiProperty({ enum: FormType, example: FormType.INSPECTION })
  @IsEnum(FormType)
  @IsNotEmpty()
  form_type!: FormType;

  @ApiProperty({ example: { technical_notes: 'Checking insulation', voltage: '220V' } })
  @IsObject()
  @IsNotEmpty()
  data!: any;

  @ApiProperty({ required: false, example: ['https://s3.url/photo1.jpg'] })
  @IsArray()
  @IsOptional()
  photo_urls?: string[];

  @ApiProperty({ required: false, example: 'Initial QC' })
  @IsString()
  @IsOptional()
  revision_note?: string;

  @ApiProperty({ required: false, example: 'REP-XXXXXXX' })
  @IsString()
  @IsOptional()
  baseReportId?: string;
}
