'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Calendar as CalendarIcon, 
  FileText, 
  User as UserIcon, 
  Filter, 
  History, 
  ShieldCheck, 
  X, 
  Upload, 
  Info,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { 
  supabaseDb, 
  LeaveRequest, 
  calculateWorkingDays, 
  getUserLeaveBalance 
} from '@/lib/supabase-db';
import { canApproveLeave } from '@/lib/rbac';
import { normalizeName, normalizeEmail } from '@/lib/utils';
import { PageFilterBar } from '@/components/page-filter-bar';
import { toast } from 'sonner';


type ActiveTab = 'dashboard' | 'my-history' | 'approvals' | 'calendar';

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReqId, setSelectedRejectReqId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Audit Trail Drawer State
  const [selectedAuditReq, setSelectedAuditReq] = useState<LeaveRequest | null>(null);

  // Request Form State
  const [formData, setFormData] = useState({
    type: 'casual' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    reason: '',
    attachmentUrl: '',
    comment: '',
  });
  const [formError, setFormError] = useState('');

  // Manager Approval Filters
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [teamMembersList, setTeamMembersList] = useState<any[]>([]);

  useEffect(() => {
    supabaseDb.getTeamMembers().then(setTeamMembersList);
  }, []);


  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const userCanApprove = useMemo(() => canApproveLeave(user), [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await supabaseDb.getLeaveRequests();
      setAllLeaveRequests(res);
    } catch (e) {
      console.error('Error loading leave requests:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = supabaseDb.subscribeToChanges('leave_requests', loadData);
    return () => unsub();
  }, []);

  const hiddenMembers = ['Abhiram', 'Rudra Sahu', 'nivixpe'];

  // User-specific leave requests for history & balance
  const myLeaveRequests = useMemo(() => {
    if (!user) return [];
    const normUser = normalizeName(user.name);
    const normEmail = normalizeEmail(user.email);
    return allLeaveRequests.filter(
      (l) => normalizeEmail(l.employeeEmail) === normEmail || normalizeName(l.employeeName) === normUser
    );
  }, [allLeaveRequests, user]);

  // Leave balance calculation for logged in user
  const userBalance = useMemo(() => {
    if (!user) return { allocated: { annual: 20, sick: 10, casual: 7, total: 37 }, used: 0, pending: 0, approvedUpcoming: 0, remaining: 37 };
    return getUserLeaveBalance(user.email || user.name, allLeaveRequests);
  }, [user, allLeaveRequests]);

  // Working days live preview in form
  const calculatedFormDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    return calculateWorkingDays(formData.startDate, formData.endDate);
  }, [formData.startDate, formData.endDate]);

  // Manager Dashboard requests filtered
  const filteredApprovalRequests = useMemo(() => {
    return allLeaveRequests.filter((req) => {
      if (hiddenMembers.includes(req.employeeName)) return false;
      const member = teamMembersList.find((m) => normalizeName(m.name) === normalizeName(req.employeeName));

      if (filterRole !== 'all' && member?.role !== filterRole) return false;
      if (filterTeam !== 'all' && member?.team !== filterTeam && !member?.additionalTeams?.includes(filterTeam)) return false;
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;
      if (filterPerson !== 'all' && normalizeName(req.employeeName) !== normalizeName(filterPerson)) return false;
      if (filterType !== 'all' && req.type !== filterType) return false;
      return true;
    });
  }, [allLeaveRequests, filterRole, filterTeam, filterStatus, filterPerson, filterType, teamMembersList]);


  const pendingApprovalCount = useMemo(() => {
    return allLeaveRequests.filter((r) => r.status === 'pending' && !hiddenMembers.includes(r.employeeName)).length;
  }, [allLeaveRequests]);

  // Handle Submit Leave Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!user) return;

    if (!formData.startDate || !formData.endDate) {
      setFormError('Please select both start date and end date.');
      return;
    }

    if (formData.endDate < formData.startDate) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    if (calculatedFormDays <= 0) {
      setFormError('Selected date range contains no working days (e.g. weekends only).');
      return;
    }

    if (!formData.reason.trim()) {
      setFormError('Please enter a valid reason for your leave request.');
      return;
    }

    try {
      await supabaseDb.createLeaveRequest({
        employeeName: user.name,
        employeeEmail: user.email,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: calculatedFormDays,
        type: formData.type,
        reason: formData.reason.trim(),
        attachmentUrl: formData.attachmentUrl.trim() || undefined,
        comment: formData.comment.trim() || undefined,
        status: 'pending',
      });

      toast.success('Leave request submitted successfully!');
      setShowRequestModal(false);
      setFormData({
        type: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        attachmentUrl: '',
        comment: '',
      });
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit leave request.');
      toast.error(err?.message || 'Failed to submit leave request.');
    }
  };

  // Handle Approve
  const handleApprove = async (id: string) => {
    if (!user || !userCanApprove) return;
    try {
      await supabaseDb.updateLeaveStatus(id, 'approved', user.name);
      toast.success('Leave request approved successfully.');
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve leave request.');
    }
  };

  // Handle Reject Modal Open
  const openRejectModal = (id: string) => {
    setSelectedRejectReqId(id);
    setRejectReasonInput('');
    setShowRejectModal(true);
  };

  // Confirm Reject with Reason
  const handleConfirmReject = async () => {
    if (!selectedRejectReqId || !user) return;
    if (!rejectReasonInput.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    try {
      await supabaseDb.updateLeaveStatus(selectedRejectReqId, 'rejected', user.name, rejectReasonInput.trim());
      toast.success('Leave request rejected.');
      setShowRejectModal(false);
      setSelectedRejectReqId(null);
      setRejectReasonInput('');
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject leave request.');
    }
  };

  // Handle Cancel Leave
  const handleCancelLeave = async (req: LeaveRequest) => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];

    // Policy check: past leave cannot be cancelled by employee
    if (req.startDate < todayStr && req.status === 'approved') {
      toast.error('Past approved leaves cannot be cancelled.');
      return;
    }

    if (!confirm(`Are you sure you want to cancel your leave request from ${req.startDate} to ${req.endDate}?`)) {
      return;
    }

    try {
      await supabaseDb.cancelLeaveRequest(req.id, user.name);
      toast.success('Leave request cancelled.');
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel leave request.');
    }
  };

  // Format Date for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Get status badge UI
  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
            Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <AlertCircle className="h-3.5 w-3.5 text-gray-500" />
            Cancelled
          </span>
        );
    }
  };

  // Calendar calculations
  const calendarDaysInMonth = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return { year, month, firstDay, lastDay, days };
  }, [currentCalendarDate]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen">
      <Header
        title="Leave Management System"
        subtitle="Submit time-off requests, track leave balances, view team leave calendar, and manage approvals"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Banner Action */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <CalendarIcon className="h-7 w-7 text-purple-200" />
              Official Team Portal Leave Center
            </h2>
            <p className="text-sm text-purple-100">
              Submit official leave requests for manager approval. All leave requests, history, and balances are tracked in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-900 hover:bg-purple-50 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 text-purple-700" />
              Apply For Leave
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="h-4 w-4" />
            Dashboard & Balance
          </button>

          <button
            onClick={() => setActiveTab('my-history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'my-history'
                ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="h-4 w-4" />
            My Leave Requests ({myLeaveRequests.length})
          </button>

          {userCanApprove && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 relative ${
                activeTab === 'approvals'
                  ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Manager Approvals
              {pendingApprovalCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  {pendingApprovalCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'calendar'
                ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Team Leave Calendar
          </button>
        </div>

        {/* TAB 1: DASHBOARD & BALANCE */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Balance Cards */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                My Annual Leave Balance ({new Date().getFullYear()})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="pt-5">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Total Allocated</p>
                    <p className="text-3xl font-extrabold text-purple-950 mt-1">{userBalance.allocated.total} Days</p>
                    <div className="text-xs text-purple-800 mt-2 space-y-0.5">
                      <p>Annual: {userBalance.allocated.annual}d | Sick: {userBalance.allocated.sick}d | Casual: {userBalance.allocated.casual}d</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="pt-5">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Approved & Used</p>
                    <p className="text-3xl font-extrabold text-green-950 mt-1">{userBalance.used} Days</p>
                    <p className="text-xs text-green-700 mt-2">
                      Upcoming Approved: <span className="font-bold">{userBalance.approvedUpcoming} days</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                  <CardContent className="pt-5">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending Review</p>
                    <p className="text-3xl font-extrabold text-amber-950 mt-1">{userBalance.pending} Days</p>
                    <p className="text-xs text-amber-700 mt-2">Awaiting Manager Approval</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="pt-5">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Remaining Balance</p>
                    <p className="text-3xl font-extrabold text-blue-950 mt-1">{userBalance.remaining} Days</p>
                    <p className="text-xs text-blue-700 mt-2">Available for request</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Rules Card */}
            <Card className="border-blue-200 bg-blue-50/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-blue-950 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Official Leave Policy & Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-blue-900 space-y-1.5 leading-relaxed">
                <p>• <strong>Working Days Only:</strong> Saturdays and Sundays are excluded automatically from leave calculations.</p>
                <p>• <strong>Official Communication:</strong> Leave must be requested through this portal. Email notifications will be generated to PMO and Sahith (CEO).</p>
                <p>• <strong>Approval Authority:</strong> CEO (Sahith), CTO (Shubham), CSO (Swaraag), COO (Siddhartha), Legal Head (Kashish), and Product Managers can approve leave.</p>
                <p>• <strong>Cancellation:</strong> Pending and future approved leaves can be cancelled by the employee prior to start date.</p>
              </CardContent>
            </Card>

            {/* Recent Personal Submissions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">My Recent Leave Requests</CardTitle>
                <button
                  onClick={() => setActiveTab('my-history')}
                  className="text-xs font-medium text-purple-700 hover:underline"
                >
                  View Full History →
                </button>
              </CardHeader>
              <CardContent>
                {myLeaveRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No leave requests submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                        <tr>
                          <th className="p-3">Dates</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Days</th>
                          <th className="p-3">Reason</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {myLeaveRequests.slice(0, 5).map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-900">
                              {formatDateDisplay(req.startDate)} – {formatDateDisplay(req.endDate)}
                            </td>
                            <td className="p-3 capitalize font-semibold text-purple-900">{req.type}</td>
                            <td className="p-3 font-bold text-slate-800">{req.days || 1} day(s)</td>
                            <td className="p-3 max-w-xs truncate text-slate-600">{req.reason}</td>
                            <td className="p-3">{getStatusBadge(req.status)}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedAuditReq(req)}
                                className="text-purple-600 hover:text-purple-800 font-medium hover:underline text-xs"
                              >
                                Audit Trail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: MY LEAVE HISTORY */}
        {activeTab === 'my-history' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Complete Personal Leave History</CardTitle>
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Apply For Leave
              </button>
            </CardHeader>
            <CardContent>
              {myLeaveRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <CalendarIcon className="h-10 w-10 mx-auto text-slate-300" />
                  <p className="text-sm font-medium">You have not submitted any leave requests yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="p-3">Applied On</th>
                        <th className="p-3">Date Range</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Working Days</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Status & Notes</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {myLeaveRequests.map((req) => {
                        const canCancel = req.status === 'pending' || (req.status === 'approved' && req.startDate > new Date().toISOString().split('T')[0]);
                        return (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-500">
                              {req.appliedAt ? formatDateDisplay(req.appliedAt.split('T')[0]) : '—'}
                            </td>
                            <td className="p-3 font-semibold text-slate-900">
                              {formatDateDisplay(req.startDate)} – {formatDateDisplay(req.endDate)}
                            </td>
                            <td className="p-3 capitalize font-bold text-purple-900">{req.type}</td>
                            <td className="p-3 font-bold text-slate-800">{req.days || 1} day(s)</td>
                            <td className="p-3 max-w-xs truncate text-slate-700">{req.reason}</td>
                            <td className="p-3 space-y-1">
                              <div>{getStatusBadge(req.status)}</div>
                              {req.status === 'rejected' && req.rejectionReason && (
                                <p className="text-xs text-red-600 font-medium">Reason: {req.rejectionReason}</p>
                              )}
                              {req.status === 'approved' && req.approvedBy && (
                                <p className="text-xs text-green-700">Approved by: {req.approvedBy}</p>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-3">
                              <button
                                onClick={() => setSelectedAuditReq(req)}
                                className="text-purple-600 hover:text-purple-800 font-medium hover:underline text-xs"
                              >
                                Audit Log
                              </button>
                              {canCancel && (
                                <button
                                  onClick={() => handleCancelLeave(req)}
                                  className="text-red-600 hover:text-red-800 font-medium hover:underline text-xs"
                                >
                                  Cancel Request
                                </button>
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

        {/* TAB 3: MANAGER APPROVAL DASHBOARD */}
        {activeTab === 'approvals' && userCanApprove && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <PageFilterBar
              selectedRole={filterRole}
              onRoleChange={setFilterRole}
              selectedTeam={filterTeam}
              onTeamChange={setFilterTeam}
              selectedPerson={filterPerson}
              onPersonChange={setFilterPerson}
              selectedStatus={filterStatus}
              onStatusChange={setFilterStatus}
              showStatusFilter={true}
              statusOptions={[
                { id: 'pending', label: 'Pending Only' },
                { id: 'approved', label: 'Approved Only' },
                { id: 'rejected', label: 'Rejected Only' },
                { id: 'cancelled', label: 'Cancelled Only' },
              ]}
              visibleMembers={teamMembersList.filter(m => !hiddenMembers.includes(m.name))}
              onResetFilters={() => {
                setFilterRole('all');
                setFilterTeam('all');
                setFilterPerson('all');
                setFilterStatus('all');
                setFilterType('all');
              }}
            />


            {/* Approval Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Manager Review & Approval List</CardTitle>
                <span className="text-xs font-semibold text-slate-500">
                  Showing {filteredApprovalRequests.length} request(s)
                </span>
              </CardHeader>
              <CardContent>
                {filteredApprovalRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No leave requests matching current filters.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                        <tr>
                          <th className="p-3">Employee</th>
                          <th className="p-3">Date Range</th>
                          <th className="p-3">Days</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Reason & Details</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Approval Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredApprovalRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{req.employeeName}</p>
                              <p className="text-xs text-slate-500">{req.employeeEmail}</p>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {formatDateDisplay(req.startDate)} – {formatDateDisplay(req.endDate)}
                            </td>
                            <td className="p-3 font-bold text-purple-900">{req.days || 1} day(s)</td>
                            <td className="p-3 capitalize font-bold text-slate-800">{req.type}</td>
                            <td className="p-3 max-w-xs">
                              <p className="text-slate-800 font-medium truncate">{req.reason}</p>
                              {req.attachmentUrl && (
                                <a href={req.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                                  <FileText className="h-3 w-3" /> View Attachment
                                </a>
                              )}
                              {req.rejectionReason && (
                                <p className="text-xs text-red-600 font-semibold mt-1">Rejection: {req.rejectionReason}</p>
                              )}
                            </td>
                            <td className="p-3">{getStatusBadge(req.status)}</td>
                            <td className="p-3 text-right space-x-2">
                              {req.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleApprove(req.id)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded shadow-sm text-xs transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(req.id)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded shadow-sm text-xs transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setSelectedAuditReq(req)}
                                  className="text-purple-600 hover:text-purple-800 font-medium hover:underline text-xs"
                                >
                                  View Audit Trail
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}


        {/* TAB 4: TEAM LEAVE CALENDAR */}
        {activeTab === 'calendar' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
                Team Leave Calendar ({currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
              </CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))}
                  className="p-2 border rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentCalendarDate(new Date())}
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))}
                  className="p-2 border rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="p-2 border text-left min-w-[140px]">Employee</th>
                      {calendarDaysInMonth.days.map((dateObj) => {
                        const dayNum = dateObj.getDate();
                        const isWeekend = dateObj.getDay() === 0;

                        return (
                          <th key={dayNum} className={`p-2 border text-center ${isWeekend ? 'bg-slate-200/70 text-slate-500' : ''}`}>
                            <div>{dayNum}</div>
                            <div className="text-[10px] font-normal">{dateObj.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set(allLeaveRequests.map((r) => r.employeeName)))
                      .filter((name) => !hiddenMembers.includes(name))
                      .map((empName) => (
                        <tr key={empName} className="hover:bg-slate-50">
                          <td className="p-2 border font-bold text-left text-slate-900 bg-white">{empName}</td>
                          {calendarDaysInMonth.days.map((dateObj) => {
                            const dateStr = dateObj.toISOString().split('T')[0];
                            const isWeekend = dateObj.getDay() === 0;


                            const activeLeave = allLeaveRequests.find(
                              (r) =>
                                normalizeName(r.employeeName) === normalizeName(empName) &&
                                (r.status === 'approved' || r.status === 'pending') &&
                                dateStr >= r.startDate &&
                                dateStr <= r.endDate
                            );

                            return (
                              <td key={dateStr} className={`p-1 border text-center ${isWeekend ? 'bg-slate-100/50' : ''}`}>
                                {activeLeave && (
                                  <div
                                    title={`${activeLeave.employeeName} (${activeLeave.type}) - ${activeLeave.status}`}
                                    className={`py-1 rounded text-[10px] font-bold ${
                                      activeLeave.status === 'approved'
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'bg-amber-200 text-amber-950 border border-amber-400'
                                    }`}
                                  >
                                    {activeLeave.status === 'approved' ? 'Leave' : 'Pending'}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* MODAL 1: SUBMIT LEAVE REQUEST */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-lg font-bold text-purple-950">Apply For Time Off</CardTitle>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Leave Type *</label>
                  <select
                    className="w-full p-2.5 border rounded-lg text-xs"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="annual">Annual / Earned Leave</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2.5 border rounded-lg text-xs"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2.5 border rounded-lg text-xs"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {calculatedFormDays > 0 && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-purple-950">
                    <span className="font-semibold">Working Leave Days:</span>
                    <span className="text-sm font-extrabold">{calculatedFormDays} Day(s)</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason *</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full p-2.5 border rounded-lg text-xs"
                    placeholder="Provide a reason for your leave request..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supporting Document / Link (Optional)</label>
                  <input
                    type="url"
                    className="w-full p-2.5 border rounded-lg text-xs"
                    placeholder="https://... or upload link"
                    value={formData.attachmentUrl}
                    onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 border rounded-lg text-slate-700 font-semibold hover:bg-slate-100 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow text-xs"
                  >
                    Submit Leave Request
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 2: REJECT REASON MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-base font-bold text-red-950">Reject Leave Request</CardTitle>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <p className="text-slate-700">Please state the reason for rejecting this leave request:</p>
              <textarea
                rows={3}
                required
                className="w-full p-2.5 border rounded-lg text-xs focus:ring-2 focus:ring-red-500"
                placeholder="Enter rejection reason..."
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow"
                >
                  Confirm Rejection
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 3: AUDIT TRAIL DRAWER */}
      {selectedAuditReq && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Leave Request Audit Trail
              </CardTitle>
              <button onClick={() => setSelectedAuditReq(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-1 text-slate-800">
                <p><strong>Employee:</strong> {selectedAuditReq.employeeName} ({selectedAuditReq.employeeEmail})</p>
                <p><strong>Dates:</strong> {selectedAuditReq.startDate} to {selectedAuditReq.endDate} ({selectedAuditReq.days || 1} days)</p>
                <p><strong>Reason:</strong> {selectedAuditReq.reason}</p>
                <p><strong>Status:</strong> {selectedAuditReq.status.toUpperCase()}</p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-purple-600" /> Action History Log
                </h4>
                {selectedAuditReq.auditLog && selectedAuditReq.auditLog.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-purple-200 pl-4 ml-2">
                    {selectedAuditReq.auditLog.map((log, idx) => (
                      <div key={idx} className="relative space-y-0.5">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-purple-600" />
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{log.action} by {log.actor}</span>
                          <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        {log.details && <p className="text-slate-600">{log.details}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No detailed audit log available for this request.</p>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setSelectedAuditReq(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg"
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
