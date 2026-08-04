-- Nivixpe Supabase Schema & Real Seed Data DDL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    team TEXT,
    additional_teams TEXT[],
    reports_to TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    last_login TEXT,
    join_date TEXT NOT NULL
);

-- 2. Work Tasks Table
CREATE TABLE IF NOT EXISTS work_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    assignee TEXT NOT NULL,
    assignee_role TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'ongoing', 'missed', 'continuous')),
    due_date TEXT NOT NULL,
    completed_date TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    description TEXT,
    comments TEXT,
    owner TEXT,
    coordination_with TEXT,
    created_by TEXT
);

-- 3. Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    email TEXT NOT NULL,
    login_time TEXT,
    logout_time TEXT,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'onLeave')),
    CONSTRAINT attendance_records_date_email_key UNIQUE (date, email)
);

-- 4. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    employee_name TEXT NOT NULL,
    employee_email TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    type TEXT NOT NULL CHECK (type IN ('vacation', 'sick', 'personal')),
    approved_by TEXT
);

-- 5. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    attendees TEXT[] NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    minutes_url TEXT,
    scheduled_by TEXT
);

-- 6. Proof of Work Table
CREATE TABLE IF NOT EXISTS proof_of_work (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    task_title TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    submitted_by_email TEXT NOT NULL,
    submission_date TEXT NOT NULL,
    work_description TEXT NOT NULL,
    proof_link TEXT,
    proof_links TEXT[],
    file_size BIGINT,
    status TEXT NOT NULL CHECK (status IN ('submitted', 'approved', 'rejected', 'revision_requested')),
    reviewed_by TEXT,
    review_comments TEXT
);

-- 7. Team Drive Documents Table
CREATE TABLE IF NOT EXISTS drive_documents (
    id TEXT PRIMARY KEY,
    team_folder TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_by_email TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    external_link TEXT,
    description TEXT,
    uploaded_at TEXT NOT NULL
);

-- 8. Drive Access Grants Table
CREATE TABLE IF NOT EXISTS drive_access_grants (
    id TEXT PRIMARY KEY,
    granted_to TEXT NOT NULL,
    granted_to_email TEXT NOT NULL,
    granted_by TEXT NOT NULL,
    folders TEXT[] NOT NULL,
    granted_at TEXT NOT NULL
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL,
    link TEXT
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_work_tasks_assignee ON work_tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_email ON leave_requests(employee_email);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- SEED REAL DATA WITH NAMES (NO RAW EMAILS FOR IDENTIFIERS)
INSERT INTO team_members (id, name, email, role, department, team, reports_to, status, join_date)
VALUES
('1', 'Sahith', 'ceo@nivixpe.com', 'CEO', 'Executive', 'Business', NULL, 'active', '2020-01-15'),
('2', 'Shubham', 'cto@nivixpe.com', 'CTO', 'Technology', 'Technical', 'Sahith', 'active', '2020-02-01'),
('3', 'Swaraag', 'cso@nivixpe.com', 'CSO', 'Sales & Strategy', 'Business', 'Sahith', 'active', '2020-03-10'),
('5', 'Ujjwal', 'dcso@nivixpe.com', 'DCSO', 'Deputy Sales & Strategy', 'Business', 'Swaraag', 'active', '2021-01-20'),
('6', 'Bhavika', 'dcmo@nivixpe.com', 'DCMO', 'Deputy Marketing', 'Marketing', 'Abhiram', 'active', '2021-02-10'),
('7', 'Siddharatha', 'coo@nivixpe.com', 'COO', 'Operations', 'Business', 'Sahith', 'active', '2020-05-01'),
('8', 'Aradhya', 'designer1@nivixpe.com', 'Designer', 'Design', 'Design', 'Shubham', 'active', '2021-06-15'),
('10', 'Kashish', 'legal1@nivixpe.com', 'Legal', 'Legal & Compliance', 'Legal', 'Sahith', 'active', '2020-08-01'),
('11', 'Ngan Nguyen', 'developer1@nivixpe.com', 'Developer 1', 'Technology', 'Technical', 'Shubham', 'active', '2025-05-01'),
('13', 'Vinisha', 'legal2@nivixpe.com', 'Legal Intern', 'Legal & Compliance', 'Legal', 'Sahith', 'active', '2025-05-15'),
('14', 'Aryan Kulshreshtra', 'pm@nivixpe.com', 'Product Manager', 'HR', 'HR', 'Sahith', 'active', '2025-05-02'),
('15', 'Adya Paliwal', 'productmanager@nivix.com', 'Product Manager', 'Product', 'Business', 'Sahith', 'active', '2025-07-25')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_tasks (id, title, assignee, assignee_role, status, due_date, priority, owner, comments)
VALUES
('bt1', 'Business Model Canvas', 'Swaraag', 'CSO', 'completed', '2025-04-15', 'high', 'Swaraag', 'Completed and approved'),
('bt2', 'Awareness Campaign', 'Swaraag', 'CSO', 'completed', '2025-04-18', 'high', 'Swaraag', 'Campaign launched successfully'),
('bt3', 'Legal Compliance Audit', 'Kashish', 'Legal', 'ongoing', '2025-05-10', 'high', 'Sahith', 'Audit underway'),
('bt4', 'API Infrastructure Refactor', 'Shubham', 'CTO', 'ongoing', '2025-05-15', 'high', 'Shubham', 'Backend migration')
ON CONFLICT (id) DO NOTHING;
