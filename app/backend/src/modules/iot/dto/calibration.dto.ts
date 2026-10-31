import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO untuk membuat atau update kalibrasi sensor secara penuh.
 * Teknisi input "nilai referensi" dari alat ukur, sistem hitung differential otomatis.
 *
 * Rumus: differential = reference - raw
 * Tampil: raw + differential = reference
 */
export class CreateCalibrationDto {
  // ── Suhu (°C) ──────────────────────────────────────────────────────────────
  @IsOptional()
  @IsNumber()
  @Min(-50) @Max(50)
  cabinet_offset?: number;

  @IsOptional()
  @IsNumber()
  @Min(-50) @Max(50)
  evaporator_offset?: number;

  @IsOptional()
  @IsNumber()
  @Min(-50) @Max(50)
  condenser_offset?: number;

  // Nilai referensi suhu (dari alat ukur teknisi)
  @IsOptional() @IsNumber() reference_cabinet?: number;
  @IsOptional() @IsNumber() reference_evaporator?: number;
  @IsOptional() @IsNumber() reference_condenser?: number;

  // ── Listrik ────────────────────────────────────────────────────────────────
  @IsOptional()
  @IsNumber()
  @Min(-100) @Max(100)
  voltage_offset?: number;   // Tegangan (V)

  @IsOptional()
  @IsNumber()
  @Min(-20) @Max(20)
  current_offset?: number;   // Arus (A)

  @IsOptional()
  @IsNumber()
  @Min(-500) @Max(500)
  power_offset?: number;     // Daya (W)

  // Nilai referensi listrik
  @IsOptional() @IsNumber() reference_voltage?: number;
  @IsOptional() @IsNumber() reference_current?: number;
  @IsOptional() @IsNumber() reference_power?: number;

  // ── Metadata ───────────────────────────────────────────────────────────────
  @IsOptional() @IsString() calibrated_by?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCalibrationDto {
  // ── Suhu ───────────────────────────────────────────────────────────────────
  @IsOptional() @IsNumber() @Min(-50) @Max(50) cabinet_offset?: number;
  @IsOptional() @IsNumber() @Min(-50) @Max(50) evaporator_offset?: number;
  @IsOptional() @IsNumber() @Min(-50) @Max(50) condenser_offset?: number;
  @IsOptional() @IsNumber() reference_cabinet?: number;
  @IsOptional() @IsNumber() reference_evaporator?: number;
  @IsOptional() @IsNumber() reference_condenser?: number;

  // ── Listrik ────────────────────────────────────────────────────────────────
  @IsOptional() @IsNumber() @Min(-100) @Max(100) voltage_offset?: number;
  @IsOptional() @IsNumber() @Min(-20) @Max(20) current_offset?: number;
  @IsOptional() @IsNumber() @Min(-500) @Max(500) power_offset?: number;
  @IsOptional() @IsNumber() reference_voltage?: number;
  @IsOptional() @IsNumber() reference_current?: number;
  @IsOptional() @IsNumber() reference_power?: number;

  // ── Metadata ───────────────────────────────────────────────────────────────
  @IsOptional() @IsString() calibrated_by?: string;
  @IsOptional() @IsString() notes?: string;
}
