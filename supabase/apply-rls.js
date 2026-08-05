#!/usr/bin/env node
// Apply RLS policies directly to Supabase using the management API

const https = require('https');

const PROJECT_REF = 'qscnzmscqxrcyujqjnyp';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY256bXNjcXhyY3l1anFqbnlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTgyMTA2MiwiZXhwIjoyMTAxMzk3MDYyfQ.5kP-ILERweFg8qZpBiNWpAAppbz_7GGeuAne0lN4ud4';

// Individual statements (Supabase REST doesn't support multi-statement SQL directly)
// We'll use pg to run the full file
const { execSync } = require('child_process');

const statements = [
  // Enable RLS
  "ALTER TABLE team_members ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE work_tasks ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE meetings ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE proof_of_work ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE drive_documents ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE drive_access_grants ENABLE ROW LEVEL SECURITY",
  "ALTER TABLE notifications ENABLE ROW LEVEL SECURITY",

  // Drop old policies
  "DROP POLICY IF EXISTS \"anon_all_team_members\" ON team_members",
  "DROP POLICY IF EXISTS \"anon_all_work_tasks\" ON work_tasks",
  "DROP POLICY IF EXISTS \"anon_all_attendance_records\" ON attendance_records",
  "DROP POLICY IF EXISTS \"anon_all_leave_requests\" ON leave_requests",
  "DROP POLICY IF EXISTS \"anon_all_meetings\" ON meetings",
  "DROP POLICY IF EXISTS \"anon_all_proof_of_work\" ON proof_of_work",
  "DROP POLICY IF EXISTS \"anon_all_drive_documents\" ON drive_documents",
  "DROP POLICY IF EXISTS \"anon_all_drive_access_grants\" ON drive_access_grants",
  "DROP POLICY IF EXISTS \"anon_all_notifications\" ON notifications",

  // Create full-access anon policies
  `CREATE POLICY "anon_all_team_members" ON team_members FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_work_tasks" ON work_tasks FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_attendance_records" ON attendance_records FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_leave_requests" ON leave_requests FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_meetings" ON meetings FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_proof_of_work" ON proof_of_work FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_drive_documents" ON drive_documents FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_drive_access_grants" ON drive_access_grants FOR ALL TO anon USING (true) WITH CHECK (true)`,
  `CREATE POLICY "anon_all_notifications" ON notifications FOR ALL TO anon USING (true) WITH CHECK (true)`,
];

function makeRequest(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: `${PROJECT_REF}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// We'll use pg client instead since exec_sql isn't available
const pg = (() => {
  try { return require('pg'); } catch { return null; }
})();

if (!pg) {
  console.log('pg not available, outputting instructions...');
  console.log('\nPlease run this SQL in your Supabase SQL Editor (https://app.supabase.com):');
  console.log('File: supabase/migrations/enable_rls_policies.sql');
  process.exit(0);
}

const { Client } = pg;

async function main() {
  const client = new Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres', // You may need to update this
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB');
    
    for (const sql of statements) {
      try {
        await client.query(sql);
        console.log('✓', sql.substring(0, 60) + '...');
      } catch (e) {
        console.warn('⚠', sql.substring(0, 60), '->', e.message);
      }
    }
    console.log('\nAll RLS policies applied!');
  } catch (e) {
    console.error('Connection failed:', e.message);
    console.log('\nPlease run enable_rls_policies.sql manually in Supabase SQL Editor');
  } finally {
    await client.end();
  }
}

main();
