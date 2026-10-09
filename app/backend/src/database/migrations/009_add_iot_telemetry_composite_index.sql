-- Migration 009: Add composite index on iot_telemetry_logs for optimal query performance
-- This index significantly improves query speed when fetching telemetry history by unit_id and time range

-- Create composite index on (unit_id, recorded_at DESC)
-- This allows PostgreSQL to efficiently filter by unit_id and sort by timestamp
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_unit_recorded 
ON iot_telemetry_logs (unit_id, recorded_at DESC);

-- Analyze the table to update statistics after index creation
ANALYZE iot_telemetry_logs;

-- Expected performance improvement:
-- Before: Full table scan on ~270k+ rows (500ms - 2s)
-- After: Index scan returning only relevant rows (<50ms)
