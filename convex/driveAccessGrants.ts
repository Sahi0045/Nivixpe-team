import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

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

    if (existing) {
      await ctx.db.patch(existing._id, {
        grantedTo,
        grantedBy,
        folders,
        grantedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert('driveAccessGrants', {
        grantedTo,
        grantedToEmail,
        grantedBy,
        folders,
        grantedAt: new Date().toISOString(),
      });
    }
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
