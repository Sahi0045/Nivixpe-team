import { supabase, isSupabaseConfigured } from './supabase';
import {
  TEAM_MEMBERS,
  WORK_TASKS,
  ATTENDANCE_RECORDS,
  LEAVE_REQUESTS,
  MEETINGS,
  TeamMember,
  WorkTask,
  AttendanceRecord,
  LeaveRequest,
  Meeting,
} from './mock-data';

export type {
  TeamMember,
  WorkTask,
  AttendanceRecord,
  LeaveRequest,
  Meeting,
};

export interface ProofOfWorkRecord {
  id: string;
  taskId?: string;
  taskTitle: string;
  submittedBy: string;
  submittedByEmail: string;
  submissionDate: string;
  workDescription: string;
  proofLink?: string;
  proofLinks?: string[];
  fileSize?: number;
  status: 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  reviewedBy?: string;
  reviewComments?: string;
}

export interface DriveDocumentRecord {
  id: string;
  teamFolder: 'Marketing' | 'Business' | 'Legal' | 'Technical' | 'Other';
  uploadedBy: string;
  uploadedByEmail: string;
  fileName: string;
  fileSize?: number;
  externalLink?: string;
  description?: string;
  uploadedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'attendance' | 'work' | 'meeting' | 'leave' | 'pow';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface DriveAccessGrantRecord {
  id: string;
  grantedTo: string;
  grantedToEmail: string;
  grantedBy: string;
  folders: string[];
  grantedAt: string;
}

// In-memory state initialized empty (all data sourced from Supabase)
let localTeamMembers: TeamMember[] = [];
let localWorkTasks: WorkTask[] = [];
let localAttendanceRecords: AttendanceRecord[] = [];
let localLeaveRequests: LeaveRequest[] = [];
let localMeetings: Meeting[] = [];
let localProofOfWork: ProofOfWorkRecord[] = [];
let localDriveDocuments: DriveDocumentRecord[] = [];
let localNotifications: NotificationRecord[] = [];

let localDriveAccessGrants: DriveAccessGrantRecord[] = [
  {
    id: 'grant-1',
    grantedTo: 'Swaraag',
    grantedToEmail: 'cso@nivixpe.com',
    grantedBy: 'Sahith',
    folders: ['Business', 'Legal'],
    grantedAt: '2025-04-01',
  },
];

export const supabaseDb = {
  // --- TEAM MEMBERS ---
  async getTeamMembers(): Promise<TeamMember[]> {
    if (!isSupabaseConfigured) return localTeamMembers;
    try {
      const { data, error } = await supabase.from('team_members').select('*');
      if (error || !data || data.length === 0) return localTeamMembers;
      return data as TeamMember[];
    } catch {
      return localTeamMembers;
    }
  },

  async addTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    const newMember = { ...member, id: String(Date.now()) };
    if (!isSupabaseConfigured) {
      localTeamMembers.push(newMember);
      return newMember;
    }
    try {
      const { data, error } = await supabase.from('team_members').insert([newMember]).select();
      if (error || !data) {
        localTeamMembers.push(newMember);
        return newMember;
      }
      return data[0] as TeamMember;
    } catch {
      localTeamMembers.push(newMember);
      return newMember;
    }
  },

  // --- WORK TASKS ---
  async getWorkTasks(): Promise<WorkTask[]> {
    if (!isSupabaseConfigured) return localWorkTasks;
    try {
      const { data, error } = await supabase.from('work_tasks').select('*');
      if (error || !data || data.length === 0) return localWorkTasks;
      return data as WorkTask[];
    } catch {
      return localWorkTasks;
    }
  },

  async createTask(task: Omit<WorkTask, 'id'>): Promise<WorkTask> {
    const newTask = { ...task, id: 'task-' + Date.now() };
    if (!isSupabaseConfigured) {
      localWorkTasks.unshift(newTask);
      return newTask;
    }
    try {
      const { data, error } = await supabase.from('work_tasks').insert([newTask]).select();
      if (error || !data) {
        localWorkTasks.unshift(newTask);
        return newTask;
      }
      return data[0] as WorkTask;
    } catch {
      localWorkTasks.unshift(newTask);
      return newTask;
    }
  },

  async updateTask(id: string, updates: Partial<WorkTask>): Promise<void> {
    if (!isSupabaseConfigured) {
      localWorkTasks = localWorkTasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      return;
    }
    try {
      await supabase.from('work_tasks').update(updates).eq('id', id);
    } catch {
      localWorkTasks = localWorkTasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    }
  },

