import { Request, Response } from "express";
import { db } from "@/infrastructure/database/turso-connection";
import { DexThreadConfig } from "@/types/thread-configs";

const threadRegistryController = {
  async getAvailableThreads(req: Request, res: Response) {
    const { type } = req.query;

    try {
      let query = db.selectFrom("thread_registry").selectAll();

      if (type) {
        query = query.where("thread_type", "=", type as string);
      }

      const threads = await query.execute();

      if (type) {
        // Return filtered results in { threads: [...] } format
        return res.json({ threads });
      } else {
        // Group by thread type for unfiltered results
        const groupedThreads = threads.reduce((acc, thread) => {
          if (!acc[thread.thread_type]) {
            acc[thread.thread_type] = [];
          }
          acc[thread.thread_type].push(thread);
          return acc;
        }, {} as Record<string, any[]>);

        return res.json(groupedThreads);
      }
    } catch (error) {
      console.error("[threadRegistryController] Error fetching available threads:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async getThreadRegistryAssets(req: Request, res: Response) {
    const { registryId } = req.params;

    try {
      const registryEntry = await db
        .selectFrom("thread_registry")
        .select(["config_json", "thread_type"])
        .where("id", "=", registryId)
        .executeTakeFirst();

      if (!registryEntry) {
        return res.status(404).json({ error: "Thread registry entry not found" });
      }

      if (registryEntry.thread_type !== "dex") {
        return res.status(400).json({ error: "Asset discovery is only supported for DEX threads" });
      }

      const config = registryEntry.config_json ? JSON.parse(registryEntry.config_json as string) : {};
      const dexConfig = config as DexThreadConfig;

      if (dexConfig && dexConfig.cached_assets) {
        return res.json(dexConfig.cached_assets);
      } else {
        return res.json([]); // Return empty array if no cached assets
      }
    } catch (error) {
      console.error(`[threadRegistryController] Error fetching assets for ${registryId}:`, error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

export default threadRegistryController;
export { threadRegistryController };