-- ============================================================
-- Migration: Add QC_SERVICE to form_type enum
-- Run once against the database if synchronize doesn't
-- automatically update the PostgreSQL enum type.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'QC_SERVICE'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'service_reports_form_type_enum'
      )
  ) THEN
    ALTER TYPE service_reports_form_type_enum ADD VALUE 'QC_SERVICE';
  END IF;
END
$$;
