-- Migration: Add missing columns to attendance_records
-- Run this in Supabase SQL Editor

ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS work_hours INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_session_start TEXT,
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- Also ensure the unique constraint exists (in case it's missing)
ALTER TABLE attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_date_email_key;

ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_records_date_email_key UNIQUE (date, email);