  async deleteTask(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      localWorkTasks = localWorkTasks.filter((t) => t.id !== id);
      return;
    }
    try {
      await supabase.from('work_tasks').delete().eq('id', id);
    } catch {
      localWorkTasks = localWorkTasks.filter((t) => t.id !== id);
    }
  },

  // --- ATTENDANCE ---
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    if (!isSupabaseConfigured) return localAttendanceRecords;
    try {
      const { data, error } = await supabase.from('attendance_records').select('*');
      if (error || !data || data.length === 0) return localAttendanceRecords;
      return data as AttendanceRecord[];
    } catch {
      return localAttendanceRecords;
    }
  },

  async markAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<void> {
    if (!isSupabaseConfigured) {
      const index = localAttendanceRecords.findIndex(
        (r) => r.date === record.date && r.email === record.email
      );
      if (index >= 0) {
        localAttendanceRecords[index] = { ...localAttendanceRecords[index], ...record };
      } else {
        localAttendanceRecords.push({ ...record });
      }
      return;
    }
    try {
      await supabase.from('attendance_records').upsert([record], { onConflict: 'date,email' });
    } catch {
      // fallback
    }
  },

  // --- LEAVE REQUESTS ---
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    if (!isSupabaseConfigured) return localLeaveRequests;
    try {
      const { data, error } = await supabase.from('leave_requests').select('*');
      if (error || !data || data.length === 0) return localLeaveRequests;
      return data as LeaveRequest[];
    } catch {
      return localLeaveRequests;
    }
  },

  async createLeaveRequest(req: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> {
    const newReq = { ...req, id: 'leave-' + Date.now() };
    if (!isSupabaseConfigured) {
      localLeaveRequests.unshift(newReq);
      return newReq;
    }
    try {
      const { data, error } = await supabase.from('leave_requests').insert([newReq]).select();
      if (error || !data) {
        localLeaveRequests.unshift(newReq);
        return newReq;
      }
      return data[0] as LeaveRequest;
    } catch {
      localLeaveRequests.unshift(newReq);
      return newReq;
    }
  },

  async updateLeaveStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    if (!isSupabaseConfigured) {
      localLeaveRequests = localLeaveRequests.map((l) => (l.id === id ? { ...l, status } : l));
      return;
    }
    try {
      await supabase.from('leave_requests').update({ status }).eq('id', id);
    } catch {
      localLeaveRequests = localLeaveRequests.map((l) => (l.id === id ? { ...l, status } : l));
    }
  },

  // --- MEETINGS ---
  async getMeetings(): Promise<Meeting[]> {
    if (!isSupabaseConfigured) return localMeetings;
    try {
      const { data, error } = await supabase.from('meetings').select('*');
      if (error || !data || data.length === 0) return localMeetings;
      return data as Meeting[];
    } catch {
      return localMeetings;
    }
  },

  async createMeeting(meeting: Omit<Meeting, 'id'>): Promise<Meeting> {
    const newMeeting = { ...meeting, id: 'meet-' + Date.now() };
    if (!isSupabaseConfigured) {
      localMeetings.unshift(newMeeting);
      return newMeeting;
    }
    try {
      const { data, error } = await supabase.from('meetings').insert([newMeeting]).select();
      if (error || !data) {
        localMeetings.unshift(newMeeting);
        return newMeeting;
      }
      return data[0] as Meeting;
    } catch {
      localMeetings.unshift(newMeeting);
      return newMeeting;
    }
  },

  async completeMeeting(id: string, updates: Partial<Meeting>): Promise<void> {
    const idx = localMeetings.findIndex((m) => m.id === id);
    if (idx !== -1) {
      localMeetings[idx] = { ...localMeetings[idx], ...updates, status: 'completed' };
    }
    if (isSupabaseConfigured) {
      await supabase.from('meetings').update({ ...updates, status: 'completed' }).eq('id', id);
    }
  },

  async deleteMeeting(id: string): Promise<void> {
    localMeetings = localMeetings.filter((m) => m.id !== id);
    if (isSupabaseConfigured) {
      await supabase.from('meetings').delete().eq('id', id);
    }
  },

  // --- PROOF OF WORK ---
  async getProofOfWork(): Promise<ProofOfWorkRecord[]> {
    if (!isSupabaseConfigured) return localProofOfWork;
    try {
      const { data, error } = await supabase.from('proof_of_work').select('*');
      if (error || !data || data.length === 0) return localProofOfWork;
      return data as ProofOfWorkRecord[];
    } catch {
      return localProofOfWork;
    }
  },

  async submitProofOfWork(pow: Omit<ProofOfWorkRecord, 'id'>): Promise<ProofOfWorkRecord> {
    const newPow = { ...pow, id: 'pow-' + Date.now() };
    if (!isSupabaseConfigured) {
      localProofOfWork.unshift(newPow);
      return newPow;
    }
    try {
      const { data, error } = await supabase.from('proof_of_work').insert([newPow]).select();
      if (error || !data) {
        localProofOfWork.unshift(newPow);
        return newPow;
      }
      return data[0] as ProofOfWorkRecord;
    } catch {
      localProofOfWork.unshift(newPow);
      return newPow;
    }
  },

  async reviewProofOfWork(id: string, status: 'approved' | 'rejected' | 'revision_requested', comments?: string, reviewer?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      localProofOfWork = localProofOfWork.map((p) =>
        p.id === id ? { ...p, status, reviewComments: comments, reviewedBy: reviewer } : p
      );
      return;
    }
    try {
      await supabase
        .from('proof_of_work')
        .update({ status, reviewComments: comments, reviewedBy: reviewer })
        .eq('id', id);
    } catch {
      localProofOfWork = localProofOfWork.map((p) =>
        p.id === id ? { ...p, status, reviewComments: comments, reviewedBy: reviewer } : p
      );
    }
  },

  // --- DRIVE DOCUMENTS ---
  async getDriveDocuments(): Promise<DriveDocumentRecord[]> {
    if (!isSupabaseConfigured) return localDriveDocuments;
    try {
      const { data, error } = await supabase.from('drive_documents').select('*');
      if (error || !data || data.length === 0) return localDriveDocuments;
      return data as DriveDocumentRecord[];
    } catch {
      return localDriveDocuments;
    }
  },

  async addDriveDocument(doc: Omit<DriveDocumentRecord, 'id'>): Promise<DriveDocumentRecord> {
    const newDoc = { ...doc, id: 'doc-' + Date.now() };
    if (!isSupabaseConfigured) {
      localDriveDocuments.unshift(newDoc);
      return newDoc;
    }
    try {
      const { data, error } = await supabase.from('drive_documents').insert([newDoc]).select();
      if (error || !data) {
        localDriveDocuments.unshift(newDoc);
        return newDoc;
      }
      return data[0] as DriveDocumentRecord;
    } catch {
      localDriveDocuments.unshift(newDoc);
      return newDoc;
    }
  },

  // --- DRIVE ACCESS GRANTS ---
  async getDriveAccessGrants(): Promise<DriveAccessGrantRecord[]> {
    if (!isSupabaseConfigured) return localDriveAccessGrants;
    try {
      const { data, error } = await supabase.from('drive_access_grants').select('*');
      if (error || !data || data.length === 0) return localDriveAccessGrants;
      return data as DriveAccessGrantRecord[];
    } catch {
      return localDriveAccessGrants;
    }
  },

  async grantDriveAccess(grant: Omit<DriveAccessGrantRecord, 'id'>): Promise<void> {
    const newGrant = { ...grant, id: 'grant-' + Date.now() };
    if (!isSupabaseConfigured) {
      localDriveAccessGrants.push(newGrant);
      return;
    }
    try {
      await supabase.from('drive_access_grants').insert([newGrant]);
    } catch {
      localDriveAccessGrants.push(newGrant);
    }
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<NotificationRecord[]> {
    if (!isSupabaseConfigured) {
      return localNotifications.filter((n) => n.userId === userId || n.userId === 'all');
    }
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`userId.eq.${userId},userId.eq.all`);
      if (error || !data || data.length === 0) {
        return localNotifications.filter((n) => n.userId === userId || n.userId === 'all');
      }
      return data as NotificationRecord[];
    } catch {
      return localNotifications.filter((n) => n.userId === userId || n.userId === 'all');
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      localNotifications = localNotifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return;
    }
    try {
      await supabase.from('notifications').update({ isRead: true }).eq('id', id);
    } catch {
      localNotifications = localNotifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    }
  },
};
