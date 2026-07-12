import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { createNotification } from './notifications';

// Get the drive access grant for a specific member by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query('driveAccessGrants')
      .withIndex('by_email', (q) => q.eq('grantedToEmail', email))
      .first();
  },
});

// Create or update drive access grant for a member
export const upsert = mutation({
  args: {
    grantedTo: v.string(),
    grantedToEmail: v.string(),
    grantedBy: v.string(),
    folders: v.array(v.string()),
  },
  handler: async (ctx, { grantedTo, grantedToEmail, grantedBy, folders }) => {
    const existing = await ctx.db
      .query('driveAccessGrants')
      .withIndex('by_email', (q) => q.eq('grantedToEmail', grantedToEmail))
      .first();

    let resultId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        grantedTo,
        grantedBy,
        folders,
        grantedAt: new Date().toISOString(),
      });
      resultId = existing._id;
    } else {
      resultId = await ctx.db.insert('driveAccessGrants', {
        grantedTo,
        grantedToEmail,
        grantedBy,
        folders,
        grantedAt: new Date().toISOString(),
      });
    }

    // Send notification and email
    const foldersList = folders.join(', ');
    await createNotification(ctx, {
      userId: grantedToEmail,
      title: "📁 Drive Access Granted",
      message: `You have been granted access to the following team folders: ${foldersList} by ${grantedBy}.`,
      type: "work",
      link: "/drive",
    });

    return resultId;
  },
});

// Remove all access grants for a member
export const remove = mutation({
  args: { grantedToEmail: v.string() },
  handler: async (ctx, { grantedToEmail }) => {
    const existing = await ctx.db
      .query('driveAccessGrants')
      .withIndex('by_email', (q) => q.eq('grantedToEmail', grantedToEmail))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
