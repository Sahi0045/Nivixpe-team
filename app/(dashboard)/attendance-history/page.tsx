'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User as UserIcon, 
  TrendingUp, 
  Filter, 
  Download, 
  Timer, 
  Briefcase, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  History, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

import { useAuth } from '@/app/providers';
import { 
  supabaseDb, 
  AttendanceRecord, 
  AttendanceCorrectionRequest, 
  TeamMember, 
  getUserAttendanceSummary 
} from '@/lib/supabase-db';
import { canAssignTasks, canViewTeamTasks } from '@/lib/rbac';
import { normalizeName, normalizeEmail } from '@/lib/utils';
import { PageFilterBar } from '@/components/page-filter-bar';
import { toast } from 'sonner';

type ActiveTab = 'matrix' | 'employee-summary' | 'corrections' | 'my-attendance';
type DateFilterMode = 'this-month' | 'today' | 'this-week' | 'prev-month' | 'custom';

// UI Helpers for World-Class Design
function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-indigo-600 text-white shadow-indigo-200',
    'bg-emerald-600 text-white shadow-emerald-200',
    'bg-purple-600 text-white shadow-purple-200',
    'bg-blue-600 text-white shadow-blue-200',
    'bg-amber-600 text-white shadow-amber-200',
    'bg-rose-600 text-white shadow-rose-200',
    'bg-teal-600 text-white shadow-teal-200',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getRoleBadgeStyle(role?: string) {
  if (!role) return 'bg-slate-100 text-slate-700 border-slate-200';
  const r = role.toLowerCase();
  if (r.includes('ceo') || r.includes('cto') || r.includes('coo') || r.includes('cso') || r.includes('cmo')) {
    return 'bg-purple-50 text-purple-900 border-purple-200/90 font-bold';
  }
  if (r.includes('developer') || r.includes('tech')) {
    return 'bg-emerald-50 text-emerald-900 border-emerald-200/90 font-semibold';
  }
  if (r.includes('product') || r.includes('manager')) {
    return 'bg-blue-50 text-blue-900 border-blue-200/90 font-semibold';
  }
  if (r.includes('designer')) {
    return 'bg-pink-50 text-pink-900 border-pink-200/90 font-semibold';
  }
  if (r.includes('legal')) {
    return 'bg-amber-50 text-amber-900 border-amber-200/90 font-semibold';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getTeamBadgeStyle(team?: string) {
  if (!team) return 'bg-slate-100 text-slate-600 border-slate-200';
  const t = team.toLowerCase();
  if (t.includes('business')) return 'bg-blue-50/80 text-blue-800 border-blue-200/80';
  if (t.includes('technical')) return 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80';
  if (t.includes('design')) return 'bg-pink-50/80 text-pink-800 border-pink-200/80';
  if (t.includes('legal')) return 'bg-purple-50/80 text-purple-800 border-purple-200/80';
  if (t.includes('hr')) return 'bg-orange-50/80 text-orange-800 border-orange-200/80';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [allCorrections, setAllCorrections] = useState<AttendanceCorrectionRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('matrix');
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [filterRole, setFilterRole] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Date Range Filter States
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals / Drawers
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceRecord | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    date: '',
    requestedLogin: '09:30 AM',
    requestedLogout: '06:15 PM',
    reason: '',
    attachmentUrl: '',
  });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCorrId, setSelectedCorrId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Cell Detail Drawer State
  const [inspectDetail, setInspectDetail] = useState<{
    member: TeamMember | { name: string; email: string; role?: string; team?: string };
    dateStr: string;
    record?: AttendanceRecord;
    correction?: AttendanceCorrectionRequest;
  } | null>(null);

  const canManageTeam = useMemo(() => {
    return user?.isSuperAdmin || user?.role === 'CTO' || user?.role === 'COO' || canAssignTasks(user);
  }, [user]);

  const hiddenMembers = ['Abhiram', 'Rudra Sahu', 'nivixpe'];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [att, corr, mem] = await Promise.all([
        supabaseDb.getAttendanceRecords(),
        supabaseDb.getAttendanceCorrectionRequests(),
        supabaseDb.getTeamMembers(),
      ]);
      setAllAttendance(att);
      setAllCorrections(corr);
      setTeamMembers(mem.filter((m) => !hiddenMembers.includes(m.name)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = supabaseDb.subscribeToChanges('attendance_records', loadData);
    return () => unsub();
  }, []);

  // Set default view tab based on role
  useEffect(() => {
    if (user && !canManageTeam) {
      setActiveTab('my-attendance');
    }
  }, [user, canManageTeam]);

  // Compute Active Date Range Start & End
  const activeDateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (dateFilterMode === 'today') {
      return { start: todayStr, end: todayStr };
    }

    if (dateFilterMode === 'this-week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
    }

    if (dateFilterMode === 'this-month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      return { start, end };
    }

    if (dateFilterMode === 'prev-month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      return { start, end };
    }

    if (dateFilterMode === 'custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }

    // Default to current month
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start, end };
  }, [dateFilterMode, customStartDate, customEndDate]);

  // Generate Date Objects for Columns in Matrix
  const dateColumns = useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayNum: number;
      dayName: string;
      monthName: string;
      isWeekend: boolean;
    }> = [];

    const current = new Date(activeDateRange.start);
    const last = new Date(activeDateRange.end);

    let count = 0;
    while (current <= last && count < 35) {
      const dateStr = current.toISOString().split('T')[0];
      const dayNum = current.getDate();
      const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = current.toLocaleDateString('en-US', { month: 'short' });
      const isWeekend = current.getDay() === 0;


      list.push({ dateStr, dayNum, dayName, monthName, isWeekend });
      current.setDate(current.getDate() + 1);
      count++;
    }

    return list;
  }, [activeDateRange]);

  // Authorized Members List
  const authorizedMembers = useMemo(() => {
    return teamMembers.filter((m) => canViewTeamTasks(user, m.name, teamMembers));
  }, [teamMembers, user]);

  // Filtered Team Members for Matrix Rows
  const matrixRowsMembers = useMemo(() => {
    return authorizedMembers.filter((m) => {
      if (filterRole !== 'all' && m.role !== filterRole) return false;
      if (filterTeam !== 'all' && m.team !== filterTeam && !m.additionalTeams?.includes(filterTeam)) return false;
      if (filterPerson !== 'all' && normalizeName(m.name) !== normalizeName(filterPerson)) return false;
      return true;
    });
  }, [authorizedMembers, filterRole, filterTeam, filterPerson]);

  // High-Impact Executive KPI Cards Metrics
  const executiveKpiMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const todayCheckedInCount = matrixRowsMembers.filter((member) => {
      const rec = allAttendance.find(
        (r) =>
          r.date === todayStr &&
          (normalizeEmail(r.email) === normalizeEmail(member.email) || normalizeName(r.name || '') === normalizeName(member.name))
      );
      return rec && (rec.status === 'present' || rec.status === 'late' || rec.status === 'halfDay');
    }).length;

    let totalWorkingSlots = 0;
    let attendedSlots = 0;
    let totalWorkMins = 0;

    matrixRowsMembers.forEach((member) => {
      dateColumns.forEach((col) => {
        if (col.isWeekend) return;
        totalWorkingSlots++;

        const rec = allAttendance.find(
          (r) =>
            r.date === col.dateStr &&
            (normalizeEmail(r.email) === normalizeEmail(member.email) || normalizeName(r.name || '') === normalizeName(member.name))
        );

        if (rec) {
          if (rec.status === 'present' || rec.status === 'late') attendedSlots++;
          else if (rec.status === 'halfDay') attendedSlots += 0.5;

          if (rec.workHours && rec.workHours > 0) {
            totalWorkMins += rec.workHours;
          }
        }
      });
    });

    const complianceRate = totalWorkingSlots > 0 ? Math.round((attendedSlots / Math.max(1, totalWorkingSlots)) * 100) : 100;
    const totalWorkingDaysCount = Math.max(1, attendedSlots);
    const avgWorkMins = totalWorkingDaysCount > 0 ? Math.round(totalWorkMins / totalWorkingDaysCount) : 0;
    const avgHours = Math.floor(avgWorkMins / 60);
    const avgMins = avgWorkMins % 60;

    const pendingCorrectionsCount = allCorrections.filter((c) => c.status === 'pending').length;

    return {
      activeTeamSize: matrixRowsMembers.length,
      todayCheckedInCount,
      complianceRate,
      formattedAvgHours: `${avgHours}h ${avgMins}m`,
      pendingCorrectionsCount,
    };
  }, [matrixRowsMembers, dateColumns, allAttendance, allCorrections]);


  // Per-Employee Aggregate Breakdown Summary
  const employeeSummaryRows = useMemo(() => {
    return matrixRowsMembers.map((member) => {
      let present = 0;
      let late = 0;
      let leave = 0;
      let absent = 0;
      let totalMins = 0;

      dateColumns.forEach((col) => {
        if (col.isWeekend) return;
        const rec = allAttendance.find(
          (r) =>
            r.date === col.dateStr &&
            (normalizeEmail(r.email) === normalizeEmail(member.email) || normalizeName(r.name || '') === normalizeName(member.name))
        );

        if (rec) {
          if (rec.status === 'present') present++;
          else if (rec.status === 'late') late++;
          else if (rec.status === 'halfDay') present += 0.5;
          else if (rec.status === 'onLeave') leave++;
          else if (rec.status === 'absent') absent++;

          if (rec.workHours && rec.workHours > 0) {
            totalMins += rec.workHours;
          }
        }
      });

      const totalDays = Math.max(1, present + late + leave);
      const avgMins = Math.round(totalMins / totalDays);
      const avgH = Math.floor(avgMins / 60);
      const avgM = avgMins % 60;

      return {
        member,
        present,
        late,
        leave,
        absent,
        totalMins,
        formattedAvg: `${avgH}h ${avgM}m`,
      };
    });
  }, [matrixRowsMembers, dateColumns, allAttendance]);

  // Format minutes display
  const formatMinsToDisplay = (mins?: number) => {
    if (!mins || mins <= 0) return '0h 0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Cell Details Click Handler
  const handleCellClick = (member: TeamMember, dateStr: string) => {
    const rec = allAttendance.find(
      (r) =>
        r.date === dateStr &&
        (normalizeEmail(r.email) === normalizeEmail(member.email) || normalizeName(r.name || '') === normalizeName(member.name))
    );

    const corr = allCorrections.find(
      (c) =>
        c.date === dateStr &&
        (normalizeEmail(c.employeeEmail) === normalizeEmail(member.email) || normalizeName(c.employeeName) === normalizeName(member.name))
    );

    setInspectDetail({ member, dateStr, record: rec, correction: corr });
  };

  // Open correction modal for selected record
  const handleOpenCorrection = (record?: AttendanceRecord) => {
    if (record) {
      setSelectedRecordForCorrection(record);
      setCorrectionForm({
        date: record.date,
        requestedLogin: record.loginTime || '09:30 AM',
        requestedLogout: record.logoutTime || '06:15 PM',
        reason: '',
        attachmentUrl: '',
      });
    } else {
      setSelectedRecordForCorrection(null);
      setCorrectionForm({
        date: new Date().toISOString().split('T')[0],
        requestedLogin: '09:30 AM',
        requestedLogout: '06:15 PM',
        reason: '',
        attachmentUrl: '',
      });
    }
    setShowCorrectionModal(true);
  };

  // Submit Attendance Correction
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!correctionForm.date) {
      toast.error('Please select a date.');
      return;
    }
    if (!correctionForm.reason.trim()) {
      toast.error('Please state the reason for your correction request.');
      return;
    }

    try {
      await supabaseDb.createAttendanceCorrectionRequest({
        attendanceId: selectedRecordForCorrection?.id,
        employeeName: user.name,
        employeeEmail: user.email,
        date: correctionForm.date,
        currentLogin: selectedRecordForCorrection?.loginTime,
        currentLogout: selectedRecordForCorrection?.logoutTime,
        requestedLogin: correctionForm.requestedLogin,
        requestedLogout: correctionForm.requestedLogout,
        reason: correctionForm.reason.trim(),
        attachmentUrl: correctionForm.attachmentUrl.trim() || undefined,
      });

      toast.success('Attendance correction request submitted for manager review!');
      setShowCorrectionModal(false);
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit correction request.');
    }
  };

  // Manager Approve Correction
  const handleApproveCorrection = async (id: string) => {
    if (!user || !canManageTeam) return;
    try {
      await supabaseDb.reviewAttendanceCorrectionRequest(id, 'approved', user.name);
      toast.success('Correction request approved and attendance record updated!');
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve correction request.');
    }
  };

  // Manager Reject Correction
  const handleConfirmRejectCorrection = async () => {
    if (!selectedCorrId || !user) return;
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    try {
      await supabaseDb.reviewAttendanceCorrectionRequest(selectedCorrId, 'rejected', user.name, rejectReason.trim());
      toast.success('Correction request rejected.');
      setShowRejectModal(false);
      setSelectedCorrId(null);
      setRejectReason('');
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject correction request.');
    }
  };

  // Export Matrix CSV
  const handleExportMatrixCSV = () => {
    if (matrixRowsMembers.length === 0 || dateColumns.length === 0) {
      toast.error('No matrix data available to export.');
      return;
    }

    const dateHeaders = dateColumns.map((c) => `${c.dateStr} (${c.dayName})`);
    const headers = ['Employee Name', 'Email', 'Role', 'Team', ...dateHeaders];

    const rows = matrixRowsMembers.map((member) => {
      const rowCells = dateColumns.map((col) => {
        const rec = allAttendance.find(
          (r) =>
            r.date === col.dateStr &&
            (normalizeEmail(r.email) === normalizeEmail(member.email) || normalizeName(r.name || '') === normalizeName(member.name))
        );
        if (rec) {
          const login = rec.loginTime || 'No checkin';
          const hours = formatMinsToDisplay(rec.workHours);
          return `"${rec.status.toUpperCase()} (${login} - ${hours})"`;
        }
        if (col.isWeekend) return '"WEEKEND"';
        return '"—"';
      });

      return [`"${member.name}"`, member.email, `"${member.role}"`, `"${member.team}"`, ...rowCells];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Matrix_${activeDateRange.start}_to_${activeDateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance matrix CSV exported successfully!');
  };

  // Employee personal attendance history list
  const myAttendanceRecords = useMemo(() => {
    if (!user) return [];
    const normUser = normalizeName(user.name);
    const normEmail = normalizeEmail(user.email);
    return allAttendance.filter((r) => {
      const isOwner = normalizeEmail(r.email) === normEmail || normalizeName(r.name || '') === normUser;
      const inRange = r.date >= activeDateRange.start && r.date <= activeDateRange.end;
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return isOwner && inRange && matchStatus;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [allAttendance, user, activeDateRange, filterStatus]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 min-h-screen">
      <Header
        title="Attendance Matrix & Organization Oversight"
        subtitle="Date-wise employee attendance matrix, verified check-in/out records, working hours, and audit tracking"
      />

      <div className="p-6 space-y-6 max-w-[1550px] mx-auto">
        {/* PREMIUM HERO BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-indigo-400" />
              Official Attendance Record Center

            </h2>
            <p className="text-sm text-slate-300 font-medium max-w-2xl">
              Real-time date-wise attendance grid. Track daily check-in times, working hours, approved leaves, and audit logs.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleOpenCorrection()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-xs border border-indigo-400/30"
            >
              <Plus className="h-4 w-4" />
              Request Correction
            </button>
            {canManageTeam && (
              <button
                onClick={handleExportMatrixCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-xs transition-all transform hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" />
                Export Matrix CSV
              </button>
            )}
          </div>
        </div>

        {/* PILL NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          {canManageTeam && (
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                activeTab === 'matrix'
                  ? 'border-indigo-600 text-indigo-950 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="h-4 w-4 text-indigo-600" />
              Date-Wise Team Matrix
            </button>
          )}

          {canManageTeam && (
            <button
              onClick={() => setActiveTab('employee-summary')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                activeTab === 'employee-summary'
                  ? 'border-indigo-600 text-indigo-950 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Employee Summary Aggregates
            </button>
          )}

          <button
            onClick={() => setActiveTab('corrections')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 relative ${
              activeTab === 'corrections'
                ? 'border-indigo-600 text-indigo-950 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="h-4 w-4 text-purple-600" />
            Correction Requests
            {allCorrections.filter((c) => c.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                {allCorrections.filter((c) => c.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('my-attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
              activeTab === 'my-attendance'
                ? 'border-indigo-600 text-indigo-950 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="h-4 w-4 text-blue-600" />
            My Personal Attendance History
          </button>
        </div>

        {/* PROMINENT DATE RANGE & FILTER BAR */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5 mr-1">
                <CalendarIcon className="h-4 w-4 text-indigo-600" /> Date Range:
              </span>
              {(['this-month', 'today', 'this-week', 'prev-month', 'custom'] as DateFilterMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDateFilterMode(mode)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-all capitalize whitespace-nowrap ${
                    dateFilterMode === mode
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mode.replace('-', ' ')}
                </button>
              ))}
            </div>

            {dateFilterMode === 'custom' && (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="date"
                  className="p-1.5 border rounded-lg"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <span className="text-slate-500 font-bold">to</span>
                <input
                  type="date"
                  className="p-1.5 border rounded-lg"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Unified Page Filter Bar */}
          <PageFilterBar
            selectedRole={filterRole}
            onRoleChange={setFilterRole}
            selectedTeam={filterTeam}
            onTeamChange={setFilterTeam}
            selectedPerson={filterPerson}
            onPersonChange={canManageTeam ? setFilterPerson : () => {}}
            showPersonFilter={canManageTeam}
            selectedStatus={filterStatus}
            onStatusChange={setFilterStatus}
            showStatusFilter={true}
            statusOptions={[
              { id: 'present', label: 'Present Only' },
              { id: 'late', label: 'Late Arrivals' },
              { id: 'halfDay', label: 'Half Day' },
              { id: 'onLeave', label: 'On Leave' },
              { id: 'absent', label: 'Absent' },
            ]}
            visibleMembers={authorizedMembers}
            onResetFilters={() => {
              setFilterRole('all');
              setFilterTeam('all');
              setFilterPerson('all');
              setFilterStatus('all');
            }}
          />
        </div>

        {/* TAB 1: MAIN DATE-WISE ATTENDANCE MATRIX */}
        {activeTab === 'matrix' && canManageTeam && (
          <div className="space-y-6">
            {/* HIGH-VALUE EXECUTIVE KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-slate-50 shadow-sm hover:shadow-md transition-all">
                <CardContent className="pt-4 p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Team Scope</p>
                    <p className="text-2xl font-black text-slate-900">{executiveKpiMetrics.activeTeamSize} Members</p>
                    <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {executiveKpiMetrics.todayCheckedInCount} / {executiveKpiMetrics.activeTeamSize} Checked-In Today
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0 shadow-inner">
                    <Users className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 shadow-sm hover:shadow-md transition-all">
                <CardContent className="pt-4 p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Compliance</p>
                    <p className="text-2xl font-black text-emerald-950">{executiveKpiMetrics.complianceRate}%</p>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      executiveKpiMetrics.complianceRate >= 85
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {executiveKpiMetrics.complianceRate >= 85 ? 'High Compliance' : 'Review Scope'}
                    </span>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 shadow-sm hover:shadow-md transition-all">
                <CardContent className="pt-4 p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Daily Hours</p>
                    <p className="text-2xl font-black text-purple-950">{executiveKpiMetrics.formattedAvgHours}</p>
                    <p className="text-[11px] font-medium text-slate-500">Target: 8h 00m per working day</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0 shadow-inner">
                    <Timer className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-100 bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/20 shadow-sm hover:shadow-md transition-all">
                <CardContent className="pt-4 p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Action Items</p>
                    <p className="text-2xl font-black text-amber-950">{executiveKpiMetrics.pendingCorrectionsCount} Requests</p>
                    <button
                      onClick={() => setActiveTab('corrections')}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:underline flex items-center gap-1"
                    >
                      Review Requests &rarr;
                    </button>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* MAIN MATRIX GRID CONTAINER WITH STICKY HEADERS & COLUMNS */}
            <Card className="border-slate-300/80 shadow-xl overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-b p-4">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Date-Wise Employee Attendance Grid ({activeDateRange.start} to {activeDateRange.end})
                </CardTitle>
                <span className="text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  Click any cell for complete check-in/out details
                </span>
              </CardHeader>

              <div className="overflow-x-auto overflow-y-auto max-h-[620px] relative scrollbar-thin scrollbar-thumb-indigo-200">
                <table className="w-full text-xs border-collapse font-sans min-w-[900px]">
                  {/* STICKY HEADER ROW: DATES */}
                  <thead className="sticky top-0 z-20 bg-slate-900 text-white font-bold shadow-md">
                    <tr>
                      <th className="sticky left-0 z-30 bg-slate-900 p-3 text-left border-b border-r border-slate-700/80 min-w-[200px] shadow-[4px_0_12px_rgba(0,0,0,0.15)]">
                        Employee Identity
                      </th>
                      <th className="sticky left-[200px] z-30 bg-slate-900 p-3 text-left border-b border-r border-slate-700/80 min-w-[130px]">
                        Role
                      </th>
                      <th className="sticky left-[330px] z-30 bg-slate-900 p-3 text-left border-b border-r border-slate-700/80 min-w-[110px] shadow-[4px_0_12px_rgba(0,0,0,0.15)]">
                        Team
                      </th>

                      {/* DATE COLUMNS */}
                      {dateColumns.map((col) => (
                        <th
                          key={col.dateStr}
                          className={`p-2.5 text-center border-b border-r border-slate-700/80 min-w-[110px] whitespace-nowrap transition-colors ${
                            col.isWeekend ? 'bg-slate-800/90 text-slate-400' : 'bg-slate-900 text-slate-100'
                          }`}
                        >
                          <div className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
                            {col.monthName} {col.dayNum}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">{col.dayName}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* MATRIX BODY: EMPLOYEE ROWS */}
                  <tbody className="divide-y divide-slate-200/80 bg-white">
                    {matrixRowsMembers.length === 0 ? (
                      <tr>
                        <td colSpan={3 + dateColumns.length} className="p-8 text-center text-slate-500 font-medium">
                          No employees found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      matrixRowsMembers.map((member) => (
                        <tr key={member.id || member.email} className="hover:bg-slate-50/90 transition-colors">
                          {/* Sticky Identity Columns */}
                          <td className="sticky left-0 z-10 bg-white p-3 font-bold text-slate-900 border-r border-slate-200/80 truncate shadow-[4px_0_12px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-sm ${getAvatarColor(member.name)}`}>
                                {getInitials(member.name)}
                              </div>
                              <div className="truncate max-w-[140px]">
                                <p className="truncate font-black text-slate-900 text-xs">{member.name}</p>
                                <p className="text-[10px] text-slate-400 font-normal truncate">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="sticky left-[200px] z-10 bg-slate-50/80 p-3 border-r border-slate-200/80 text-[11px] truncate">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getRoleBadgeStyle(member.role)}`}>
                              {member.role || 'Member'}
                            </span>
                          </td>
                          <td className="sticky left-[330px] z-10 bg-slate-50/80 p-3 border-r border-slate-200/80 text-[11px] truncate shadow-[4px_0_12px_rgba(0,0,0,0.04)]">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getTeamBadgeStyle(member.team)}`}>
                              {member.team || 'General'}
                            </span>
                          </td>

                          {/* ATTENDANCE CELLS PER DATE */}
                          {dateColumns.map((col) => {
                            const rec = allAttendance.find(
                              (r) =>
                                r.date === col.dateStr &&
                                (normalizeEmail(r.email) === normalizeEmail(member.email) || normalizeName(r.name || '') === normalizeName(member.name))
                            );

                            const corr = allCorrections.find(
                              (c) =>
                                c.date === col.dateStr &&
                                (normalizeEmail(c.employeeEmail) === normalizeEmail(member.email) || normalizeName(c.employeeName) === normalizeName(member.name)) &&
                                c.status === 'pending'
                            );

                            return (
                              <td
                                key={col.dateStr}
                                onClick={() => handleCellClick(member, col.dateStr)}
                                className={`p-2 border-r border-slate-200/80 text-center cursor-pointer transition-all hover:bg-indigo-50/80 ${
                                  col.isWeekend ? 'bg-slate-100/40' : ''
                                }`}
                              >
                                {rec ? (
                                  <div className="space-y-1">
                                    <div
                                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block w-full shadow-xs ${
                                        rec.status === 'present'
                                          ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/80'
                                          : rec.status === 'late'
                                          ? 'bg-amber-100/80 text-amber-900 border border-amber-300/80'
                                          : rec.status === 'halfDay'
                                          ? 'bg-orange-100/80 text-orange-900 border border-orange-300/80'
                                          : rec.status === 'onLeave'
                                          ? 'bg-blue-100/80 text-blue-900 border border-blue-300/80'
                                          : rec.status === 'absent'
                                          ? 'bg-rose-100/80 text-rose-900 border border-rose-300/80'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      ● {rec.status}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-900">
                                      {rec.loginTime || '—'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-semibold">
                                      {formatMinsToDisplay(rec.workHours)}
                                    </div>
                                    {corr && (
                                      <div className="text-[9px] font-bold text-amber-800 bg-amber-50 rounded border border-amber-300 px-1 py-0.2 animate-pulse">
                                        ● Correction Pending
                                      </div>
                                    )}
                                  </div>
                                ) : col.isWeekend ? (
                                  <div className="py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Weekend
                                  </div>
                                ) : (
                                  <div className="py-2 text-slate-300 font-bold text-[11px]">—</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: EMPLOYEE SUMMARY AGGREGATES */}
        {activeTab === 'employee-summary' && canManageTeam && (
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Employee Attendance Aggregates ({activeDateRange.start} to {activeDateRange.end})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Team</th>
                      <th className="p-3">Present</th>
                      <th className="p-3">Late</th>
                      <th className="p-3">On Leave</th>
                      <th className="p-3">Absent</th>
                      <th className="p-3">Avg Hours / Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {employeeSummaryRows.map(({ member, present, late, leave, absent, formattedAvg }) => (
                      <tr key={member.id || member.email} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {member.name}
                          <p className="text-[10px] font-normal text-slate-500">{member.email}</p>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{member.role}</td>
                        <td className="p-3 text-slate-600">{member.team}</td>
                        <td className="p-3 font-bold text-green-700">{present}</td>
                        <td className="p-3 font-bold text-amber-700">{late}</td>
                        <td className="p-3 font-bold text-blue-700">{leave}</td>
                        <td className="p-3 font-bold text-rose-700">{absent}</td>
                        <td className="p-3 font-extrabold text-indigo-950">{formattedAvg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: CORRECTION REQUESTS WORKFLOW */}
        {activeTab === 'corrections' && (
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Attendance Correction Requests</CardTitle>
              <button
                onClick={() => handleOpenCorrection()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow"
              >
                <Plus className="h-4 w-4" />
                New Correction Request
              </button>
            </CardHeader>
            <CardContent>
              {allCorrections.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">No attendance correction requests submitted.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Employee</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Current Times</th>
                        <th className="p-3">Requested Correction</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allCorrections.map((corr) => {
                        const isMine = normalizeEmail(corr.employeeEmail) === normalizeEmail(user?.email || '');
                        if (!canManageTeam && !isMine) return null;

                        return (
                          <tr key={corr.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{corr.employeeName}</p>
                              <p className="text-xs text-slate-500">{corr.employeeEmail}</p>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{corr.date}</td>
                            <td className="p-3 text-slate-600">
                              {corr.currentLogin || '—'} / {corr.currentLogout || 'Logout not recorded'}
                            </td>
                            <td className="p-3 font-bold text-indigo-950">
                              {corr.requestedLogin} to {corr.requestedLogout}
                            </td>
                            <td className="p-3 max-w-xs truncate text-slate-700">{corr.reason}</td>
                            <td className="p-3">
                              {corr.status === 'approved' && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Approved</span>
                              )}
                              {corr.status === 'pending' && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-pulse">Pending Review</span>
                              )}
                              {corr.status === 'rejected' && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Rejected</span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              {canManageTeam && corr.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleApproveCorrection(corr.id)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-sm text-xs"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => { setSelectedCorrId(corr.id); setShowRejectModal(true); }}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-sm text-xs"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 4: MY PERSONAL ATTENDANCE HISTORY */}
        {activeTab === 'my-attendance' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">My Verified Attendance Logs</CardTitle>
              <span className="text-xs font-semibold text-slate-500">
                Showing {myAttendanceRecords.length} record(s)
              </span>
            </CardHeader>
            <CardContent>
              {myAttendanceRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <Clock className="h-10 w-10 mx-auto text-slate-300" />
                  <p className="text-sm font-medium">No personal attendance records found for selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Day</th>
                        <th className="p-3">Login Time</th>
                        <th className="p-3">Logout Time</th>
                        <th className="p-3">Working Hours</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {myAttendanceRecords.map((req) => {
                        const dateObj = new Date(req.date);
                        const dayName = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                        return (
                          <tr key={req.id || `${req.date}-${req.email}`} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-900">{req.date}</td>
                            <td className="p-3 text-slate-600">{dayName}</td>
                            <td className="p-3 font-medium text-emerald-950">
                              {req.loginTime || <span className="text-slate-400">—</span>}
                            </td>
                            <td className="p-3 font-medium text-slate-900">
                              {req.logoutTime ? (
                                req.logoutTime
                              ) : req.loginTime ? (
                                <span className="text-amber-700 font-semibold italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Logout not recorded
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              {formatMinsToDisplay(req.workHours)}
                            </td>
                            <td className="p-3 font-bold uppercase">{req.status}</td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => handleOpenCorrection(req)}
                                className="text-indigo-700 hover:text-indigo-900 font-semibold hover:underline text-xs"
                              >
                                Request Correction
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* DRAWER 1: CELL ATTENDANCE DETAILS DRAWER */}
      {inspectDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-200 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3 bg-slate-900 text-white rounded-t-xl">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                Attendance Details: {inspectDetail.dateStr}
              </CardTitle>
              <button onClick={() => setInspectDetail(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border rounded-xl space-y-2 text-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Employee:</span>
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${getAvatarColor(inspectDetail.member.name)}`}>
                      {getInitials(inspectDetail.member.name)}
                    </div>
                    <span className="font-bold">{inspectDetail.member.name}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Role & Team:</span>
                  <span className="font-medium">{inspectDetail.member.role || 'Member'} ({inspectDetail.member.team || 'General'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Expected Check-In:</span>
                  <span>09:30 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Actual Check-In:</span>
                  <span className="font-bold text-emerald-950">{inspectDetail.record?.loginTime || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Actual Check-Out:</span>
                  <span className="font-bold text-slate-900">
                    {inspectDetail.record?.logoutTime ? (
                      inspectDetail.record.logoutTime
                    ) : inspectDetail.record?.loginTime ? (
                      <span className="text-amber-700 font-semibold italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Logout not recorded</span>
                    ) : (
                      'Not recorded'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Working Hours:</span>
                  <span className="font-black text-indigo-900">{formatMinsToDisplay(inspectDetail.record?.workHours)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-slate-500">Final Status:</span>
                  <span className="font-black uppercase text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    ● {inspectDetail.record?.status || 'Unrecorded'}
                  </span>
                </div>
              </div>

              {inspectDetail.correction && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <p className="font-bold text-amber-950">Correction Pending Review</p>
                  <p className="text-[11px]">Requested: {inspectDetail.correction.requestedLogin} to {inspectDetail.correction.requestedLogout}</p>
                  <p className="text-[11px]">Reason: {inspectDetail.correction.reason}</p>
                </div>
              )}

              {/* Audit Log Timeline */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-indigo-600" /> Action Audit Trail
                </h4>
                {inspectDetail.record?.auditLog && inspectDetail.record.auditLog.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-indigo-200 pl-3 ml-1">
                    {inspectDetail.record.auditLog.map((log, i) => (
                      <div key={i} className="text-[11px] space-y-0.5">
                        <p className="font-bold text-slate-900">{log.action} by {log.actor}</p>
                        <p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                        {log.details && <p className="text-slate-600">{log.details}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">No audit trail logged for this cell.</p>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button
                  onClick={() => setInspectDetail(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 rounded-lg text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: ATTENDANCE CORRECTION REQUEST MODAL */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-base font-bold text-indigo-950">Request Attendance Correction</CardTitle>
              <button onClick={() => setShowCorrectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <form onSubmit={handleSubmitCorrection} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 border rounded-lg text-xs"
                    value={correctionForm.date}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Requested Check-In *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09:30 AM"
                      className="w-full p-2.5 border rounded-lg text-xs"
                      value={correctionForm.requestedLogin}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, requestedLogin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Requested Check-Out *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 06:15 PM"
                      className="w-full p-2.5 border rounded-lg text-xs"
                      value={correctionForm.requestedLogout}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, requestedLogout: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason for Correction *</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full p-2.5 border rounded-lg text-xs"
                    placeholder="e.g. Forgot to check out, system network glitch..."
                    value={correctionForm.reason}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCorrectionModal(false)}
                    className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow"
                  >
                    Submit Correction
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 2: REJECT CORRECTION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-base font-bold text-red-950">Reject Correction Request</CardTitle>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <p className="text-slate-700">Please provide a reason for rejecting this attendance correction request:</p>
              <textarea
                rows={3}
                required
                className="w-full p-2.5 border rounded-lg text-xs"
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRejectCorrection}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow"
                >
                  Confirm Rejection
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
