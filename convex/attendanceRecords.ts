import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all attendance records
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("attendanceRecords").order("desc").take(100);
  },
});

// Get attendance by date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendanceRecords")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

// Get attendance by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendanceRecords")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(30);
  },
});

// Create attendance record
export const create = mutation({
  args: {
    date: v.string(),
    email: v.string(),
    loginTime: v.optional(v.string()),
    logoutTime: v.optional(v.string()),
    reportTime: v.optional(v.string()),
    status: v.string(),
    approval: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("attendanceRecords", args as any);
  },
});

// Update attendance record
export const update = mutation({
  args: {
    id: v.id("attendanceRecords"),
    logoutTime: v.optional(v.string()),
    reportTime: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates as any);
  },
});
