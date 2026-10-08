-- ============================================================
-- Migration 008: Add V4 Health Score Columns
-- Description  : Tambah kolom baru untuk fitur V4:
--                Door Recovery, Defrost Detection,
--                Voltage Anomaly, dan Baseline Commissioning
-- Date         : 2026-10-07
-- ============================================================

-- V4 Door Recovery
ALTER TABLE unit_health_scores
  ADD COLUMN IF NOT EXISTS door_avg_recovery_min  FLOAT,
  ADD COLUMN IF NOT EXISTS door_event_count        INTEGER;

-- V4 Voltage Anomaly
ALTER TABLE unit_health_scores
  ADD COLUMN IF NOT EXISTS voltage_anomaly_ratio   FLOAT;

-- V4 Defrost Detection
ALTER TABLE unit_health_scores
  ADD COLUMN IF NOT EXISTS defrost_cycle_count     INTEGER,
  ADD COLUMN IF NOT EXISTS defrost_anomaly_fraction FLOAT;

-- V4 Baseline Commissioning
ALTER TABLE unit_health_scores
  ADD COLUMN IF NOT EXISTS sub_baseline_score      FLOAT,
  ADD COLUMN IF NOT EXISTS baseline_tib_delta      FLOAT,
  ADD COLUMN IF NOT EXISTS baseline_cooling_delta  FLOAT;

-- Add updated_at if not exists (entity now has @UpdateDateColumn)
ALTER TABLE unit_health_scores
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update comment on table to reflect V4
COMMENT ON TABLE unit_health_scores IS 'Health Score V4 - 5 subsystem scoring engine with door recovery, defrost detection, voltage anomaly, and baseline commissioning.';
