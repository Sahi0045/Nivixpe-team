import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { TEAM_MEMBERS, WORK_TASKS, ATTENDANCE_RECORDS, LEAVE_REQUESTS, MEETINGS } from "../lib/mock-data";

// Seed team members
export const seedTeamMembers = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const member of TEAM_MEMBERS) {
      await ctx.db.insert("teamMembers", {
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department,
        team: member.team as any,
        reportsTo: member.reportsTo,
        status: member.status,
        lastLogin: member.lastLogin,
        joinDate: member.joinDate,
      });
    }
    console.log(`Seeded ${TEAM_MEMBERS.length} team members`);
  },
});

// Seed work tasks
export const seedWorkTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const task of WORK_TASKS) {
      await ctx.db.insert("workTasks", {
        title: task.title,
        assignee: task.assignee,
        assigneeRole: task.assigneeRole,
        status: task.status,
        dueDate: task.dueDate,
        completedDate: task.completedDate,
        priority: task.priority,
        description: task.description,
        comments: task.comments,
        owner: task.owner,
        coordinationWith: task.coordinationWith,
        createdBy: "System",
      } as any);
    }
    console.log(`Seeded ${WORK_TASKS.length} work tasks`);
  },
});

// Seed attendance records
export const seedAttendanceRecords = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const record of ATTENDANCE_RECORDS) {
      await ctx.db.insert("attendanceRecords", {
        date: record.date,
        email: record.email,
        loginTime: record.loginTime,
        logoutTime: record.logoutTime,
        status: record.status,
      } as any);
    }
    console.log(`Seeded ${ATTENDANCE_RECORDS.length} attendance records`);
  },
});

// Seed leave requests
export const seedLeaveRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const request of LEAVE_REQUESTS) {
      await ctx.db.insert("leaveRequests", {
        employeeName: request.employeeName,
        employeeEmail: request.employeeEmail,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason,
        status: request.status,
        type: request.type,
      } as any);
    }
    console.log(`Seeded ${LEAVE_REQUESTS.length} leave requests`);
  },
});

// Seed meetings
export const seedMeetings = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const meeting of MEETINGS) {
      await ctx.db.insert("meetings", {
        title: meeting.title,
        date: meeting.date,
        time: meeting.time,
        attendees: meeting.attendees,
        status: meeting.status,
        minutesUrl: meeting.minutesUrl,
      } as any);
    }
    console.log(`Seeded ${MEETINGS.length} meetings`);
  },
});

// Seed all data
export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.seedTeamMembers, {});
    await ctx.runMutation(internal.seed.seedWorkTasks, {});
    await ctx.runMutation(internal.seed.seedAttendanceRecords, {});
    await ctx.runMutation(internal.seed.seedLeaveRequests, {});
    await ctx.runMutation(internal.seed.seedMeetings, {});
    console.log("All data seeded successfully!");
  },
});
