-- Migration 010: Add last_login column to users table
-- Run this on both local and production databases

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;

-- Optional: create index for sorting by last_login
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users (last_login DESC NULLS LAST);
