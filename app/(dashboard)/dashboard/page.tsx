'use client';

import { useAuth } from '@/app/providers';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabaseDb, WorkTask, AttendanceRecord, ProofOfWorkRecord, Meeting, TeamMember } from '@/lib/supabase-db';
import { KPICard } from '@/components/kpi-card';
import { ActivityFeed } from '@/components/activity-feed';
import { Users, CheckCircle, Clock, CheckSquare, Calendar, LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { normalizeEmail } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = new Date();
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const [allTasks, setAllTasks] = useState<WorkTask[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [allProofOfWork, setAllProofOfWork] = useState<ProofOfWorkRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const loadData = () => {
    Promise.all([
      supabaseDb.getWorkTasks(),
      supabaseDb.getAttendanceRecords(),
      supabaseDb.getProofOfWork(),
      supabaseDb.getMeetings(),
      supabaseDb.getTeamMembers(),
    ]).then(([t, a, p, m, tm]) => {
      setAllTasks(t);
      // Normalize emails
      const normalizedA = a.map(r => ({
        ...r,
        email: normalizeEmail(r.email)
      }));
      const normalizedTm = tm.map(mem => ({
        ...mem,
        email: normalizeEmail(mem.email)
      }));
      setAttendanceRecords(normalizedA.filter((r) => r.date === today));
      setAllProofOfWork(p);
      setMeetings(m);
      setTeamMembers(normalizedTm as any);
    });
  };

  useEffect(() => {
    loadData();
    const unsubTasks = supabaseDb.subscribeToChanges('work_tasks', loadData);
    const unsubAtt = supabaseDb.subscribeToChanges('attendance_records', loadData);
    const unsubPow = supabaseDb.subscribeToChanges('proof_of_work', loadData);
    const unsubMeetings = supabaseDb.subscribeToChanges('meetings', loadData);

    return () => {
      unsubTasks();
      unsubAtt();
      unsubPow();
      unsubMeetings();
    };
  }, [today]);

  // KPI Calculations
  const presentToday = attendanceRecords.filter((a) => a.status === 'present').length;
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
  const completionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;
  const pendingReviews = allProofOfWork.filter((pow) => pow.status === 'submitted').length;
  const activeEmployees = teamMembers.filter(m => m.status === 'active' && !['Abhiram', 'Rudra Sahu'].includes(m.name)).length;

  // Names to hide everywhere except Proof of Work and Team Drive
  const hiddenMembers = ['Abhiram', 'Rudra Sahu'];

  // Build Activity Feed from Tasks, ProofOfWork, and Attendance
  const activities: any[] = [];
  
  allTasks.filter(t => !hiddenMembers.includes(t.assignee)).slice(0, 5).forEach(task => {
    activities.push({
      id: `task-${task.id || (task as any)._id}`,
      user: task.assignee,
      action: `was assigned a new task: ${task.title}`,
      timestamp: task.dueDate || 'Recently',
      icon: <CheckSquare className="h-4 w-4" />
    });
  });

  allProofOfWork.slice(0, 5).forEach(pow => {
    activities.push({
      id: `pow-${pow.id || (pow as any)._id}`,
      user: pow.submittedBy,
      action: `submitted proof of work for "${pow.taskTitle}"`,
      timestamp: pow.submissionDate,
      icon: <LinkIcon className="h-4 w-4" />
    });
  });

  attendanceRecords.slice(0, 5).forEach(record => {
    const memberName = teamMembers.find(m => m.email === record.email)?.name || record.email;
    activities.push({
      id: `att-${record.email}-${record.date}`,
      user: memberName,
      action: `checked in at ${record.loginTime || '09:00 AM'}`,
      timestamp: today,
      icon: <Clock className="h-4 w-4" />
    });
  });

  // Upcoming Meetings
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled').slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <Header title="Executive Dashboard" subtitle="Overview of team operations and performance" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Row: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Present Today" 
            value={presentToday} 
            subtitle={`out of ${activeEmployees} employees`}
            icon={<Users />}
            bgColor="blue"
          />
          <KPICard 
            title="Task Completion Rate" 
            value={`${completionRate}%`} 
            subtitle={`${completedTasks} tasks completed`}
            icon={<CheckCircle />}
            bgColor="green"
          />
          <KPICard 
            title="Pending Reviews" 
            value={pendingReviews} 
            subtitle="Proof of Work submissions"
            icon={<Clock />}
            bgColor="yellow"
          />
          <KPICard 
            title="Active Employees" 
            value={activeEmployees} 
            subtitle="Currently on payroll"
            icon={<CheckSquare />}
            bgColor="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Middle Left: Activity Feed (60%) */}
          <div className="lg:col-span-2 space-y-6">
            <ActivityFeed activities={activities.slice(0, 8)} title="Recent Activities" />
            
            {/* Team Announcements */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Team Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                  <h4 className="font-semibold text-blue-900">Welcome to the New Executive Portal</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    We've upgraded our internal operations platform! You can now manage attendance, approve proof of work submissions, and track team performance natively.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Right: Quick Actions & Meetings (40%) */}
          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button 
                  onClick={() => router.push('/attendance')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700"
                >
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500"/> Mark Attendance</span>
                  <span>→</span>
                </button>
                <button 
                  onClick={() => router.push('/proof-of-work')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700"
                >
                  <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Submit Proof of Work</span>
                  <span>→</span>
                </button>
                <button 
                  onClick={() => router.push('/work-allocation')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700"
                >
                  <span className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-purple-500"/> Create Task</span>
                  <span>→</span>
                </button>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMeetings.length > 0 ? upcomingMeetings.map(meeting => (
                    <div key={meeting.id || (meeting as any)._id} className="flex items-start gap-3">
                      <div className="bg-slate-100 p-2 rounded-md border border-slate-200">
                        <Calendar className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{meeting.title}</p>
                        <p className="text-xs text-slate-500">{meeting.date} at {meeting.time}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-4">No upcoming meetings scheduled</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
