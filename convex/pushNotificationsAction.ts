"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import webpush from "web-push";

export const sendPush = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Fetch active subscriptions for this user
    const subscriptions = await ctx.runQuery(
      internal.pushNotifications.getSubscriptions,
      { userId: args.userId }
    );

    if (!subscriptions || subscriptions.length === 0) {
      return { success: false, reason: "No push subscriptions found" };
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      console.warn("VAPID keys not configured. Skipping push notification.");
      return { success: false, reason: "VAPID keys not configured" };
    }

    webpush.setVapidDetails(
      "mailto:support@nivixpe-team.com",
      publicKey,
      privateKey
    );

    const payload = JSON.stringify({
      title: args.title,
      body: args.message,
      icon: "/nivixpe-logo.png",
      data: {
        url: args.link ? `https://nivixpe-team.vercel.app${args.link}` : "https://nivixpe-team.vercel.app/dashboard",
      },
    });

    let successCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        successCount++;
      } catch (error: any) {
        console.error("Failed to send push notification to subscription:", error);
        failedCount++;
        // Clean up expired (410 Gone) or invalid (404 Not Found) subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await ctx.runMutation(internal.pushNotifications.deleteSubscription, {
            id: sub._id,
          });
        }
      }
    }

    return { success: true, sent: successCount, failed: failedCount };
  },
});
