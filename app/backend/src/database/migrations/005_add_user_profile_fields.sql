-- Migration 005: Add phone and city columns to users table
-- Run this on the database to support user profile updates

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS city  VARCHAR(100);
