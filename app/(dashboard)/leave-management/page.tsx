'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { useAuth } from '@/app/providers';

export default function LeaveManagementPage() {
  const { user } = useAuth();
  
  // Real-time queries
  const allLeaveRequests = useQuery(api.leaveRequests.getAll) || [];
  const myLeaveRequests = useQuery(api.leaveRequests.getByEmail, user ? { email: user.email } : "skip") || [];
  
  // Mutation for updating leave status
  const updateLeaveStatus = useMutation(api.leaveRequests.updateStatus);
  
  // Only 4 heads can approve/reject: CEO (Sahith), CTO (Shubham), CSO (Swaraag), CMO (Abhiram)
  const canApproveLeave = user?.isSuperAdmin || user?.role === 'CTO' || user?.role === 'CSO' || user?.role === 'CMO';
  
  // Show all requests for CEO/CTO, only own requests for others
  const displayRequests = canApproveLeave ? allLeaveRequests : myLeaveRequests;
  
  const approvedCount = displayRequests.filter((lr) => lr.status === 'approved').length;
  const pendingCount = displayRequests.filter((lr) => lr.status === 'pending').length;
  const rejectedCount = displayRequests.filter((lr) => lr.status === 'rejected').length;

  const approved = displayRequests.filter((lr) => lr.status === 'approved');
  const pending = displayRequests.filter((lr) => lr.status === 'pending');
  const rejected = displayRequests.filter((lr) => lr.status === 'rejected');

  const handleApprove = async (requestId: any) => {
    if (!canApproveLeave || !user) return;
    try {
      await updateLeaveStatus({
        id: requestId,
        status: 'approved',
        approvedBy: user.name,
      });
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave request');
    }
  };

  const handleReject = async (requestId: any) => {
    if (!canApproveLeave || !user) return;
    try {
      await updateLeaveStatus({
        id: requestId,
        status: 'rejected',
        approvedBy: user.name,
      });
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave request');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header 
        title={canApproveLeave ? "Leave Management - Approval Dashboard" : "My Leave Requests"} 
        subtitle={canApproveLeave ? "View and manage all employee leave requests" : "View your leave request status and history"} 
      />

      <div className="p-6 space-y-6">
        {/* Leave System Rules */}
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Info className="h-5 w-5" />
              Leave System Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            <div className="space-y-1">
              <p className="font-medium">Post-Login Leave:</p>
              <p className="ml-4">• Employees can take leave at any time after login (no restriction on same-day leave post login)</p>
              <p className="ml-4">• Partial leave is allowed after logging in</p>
            </div>
            <div className="space-y-1 mt-3">
              <p className="font-medium">Full Day Absence:</p>
              <p className="ml-4">• If an employee is absent for the full day (no login), leave approval is mandatory</p>
              <p className="ml-4">• Leave approval must be taken from Team Lead, Reporting Manager, CTO, or CEO</p>
            </div>
            <div className="space-y-1 mt-3">
              <p className="font-medium">Leave Types:</p>
              <p className="ml-4">• <span className="font-medium">Present:</span> Logged in and working</p>
              <p className="ml-4">• <span className="font-medium">Partial Leave:</span> Logged in but left early</p>
              <p className="ml-4">• <span className="font-medium">Full Leave:</span> No login with approved leave request</p>
              <p className="ml-4">• <span className="font-medium">Absent:</span> No login without approved leave (auto-marked)</p>
            </div>
            <div className="space-y-1 mt-3">
              <p className="font-medium">Approval Authority:</p>
              <p className="ml-4">• <span className="font-medium text-amber-700">CEO (Sahith)</span> - Can approve all leave requests</p>
              <p className="ml-4">• <span className="font-medium text-blue-700">CTO (Shubham)</span> - Can approve all leave requests</p>
              <p className="ml-4">• <span className="font-medium text-green-700">CSO (Swaraag)</span> - Can approve all leave requests</p>
              <p className="ml-4">• <span className="font-medium text-purple-700">CMO (Abhiram)</span> - Can approve all leave requests</p>
            </div>
          </CardContent>
        </Card>

        {/* Head Approval Notice */}
        {canApproveLeave && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">
                {user?.isSuperAdmin ? 'CEO Approval Dashboard' : 
                 user?.role === 'CTO' ? 'CTO Approval Dashboard' :
                 user?.role === 'CSO' ? 'CSO Approval Dashboard' :
                 'CMO Approval Dashboard'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900">
              <p>You have authority to approve or reject all leave requests. All team members' requests are visible below.</p>
            </CardContent>
          </Card>
        )}

        {/* Regular User Notice */}
        {!canApproveLeave && (
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">My Leave Request History</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-900">
              <p>View your leave request status and history. To raise a new leave request, contact your team lead or use the request form.</p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">requests approved</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
              <p className="text-xs text-muted-foreground">requests rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests - Show first for approval */}
        {pending.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-yellow-700">
                {canApproveLeave ? 'Pending Requests - Awaiting Your Approval' : 'My Pending Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pending.map((request) => (
                  <div
                    key={request._id}
                    className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.employeeEmail}</p>
                      </div>
                      <span className="inline-flex px-3 py-1 bg-yellow-600 text-white rounded text-xs font-medium">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {request.startDate} to {request.endDate}
                      </span>
                      <div className="flex gap-2">
                        {canApproveLeave ? (
                          <>
                            <button 
                              onClick={() => handleApprove(request._id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(request._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <p className="text-sm text-yellow-700 font-medium">Pending Review</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved Requests */}
        {approved.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-green-700">
                {canApproveLeave ? 'Approved Requests' : 'My Approved Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approved.map((request) => (
                  <div
                    key={request._id}
                    className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.employeeEmail}</p>
                      </div>
                      <span className="inline-flex px-3 py-1 bg-green-600 text-white rounded text-xs font-medium">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {request.startDate} to {request.endDate}
                      </span>
                      <div className="text-right">
                        <p className="text-sm text-green-700 font-medium">Approved</p>
                        {request.approvedBy && (
                          <p className="text-xs text-muted-foreground">by {request.approvedBy}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Requests */}
        {rejected.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-red-700">
                {canApproveLeave ? 'Rejected Requests' : 'My Rejected Requests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rejected.map((request) => (
                  <div
                    key={request._id}
                    className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.employeeEmail}</p>
                      </div>
                      <span className="inline-flex px-3 py-1 bg-red-600 text-white rounded text-xs font-medium">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {request.startDate} to {request.endDate}
                      </span>
                      <div className="text-right">
                        <p className="text-sm text-red-700 font-medium">Rejected</p>
                        {request.approvedBy && (
                          <p className="text-xs text-muted-foreground">by {request.approvedBy}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No requests message */}
        {displayRequests.length === 0 && (
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {canApproveLeave ? 'No leave requests to display' : 'You have no leave requests yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
