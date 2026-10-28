import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateCalibrationDto {
  @IsNumber()
  @Min(-10)
  @Max(10)
  cabinet_offset: number;

  @IsNumber()
  @Min(-10)
  @Max(10)
  evaporator_offset: number;

  @IsNumber()
  @Min(-10)
  @Max(10)
  condenser_offset: number;

  @IsOptional()
  @IsString()
  calibrated_by?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  reference_cabinet?: number;

  @IsOptional()
  @IsNumber()
  reference_evaporator?: number;

  @IsOptional()
  @IsNumber()
  reference_condenser?: number;
}

export class UpdateCalibrationDto {
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  cabinet_offset?: number;

  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  evaporator_offset?: number;

  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  condenser_offset?: number;

  @IsOptional()
  @IsString()
  calibrated_by?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  reference_cabinet?: number;

  @IsOptional()
  @IsNumber()
  reference_evaporator?: number;

  @IsOptional()
  @IsNumber()
  reference_condenser?: number;
}
