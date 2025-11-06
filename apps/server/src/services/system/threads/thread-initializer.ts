import { db } from "@/infrastructure/database/turso-connection";
import { ThreadRegistryConfig, DexThreadConfig, VerifiedAsset } from "@/types/thread-configs";
import { ThreadRegistryTable } from "@/infrastructure/database/schema";
import ky from "ky";
import { threadService } from "./thread-service";

// Dummy stub for asset verification service for now
async function assetVerificationService(assets: any[]): Promise<VerifiedAsset[]> {
  console.log("[assetVerificationService] Dummy verification for assets:", assets);
  return assets.map(asset => ({
    ...asset,
    verification_status: 'unverified', // Default to unverified for the stub
  }));
}

export async function initializeAndCacheThreadData(registryId: string): Promise<void> {
  console.log(`[ThreadInitializer] Initializing and caching data for thread registry: ${registryId}`);

  const registryEntry = await db
    .selectFrom("thread_registry")
    .selectAll()
    .where("id", "=", registryId)
    .executeTakeFirst();

  if (!registryEntry) {
    console.error(`[ThreadInitializer] Thread registry entry not found for ID: ${registryId}`);
    return;
  }

  try {
    // 1. Spawn the thread process to get its port
    // We use dummy orbId, sectorId, chain, and config as they are not relevant for initialization data fetching
    const { port } = await threadService.getOrServeThread(
      0, // dummy orbId
      0, // dummy sectorId
      "ethereum", // dummy chain
      registryEntry.id,
      {} // dummy config
    );

    // 2. Make an HTTP call to the thread's /initialize endpoint
    const threadInitData = await ky.get(`http://localhost:${port}/initialize`).json<ThreadRegistryConfig>();

    let updatedConfig: ThreadRegistryConfig = {};

    // Handle DEX thread specific initialization (asset caching)
    if (registryEntry.thread_type === "dex" && 'cached_assets' in threadInitData) {
      const rawAssets = (threadInitData as DexThreadConfig).cached_assets;
      const verifiedAssets = await assetVerificationService(rawAssets);
      updatedConfig = { ...updatedConfig, cached_assets: verifiedAssets };
    }

    // 3. Update the thread_registry with the new config_json
    await db
      .updateTable("thread_registry")
      .set({ config_json: JSON.stringify(updatedConfig) })
      .where("id", "=", registryId)
      .execute();

    console.log(`[ThreadInitializer] Successfully cached data for thread registry: ${registryId}`);
  } catch (error) {
    console.error(`[ThreadInitializer] Failed to initialize or cache data for ${registryId}:`, error);
  }
}
