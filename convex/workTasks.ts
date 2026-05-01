import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all work tasks
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workTasks").order("desc").collect();
  },
});

// Get tasks by assignee
export const getByAssignee = query({
  args: { assignee: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workTasks")
      .withIndex("by_assignee", (q) => q.eq("assignee", args.assignee))
      .order("desc")
      .collect();
  },
});

// Get tasks by status
export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workTasks")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .order("desc")
      .collect();
  },
});

// Create work task
export const create = mutation({
  args: {
    title: v.string(),
    assignee: v.string(),
    assigneeRole: v.string(),
    status: v.string(),
    dueDate: v.string(),
    completedDate: v.optional(v.string()),
    priority: v.string(),
    description: v.optional(v.string()),
    comments: v.optional(v.string()),
    owner: v.optional(v.string()),
    coordinationWith: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workTasks", args as any);
  },
});

// Update work task
export const update = mutation({
  args: {
    id: v.id("workTasks"),
    status: v.optional(v.string()),
    completedDate: v.optional(v.string()),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates as any);
  },
});

// Delete work task
export const remove = mutation({
  args: { id: v.id("workTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
