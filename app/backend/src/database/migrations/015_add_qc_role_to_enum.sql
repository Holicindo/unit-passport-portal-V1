-- Migration: Add QC role to users_role_enum
-- This adds the 'QC' (Quality Control) value to the existing role enum

-- Add QC to the users_role_enum type
ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'QC';

-- Note: ALTER TYPE ADD VALUE cannot be executed inside a transaction block
-- It must be run separately and cannot be rolled back
