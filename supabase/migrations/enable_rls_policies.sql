-- RLS Policies for Nivixpe Internal App
-- This app uses its own auth (MOCK_USERS), not Supabase Auth.
-- So we allow full anon access to all tables.
-- Run this in Supabase SQL Editor → https://app.supabase.com

-- ENABLE RLS on all tables (safe even if already enabled)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any (clean slate)
DROP POLICY IF EXISTS "anon_select_team_members" ON team_members;
DROP POLICY IF EXISTS "anon_all_team_members" ON team_members;
DROP POLICY IF EXISTS "anon_select_work_tasks" ON work_tasks;
DROP POLICY IF EXISTS "anon_all_work_tasks" ON work_tasks;
DROP POLICY IF EXISTS "anon_select_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "anon_all_attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "anon_select_leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "anon_all_leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_all_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_select_proof_of_work" ON proof_of_work;
DROP POLICY IF EXISTS "anon_all_proof_of_work" ON proof_of_work;
DROP POLICY IF EXISTS "anon_select_drive_documents" ON drive_documents;
DROP POLICY IF EXISTS "anon_all_drive_documents" ON drive_documents;
DROP POLICY IF EXISTS "anon_select_drive_access_grants" ON drive_access_grants;
DROP POLICY IF EXISTS "anon_all_drive_access_grants" ON drive_access_grants;
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_all_notifications" ON notifications;

-- CREATE full-access policies for anon role on all tables
CREATE POLICY "anon_all_team_members" ON team_members
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_work_tasks" ON work_tasks
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_attendance_records" ON attendance_records
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_leave_requests" ON leave_requests
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_meetings" ON meetings
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_proof_of_work" ON proof_of_work
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_drive_documents" ON drive_documents
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_drive_access_grants" ON drive_access_grants
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_notifications" ON notifications
  FOR ALL TO anon USING (true) WITH CHECK (true);
