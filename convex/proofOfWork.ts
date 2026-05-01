import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all proof of work submissions
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("proofOfWork").order("desc").collect();
  },
});

// Get proof of work by submitter
export const getBySubmitter = query({
  args: { submittedBy: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proofOfWork")
      .withIndex("by_submitted_by", (q) => q.eq("submittedBy", args.submittedBy))
      .order("desc")
      .collect();
  },
});

// Get proof of work by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proofOfWork")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .order("desc")
      .collect();
  },
});

// Create proof of work submission
export const create = mutation({
  args: {
    taskId: v.optional(v.id("workTasks")),
    taskTitle: v.string(),
    submittedBy: v.string(),
    submittedByEmail: v.string(),
    submissionDate: v.string(),
    workDescription: v.string(),
    proofLink: v.optional(v.string()),
    proofFile: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("proofOfWork", args as any);
  },
});

// Update proof of work status
export const updateStatus = mutation({
  args: {
    id: v.id("proofOfWork"),
    status: v.string(),
    reviewedBy: v.optional(v.string()),
    reviewComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates as any);
  },
});
