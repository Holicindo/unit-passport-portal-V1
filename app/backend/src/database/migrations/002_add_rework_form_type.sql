-- ============================================================
-- Migration: Add REWORK to form_type enum
-- Run this once against the database if synchronize doesn't
-- automatically update the PostgreSQL enum type.
-- ============================================================

-- Add REWORK value to the existing enum (safe, idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'REWORK'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'service_reports_form_type_enum'
      )
  ) THEN
    ALTER TYPE service_reports_form_type_enum ADD VALUE 'REWORK';
  END IF;
END
$$;
