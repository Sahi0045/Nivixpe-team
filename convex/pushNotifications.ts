import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Get all push subscriptions for a user
export const getSubscriptions = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Delete a subscription (e.g. if expired or invalid)
export const deleteSubscription = internalMutation({
  args: { id: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
