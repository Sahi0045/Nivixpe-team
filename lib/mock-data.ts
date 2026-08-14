export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  team?: 'Business' | 'Legal' | 'Technical' | 'Marketing' | 'Design' | 'HR';
  additionalTeams?: string[];
  reportsTo?: string;
  status: 'active' | 'onLeave' | 'inactive';
  lastLogin?: string;
  joinDate: string;
}

export interface WorkTask {
  id: string;
  title: string;
  assignee: string;
  assigneeRole: string;
  status: 'completed' | 'ongoing' | 'in_review' | 'missed' | 'continuous';

  dueDate: string;
  completedDate?: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  comments?: string;
  owner?: string;
  coordinationWith?: string;
}

export interface AttendanceAuditLog {
  id?: string;
  timestamp: string;
  action: string;
  actor?: string;
  changedBy?: string;
  details?: string;
  note?: string;
}

export interface AttendanceRecord {
  id?: string;
  date: string;
  email: string;
  name?: string;
  loginTime?: string;
  logoutTime?: string;
  status: 'present' | 'late' | 'absent' | 'halfDay' | 'onLeave' | 'holiday' | 'weekend' | 'workFromHome' | 'onDuty';
  workHours?: number; // minutes
  lateMinutes?: number;
  expectedLogin?: string;
  correctionStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  leaveRequestId?: string;
  isPaused?: boolean;
  currentSessionStart?: string;
  auditLog?: AttendanceAuditLog[];
}

export interface AttendanceCorrectionRequest {
  id: string;
  attendanceId?: string;
  employeeName: string;
  employeeEmail: string;
  date: string;
  currentLogin?: string;
  currentLogout?: string;
  requestedLogin: string;
  requestedLogout: string;
  reason: string;
  attachmentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}



export interface LeaveAuditLog {
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeEmail: string;
  startDate: string;
  endDate: string;
  days?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  type: 'casual' | 'sick' | 'annual' | 'emergency' | 'unpaid' | 'other' | 'vacation' | 'personal';
  approvedBy?: string;
  rejectionReason?: string;
  attachmentUrl?: string;
  comment?: string;
  appliedAt?: string;
  auditLog?: LeaveAuditLog[];
}


export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  minutesUrl?: string;
  meetLink?: string;
  decisions?: string;
  agenda?: string;
}

// All data is dynamically loaded from Supabase database tables
export const TEAM_MEMBERS: TeamMember[] = [];
export const WORK_TASKS: WorkTask[] = [];
export const ATTENDANCE_RECORDS: AttendanceRecord[] = [];
export const LEAVE_REQUESTS: LeaveRequest[] = [];
export const MEETINGS: Meeting[] = [];
