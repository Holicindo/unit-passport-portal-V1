-- Migration: Create IoT Calibration Table
-- Description: Store sensor calibration offsets per unit for accurate temperature readings
-- Author: System
-- Date: 2026-10-27

-- ─────────────────────────────────────────────────────────────────────────────
-- Create iot_calibration table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS iot_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id VARCHAR(255) NOT NULL,
  
  -- Sensor offsets (in Celsius)
  cabinet_offset DECIMAL(4,2) DEFAULT 0.0,
  evaporator_offset DECIMAL(4,2) DEFAULT 0.0,
  condenser_offset DECIMAL(4,2) DEFAULT 0.0,
  
  -- Metadata
  calibrated_at TIMESTAMPTZ DEFAULT NOW(),
  calibrated_by VARCHAR(255),
  notes TEXT,
  
  -- Reference temperature used during calibration
  reference_cabinet DECIMAL(5,2),
  reference_evaporator DECIMAL(5,2),
  reference_condenser DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one calibration record per unit (latest is active)
  UNIQUE(unit_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Add foreign key constraint separately
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE iot_calibration 
ADD CONSTRAINT iot_calibration_unit_id_fkey 
FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Create index for faster lookups
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_iot_calibration_unit_id ON iot_calibration(unit_id);
CREATE INDEX IF NOT EXISTS idx_iot_calibration_calibrated_at ON iot_calibration(calibrated_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: Update updated_at timestamp
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_iot_calibration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_iot_calibration_timestamp
BEFORE UPDATE ON iot_calibration
FOR EACH ROW
EXECUTE FUNCTION update_iot_calibration_timestamp();

-- ─────────────────────────────────────────────────────────────────────────────
-- Insert default calibration for existing units with IoT
-- ─────────────────────────────────────────────────────────────────────────────

-- Comment out for now - we'll add calibration data via the API later
-- INSERT INTO iot_calibration (unit_id, cabinet_offset, evaporator_offset, condenser_offset, calibrated_by, notes)
-- SELECT 
--   id,
--   -0.8,  -- cabinet_offset
--   0.5,   -- evaporator_offset
--   -1.2,  -- condenser_offset
--   'System Migration',
--   'Default calibration values applied during migration for units A26051860 and A26071976'
-- FROM units
-- WHERE iot_unit_id IS NOT NULL
-- ON CONFLICT (unit_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE iot_calibration IS 'Sensor calibration offsets per unit for accurate temperature readings';
COMMENT ON COLUMN iot_calibration.cabinet_offset IS 'Offset to apply to cabinet sensor (°C)';
COMMENT ON COLUMN iot_calibration.evaporator_offset IS 'Offset to apply to evaporator sensor (°C)';
COMMENT ON COLUMN iot_calibration.condenser_offset IS 'Offset to apply to condenser sensor (°C)';
COMMENT ON COLUMN iot_calibration.reference_cabinet IS 'Reference temperature used during calibration (from calibrated thermometer)';
COMMENT ON COLUMN iot_calibration.calibrated_by IS 'Technician name or user who performed calibration';
