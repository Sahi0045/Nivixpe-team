import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY environment variable is not set. Skipping email sending.");
      return { success: false, reason: "RESEND_API_KEY not set" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Nivixpe Team Portal <notifications@resend.dev>",
          to: [args.to],
          subject: args.subject,
          html: args.html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Resend API error response:", errorData);
        return { success: false, reason: errorData };
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      return { success: false, error: String(error) };
    }
  },
});
