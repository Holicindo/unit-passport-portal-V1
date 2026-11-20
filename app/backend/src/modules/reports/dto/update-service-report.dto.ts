import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceReportDto {
  @ApiProperty({ required: false, example: { technical_notes: 'Updated notes' } })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiProperty({ required: false, example: ['https://s3.url/photo.jpg'] })
  @IsArray()
  @IsOptional()
  photo_urls?: string[];

  @ApiProperty({ required: false, example: 'APPROVED' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  revision_note?: string;
}
