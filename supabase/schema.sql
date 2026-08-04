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
('1', 'Sahith', 'sahith@nivixpe.com', 'CEO', 'Executive', 'Business', NULL, 'active', '2020-01-15'),
('2', 'Co-founder,CTO', 'shubhamc@nivixpe.com', 'CTO', 'Technology', 'Technical', 'Sahith', 'active', '2020-02-01'),
('3', 'Swaraag Shrey Nambala', 'swaraag@nivixpe.com', 'CSO', 'Sales & Strategy', 'Business', 'Sahith', 'active', '2020-03-10'),
('4', 'Ujjwal', 'ujjwal@nivixpe.com', 'DCSO', 'Deputy Sales & Strategy', 'Business', 'Swaraag Shrey Nambala', 'active', '2021-01-20'),
('5', 'Bhavika', 'N-wkw@nivixpe.com', 'DCMO', 'Deputy Marketing', 'Marketing', 'Sahith', 'active', '2021-02-10'),
('6', 'Siddharatha', 'siddharatha@nivixpe.com', 'COO', 'Operations', 'Business', 'Sahith', 'active', '2020-05-01'),
('7', 'Kashish', 'kashish@nivixpe.com', 'Legal', 'Legal & Compliance', 'Legal', 'Sahith', 'active', '2020-08-01'),
('8', 'Ngan Nguyen', 'nguyen@nivixpe.com', 'Developer 1', 'Technology', 'Technical', 'Co-founder,CTO', 'active', '2025-05-01'),
('9', 'Vinisha', 'vinisha@nivixpe.com', 'Legal Intern', 'Legal & Compliance', 'Legal', 'Sahith', 'active', '2025-05-15'),
('10', 'Aryan Kulshreshtra', 'aryan@nivixpe.com', 'Product Manager', 'HR', 'HR', 'Sahith', 'active', '2025-05-02'),
('11', 'Adya Paliwal', 'adya@nivixpe.com', 'Product Manager', 'Product', 'Business', 'Sahith', 'active', '2025-07-25'),
('12', 'Nithin', 'nithin@nivixpe.com', 'Developer 3', 'Technology', 'Technical', 'Co-founder,CTO', 'active', '2025-05-01'),
('13', 'Shubham kumar kushwaha', 'shubham@nivixpe.com', 'Developer 2', 'Technology', 'Technical', 'Co-founder,CTO', 'active', '2025-05-01'),
('14', 'nivixpe', 'team@nivixpe.com', 'Admin', 'Operations', 'Business', 'Sahith', 'active', '2025-01-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_tasks (id, title, assignee, assignee_role, status, due_date, priority, owner, comments)
VALUES
('bt1', 'Business Model Canvas', 'Swaraag', 'CSO', 'completed', '2025-04-15', 'high', 'Swaraag', 'Completed and approved'),
('bt2', 'Awareness Campaign', 'Swaraag', 'CSO', 'completed', '2025-04-18', 'high', 'Swaraag', 'Campaign launched successfully'),
('bt3', 'Legal Compliance Audit', 'Kashish', 'Legal', 'ongoing', '2025-05-10', 'high', 'Sahith', 'Audit underway'),
('bt4', 'API Infrastructure Refactor', 'Shubham', 'CTO', 'ongoing', '2025-05-15', 'high', 'Shubham', 'Backend migration')
ON CONFLICT (id) DO NOTHING;

-- Drive Documents (87 real documents exported from Convex)
INSERT INTO drive_documents (id, team_folder, uploaded_by, uploaded_by_email, file_name, file_size, external_link, description, uploaded_at) VALUES
('k57b3kzxcex4jbryrvsdrnjn4n8bs1w0', 'Business', 'Sahith', 'ceo@nivixpe.com', '6 months Growth Plan.docx', 750838, 'https://diligent-camel-310.convex.cloud/api/storage/c3cb53d3-46f5-408a-a5d2-c81ae7909256', 'Upload by Swaraag', '2026-08-03T08:04:30.642Z'),
('k57fbwscnnym7mvt5rtqtchj098bj175', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'tracker for grants.xlsx', 6066, 'https://diligent-camel-310.convex.cloud/api/storage/9615c775-6bf4-42bc-ae98-e60b31bb1e86', '', '2026-07-31T20:45:56.962Z'),
('k57f22z8f6psm7p7abgw91t9018bjg6e', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Different sources to expend our customer base.docx', 19933, 'https://diligent-camel-310.convex.cloud/api/storage/9bf511f6-b51d-44b1-ad6c-72703a33c2b8', '', '2026-07-31T19:25:53.508Z'),
('k575y5bvst1xe3ag70r90ksf5n8bj1wn', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Investor Incentive Document.docx', 38411, 'https://diligent-camel-310.convex.cloud/api/storage/04b90cae-4a23-4363-ad8b-42d4f865361b', '', '2026-07-31T19:25:44.182Z'),
('k573t6aw5868a0z4sm8sjbhjh98bk9f4', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Capital Structure and Funding Strategy-Draft(to be designed ).docx', 22984, 'https://diligent-camel-310.convex.cloud/api/storage/789aeffc-2ce0-4e90-b4ad-d4500c9579be', '', '2026-07-31T19:25:35.398Z'),
('k57f1jaymfz5xmcyrvdqw2kjgd8bk4y9', 'Legal', 'Vinisha', 'legal2@nivixpe.com', 'NivixPe_Legal_Vision_Board-3.docx', 16672, 'https://diligent-camel-310.convex.cloud/api/storage/f2d94706-585b-4f3c-b488-85dc497d7be7', 'Nivixpe legal vision board', '2026-07-31T17:33:28.654Z'),
('k572vf0art2vqqa5dm08bz8zqx8bkp1v', 'Business', 'Swaraag', 'cso@nivixpe.com', 'NIVIXPE Investor Economics & Return Framework Draft(to be designed).docx', 65190, 'https://diligent-camel-310.convex.cloud/api/storage/3a926138-6c3a-495f-98a9-b110e758ca88', 'Design team to design the doc as well as create the diagrams according to the instructions given in the document.', '2026-07-31T11:56:42.915Z'),
('k572zfgb7zk6ydmknmt9g28f7s8bj543', 'Business', 'Swaraag', 'cso@nivixpe.com', 'NIVIXPE Commercial Incentive Framework - Draft(to be designed).docx', 51326, 'https://diligent-camel-310.convex.cloud/api/storage/eb94b6d5-f6ea-4906-a6ce-b8cf18c09e46', 'Design team to design the doc as well as create the diagrams according to the instructions given in the document.', '2026-07-31T11:56:23.130Z'),
('k5712jrkk4ysfg3heq96zey64d8b4m40', 'Business', 'Swaraag', 'cso@nivixpe.com', 'NIVIXPE Growth Marketing Handbook_compressed.pdf', 1196932, 'https://diligent-camel-310.convex.cloud/api/storage/aafaf5c1-6e72-4fab-8f79-d8d94828de53', 'Marketing Growth Economics Handbook', '2026-07-24T13:30:24.693Z'),
('k579cdv4f6hrb0z1f4cyafj2358ayb1n', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Consultancy Talk Phases.pdf', 91798, 'https://diligent-camel-310.convex.cloud/api/storage/496e8c28-9652-40a1-a1b4-3f77e350d8df', '', '2026-07-21T17:31:36.287Z'),
('k577ay88gft98z93tw1hb4raj98az9de', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'New Logistics Companies partnerships and division in phases too .pdf', 186211, 'https://diligent-camel-310.convex.cloud/api/storage/da04f73d-98fe-4297-95dd-daee7a971492', '', '2026-07-21T17:24:55.116Z'),
('k572zv8962rhgdxb2g9pn8re5n8ayn8c', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'India Exports 2015-2025.xlsx', 11958, 'https://diligent-camel-310.convex.cloud/api/storage/043a4226-9774-47d1-a671-60ab361c68de', '', '2026-07-21T17:23:40.478Z'),
('k57a7ajbvasxgg4m58jznrgr018azyqa', 'Business', 'Swaraag', 'cso@nivixpe.com', 'https://docs.google.com/document/d/1buEI4iju8jbCssg-s-3ys0wbDqhTsuoBsI__F6KFBQw/edit?usp=sharing', 0, 'https://docs.google.com/document/d/1buEI4iju8jbCssg-s-3ys0wbDqhTsuoBsI__F6KFBQw/edit?usp=sharing', 'Pitch Styles and Questions', '2026-07-21T07:07:19.627Z'),
('k5793yyvfgtv8m5cnjpb0qyfjh8arxdj', 'Business', 'Swaraag', 'cso@nivixpe.com', 'Marketing team Fund Allocation.pdf', 212270, 'https://diligent-camel-310.convex.cloud/api/storage/de00b987-7fe0-42a6-83e5-f0bd3cd6090c', '', '2026-07-18T04:21:47.145Z'),
('k575qpxg78ser455cfdm6yx2td8aegj6', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Business Team Report June.docx', 15886, 'https://diligent-camel-310.convex.cloud/api/storage/db91e49c-5d39-4ebc-a852-277650216abe', '', '2026-07-13T08:54:43.173Z'),
('k573fya4v682kdb2y6cvsfj3fd8a3dte', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '130_Smart_Contract_Audit_Framework.docx', 69306, 'https://diligent-camel-310.convex.cloud/api/storage/a16a4e8b-2213-4d29-a488-1878a16b3c73', '', '2026-07-07T09:15:14.016Z'),
('k579gs9m8p4g5yptgpn4j7x5p58a36nb', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '129_Cloud_Infrastructure_Policy.docx', 69554, 'https://diligent-camel-310.convex.cloud/api/storage/7a779343-01e2-4b60-9f06-c817f0e62a33', '', '2026-07-07T09:15:04.699Z'),
('k57ae2r0pxwwd4waxdghrfjhbh8a3w4c', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '128_Penetration_Testing_Policy.docx', 62315, 'https://diligent-camel-310.convex.cloud/api/storage/8729ce7f-9522-47e2-9f3c-a6224ef74359', '', '2026-07-07T09:14:56.608Z'),
('k57b9991j7f2kb827d5pn7x9v58a3aqh', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '127_ISO27001_Readiness_Plan.docx', 69399, 'https://diligent-camel-310.convex.cloud/api/storage/d4c2241a-8f42-4d9c-9358-bab749780a11', '', '2026-07-07T09:14:47.193Z'),
('k572affqzetn702s190re101s58a3b9q', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '126_SOC2_Readiness_Plan.docx', 68420, 'https://diligent-camel-310.convex.cloud/api/storage/630a71eb-5369-493a-9605-405dcc73333c', '', '2026-07-07T09:14:35.825Z'),
('k57e0dktf3xhpzgskywc3vfken8a3yhb', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '125_Logging_Observability_Framework.docx', 66252, 'https://diligent-camel-310.convex.cloud/api/storage/e1212c83-525a-489e-ba7d-ed9defd9c332', '', '2026-07-07T09:14:23.228Z'),
('k57a5z7n3g9b0jgg8p65zy3rys8a2eck', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '124_API_Gateway_Architecture.docx', 67496, 'https://diligent-camel-310.convex.cloud/api/storage/e6704f87-798a-4a0a-b31d-a5a666047981', '', '2026-07-07T09:14:14.527Z'),
('k578v79sehqxv6p55b9ybsayed8a3wmq', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '123_DevOps_SOP_CICD.docx', 65713, 'https://diligent-camel-310.convex.cloud/api/storage/c4ec54e2-8961-48af-8d9a-39ca9cc30566', '', '2026-07-07T09:14:03.981Z'),
('k57ae899yc8zmc2g9c9afsgbg18a3f29', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '122_Data_Backup_Policy.docx', 65134, 'https://diligent-camel-310.convex.cloud/api/storage/83789b0f-d8fd-4b8f-8a77-08b009aa0187', '', '2026-07-07T09:13:53.531Z'),
('k573hnn47c7q9f9t0yva49gfjx8a2tgb', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '121_Infrastructure_Monitoring_SOP.docx', 67451, 'https://diligent-camel-310.convex.cloud/api/storage/68ae58e1-ce87-4a99-b967-232bead2485b', '', '2026-07-07T09:13:43.572Z'),
('k57e69xb1a1s5cer22zyqq8zw58a3k0x', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '120_Business_Continuity_Plan_BCP.docx', 70215, 'https://diligent-camel-310.convex.cloud/api/storage/4dbf2db3-df77-471d-8a40-07276934b4e9', '', '2026-07-07T09:13:33.875Z'),
('k57cdrd2dwj28b9ac0n29bhwx58a3c66', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '119_Disaster_Recovery_Plan_DRP.docx', 70374, 'https://diligent-camel-310.convex.cloud/api/storage/82faeec2-81a9-4cb8-8252-3ef5e2690ab7', '', '2026-07-07T09:13:23.016Z'),
('k573b9vt0thscjssmz5ncbagzh8a2ch7', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '118_Access_Control_Policy_RBAC.docx', 66743, 'https://diligent-camel-310.convex.cloud/api/storage/e996db12-c70c-4ff2-85a1-d43859a2e36c', '', '2026-07-07T09:13:09.520Z'),
('k57ey5ms1tzc7116q5d6vc1qp58a3hvh', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '117_Security_Architecture_Document.docx', 68360, 'https://diligent-camel-310.convex.cloud/api/storage/bc2559aa-0516-4758-ad07-28316bc5356a', '', '2026-07-07T09:12:58.334Z'),
('k575g59b34vqmhp121n2mty6n98a3g3h', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '116_System_Design_Documents.docx', 73927, 'https://diligent-camel-310.convex.cloud/api/storage/5fe5bb60-a500-423a-bc96-7c45be5b008b', '', '2026-07-07T09:12:48.407Z'),
('k576sa4hyzkcdcv62d7ws8afw58a2e5d', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '115_API_Documentation_External.docx', 68797, 'https://diligent-camel-310.convex.cloud/api/storage/10877888-6566-4d44-a4df-89b5b4ac7f25', '', '2026-07-07T09:12:38.162Z'),
('k576kj3g0bnpk4x325vpkqbvsx8a27cw', 'Technical', 'Siddharatha', 'coo@nivixpe.com', '114_Infrastructure_Architecture_Document.docx', 72823, 'https://diligent-camel-310.convex.cloud/api/storage/64ae2ac5-8252-45ac-b44e-10f480d6a612', '', '2026-07-07T09:12:18.796Z'),
('k570cy6mqwf6ezbtgz891bvqyx898q2c', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'what we need FOR BETA PHASE (1).docx', 22727, 'https://diligent-camel-310.convex.cloud/api/storage/2debd280-832b-4ec3-a1a1-daa421705d64', '', '2026-06-24T16:19:48.581Z'),
('k571jza1vdvgq5j7nxbts7mz2n899r6e', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'NIVIXPE PRIVATE LIMITED- Vulnerability Disclosure Policy (1).docx', 20531, 'https://diligent-camel-310.convex.cloud/api/storage/69967d91-a20f-4c0f-81e2-7f38cf73a0d9', '', '2026-06-24T16:19:34.413Z'),
('k571drfgjz43he2mh6nxxangh1898j9x', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'NIVIXPE PRIVATE LIMITED- Student Brand Ambassador (1).docx', 30821, 'https://diligent-camel-310.convex.cloud/api/storage/76bd46cc-b268-45da-b864-e28623b5c475', '', '2026-06-24T16:19:21.350Z'),
('k579h156cphk274q77af2tvaed899frd', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'NIVIXPE PRIVATE LIMITED - Privacy policy fnl. (1).docx', 27519, 'https://diligent-camel-310.convex.cloud/api/storage/73f94768-5d8a-44d8-bf14-0c3316f488c3', '', '2026-06-24T16:19:02.600Z'),
('k57a49e0q7gx9cxp9k6bcqty1d899frc', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'NIVIXPE PRIVATE LIMITED - Incident Response Note (1).docx', 28037, 'https://diligent-camel-310.convex.cloud/api/storage/c7a2f206-d94f-4fe1-b1c0-e5f70bd6984b', '', '2026-06-24T16:18:44.136Z'),
('k573x9pvwhqpg0p18723zy9x5x899c8h', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'NIVIXPE PRIVATE LIMITED - GRIEVANCE OFFICER DESIGNATION (1).docx', 18811, 'https://diligent-camel-310.convex.cloud/api/storage/b405d415-e1e2-42b4-8bb7-216d0a7f421f', '', '2026-06-24T16:18:27.665Z'),
('k574yp0d7a2wg309s06zkm5n8n899cx5', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'NIVIXPE PRIVATE LIMITED - GRIEVANCE - PUBLIC NOTICE (1).docx', 17472, 'https://diligent-camel-310.convex.cloud/api/storage/54de71e2-ee2c-43bd-829a-78fea65eafec', '', '2026-06-24T16:18:00.559Z'),
('k5721ghqmar31m2w44aa8k3bhs899c58', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'NIVIXPE PRIVATE LIMITED - Beta Test Agreement (1).docx', 26501, 'https://diligent-camel-310.convex.cloud/api/storage/f4a549b5-08a7-4407-8560-c5d9d6256b07', '', '2026-06-24T16:17:39.632Z'),
('k576vr6yraayac1j2q81ejz2sh8992ec', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'IFSCA Docs needed and complience meet (1).xlsx', 15587, 'https://diligent-camel-310.convex.cloud/api/storage/a9227436-fc4e-41f5-b197-ac334692b7e2', '', '2026-06-24T16:17:25.510Z'),
('k577zbjyrsr1tqe7bnmnxrc5y9898jf2', 'Legal', 'Kashish', 'legal1@nivixpe.com', 'CHEAT SHEET- NIVIXPE PRIVATE LIMITED (1).docx', 29299, 'https://diligent-camel-310.convex.cloud/api/storage/670997e5-f98b-43a9-8477-9e78a8983dff', '', '2026-06-24T16:17:05.703Z'),
('k57cpfehhe5mrrr9gq899nr2yd88p7hp', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'NivixPe 90 Day Strategic Plan.docx', 28630, 'https://diligent-camel-310.convex.cloud/api/storage/eae700db-388a-45b8-bd1a-33e6adb5ebd4', 'of Business Team together', '2026-06-15T12:42:10.488Z'),
('k571kkszxrfzxqt5rast2tbgr188khcv', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Monthly Hatchery Report - May .docx', 9118, 'https://diligent-camel-310.convex.cloud/api/storage/d80fe15b-a683-4bff-9bd2-40499a2abb73', '', '2026-06-13T16:52:36.220Z'),
('k5711vd1z9vv8tpp58gp7dyhg588jyjs', 'Marketing', 'Abhiram', 'cmo@nivixpe.com', 'NIVIXPE_GTM_Revised_2026 (1).pdf', 67774, 'https://diligent-camel-310.convex.cloud/api/storage/08d0b116-ac69-4e79-858c-b8492ba46cb4', 'Nivixpe Gtm revised plan 2026', '2026-06-13T12:24:55.026Z'),
('k5759p6rf1kefjb3035t55tyd988ezzk', 'Other', 'Rudra Sahu', 'designer2@nivixpe.com', 'https://drive.google.com/drive/folders/1a_kz2yW1P0dYfPSaABvGFYxI5-AMHhI9', 0, 'https://drive.google.com/drive/folders/1a_kz2yW1P0dYfPSaABvGFYxI5-AMHhI9', 'Drive with all the assets created by me till date', '2026-06-11T18:28:50.394Z'),
('k576jdc63ex7p8agg140n5ff5188e8f1', 'Other', 'Aradhya', 'designer1@nivixpe.com', 'NIVIXPE LOGO (4).png', 46342, 'https://diligent-camel-310.convex.cloud/api/storage/e69dee64-1eb5-4733-8071-1dd5d04a90bf', '', '2026-06-11T17:14:18.722Z'),
('k571v6cyhf5trnkyhv46k859ah88eh31', 'Other', 'Aradhya', 'designer1@nivixpe.com', 'NIVIXPE LOGO (4) 3.png', 50018, 'https://diligent-camel-310.convex.cloud/api/storage/1bc63dbf-e628-4dfc-9c0e-4376b3d0c104', '', '2026-06-11T17:14:11.358Z'),
('k578ff21dnb7cx80w74t0vevbh88fqhp', 'Other', 'Aradhya', 'designer1@nivixpe.com', 'NivixPe - 1st post (4).png', 1223827, 'https://diligent-camel-310.convex.cloud/api/storage/9da5df9f-adcf-459a-b8c3-7d0a8b53088b', '', '2026-06-11T17:13:59.889Z'),
('k57etz5y2475fa9qkq683rdq1588fhhr', 'Other', 'Aradhya', 'designer1@nivixpe.com', 'NivixPe - 1st post (4).png', 1223827, 'https://diligent-camel-310.convex.cloud/api/storage/4869af95-a710-47fe-8d99-ce1633a594c2', '', '2026-06-11T17:13:10.354Z'),
('k577w29rrmz0w4sk48qxy229yx88ek2y', 'Other', 'Aradhya', 'designer1@nivixpe.com', 'NivixPe - 1st post (10).png', 638818, 'https://diligent-camel-310.convex.cloud/api/storage/6b53fab9-cf21-492d-adf6-c60a10bb5a9e', '', '2026-06-11T17:13:02.965Z'),
('k57fr13sveamw4h754rmmv8rrh88e6v1', 'Other', 'Aradhya', 'designer1@nivixpe.com', 'Twitter post - 3.png', 958810, 'https://diligent-camel-310.convex.cloud/api/storage/f2487db9-e577-4371-8c88-b71ed3334420', '', '2026-06-11T17:12:38.682Z'),
('k5708k5se1zn3q5j434hpwxpjd88enek', 'Other', 'Aradhya', 'designer1@nivixpe.com', 'Twitter post - 2.png', 1025746, 'https://diligent-camel-310.convex.cloud/api/storage/968feff5-66b6-4afd-a986-539105573631', '', '2026-06-11T17:12:30.162Z'),
('k570yvpkf8zy07ccc82dr52s9n88ek6t', 'Other', 'Aradhya', 'designer1@nivixpe.com', 'Twitter post - 1.png', 664550, 'https://diligent-camel-310.convex.cloud/api/storage/d44beaec-7b03-402b-94fd-cb4641d52a2d', '', '2026-06-11T17:12:17.267Z'),
('k57c38cnf0bd2dka3b60rq80s588bjm3', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Insurance companies benefits of DID + possible partners.pdf', 97164, 'https://diligent-camel-310.convex.cloud/api/storage/71938326-bcff-4cb4-adb1-607384472a27', '', '2026-06-09T17:24:54.333Z'),
('k57bx7xefdtn57htyj3454b6gh8885rf', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'List of Small Banks In India.pdf', 115228, 'https://diligent-camel-310.convex.cloud/api/storage/b13c588e-ff58-44d3-983a-9c27ac5507a4', '', '2026-06-08T20:44:41.759Z'),
('k579s386kr8vteketkxkm80gfn889d5e', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Monthly Report Business Team-May.pdf', 90669, 'https://diligent-camel-310.convex.cloud/api/storage/8b3453a1-1bd3-497e-b3b8-e47286f629a6', '', '2026-06-08T20:44:10.905Z'),
('k577yp2vdm6sdtsg2k5nfcqyfs888z5y', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Revolut New Policy.pdf', 34987, 'https://diligent-camel-310.convex.cloud/api/storage/a2757bdb-bd96-4b44-b0f8-0871baeca749', '', '2026-06-08T20:42:57.436Z'),
('k575cbpp2fa0em2n06qsq1bx6d888a64', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Customer Switching Behaviour.pdf', 35433, 'https://diligent-camel-310.convex.cloud/api/storage/422d9258-03e4-4895-9e9e-962989075f5a', '', '2026-06-08T20:42:29.795Z'),
('k57257879wjnn5782pths13knx888nr6', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Difference in Strategy in Marketing.pdf', 157830, 'https://diligent-camel-310.convex.cloud/api/storage/36dd4d40-5c43-4676-bc63-e29d1dc1a0f6', 'Between Europe & India', '2026-06-08T20:41:46.008Z'),
('k5731p3yvntze5h7pxgahegtv5888cra', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Slice Company Analysis.pdf', 111537, 'https://diligent-camel-310.convex.cloud/api/storage/d8459acd-9a04-4636-bf22-c1b53ba14c21', '', '2026-06-08T20:40:49.656Z'),
('k571wgz5s32gzdtrwhvxf39j49889fr8', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Chinese Yuan.pdf', 589966, 'https://diligent-camel-310.convex.cloud/api/storage/a4f3aa00-e891-4fb8-bd48-6dca5af6d80c', '', '2026-06-08T20:32:54.760Z'),
('k57c1q3ycmpa6p1jrqzn8f2gtx8883ja', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'USD currency.pdf', 578479, 'https://diligent-camel-310.convex.cloud/api/storage/d2522498-8da1-4536-9fea-54e885dcd80d', '', '2026-06-08T20:32:45.207Z'),
('k57eg5pykc3gbndy6ayx5dskhx8882rz', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Jordanian.pdf', 520046, 'https://diligent-camel-310.convex.cloud/api/storage/e246112c-95a4-45b2-adaf-a34322269b07', '', '2026-06-08T20:32:31.892Z'),
('k572csn6hmx9wxdmb7g1vagaah889p8z', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Omani Rial.pdf', 572919, 'https://diligent-camel-310.convex.cloud/api/storage/fc10033f-7bd2-408b-a966-ff9f75e8bb1a', '', '2026-06-08T20:32:19.950Z'),
('k57dsf7f7hg6640jc2cc7cdpp9888drp', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Bahrain Dinar.pdf', 596059, 'https://diligent-camel-310.convex.cloud/api/storage/35678949-a8ab-4d50-ab91-bc2db38edc8b', '', '2026-06-08T20:32:09.343Z'),
('k573gdpnqkx95xx494xg5ydqph889jry', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Kuwaiti Dinar.pdf', 497698, 'https://diligent-camel-310.convex.cloud/api/storage/8eb6588e-ffdb-43c1-b307-ea9e3d6d5149', '', '2026-06-08T20:31:58.093Z'),
('k577tw0p2j6xer66x05vht4rwn888v5f', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Revolut Company Analysis.pdf', 1504363, 'https://diligent-camel-310.convex.cloud/api/storage/a58ef610-e85d-47d6-a61c-cba4f11ba492', '', '2026-06-08T20:28:53.067Z'),
('k570vntq2g2h7jpvabnpwtnwy98892jg', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Short Intro Script.pdf', 85669, 'https://diligent-camel-310.convex.cloud/api/storage/0e5d80b5-c17a-4bde-960b-964daeb44acb', '', '2026-06-08T20:26:19.754Z'),
('k57be05am4k92r54h4bjqzks79889x7q', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Investor profile analysis( if we want to approach again).pdf', 88891, 'https://diligent-camel-310.convex.cloud/api/storage/04589b7d-68ab-46a4-b45f-a13bf543d390', '', '2026-06-08T20:25:37.600Z'),
('k57egrhfg1ds29eat9ywsxwz7h888z1n', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'FINAL VALUATION ANALYSIS.pdf', 138930, 'https://diligent-camel-310.convex.cloud/api/storage/53c7fee6-8156-401f-a813-1ec2ebd76362', '', '2026-06-08T20:24:55.805Z'),
('k572sg2qagb07gckwfgw3ncpjs888h80', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Nivixpe_compressed (1).pdf', 1277819, 'https://diligent-camel-310.convex.cloud/api/storage/e32d148c-37be-4dc3-8b94-8019dac09821', 'A small ppt on nivixpe', '2026-06-08T07:45:41.497Z'),
('k57drwn6pskamp4k0mhtbkebws889atz', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Budget_Allocation.pdf', 22978, 'https://diligent-camel-310.convex.cloud/api/storage/5f35f185-9e60-46cd-80a7-226f1c132baa', 'Final Draft of budget allocation ( Current Updated On is With Swaraag )', '2026-06-08T07:40:35.317Z'),
('k578jy3jdsz19d3hgfj2nh6qx5888t3y', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'NIVIXPE.docx', 25867, 'https://diligent-camel-310.convex.cloud/api/storage/50be9dec-ce11-4524-898e-019e27ebd2ef', 'Budget allocation-1', '2026-06-08T07:39:54.354Z'),
('k570tfvt4hyh8hcyp4nq246cm9889s6e', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Reward_Strategy (1).pdf', 87940, 'https://diligent-camel-310.convex.cloud/api/storage/2abf4b7c-3ccf-4b10-9007-150017531c8f', 'Reward Strategy (final)', '2026-06-08T07:38:37.213Z'),
('k570v1m7w10menq8e33t9ea2hd889q1c', 'Business', 'Ujjwal', 'dcso@nivixpe.com', 'Investor_Data_Room_Tracker.xlsx', 10461, 'https://diligent-camel-310.convex.cloud/api/storage/f7c6855b-83c4-4227-a830-35b2b3b3b596', 'Investor DATA Room Index', '2026-06-08T07:36:01.767Z'),
('k5790e0gqt52qtpy1j84wy51r58833v5', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'NIVIXPE_Blog_Article (1).docx', 13656, 'https://diligent-camel-310.convex.cloud/api/storage/7defd7d2-9b0d-4402-bc36-5e7e544eb2cc', 'Domakonda Bhavika → May → 29th → Blog posted on 2nd June', '2026-06-05T14:09:49.078Z'),
('k576jcy3bztakbsa0z10fyx87d8836g6', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'Nivixpe_SocialMedia_Plan_June2026 (1).xlsx', 30147, 'https://diligent-camel-310.convex.cloud/api/storage/25cd4402-f458-412e-ac8d-e4f2ef34390e', 'Domakonda Bhavika → May → 26th → Social Media Plan for June 2026', '2026-06-05T14:07:30.626Z'),
('k5795wevpz82g1qynsaswr7fy1883a8t', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'NIVIXPE_Medium_Blog_Post.docx', 14246, 'https://diligent-camel-310.convex.cloud/api/storage/dcf1f05d-8bb6-4477-ba80-101c249d5565', 'Domakonda Bhavika → May → 25th → Blog posted on 29th May', '2026-06-05T14:05:39.849Z'),
('k574ajzqzwzdxk274dzrd1m9y188353b', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'NIVIXPE_Blog_Banks_Dont_Charge_Fees.docx', 13472, 'https://diligent-camel-310.convex.cloud/api/storage/5c5bc09f-9f8c-4dbd-b0e5-c9d4bcb52d58', 'Domakonda Bhavika → May → 11th → Blog posted on 24th May', '2026-06-05T14:04:38.670Z'),
('k57dbmffzgmxc9jjyrz6wwmbah883ctj', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'NIVIXPE_Blog_Global_Payments.docx', 12566, 'https://diligent-camel-310.convex.cloud/api/storage/1c03c3be-ca5a-42b9-9056-689e8f79df77', 'Domakonda Bhavika → May → 3rd → Blog posted on 11th May', '2026-06-05T14:02:48.005Z'),
('k57crn7s68w07pxze2fxsmcphd883dft', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'nivixpe subsciptions - bhavika.docx', 11492, 'https://diligent-camel-310.convex.cloud/api/storage/fd59567a-3c02-4aca-b6fa-66686797832e', 'Domakonda Bhavika → May → 1st → Instagram & Twitter subscription document', '2026-06-05T14:01:03.129Z'),
('k57fkheyyzn0hgbqys0zx6f9f188392r', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'Wise_Analysis_Bhavika.pdf', 270744, 'https://diligent-camel-310.convex.cloud/api/storage/c3fae0db-ced0-46eb-8e6e-fcc239c99317', 'Domakonda Bhavika → May → 1st → Marketing Analysis on Wise', '2026-06-05T14:00:03.539Z'),
('k57cq8xezfsx8t99v4t4h9p5ns8835pw', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'NivixPe_Blog_CrossBorderPayments.docx', 13660, 'https://diligent-camel-310.convex.cloud/api/storage/e30a6277-3e86-4737-883f-69f3ecdb87bf', 'Domakonda Bhavika → April → 29th → Blog posted on 2nd May', '2026-06-05T13:58:24.243Z'),
('k5752rk59prj4f7k0c5w5tme3x8831gb', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'nivixpe_solution_blog.docx', 12753, 'https://diligent-camel-310.convex.cloud/api/storage/eecb99fc-328f-4f92-906a-d3fb405ceedb', 'Domakonda Bhavika → April → 15th → Blog posted on 18th April', '2026-06-05T13:56:53.131Z'),
('k573rqwkkwk24zmvzb4h0mh9x58827e4', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'invisible_tax_global_ambition.docx', 11284, 'https://diligent-camel-310.convex.cloud/api/storage/731988ea-0087-4b67-9cad-b6e18b6909c1', 'Domakonda Bhavika → April → 8th → Blog posted on 10th April', '2026-06-05T13:55:54.096Z'),
('k5756z15rrqbjbez8p0aezpx7n882tc0', 'Marketing', 'Bhavika', 'dcmo@nivixpe.com', 'DeFi_vs_CBDCs_Medium_Blog.docx', 14508, 'https://diligent-camel-310.convex.cloud/api/storage/c042c504-5522-4602-b8db-8bdf0c7bd925', 'Domakonda Bhavika → April → 2nd → Blog posted on 2nd April', '2026-06-05T13:53:45.426Z')
ON CONFLICT (id) DO NOTHING;
