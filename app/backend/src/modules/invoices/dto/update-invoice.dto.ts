import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInvoiceDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  invoice_date?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  due_date?: string;
}
