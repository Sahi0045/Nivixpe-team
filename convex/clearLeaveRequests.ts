import { mutation } from "./_generated/server";

// Clear all leave requests - Run this to start fresh
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const allRequests = await ctx.db.query("leaveRequests").collect();
    
    let deleted = 0;
    for (const request of allRequests) {
      await ctx.db.delete(request._id);
      deleted++;
    }
    
    console.log(`✅ Cleared ${deleted} leave requests from database`);
    console.log(`📝 System is now ready for fresh leave requests`);
    console.log(`🔄 All new requests will sync in real-time`);
    
    return { 
      success: true,
      deleted: deleted,
      message: `Cleared ${deleted} leave requests. System ready for new requests.`
    };
  },
});
