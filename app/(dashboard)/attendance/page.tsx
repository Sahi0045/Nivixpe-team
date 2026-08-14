'use client';

import { Header } from '@/components/header';
import { useAuth } from '@/app/providers';
import { useState, useEffect, useCallback } from 'react';
import { supabaseDb, AttendanceRecord, LeaveRequest, TeamMember, AttendanceAuditLog } from '@/lib/supabase-db';
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
  Coffee,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn, normalizeEmail } from '@/lib/utils';
import {
  calculateSessionMinutes,
  formatMinutes,
  getCurrentTimeString,
  formatTimeDisplay,
} from '@/lib/attendance-utils';
import { isNightShiftWorker, getAttendanceShiftNote, NIGHT_SHIFT_START } from '@/lib/attendance-shift';
import { toast } from 'sonner';

const pad = (n: number) => String(n).padStart(2, '0');

export default function AttendancePage() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0); // re-render every second
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAuditLog, setShowAuditLog] = useState(false);

  const d = new Date();
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [activeLeavesToday, setActiveLeavesToday] = useState<LeaveRequest[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const records = await supabaseDb.getAttendanceRecords();
    const leaves = await supabaseDb.getLeaveRequests();
    const members = await supabaseDb.getTeamMembers();

    // Normalize emails
    const normalizedRecords = records.map(r => ({
      ...r,
      email: normalizeEmail(r.email)
    }));
    const normalizedLeaves = leaves.map(l => ({
      ...l,
      employeeEmail: normalizeEmail(l.employeeEmail)
    }));
    const normalizedMembers = members.map(m => ({
      ...m,
      email: normalizeEmail(m.email)
    }));

    setTodayAttendance(normalizedRecords.filter((a) => a.date === today));
    setActiveLeavesToday(normalizedLeaves.filter((l) => l.status === 'approved' && l.startDate <= today && l.endDate >= today));
    setAllMembers(normalizedMembers as any);
  };

  useEffect(() => {
    loadData();
    const unsubAtt = supabaseDb.subscribeToChanges('attendance_records', loadData);
    const unsubLeave = supabaseDb.subscribeToChanges('leave_requests', loadData);
    return () => {
      unsubAtt();
      unsubLeave();
    };
  }, [today]);

  const userEmailNorm = user?.email ? normalizeEmail(user.email) : '';
  const myAttendance = todayAttendance.find(a => normalizeEmail(a.email) === userEmailNorm);

  /* ── Tick every second for live timers ── */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  /* ── Live work & break stats ── */
  const getLiveWorkStats = useCallback(() => {
    if (!myAttendance) {
      return { sessionMins: 0, totalMins: 0, isActive: false, isPaused: false, breakMins: 0 };
    }

    const accumulated = myAttendance.workHours || 0;
    const activeStart = myAttendance.currentSessionStart;
    const isPaused = Boolean(myAttendance.isPaused);

    if (activeStart && !isPaused) {
      const session = calculateSessionMinutes(activeStart);
      return { sessionMins: session, totalMins: accumulated + session, isActive: true, isPaused: false, breakMins: 0 };
    }

    if (isPaused && myAttendance.logoutTime) {
      const breakMins = calculateSessionMinutes(myAttendance.logoutTime);
      return { sessionMins: 0, totalMins: accumulated, isActive: false, isPaused: true, breakMins };
    }

    return { sessionMins: 0, totalMins: accumulated, isActive: false, isPaused: false, breakMins: 0 };
  }, [myAttendance, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const { sessionMins, totalMins, isActive, isPaused, breakMins } = getLiveWorkStats();

  /* ── Summary counts ── */
  const activeMembers = allMembers.filter(m => m.status === 'active');
  const activeEmails = new Set(activeMembers.map(m => m.email.toLowerCase()));

  const extraRecords = todayAttendance
    .filter(a => !activeEmails.has(a.email.toLowerCase()))
    .map(a => ({
      ...a,
      name: allMembers.find(m => m.email.toLowerCase() === a.email.toLowerCase())?.name || a.email,
    }));

  const allActiveAttendance = activeMembers.map(member => {
    const existing = todayAttendance.find(a => a.email.toLowerCase() === member.email.toLowerCase());
    if (existing) {
      return {
        ...existing,
        name: member.name,
      };
    }
    
    const leave = activeLeavesToday.find(l => l.employeeEmail.toLowerCase() === member.email.toLowerCase());
    if (leave) {
      return {
        email: member.email,
        date: today,
        status: 'onLeave' as const,
        loginTime: undefined as string | undefined,
        logoutTime: undefined as string | undefined,
        approval: leave.approvedBy || 'Approved',
        name: member.name,
      };
    }
    
    return {
      email: member.email,
      date: today,
      status: 'absent' as const,
      loginTime: undefined as string | undefined,
      logoutTime: undefined as string | undefined,
      name: member.name,
    };
  });

  const combinedAttendance = [...allActiveAttendance, ...extraRecords];

  const presentCount = combinedAttendance.filter(a => a.status === 'present').length;
  const onLeaveCount = combinedAttendance.filter(a => a.status === 'onLeave').length;
  const absentCount = combinedAttendance.filter(a => a.status === 'absent').length;
  const belowMinCount = combinedAttendance.filter(
    a => a.status === 'present' && a.workHours !== undefined && a.workHours < 240
  ).length;

  /* ── Handlers for Start, Pause, Resume, Logout ── */
  const handleResumeOrStartWork = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await supabaseDb.resumeAttendance(today, user.email);
      await loadData();
      const isResume = Boolean(myAttendance);
      toast.success(isResume ? 'Work session resumed! Work hours tracking active.' : 'Logged in successfully! Welcome to work.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start/resume work session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTakeBreak = async () => {
    if (!user || !myAttendance || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newTotal = await supabaseDb.pauseAttendance(today, user.email, 'Break');
      await loadData();
      toast.success(`Break started! Total work recorded so far: ${formatMinutes(newTotal)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to pause work session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteDay = async () => {
    if (!user || !myAttendance || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const finalTotal = await supabaseDb.logoutAttendance(today, user.email);
      await loadData();
      toast.success(`Logged out for today! Total work duration: ${formatMinutes(finalTotal)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Filtered table data ── */
  const filteredAttendance = combinedAttendance.filter(r => {
    const memberName = r.name || allMembers.find(m => m.email === r.email)?.name || r.email;
    const matchSearch = r.email.toLowerCase().includes(searchTerm.toLowerCase()) || memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── Live minutes for table row ── */
  const liveMinutes = (record: any) => {
    let mins = record.workHours || 0;
    if (record.currentSessionStart && !record.isPaused) {
      mins += calculateSessionMinutes(record.currentSessionStart);
    }
    return mins;
  };

  /* ── CSV export ── */
  const exportToCSV = () => {
    const rows = [
      ['Email', 'Status', 'Login', 'Logout', 'Work Hours'],
      ...filteredAttendance.map(r => {
        const m = liveMinutes(r);
        return [r.email, r.status, r.loginTime || '', r.logoutTime || '', formatMinutes(m)];
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
    if (record.isPaused) return <span className="att-badge att-badge-paused">⏸ On Break</span>;
    if (record.currentSessionStart && !record.isPaused) return <span className="att-badge att-badge-active">● Active</span>;
    if (record.logoutTime) return <span className="att-badge att-badge-done">✓ Logged Out</span>;
    return <span className="att-badge att-badge-done">Present</span>;
  };

  return (
    <>
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
                      Total Work: <span className="text-white font-mono">{formatMinutes(totalMins)}</span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                    </div>

                    {isActive && (
                      <div className="att-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold">
                        <Zap className="h-4 w-4 text-emerald-300" />
                        Current Session: <span className="text-emerald-300 font-mono">{formatMinutes(sessionMins)}</span>
                      </div>
                    )}

                    {isPaused && (
                      <div className="att-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold border-amber-500/30 bg-amber-500/10">
                        <Coffee className="h-4 w-4 text-amber-300" />
                        On Break for: <span className="text-amber-300 font-mono">{formatMinutes(breakMins)}</span>
                      </div>
                    )}

                    {myAttendance.loginTime && (
                      <div className="att-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
                        <LogIn className="h-4 w-4 text-slate-300" />
                        In: <span className="font-bold font-mono">{formatTimeDisplay(myAttendance.loginTime)}</span>
                      </div>
                    )}

                    {myAttendance.logoutTime && isPaused && (
                      <div className="att-glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
                        <PauseCircle className="h-4 w-4 text-amber-300" />
                        Paused at: <span className="font-bold font-mono">{formatTimeDisplay(myAttendance.logoutTime)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {user && (
                  <div className="flex flex-wrap gap-3 items-center">
                    {!myAttendance ? (
                      <button
                        onClick={handleResumeOrStartWork}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <PlayCircle className="h-5 w-5" /> Start Work / Log In
                      </button>
                    ) : isActive ? (
                      <>
                        <button
                          onClick={handleTakeBreak}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-900/40 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Coffee className="h-5 w-5" /> Take Break / Pause
                        </button>
                        <button
                          onClick={handleCompleteDay}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-900/40 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <LogOut className="h-5 w-5" /> Complete Day / Log Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleResumeOrStartWork}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <PlayCircle className="h-5 w-5" /> Resume Work
                        </button>
                        <button
                          onClick={handleCompleteDay}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          <LogOut className="h-5 w-5" /> Complete Day / Log Out
                        </button>
                      </>
                    )}

                    {myAttendance?.auditLog && myAttendance.auditLog.length > 0 && (
                      <button
                        onClick={() => setShowAuditLog(!showAuditLog)}
                        className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-900/40 hover:bg-indigo-800/50 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors ml-auto"
                      >
                        <History className="h-3.5 w-3.5" />
                        {showAuditLog ? 'Hide Timeline' : 'Break Log'}
                        {showAuditLog ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
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

            {/* Audit Log Timeline Drawer */}
            {showAuditLog && myAttendance?.auditLog && (
              <div className="mt-6 pt-5 border-t border-indigo-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-200">
                  <History className="h-4 w-4 text-indigo-400" />
                  Today's Session & Break History
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {myAttendance.auditLog.map((log, idx) => (
                    <div key={log.id || `${log.timestamp}-${idx}`} className="bg-slate-900/60 border border-indigo-500/20 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between items-center text-indigo-300">
                        <span className="font-semibold capitalize text-white flex items-center gap-1.5">
                          {log.action === 'paused' ? <Coffee className="h-3.5 w-3.5 text-amber-400" /> :
                           log.action === 'resumed' ? <Zap className="h-3.5 w-3.5 text-emerald-400" /> :
                           <Clock className="h-3.5 w-3.5 text-indigo-400" />}
                          {log.action}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11.5px] leading-relaxed">{log.note || log.details || 'Session event'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  <li>Click <strong>Start Work</strong> when you check in</li>
                  <li>Click <strong>Take Break</strong> during pauses/lunches</li>
                  <li>Click <strong>Resume Work</strong> when back</li>
                </ul>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Click <strong>Complete Day</strong> at final logout</li>
                  <li>Minimum 4 hours active work per day required</li>
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
              { label: '< 4h Goal', value: belowMinCount, sub: 'Below 4 hours', color: belowMinCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100', iconBg: 'bg-orange-100 text-orange-600', Icon: Timer },
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
                    <th className="text-left">Logout / Break</th>
                    <th className="text-right">Work Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map(record => {
                      const mins = liveMinutes(record);
                      const isSufficient = mins >= 240;
                      const isActiveRow = (record as any).currentSessionStart && !(record as any).isPaused;
                      const isPausedRow = Boolean((record as any).isPaused);
                      const memberName = record.name || allMembers.find(m => m.email === record.email)?.name || record.email;

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
                              {formatTimeDisplay(record.loginTime)}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-slate-700 text-sm">
                              {isActiveRow ? (
                                <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> ● Active
                                </span>
                              ) : isPausedRow ? (
                                <span className="text-amber-600 font-semibold text-xs flex items-center gap-1">
                                  <Coffee className="h-3 w-3" /> On Break ({formatTimeDisplay(record.logoutTime)})
                                </span>
                              ) : record.logoutTime ? (
                                formatTimeDisplay(record.logoutTime)
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </span>
                          </td>
                          <td className="text-right">
                            {record.status === 'present' ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className={`att-badge ${isSufficient ? 'att-badge-ok' : 'att-badge-warn'}`}>
                                  {formatMinutes(mins)} {!isSufficient && '⚠️'}
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
