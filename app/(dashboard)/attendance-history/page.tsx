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
  Search, 
  Timer, 
  Briefcase, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Plus, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  Check, 
  History, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { 
  supabaseDb, 
  AttendanceRecord, 
  AttendanceCorrectionRequest, 
  TeamMember, 
  getUserAttendanceSummary 
} from '@/lib/supabase-db';
import { canAssignTasks } from '@/lib/rbac';
import { normalizeName, normalizeEmail } from '@/lib/utils';
import { toast } from 'sonner';

type ActiveTab = 'my-attendance' | 'calendar' | 'corrections' | 'team-overview';
type DateFilterMode = 'this-month' | 'today' | 'this-week' | 'prev-month' | 'custom';

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [allCorrections, setAllCorrections] = useState<AttendanceCorrectionRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-attendance');
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [dateFilter, setDateFilter] = useState<DateFilterMode>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Modals
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

  // Day Inspection Drawer
  const [inspectRecord, setInspectRecord] = useState<AttendanceRecord | null>(null);

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

  // Compute date range for filtering
  const activeDateRange = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      return { start: todayStr, end: todayStr };
    }

    if (dateFilter === 'this-week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
    }

    if (dateFilter === 'this-month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      return { start, end };
    }

    if (dateFilter === 'prev-month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      return { start, end };
    }

    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }

    return { start: '2020-01-01', end: '2099-12-31' };
  }, [dateFilter, customStartDate, customEndDate]);

  // Employee's personal attendance records
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

  // Employee summary stats
  const userSummary = useMemo(() => {
    if (!user) return { totalWorkingDays: 0, present: 0, late: 0, halfDay: 0, leave: 0, absent: 0, formattedHours: '0h 0m', attendanceRate: 0 };
    return getUserAttendanceSummary(user.email || user.name, allAttendance, activeDateRange.start, activeDateRange.end);
  }, [user, allAttendance, activeDateRange]);

  // Open correction modal for a record
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

  // Format mins to hours/mins
  const formatMinsToDisplay = (mins?: number) => {
    if (!mins || mins <= 0) return '0h 0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Export Attendance CSV
  const handleExportCSV = () => {
    if (allAttendance.length === 0) {
      toast.error('No attendance records available to export.');
      return;
    }
    const headers = ['Date', 'Employee Name', 'Email', 'Login Time', 'Logout Time', 'Working Mins', 'Status'];
    const rows = allAttendance.map((r) => [
      r.date,
      `"${r.name || r.email}"`,
      r.email,
      r.loginTime || 'Not recorded',
      r.logoutTime || 'Not recorded',
      r.workHours || 0,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance report exported successfully!');
  };

  // Status Badge UI
  const getStatusBadge = (status: AttendanceRecord['status'], loginTime?: string, logoutTime?: string) => {
    if (status === 'present') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          Present
        </span>
      );
    }
    if (status === 'late') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          Late Arrival
        </span>
      );
    }
    if (status === 'halfDay') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
          <Timer className="h-3.5 w-3.5 text-orange-600" />
          Half Day
        </span>
      );
    }
    if (status === 'onLeave') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
          On Leave
        </span>
      );
    }
    if (status === 'absent') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
          <XCircle className="h-3.5 w-3.5 text-red-600" />
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        <Info className="h-3.5 w-3.5 text-slate-500" />
        {status}
      </span>
    );
  };

  // Calendar days calculation
  const calendarDaysInMonth = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return { year, month, firstDay, lastDay, days };
  }, [calendarDate]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      <Header
        title="Attendance History & Verification"
        subtitle="Track daily working hours, login/logout records, late arrivals, monthly summary statistics, and correction requests"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Banner & Quick Actions */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <Clock className="h-7 w-7 text-emerald-200" />
              Official Attendance Record Center
            </h2>
            <p className="text-sm text-emerald-100">
              Verified daily attendance logs, working hours, leave integration, and audited correction requests.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleOpenCorrection()}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl shadow transition-all transform hover:-translate-y-0.5 text-xs"
            >
              <Plus className="h-4 w-4 text-emerald-700" />
              Request Correction
            </button>
            {canManageTeam && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow border border-emerald-500 text-xs transition-all"
              >
                <Download className="h-4 w-4" />
                Export Attendance CSV
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('my-attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'my-attendance'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="h-4 w-4" />
            My Attendance History
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'calendar'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Monthly Calendar Grid
          </button>

          <button
            onClick={() => setActiveTab('corrections')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 relative ${
              activeTab === 'corrections'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="h-4 w-4" />
            Correction Requests
            {allCorrections.filter((c) => c.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {allCorrections.filter((c) => c.status === 'pending').length}
              </span>
            )}
          </button>

          {canManageTeam && (
            <button
              onClick={() => setActiveTab('team-overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'team-overview'
                  ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Manager Team Overview
            </button>
          )}
        </div>

        {/* TAB 1: MY ATTENDANCE & SUMMARY */}
        {activeTab === 'my-attendance' && (
          <div className="space-y-6">
            {/* Date Filters Bar */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-slate-500" /> Range:
                  </span>
                  {(['this-month', 'today', 'this-week', 'prev-month', 'custom'] as DateFilterMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDateFilter(mode)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all capitalize whitespace-nowrap ${
                        dateFilter === mode
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {mode.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                {dateFilter === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="p-1.5 border rounded-lg text-xs"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="date"
                      className="p-1.5 border rounded-lg text-xs"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <select
                    className="p-1.5 border rounded-lg bg-slate-50 text-xs font-medium"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="present">Present Only</option>
                    <option value="late">Late Arrivals</option>
                    <option value="halfDay">Half Day</option>
                    <option value="onLeave">On Leave</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Monthly Summary Statistics Cards */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Attendance Summary ({dateFilter.replace('-', ' ').toUpperCase()})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <Card className="border-slate-200 bg-white">
                  <CardContent className="pt-4 p-3 text-center">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Working Days</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">{userSummary.totalWorkingDays}</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/60">
                  <CardContent className="pt-4 p-3 text-center">
                    <p className="text-[10px] font-semibold text-green-700 uppercase">Present</p>
                    <p className="text-xl font-extrabold text-green-950 mt-1">{userSummary.present}</p>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/60">
                  <CardContent className="pt-4 p-3 text-center">
                    <p className="text-[10px] font-semibold text-amber-700 uppercase">Late Arrivals</p>
                    <p className="text-xl font-extrabold text-amber-950 mt-1">{userSummary.late}</p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/60">
                  <CardContent className="pt-4 p-3 text-center">
                    <p className="text-[10px] font-semibold text-orange-700 uppercase">Half Day</p>
                    <p className="text-xl font-extrabold text-orange-950 mt-1">{userSummary.halfDay}</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/60">
                  <CardContent className="pt-4 p-3 text-center">
                    <p className="text-[10px] font-semibold text-blue-700 uppercase">On Leave</p>
                    <p className="text-xl font-extrabold text-blue-950 mt-1">{userSummary.leave}</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/60">
                  <CardContent className="pt-4 p-3 text-center">
                    <p className="text-[10px] font-semibold text-red-700 uppercase">Absent</p>
                    <p className="text-xl font-extrabold text-red-950 mt-1">{userSummary.absent}</p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/60">
                  <CardContent className="pt-4 p-3 text-center">
                    <p className="text-[10px] font-semibold text-purple-700 uppercase">Total Hours</p>
                    <p className="text-lg font-extrabold text-purple-950 mt-1">{userSummary.formattedHours}</p>
                  </CardContent>
                </Card>

                <Card className="border-emerald-300 bg-emerald-100/70">
                  <CardContent className="pt-4 p-3 text-center">
                    <p className="text-[10px] font-semibold text-emerald-800 uppercase">Attendance %</p>
                    <p className="text-xl font-extrabold text-emerald-950 mt-1">{userSummary.attendanceRate}%</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Attendance History Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">My Verified Attendance History</CardTitle>
                <span className="text-xs font-semibold text-slate-500">
                  Showing {myAttendanceRecords.length} record(s)
                </span>
              </CardHeader>
              <CardContent>
                {myAttendanceRecords.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-3">
                    <Clock className="h-10 w-10 mx-auto text-slate-300" />
                    <p className="text-sm font-medium">No attendance records found for selected filters.</p>
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
                              <td className="p-3">{getStatusBadge(req.status, req.loginTime, req.logoutTime)}</td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => setInspectRecord(req)}
                                  className="text-purple-600 hover:text-purple-800 font-semibold hover:underline text-xs"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => handleOpenCorrection(req)}
                                  className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline text-xs"
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
          </div>
        )}

        {/* TAB 2: MONTHLY CALENDAR GRID */}
        {activeTab === 'calendar' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-emerald-700" />
                Monthly Attendance Grid ({calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
              </CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  className="p-2 border rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Today
                </button>
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  className="p-2 border rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-2 bg-slate-100 text-slate-700 rounded-lg">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 text-xs">
                {/* Empty padding slots before first day */}
                {Array.from({ length: calendarDaysInMonth.firstDay.getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-24 p-2 border rounded-lg bg-slate-50/40 opacity-40" />
                ))}

                {calendarDaysInMonth.days.map((dateObj) => {
                  const dateStr = dateObj.toISOString().split('T')[0];
                  const dayNum = dateObj.getDate();
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                  const record = allAttendance.find(
                    (r) => r.date === dateStr && (normalizeEmail(r.email) === normalizeEmail(user?.email || '') || normalizeName(r.name || '') === normalizeName(user?.name || ''))
                  );

                  return (
                    <div
                      key={dateStr}
                      onClick={() => record && setInspectRecord(record)}
                      className={`h-24 p-2 border rounded-lg flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
                        isWeekend ? 'bg-slate-100/60' : 'bg-white hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{dayNum}</span>
                        {isWeekend && <span className="text-[10px] text-slate-400 font-normal">W-End</span>}
                      </div>

                      {record ? (
                        <div className="space-y-1">
                          <div className={`p-1 rounded text-[10px] font-bold text-center ${
                            record.status === 'present' ? 'bg-green-100 text-green-800 border border-green-300' :
                            record.status === 'late' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            record.status === 'onLeave' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800 border border-red-300' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status.toUpperCase()}
                          </div>
                          {record.workHours && record.workHours > 0 ? (
                            <p className="text-[10px] text-slate-500 text-center font-medium">{formatMinsToDisplay(record.workHours)}</p>
                          ) : null}
                        </div>
                      ) : isWeekend ? (
                        <p className="text-[10px] text-slate-400 text-center">Weekend</p>
                      ) : (
                        <p className="text-[10px] text-slate-300 text-center">No record</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: CORRECTION REQUESTS WORKFLOW */}
        {activeTab === 'corrections' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Attendance Correction Requests List</CardTitle>
                <button
                  onClick={() => handleOpenCorrection()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
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
                          <th className="p-3">Current Login / Logout</th>
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
                              <td className="p-3 font-bold text-emerald-950">
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
          </div>
        )}

        {/* TAB 4: MANAGER TEAM OVERVIEW */}
        {activeTab === 'team-overview' && canManageTeam && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Team Attendance Log & Oversight</CardTitle>
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg">
                <Download className="h-4 w-4" /> Download Report
              </button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Role & Team</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Login</th>
                      <th className="p-3">Logout</th>
                      <th className="p-3">Working Hours</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {allAttendance.map((r, idx) => {
                      const member = teamMembers.find((m) => normalizeEmail(m.email) === normalizeEmail(r.email));
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{member?.name || r.name || r.email}</p>
                            <p className="text-xs text-slate-500">{r.email}</p>
                          </td>
                          <td className="p-3 text-slate-600">{member?.role || 'Team Member'} ({member?.team || 'General'})</td>
                          <td className="p-3 font-semibold text-slate-800">{r.date}</td>
                          <td className="p-3">{r.loginTime || '—'}</td>
                          <td className="p-3">
                            {r.logoutTime ? r.logoutTime : r.loginTime ? <span className="text-amber-700 font-semibold italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Logout not recorded</span> : '—'}
                          </td>
                          <td className="p-3 font-bold text-slate-800">{formatMinsToDisplay(r.workHours)}</td>
                          <td className="p-3">{getStatusBadge(r.status, r.loginTime, r.logoutTime)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* MODAL 1: ATTENDANCE CORRECTION REQUEST MODAL */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-base font-bold text-emerald-950">Request Attendance Correction</CardTitle>
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

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Optional Supporting Link / Proof</label>
                  <input
                    type="url"
                    className="w-full p-2.5 border rounded-lg text-xs"
                    placeholder="https://..."
                    value={correctionForm.attachmentUrl}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, attachmentUrl: e.target.value })}
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
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
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
              <div className="flex justify-end gap-3 pt-2">
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

      {/* MODAL 3: DAY INSPECTION DRAWER */}
      {inspectRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Attendance Details: {inspectRecord.date}
              </CardTitle>
              <button onClick={() => setInspectRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2 text-slate-800">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Employee:</span>
                  <span className="font-bold">{inspectRecord.name || inspectRecord.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Expected Login:</span>
                  <span>{inspectRecord.expectedLogin || '09:30 AM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Actual Check-In:</span>
                  <span className="font-bold text-emerald-950">{inspectRecord.loginTime || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Actual Check-Out:</span>
                  <span className="font-bold text-slate-900">
                    {inspectRecord.logoutTime ? (
                      inspectRecord.logoutTime
                    ) : inspectRecord.loginTime ? (
                      <span className="text-amber-700 font-semibold italic">Logout not recorded</span>
                    ) : (
                      'Not recorded'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Total Working Hours:</span>
                  <span className="font-bold text-purple-900">{formatMinsToDisplay(inspectRecord.workHours)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="font-semibold text-slate-500">Final Status:</span>
                  <div>{getStatusBadge(inspectRecord.status, inspectRecord.loginTime, inspectRecord.logoutTime)}</div>
                </div>
              </div>

              {inspectRecord.status === 'onLeave' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 space-y-2">
                  <p className="font-semibold">Integrated Approved Leave</p>
                  <p className="text-[11px]">This attendance record reflects an approved leave request.</p>
                </div>
              )}

              {/* Audit Log Timeline */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-emerald-600" /> Attendance Action Log
                </h4>
                {inspectRecord.auditLog && inspectRecord.auditLog.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-emerald-200 pl-3 ml-1">
                    {inspectRecord.auditLog.map((log, i) => (
                      <div key={i} className="text-[11px] space-y-0.5">
                        <p className="font-bold text-slate-900">{log.action} by {log.actor}</p>
                        <p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                        {log.details && <p className="text-slate-600">{log.details}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px]">No audit history logged for this date.</p>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setInspectRecord(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-semibold text-slate-800 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
