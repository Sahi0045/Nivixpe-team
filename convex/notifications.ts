import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper function to create in-app notification and send Resend email
export async function createNotification(ctx: any, args: {
  userId: string;
  title: string;
  message: string;
  type: "attendance" | "work" | "meeting" | "leave" | "pow";
  link?: string;
}) {
  const notificationId = await ctx.db.insert("notifications", {
    ...args,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Schedule email sending via Resend
  await ctx.scheduler.runAfter(0, internal.emails.sendEmail, {
    to: args.userId,
    subject: `[Nivixpe Portal] ${args.title}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 700;">Nivixpe Team Portal</h1>
        </div>
        <div style="border-top: 4px solid #2563eb; padding-top: 20px;">
          <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 15px;">${args.title}</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 20px;">${args.message}</p>
          ${args.link ? `
            <div style="margin-top: 30px; margin-bottom: 20px;">
              <a href="https://nivixpe-team.vercel.app${args.link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">View in Portal</a>
            </div>
          ` : ''}
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 35px; margin-bottom: 20px;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">This is an automated notification from the Nivixpe Team Portal. Please do not reply directly to this email.</p>
      </div>
    `
  });

  // Schedule push notification sending via web-push
  await ctx.scheduler.runAfter(0, internal.pushNotificationsAction.sendPush, {
    userId: args.userId,
    title: args.title,
    message: args.message,
    link: args.link,
  });

  return notificationId;
}

// Get user's notifications
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

// Mark all as read
export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_status", (q) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

// Create notification
export const create = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("attendance"),
      v.literal("work"),
      v.literal("meeting"),
      v.literal("leave"),
      v.literal("pow")
    ),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await createNotification(ctx, args);
  },
});

// Send notification to multiple users (e.g. for meetings)
export const createMultiple = mutation({
  args: {
    userIds: v.array(v.string()),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("attendance"),
      v.literal("work"),
      v.literal("meeting"),
      v.literal("leave"),
      v.literal("pow")
    ),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userIds, ...rest } = args;
    for (const userId of userIds) {
      await createNotification(ctx, {
        ...rest,
        userId,
      });
    }
  },
});

// Save a new push subscription
export const saveSubscription = mutation({
  args: {
    userId: v.string(),
    subscription: v.any(),
  },
  handler: async (ctx, args) => {
    // Remove old subscriptions for this user on the same device (if possible) or just keep all
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Simple deduplication: if the subscription string is the same, don't re-insert
    const subString = JSON.stringify(args.subscription);
    if (existing.some(s => JSON.stringify(s.subscription) === subString)) {
      return;
    }

    await ctx.db.insert("pushSubscriptions", {
      userId: args.userId,
      subscription: args.subscription,
      createdAt: new Date().toISOString(),
    });
  },
});
