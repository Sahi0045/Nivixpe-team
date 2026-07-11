'use client';

import { Header } from '@/components/header';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/providers';
import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User as UserIcon,
  TrendingUp,
  Filter,
  Download,
  Search,
  Timer,
  Briefcase,
  Users,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { format, parse, differenceInMinutes } from 'date-fns';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ─── helpers ────────────────────────────────────────────── */
const fmt = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

const calcWorkMins = (login: string, logout?: string, stored?: number) => {
  if (stored !== undefined && stored > 0) return stored;
  if (!logout) return 0;
  try {
    const s = parse(login, 'HH:mm', new Date());
    const e = parse(logout, 'HH:mm', new Date());
    return Math.max(0, differenceInMinutes(e, s));
  } catch {
    return 0;
  }
};

const ROLE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9'];

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedPersonEmail, setSelectedPersonEmail] = useState('');

  /* ── Live queries ── */
  const allHistory = useQuery(api.attendanceRecords.getAllHistory) || [];
  const rawMembers = useQuery(api.teamMembers.getAll) || [];

  /* ── Deduplicate members ── */
  const teamMembers = useMemo(() => {
    const seen = new Set<string>();
    return rawMembers.filter(m => { if (seen.has(m.email)) return false; seen.add(m.email); return true; });
  }, [rawMembers]);

  /* ── Enrich history with member data ── */
  const historyWithRoles = useMemo(() =>
    allHistory.map(r => {
      const m = teamMembers.find(tm => tm.email === r.email);
      return { ...r, role: m?.role || 'Unknown', team: m?.team || 'Other', name: m?.name || r.email.split('@')[0] };
    }),
    [allHistory, teamMembers]
  );

  /* ── Roles list ── */
  const roles = useMemo(() => {
    const unique = Array.from(new Set(teamMembers.map(m => m.role)));
    return ['All Roles', ...unique];
  }, [teamMembers]);

  /* ── Role-wise stats for chart ── */
  const roleStats = useMemo(() => {
    const stats: Record<string, { totalMins: number; count: number; presentCount: number }> = {};
    historyWithRoles.forEach(r => {
      if (!stats[r.role]) stats[r.role] = { totalMins: 0, count: 0, presentCount: 0 };
      stats[r.role].totalMins += calcWorkMins(r.loginTime || '00:00', r.logoutTime, r.workHours);
      stats[r.role].count += 1;
      if (r.status === 'present') stats[r.role].presentCount += 1;
    });
    return Object.entries(stats).map(([role, d]) => ({
      role,
      avgHours: d.count > 0 ? +(d.totalMins / d.count / 60).toFixed(1) : 0,
      attendanceRate: d.count > 0 ? Math.round((d.presentCount / d.count) * 100) : 0,
      count: d.count,
    }));
  }, [historyWithRoles]);

  /* ── Filtered history (permissions respected) ── */
  const filteredHistory = useMemo(() => {
    const canSeeAll = user?.isSuperAdmin || ['COO', 'CTO', 'CSO', 'CMO'].includes(user?.role || '');
    return historyWithRoles.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = selectedRole === 'All Roles' || r.role === selectedRole;
      const canAccess = r.email === user?.email || canSeeAll;
      return matchSearch && matchRole && canAccess;
    });
  }, [historyWithRoles, searchTerm, selectedRole, user]);

  /* ── Dedup by date+email ── */
  const uniqueHistory = useMemo(() => {
    const seen = new Set<string>();
    return filteredHistory.filter(r => {
      const k = `${r.date}-${r.email}`;
      if (seen.has(k)) return false; seen.add(k); return true;
    });
  }, [filteredHistory]);

  /* ── Individual stats ── */
  const targetEmail = selectedPersonEmail || user?.email || '';
  const personHistory = historyWithRoles.filter(r => r.email === targetEmail).slice(0, 14).reverse();
  const personStats = useMemo(() => {
    const h = historyWithRoles.filter(r => r.email === targetEmail);
    const totalMins = h.reduce((a, r) => a + calcWorkMins(r.loginTime || '00:00', r.logoutTime, r.workHours), 0);
    const present = h.filter(r => r.status === 'present').length;
    const insufficient = h.filter(r => {
      const m = calcWorkMins(r.loginTime || '00:00', r.logoutTime, r.workHours);
      return m > 0 && m < 240;
    }).length;
    return {
      totalHours: fmt(totalMins),
      avgHours: h.length ? fmt(Math.round(totalMins / h.length)) : '0h 0m',
      insufficientDays: insufficient,
      attendanceRate: Math.min(100, Math.round((present / Math.max(1, h.length)) * 100)),
      totalDays: h.length,
    };
  }, [historyWithRoles, targetEmail]);

  const chartData = personHistory.map(r => ({
    date: format(new Date(r.date), 'MMM dd'),
    hours: +(calcWorkMins(r.loginTime || '00:00', r.logoutTime, r.workHours) / 60).toFixed(1),
  }));

  /* ── CSV Export ── */
  const handleExport = () => {
    if (!uniqueHistory.length) return;
    const rows = [
      ['Date', 'Name', 'Email', 'Role', 'Team', 'Status', 'Login', 'Logout', 'Work Hours'],
      ...uniqueHistory.map(r => [
        r.date, r.name, r.email, r.role, r.team, r.status,
        r.loginTime || '-', r.logoutTime || '-',
        fmt(calcWorkMins(r.loginTime || '00:00', r.logoutTime, r.workHours)),
      ]),
    ];
    const csv = rows.map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ── Aggregate quick stats ── */
  const totalRecords = uniqueHistory.length;
  const presentRecords = uniqueHistory.filter(r => r.status === 'present').length;
  const avgHoursAll = totalRecords > 0
    ? (uniqueHistory.reduce((a, r) => a + calcWorkMins(r.loginTime || '00:00', r.logoutTime, r.workHours), 0) / totalRecords / 60).toFixed(1)
    : '0';

  /* ── status badge ── */
  const statusBadge = (status: string, mins: number, hasLogout: boolean) => {
    if (status === 'present') {
      if (!hasLogout) return <span className="hist-badge hist-badge-active">Active</span>;
      return mins < 240
        ? <span className="hist-badge hist-badge-warn">Present ⚠️</span>
        : <span className="hist-badge hist-badge-ok">Present ✓</span>;
    }
    if (status === 'onLeave') return <span className="hist-badge hist-badge-leave">On Leave</span>;
    return <span className="hist-badge hist-badge-absent">Absent</span>;
  };

  return (
    <>
      <style>{`
        .hist-badge {
          display:inline-flex; align-items:center;
          padding:3px 10px; border-radius:9999px;
          font-size:11px; font-weight:700; letter-spacing:.04em;
        }
        .hist-badge-active { background:#d1fae5; color:#065f46; }
        .hist-badge-ok     { background:#ede9fe; color:#5b21b6; }
        .hist-badge-warn   { background:#fff7ed; color:#9a3412; }
        .hist-badge-leave  { background:#dbeafe; color:#1e40af; }
        .hist-badge-absent { background:#fee2e2; color:#991b1b; }
        .hist-stat {
          background:#fff; border:1px solid #f1f5f9; border-radius:16px;
          padding:18px 22px; display:flex; align-items:center; gap:14px;
          box-shadow:0 1px 3px rgba(0,0,0,.05);
        }
        .hist-icon {
          width:46px; height:46px; border-radius:14px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .hist-table th {
          padding:13px 18px; font-size:11px; font-weight:700;
          letter-spacing:.08em; text-transform:uppercase;
          color:#94a3b8; background:#f8fafc; border-bottom:1px solid #f1f5f9;
        }
        .hist-table td { padding:14px 18px; font-size:13.5px; border-bottom:1px solid #f8fafc; }
        .hist-table tbody tr:hover td { background:#f8fafc; }
        .hist-table tbody tr:last-child td { border-bottom:none; }
        .hist-hours-bar { height:4px; background:#e2e8f0; border-radius:9999px; margin-top:5px; overflow:hidden; }
        .hist-hours-fill { height:100%; border-radius:9999px; transition:width .5s ease; }
        .hist-gauge { position:relative; display:flex; flex-direction:column; align-items:center; }
        .person-card {
          background:linear-gradient(135deg,#1e1b4b,#312e81);
          border-radius:20px; padding:22px 24px; color:#fff;
        }
      `}</style>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Header title="Attendance Analytics" subtitle="Role-wise & historical work-hour tracking" />

        <div className="p-6 space-y-6 max-w-7xl mx-auto">

          {/* ══ QUICK INSIGHT CARDS ══════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Records', value: totalRecords, sub: 'in view', Icon: Calendar, iconCls: 'bg-indigo-100 text-indigo-600' },
              { label: 'Present Days', value: presentRecords, sub: 'logged in', Icon: CheckCircle2, iconCls: 'bg-emerald-100 text-emerald-600' },
              { label: 'Avg Work Day', value: `${avgHoursAll}h`, sub: 'per session', Icon: Timer, iconCls: 'bg-amber-100 text-amber-600' },
              { label: 'Active Roles', value: roles.length - 1, sub: 'unique roles', Icon: Briefcase, iconCls: 'bg-purple-100 text-purple-600' },
            ].map(({ label, value, sub, Icon, iconCls }) => (
              <div key={label} className="hist-stat">
                <div className={`hist-icon ${iconCls}`}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xl font-black text-slate-900">{value}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
                  <p className="text-[11px] text-slate-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ══ ROLE CHART + PERSONAL ANALYTICS ════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Role chart */}
            <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">Role-wise Avg. Hours</h3>
              </div>
              <div className="p-4 h-[280px]">
                {roleStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleStats} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="role" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}h`} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.08)', fontSize: 12 }}
                        formatter={(v: any) => [`${v}h`, 'Avg Hours']}
                      />
                      <Bar dataKey="avgHours" radius={[6, 6, 0, 0]} barSize={28}>
                        {roleStats.map((_, i) => (
                          <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300">
                    <p className="font-medium">No data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personal analytics panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Selector */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Filter className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Filters & Analytics</h3>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Role</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Member</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={selectedPersonEmail}
                    onChange={e => setSelectedPersonEmail(e.target.value)}
                  >
                    <option value="">Myself ({user?.name})</option>
                    {teamMembers.filter(m => m.email !== user?.email).map(m => (
                      <option key={m._id} value={m.email}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Person card */}
              <div className="person-card">
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-3">
                  {selectedPersonEmail
                    ? teamMembers.find(m => m.email === selectedPersonEmail)?.name
                    : user?.name}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Total Hours', value: personStats.totalHours },
                    { label: 'Avg/Day', value: personStats.avgHours },
                    { label: '<4h Days', value: personStats.insufficientDays, alert: personStats.insufficientDays > 0 },
                    { label: 'Days Tracked', value: personStats.totalDays },
                  ].map(({ label, value, alert }) => (
                    <div key={label} className="bg-white/10 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">{label}</p>
                      <p className={cn('text-lg font-black mt-0.5', alert ? 'text-amber-400' : 'text-white')}>{value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-indigo-300">Attendance Consistency</span>
                    <span className="text-white">{personStats.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${personStats.attendanceRate}%`,
                        background: personStats.attendanceRate >= 80 ? '#34d399' : personStats.attendanceRate >= 60 ? '#fbbf24' : '#f87171'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══ PERSONAL WORK HOURS CHART ═══════════════════════════ */}
          {chartData.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">Recent Work-Hour Trend</h3>
                <span className="text-xs text-slate-400 ml-1">(last {chartData.length} sessions)</span>
              </div>
              <div className="p-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}h`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.08)', fontSize: 12 }}
                      formatter={(v: any) => [`${v}h`, 'Hours']}
                    />
                    <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5}
                      fill="url(#areaGrad)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#6366f1' }}
                    />
                    {/* 4h reference line */}
                    <Area type="monotone" dataKey={() => 4} stroke="#ef4444" strokeWidth={1}
                      strokeDasharray="5 4" fill="none" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══ HISTORY TABLE ═══════════════════════════════════════ */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">Attendance Logs</h3>
                <p className="text-xs text-slate-400 mt-0.5">{uniqueHistory.length} records</p>
              </div>
              <div className="flex gap-3 items-center flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search members…"
                    className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20 w-52"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-100"
                >
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full hist-table">
                <thead>
                  <tr>
                    <th className="text-left">Employee</th>
                    <th className="text-left">Department</th>
                    <th className="text-left">Status</th>
                    <th className="text-center">Log Times</th>
                    <th className="text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueHistory.length > 0 ? (
                    uniqueHistory.map(record => {
                      const mins = calcWorkMins(record.loginTime || '00:00', record.logoutTime, record.workHours);
                      const isSufficient = mins >= 240;
                      const hasLogout = !!record.logoutTime;
                      return (
                        <tr key={record._id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {record.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{record.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{record.date}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="text-sm font-medium text-slate-700">{record.role}</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{record.team}</p>
                          </td>
                          <td>{statusBadge(record.status, mins, hasLogout)}</td>
                          <td>
                            <div className="flex items-center justify-center gap-2 text-sm font-mono">
                              <span className="text-slate-700">{record.loginTime || '—'}</span>
                              <span className="text-slate-300">→</span>
                              <span className="text-slate-700">{record.logoutTime || (record.status === 'present' ? 'Active' : '—')}</span>
                            </div>
                          </td>
                          <td className="text-right">
                            {record.status === 'present' && hasLogout ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className={cn(
                                  'text-sm font-bold px-3 py-1 rounded-lg border transition-all',
                                  isSufficient
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                )}>
                                  {fmt(mins)}
                                </span>
                                <div className="hist-hours-bar w-20">
                                  <div className="hist-hours-fill" style={{
                                    width: `${Math.min(100, (mins / 240) * 100)}%`,
                                    background: isSufficient ? '#6366f1' : '#f59e0b'
                                  }} />
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Users className="h-12 w-12 text-slate-200" />
                          <p className="font-semibold">No matching attendance records found.</p>
                          <p className="text-xs">Try adjusting filters or search term.</p>
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
