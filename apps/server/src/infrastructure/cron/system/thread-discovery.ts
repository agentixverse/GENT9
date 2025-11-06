import cron from "node-cron";
import { threadDiscoveryService } from "@/services/system/threads/thread-discovery-service";
import { initializeAndCacheThreadData } from "@/services/system/threads/thread-initializer";

/**
 * Thread Discovery Cron Job
 *
 * Runs every 5 minutes to discover new threads from the GitHub repository
 * and update the thread_registry table.
 */
const threadDiscoveryCron = {
  async start() {
    console.log("[thread-discovery-cron] Starting thread discovery cron job...");

    // Schedule the job to run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      console.log("[thread-discovery-cron] Running thread discovery...");
      await this.runDiscovery();
    });

    // Run immediately on startup
    console.log("[thread-discovery-cron] Running initial thread discovery...");
    await this.runDiscovery();
  },

  async runDiscovery() {
    try {
      const result = await threadDiscoveryService.discoverThreads();

      console.log(
        `[thread-discovery-cron] Discovery completed: ${result.discovered} threads discovered, ` +
          `${result.new.length} new, ${result.updated.length} updated`
      );

      // Trigger initialization for new and updated threads
      const threadsToInitialize = [...result.new, ...result.updated];
      for (const registryId of threadsToInitialize) {
        await initializeAndCacheThreadData(registryId);
      }

      if (result.errors.length > 0) {
        console.warn(
          `[thread-discovery-cron] Encountered ${result.errors.length} errors during discovery:`
        );
        result.errors.forEach((err) => {
          console.warn(`  - ${err.folder}: ${err.error}`);
        });
      }

      // Log threads by type
      if (Object.keys(result.threads_by_type).length > 0) {
        console.log("[thread-discovery-cron] Threads by type:");
        Object.entries(result.threads_by_type).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count}`);
        });
      }
    } catch (error) {
      console.error("[thread-discovery-cron] Thread discovery failed:", error);
    }
  },
};

export default threadDiscoveryCron;
