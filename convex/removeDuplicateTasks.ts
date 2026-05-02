import { mutation } from "./_generated/server";

// Remove duplicate work tasks based on title and assignee
export const removeDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const allTasks = await ctx.db.query("workTasks").collect();
    
    // Group tasks by title + assignee combination
    const taskMap = new Map<string, any[]>();
    
    for (const task of allTasks) {
      const key = `${task.title}-${task.assignee}`;
      if (!taskMap.has(key)) {
        taskMap.set(key, []);
      }
      taskMap.get(key)!.push(task);
    }
    
    let duplicatesRemoved = 0;
    
    // For each group, keep only the first task and delete the rest
    for (const [key, tasks] of taskMap.entries()) {
      if (tasks.length > 1) {
        // Sort by creation time to keep the oldest one
        tasks.sort((a, b) => a._creationTime - b._creationTime);
        
        // Delete all except the first one
        for (let i = 1; i < tasks.length; i++) {
          await ctx.db.delete(tasks[i]._id);
          duplicatesRemoved++;
        }
        
        console.log(`Removed ${tasks.length - 1} duplicate(s) for: ${key}`);
      }
    }
    
    console.log(`✅ Total duplicates removed: ${duplicatesRemoved}`);
    console.log(`📊 Unique tasks remaining: ${taskMap.size}`);
    
    return {
      success: true,
      duplicatesRemoved,
      uniqueTasksRemaining: taskMap.size,
      message: `Removed ${duplicatesRemoved} duplicate tasks. ${taskMap.size} unique tasks remaining.`
    };
  },
});
