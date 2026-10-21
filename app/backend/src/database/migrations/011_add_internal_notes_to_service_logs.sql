-- Migration 011: Add internal_notes column to service_logs table
-- Run once against the database to add the admin-only internal notes field

ALTER TABLE service_logs
ADD COLUMN IF NOT EXISTS internal_notes TEXT NULL;

-- internal_notes is separate from planning_notes:
--   planning_notes = Result (hasil akhir servis, filled by technician/admin)
--   internal_notes = Catatan Internal (admin-only notes, never auto-populated)
