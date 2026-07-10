-- Migration 007: Create iot_calibration table
-- Menambahkan tabel untuk melacak offset kalibrasi sensor per unit
CREATE TABLE IF NOT EXISTS iot_calibration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL, -- e.g., 'CABINET', 'EVAPORATOR', 'CONDENSER'
    offset_value NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    calibrated_by VARCHAR(255),
    calibrated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_id, sensor_type) -- Hanya satu offset aktif per sensor per unit
);

-- Index untuk mempercepat query kalibrasi berdasarkan unit
CREATE INDEX IF NOT EXISTS idx_iot_calibration_unit_id ON iot_calibration(unit_id);
