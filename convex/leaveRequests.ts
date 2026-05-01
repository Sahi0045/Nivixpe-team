import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all leave requests
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("leaveRequests").order("desc").collect();
  },
});

// Get leave requests by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .order("desc")
      .collect();
  },
});

// Get leave requests by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leaveRequests")
      .withIndex("by_email", (q) => q.eq("employeeEmail", args.email))
      .order("desc")
      .collect();
  },
});

// Create leave request
export const create = mutation({
  args: {
    employeeName: v.string(),
    employeeEmail: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.string(),
    status: v.string(),
    type: v.string(),
    approvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leaveRequests", args as any);
  },
});

// Update leave request status
export const updateStatus = mutation({
  args: {
    id: v.id("leaveRequests"),
    status: v.string(),
    approvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates as any);
  },
});
