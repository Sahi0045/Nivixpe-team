'use client';

import { Header } from '@/components/header';
import { useAuth } from '@/app/providers';
import { useState, useEffect, useCallback } from 'react';
import { supabaseDb, AttendanceRecord, LeaveRequest, TeamMember } from '@/lib/supabase-db';
import { TEAM_MEMBERS } from '@/lib/mock-data';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Timer,
  Search,
  Download,
  Filter,
  LogIn,
  LogOut,
  Zap,
  Users,
  ShieldCheck,
  Moon,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNightShiftWorker, getAttendanceShiftNote, NIGHT_SHIFT_START } from '@/lib/attendance-shift';
import { toast } from 'sonner';

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;
const pad = (n: number) => String(n).padStart(2, '0');

export default function AttendancePage() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);          // re-render every second
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const today = new Date().toISOString().split('T')[0];

  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [activeLeavesToday, setActiveLeavesToday] = useState<LeaveRequest[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>(TEAM_MEMBERS as any);

  const loadData = async () => {
    const records = await supabaseDb.getAttendanceRecords();
    const leaves = await supabaseDb.getLeaveRequests();
    const members = await supabaseDb.getTeamMembers();
    setTodayAttendance(records.filter((a) => a.date === today));
    setActiveLeavesToday(leaves.filter((l) => l.status === 'approved' && l.startDate <= today && l.endDate >= today));
    setAllMembers(members as any);
  };

  useEffect(() => {
    loadData();
  }, [today]);

  const myAttendance = todayAttendance.find(a => a.email === user?.email);

  /* ── Tick every second ── */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  /* ── Live work stats ── */
  const getLiveWorkStats = useCallback(() => {
    if (!myAttendance) return { sessionMins: 0, totalMins: 0, isActive: false };
    const accumulated = myAttendance.workHours || 0;
    const activeStart = (myAttendance as any).currentSessionStart;
    if (activeStart && !(myAttendance as any).isPaused) {
      const [startH, startM] = activeStart.split(':').map(Number);
      const n = new Date();
      let start = startH * 60 + startM;
      let curr = n.getHours() * 60 + n.getMinutes();
      if (curr < start) curr += 1440;
      const session = Math.max(0, curr - start);
      return { sessionMins: session, totalMins: accumulated + session, isActive: true };
    }
    return { sessionMins: 0, totalMins: accumulated, isActive: false };
  }, [myAttendance, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const { sessionMins, totalMins, isActive } = getLiveWorkStats();

  /* ── Summary counts ── */
  const activeMembers = allMembers.filter(m => m.status === 'active');
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const onLeaveCount = activeLeavesToday.length;
  const markedEmails = new Set(todayAttendance.map(a => a.email));
  const leaveEmails = new Set(activeLeavesToday.map(l => l.employeeEmail));
  const absentCount = activeMembers.filter(m => !markedEmails.has(m.email) && !leaveEmails.has(m.email)).length;
  const belowMinCount = todayAttendance.filter(
    a => a.status === 'present' && a.workHours !== undefined && a.workHours < 240
  ).length;

  /* ── Handlers ── */
  const handleMarkLogin = async () => {
    if (!user) return;
    const loginTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
    try {
      await supabaseDb.markAttendance({ date: today, email: user.email, loginTime, status: 'present' });
      await loadData();
      toast.success(`Logged in at ${loginTime}. Minimum 4h required.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log in.');
    }
  };

  const handleMarkLogout = async () => {
    if (!user || !myAttendance) return;
    const logoutTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
    try {
      await supabaseDb.markAttendance({ ...myAttendance, logoutTime });
      await loadData();
      toast.success(`Logged out at ${logoutTime}.`);
    } catch {
      toast.error('Failed to log out.');
    }
  };

  /* ── Filtered table data ── */
  const filteredAttendance = todayAttendance.filter(r => {
    const memberName = TEAM_MEMBERS.find(m => m.email === r.email)?.name || r.email;
    const matchSearch = r.email.toLowerCase().includes(searchTerm.toLowerCase()) || memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── Live minutes for table row ── */
  const liveMinutes = (record: any) => {
    let mins = record.workHours || 0;
    if (record.currentSessionStart && !record.isPaused) {
      const [sh, sm] = record.currentSessionStart.split(':').map(Number);
      const n = new Date();
      let s = sh * 60 + sm, c = n.getHours() * 60 + n.getMinutes();
      if (c < s) c += 1440;
      mins += Math.max(0, c - s);
    }
    return mins;
  };

  /* ── CSV export ── */
  const exportToCSV = () => {
    const rows = [
      ['Email', 'Status', 'Login', 'Logout', 'Work Hours'],
      ...filteredAttendance.map(r => {
        const m = liveMinutes(r);
        return [r.email, r.status, r.loginTime || '', r.logoutTime || '', fmt(m)];
      }),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `attendance-${today}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ── Progress ring math ── */
  const GOAL = 240; // 4h in minutes
  const progress = Math.min(1, totalMins / GOAL);
  const RADIUS = 54;
  const CIRC = 2 * Math.PI * RADIUS;
  const dash = progress * CIRC;

  /* ── Status badge helper ── */
  const statusBadge = (record: any) => {
    if (record.status !== 'present') {
      return record.status === 'onLeave'
        ? <span className="att-badge att-badge-leave">On Leave</span>
        : <span className="att-badge att-badge-absent">Absent</span>;
    }
    if (record.isPaused) return <span className="att-badge att-badge-paused">Paused</span>;
    if (!record.logoutTime) return <span className="att-badge att-badge-active">● Active</span>;
    return <span className="att-badge att-badge-done">Done</span>;
  };

  return (
    <>
      {/* ── Inline styles for this page ── */}
      <style>{`
        .att-gradient-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
        }
        .att-glass {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .att-ring-track { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 8; }
        .att-ring-fill  { fill: none; stroke-width: 8; stroke-linecap: round;
                          transition: stroke-dashoffset 0.6s ease; }
        .att-badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 9999px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
        }
        .att-badge-active  { background:#dcfce7; color:#15803d; animation: pulse 2s infinite; }
        .att-badge-paused  { background:#fef9c3; color:#854d0e; }
        .att-badge-done    { background:#ede9fe; color:#5b21b6; }
        .att-badge-leave   { background:#dbeafe; color:#1d4ed8; }
        .att-badge-absent  { background:#fee2e2; color:#b91c1c; }
        .att-badge-ok      { background:#d1fae5; color:#065f46; }
        .att-badge-warn    { background:#fff7ed; color:#9a3412; }
        .att-stat-card {
          border-radius: 16px; padding: 20px 24px;
          display: flex; align-items: center; gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .att-icon-circle {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .att-table th {
          padding: 14px 20px; font-size: 11px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase;
          color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #f1f5f9;
        }
        .att-table td { padding: 14px 20px; font-size: 13.5px; border-bottom: 1px solid #f8fafc; }
        .att-table tr:hover td { background: #f8fafc; }
        .att-table tr:last-child td { border-bottom: none; }
        .att-hours-bar { height: 4px; border-radius: 9999px; background: #e2e8f0; overflow: hidden; margin-top: 6px; }
        .att-hours-bar-fill { height: 100%; border-radius: 9999px; transition: width .6s ease; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .att-spin { animation: spin-slow 4s linear infinite; }
      `}</style>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Header title="Attendance" subtitle="Daily check-in & live work-hour tracking" />

        <div className="p-6 space-y-6 max-w-7xl mx-auto">

          {/* ══ HERO CARD ══════════════════════════════════════════ */}
          <div className="att-gradient-hero rounded-2xl p-6 md:p-8 text-white shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">

              {/* Left: Date / time / controls */}
              <div className="flex-1 space-y-5">
                <div>
                  <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </h2>
                  <p className="text-indigo-300 text-sm mt-1 font-mono tracking-widest">{currentTime}</p>
                </div>

                {/* Work-time pills */}
                {myAttendance && (
                  <div className="flex flex-wrap gap-3">
                    <div className="att-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold">
                      <Timer className="h-4 w-4 text-indigo-300" />
                      Total: <span className="text-white">{fmt(totalMins)}</span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                    </div>
                    {isActive && (
                      <div className="att-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold">
                        <Zap className="h-4 w-4 text-emerald-300" />
                        Session: <span className="text-emerald-300">{fmt(sessionMins)}</span>
                      </div>
                    )}
                    {myAttendance.loginTime && (
                      <div className="att-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
                        <LogIn className="h-4 w-4 text-slate-300" />
                        In: <span className="font-bold">{myAttendance.loginTime}</span>
                      </div>
                    )}
                    {myAttendance.logoutTime && (
                      <div className="att-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
                        <LogOut className="h-4 w-4 text-slate-300" />
                        Out: <span className="font-bold">{myAttendance.logoutTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {user && (
                  <div className="flex flex-wrap gap-3">
                    {!myAttendance ? (
                      <button
                        onClick={handleMarkLogin}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
                      >
                        <PlayCircle className="h-5 w-5" /> Start Work / Log In
                      </button>
                    ) : isActive ? (
                      <button
                        onClick={handleMarkLogout}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-900/40 transition-all active:scale-95"
                      >
                        <PauseCircle className="h-5 w-5" /> Pause / Log Out
                      </button>
                    ) : (
                      <button
                        onClick={handleMarkLogin}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
                      >
                        <PlayCircle className="h-5 w-5" /> Resume / Log In
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: progress ring */}
              {myAttendance && (
                <div className="att-glass rounded-2xl p-6 flex flex-col items-center gap-3 min-w-[170px]">
                  <svg width="128" height="128" viewBox="0 0 128 128">
                    <circle className="att-ring-track" cx="64" cy="64" r={RADIUS} />
                    <circle
                      className="att-ring-fill"
                      cx="64" cy="64" r={RADIUS}
                      stroke={progress >= 1 ? '#34d399' : progress >= 0.5 ? '#818cf8' : '#f59e0b'}
                      strokeDasharray={`${dash} ${CIRC}`}
                      strokeDashoffset={0}
                      transform="rotate(-90 64 64)"
                    />
                    <text x="64" y="58" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{Math.floor(totalMins / 60)}h</text>
                    <text x="64" y="76" textAnchor="middle" fill="#94a3b8" fontSize="12">{totalMins % 60}m</text>
                  </svg>
                  <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">of 4h goal</p>
                  <div className="att-hours-bar w-full" style={{width:'100%'}}>
                    <div
                      className="att-hours-bar-fill"
                      style={{
                        width: `${Math.min(100, progress * 100)}%`,
                        background: progress >= 1 ? '#34d399' : progress >= 0.5 ? '#818cf8' : '#f59e0b'
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">{Math.round(progress * 100)}% complete</p>
                </div>
              )}
            </div>
          </div>

          {/* ══ NIGHT SHIFT NOTICE ══════════════════════════════════ */}
          {user && isNightShiftWorker(user) && (
            <div className="flex gap-4 items-start bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
              <div className="att-icon-circle bg-indigo-100 text-indigo-600 flex-shrink-0">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-indigo-900">Night Shift — {user.role}</p>
                <p className="text-sm text-indigo-700 mt-1">Primary shift starts at {NIGHT_SHIFT_START} (9:00 PM).</p>
                <p className="text-sm text-indigo-600 mt-0.5">{getAttendanceShiftNote(user)}</p>
              </div>
            </div>
          )}

          {/* ══ MANDATORY RULES ══════════════════════════════════════ */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4 items-start">
            <div className="att-icon-circle bg-red-100 text-red-600 flex-shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900 text-sm mb-2">MANDATORY: All employees (including Leads) MUST work minimum 4 hours per day.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-red-800">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Mark <strong>LOGIN</strong> when you start work</li>
                  <li>Mark <strong>LOGOUT</strong> when you finish work</li>
                  <li>System auto-calculates work hours</li>
                </ul>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Present</strong> if logged in, <strong>Absent</strong> if not</li>
                  <li>Approved leaves are synced automatically</li>
                  <li>You can only mark attendance for <strong>TODAY</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* ══ ACTIVE LEAVES TODAY ══════════════════════════════════ */}
          {activeLeavesToday.length > 0 && (
            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Active Leaves Today</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeLeavesToday.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeLeavesToday.map(leave => (
                  <div key={leave.id || (leave as any)._id} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {leave.employeeName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-blue-900 text-sm truncate">{leave.employeeName}</p>
                      <p className="text-[11px] text-blue-600 truncate">{leave.type} • {leave.startDate} → {leave.endDate}</p>
                    </div>
                    <span className="ml-auto flex-shrink-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">Leave</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ SUMMARY STAT CARDS ══════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: presentCount, sub: 'Logged in today', color: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-600', Icon: CheckCircle },
              { label: 'On Leave', value: onLeaveCount, sub: 'Approved leave', color: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-100 text-blue-600', Icon: Calendar },
              { label: 'Absent', value: absentCount, sub: 'Not logged in', color: 'bg-red-50 border-red-100', iconBg: 'bg-red-100 text-red-600', Icon: AlertCircle },
              { label: '< 4h', value: belowMinCount, sub: 'Below minimum', color: belowMinCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100', iconBg: 'bg-orange-100 text-orange-600', Icon: Timer },
            ].map(({ label, value, sub, color, iconBg, Icon }) => (
              <div key={label} className={`att-stat-card border bg-white ${color} shadow-sm`}>
                <div className={`att-icon-circle ${iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{value}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ══ TODAY'S ATTENDANCE TABLE ════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Table header bar */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">Today's Attendance</h3>
                <p className="text-xs text-slate-400 mt-0.5">{today} · {todayAttendance.length} records</p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search email…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 w-48"
                  />
                </div>
                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="onLeave">On Leave</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                {/* Export */}
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full att-table">
                <thead>
                  <tr>
                    <th className="text-left">Employee</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Login</th>
                    <th className="text-left">Logout</th>
                    <th className="text-right">Work Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map(record => {
                      const mins = liveMinutes(record);
                      const isSufficient = mins >= 240;
                      const isActiveRow = (record as any).currentSessionStart && !(record as any).isPaused;
                      const memberName = TEAM_MEMBERS.find(m => m.email === record.email)?.name || record.email;
                      return (
                        <tr key={record.email + record.date}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                                {memberName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-700 truncate max-w-[180px]">{memberName}</span>
                            </div>
                          </td>
                          <td>{statusBadge(record)}</td>
                          <td>
                            <span className="font-mono text-slate-700 text-sm">
                              {record.loginTime || <span className="text-slate-300">—</span>}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-slate-700 text-sm">
                              {record.logoutTime
                                ? record.logoutTime
                                : isActiveRow
                                ? <span className="text-emerald-500 font-semibold text-xs">● Active</span>
                                : <span className="text-slate-300">—</span>
                              }
                            </span>
                          </td>
                          <td className="text-right">
                            {record.status === 'present' ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className={`att-badge ${isSufficient ? 'att-badge-ok' : 'att-badge-warn'}`}>
                                  {fmt(mins)} {!isSufficient && '⚠️'}
                                </span>
                                <div className="att-hours-bar w-20">
                                  <div
                                    className="att-hours-bar-fill"
                                    style={{
                                      width: `${Math.min(100, (mins / GOAL) * 100)}%`,
                                      background: isSufficient ? '#10b981' : '#f59e0b'
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Users className="h-10 w-10 text-slate-200" />
                          <p className="font-medium">No attendance records for today yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
