import { createHash } from "crypto";
import { db } from "@/infrastructure/database";
import type { ThreadRegistryTable } from "@/infrastructure/database/schema";
import { sql } from "kysely";

interface AGXManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  logic: string;
  ui?: {
    entry: string;
    supports_iframe: boolean;
    responsive: boolean;
    dimensions: string;
  } | null;
  thread_type: "dex" | "bridge" | "lending" | "yield_farming" | "network_infra" | "other";
  supported_networks: string[];
  storage_schema: Record<string, any>;
  api_endpoints: Record<string, string>;
  features: string[];
  permissions?: string[];
  created_at: string;
}

interface DiscoveredThread {
  agx_manifest: AGXManifest;
  folder_name: string;
  source_url: string;
}

interface DiscoveryResult {
  discovered: number;
  updated: number;
  new: number;
  errors: Array<{ folder: string; error: string }>;
  threads_by_type: Record<string, number>;
}

/**
 * Thread Discovery Service
 *
 * Scans a GitHub repository for thread providers with AGX.json manifests
 * and updates the thread_registry table with discovered threads.
 */
export class ThreadDiscoveryService {
  private readonly GITHUB_REPO_URL: string;
  private readonly GITHUB_RAW_BASE: string;

  constructor() {
    this.GITHUB_REPO_URL =
      process.env.THREADS_REPO_URL ||
      "https://api.github.com/repos/agentix/threads/contents";

    this.GITHUB_RAW_BASE =
      process.env.THREADS_RAW_BASE ||
      "https://raw.githubusercontent.com/agentix/threads/main";
  }

  /**
   * Discover threads from the GitHub repository
   */
  async discoverThreads(): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      discovered: 0,
      updated: 0,
      new: 0,
      errors: [],
      threads_by_type: {},
    };

    try {
      // Fetch root directory contents
      const response = await fetch(this.GITHUB_REPO_URL, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const contents = await response.json() as Array<{ name: string; type: string; path: string }>;

      // Filter for directories (potential thread folders)
      const threadFolders = contents.filter(
        (item) => item.type === "dir" && !item.name.startsWith(".")
      );

      console.log(`Found ${threadFolders.length} potential thread folders`);

      // Process each folder
      for (const folder of threadFolders) {
        try {
          const discovered = await this.processThreadFolder(folder.name, folder.path);

          if (discovered) {
            result.discovered++;

            // Compute content hash and upsert
            const registryId = this.computeContentHash(discovered.agx_manifest);
            const inserted = await this.upsertThreadRegistry(registryId, discovered);

            if (inserted) {
              result.new++;
            } else {
              result.updated++;
            }

            // Count by type
            const threadType = discovered.agx_manifest.thread_type;
            result.threads_by_type[threadType] = (result.threads_by_type[threadType] || 0) + 1;
          }
        } catch (error) {
          result.errors.push({
            folder: folder.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          console.error(`Error processing folder ${folder.name}:`, error);
        }
      }

      console.log("Thread discovery completed:", result);
      return result;
    } catch (error) {
      console.error("Thread discovery failed:", error);
      throw error;
    }
  }

  /**
   * Process a single thread folder
   */
  private async processThreadFolder(
    folderName: string,
    folderPath: string
  ): Promise<DiscoveredThread | null> {
    // Fetch AGX.json from the folder
    const agxJsonUrl = `${this.GITHUB_RAW_BASE}/${folderPath}/AGX.json`;

    const response = await fetch(agxJsonUrl, {
      headers: {
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Skipping ${folderName}: No AGX.json found`);
        return null;
      }
      throw new Error(`Failed to fetch AGX.json: ${response.status}`);
    }

    const agxManifest = await response.json() as AGXManifest;

    // Validate manifest
    this.validateManifest(agxManifest, folderName);

    return {
      agx_manifest: agxManifest,
      folder_name: folderName,
      source_url: `${this.GITHUB_REPO_URL}/../blob/main/${folderPath}`,
    };
  }

  /**
   * Validate AGX.json manifest structure
   */
  private validateManifest(manifest: AGXManifest, folderName: string): void {
    const required = [
      "name",
      "version",
      "description",
      "author",
      "logic",
      "thread_type",
      "supported_networks",
    ];

    for (const field of required) {
      if (!(field in manifest)) {
        throw new Error(`Missing required field '${field}' in ${folderName}/AGX.json`);
      }
    }

    const validThreadTypes = ["dex", "bridge", "lending", "yield_farming", "network_infra", "other"];
    if (!validThreadTypes.includes(manifest.thread_type)) {
      throw new Error(`Invalid thread_type '${manifest.thread_type}' in ${folderName}/AGX.json`);
    }

    if (!Array.isArray(manifest.supported_networks) || manifest.supported_networks.length === 0) {
      throw new Error(`supported_networks must be a non-empty array in ${folderName}/AGX.json`);
    }
  }

  /**
   * Compute content hash for versioning (SHA256 of AGX.json)
   */
  private computeContentHash(manifest: AGXManifest): string {
    const content = JSON.stringify(manifest, Object.keys(manifest).sort());
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Generate provider_id from name and author (slugified)
   */
  private generateProviderId(name: string, author: string): string {
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return `${slugify(name)}-${slugify(author)}`;
  }

  /**
   * Upsert thread to registry
   * Returns true if new entry was created, false if updated
   */
  private async upsertThreadRegistry(
    registryId: string,
    discovered: DiscoveredThread
  ): Promise<boolean> {
    const { agx_manifest, source_url } = discovered;

    // Check if exists
    const existing = await db
      .selectFrom("thread_registry")
      .select("id")
      .where("id", "=", registryId)
      .executeTakeFirst();

    const providerId = this.generateProviderId(agx_manifest.name, agx_manifest.author);

    const registryData: Omit<ThreadRegistryTable, "discovered_at" | "last_validated_at"> = {
      id: registryId,
      name: agx_manifest.name,
      version: agx_manifest.version,
      provider_id: providerId,
      author: agx_manifest.author,
      thread_type: agx_manifest.thread_type,
      supported_networks: agx_manifest.supported_networks,
      logic_path: agx_manifest.logic,
      ui_entry: agx_manifest.ui?.entry ?? null,
      agx_manifest: {
        description: agx_manifest.description,
        ui: agx_manifest.ui
          ? {
              supports_iframe: agx_manifest.ui.supports_iframe,
              responsive: agx_manifest.ui.responsive,
              dimensions: agx_manifest.ui.dimensions,
            }
          : undefined,
        storage_schema: agx_manifest.storage_schema,
        api_endpoints: agx_manifest.api_endpoints,
        features: agx_manifest.features,
        permissions: agx_manifest.permissions,
        created_at: agx_manifest.created_at,
      },
      source_url,
    };

    if (existing) {
      // Update existing entry
      await db
        .updateTable("thread_registry")
        .set({
          ...registryData,
          last_validated_at: sql`CURRENT_TIMESTAMP`,
        })
        .where("id", "=", registryId)
        .execute();

      console.log(`Updated thread registry: ${agx_manifest.name} (${registryId})`);
      return false;
    } else {
      // Insert new entry
      await db
        .insertInto("thread_registry")
        .values(registryData as any)
        .execute();

      console.log(`Inserted new thread: ${agx_manifest.name} (${registryId})`);
      return true;
    }
  }

  /**
   * Get threads by type from registry
   */
  async getThreadsByType(
    threadType?: "dex" | "bridge" | "lending" | "yield_farming" | "network_infra" | "other"
  ) {
    let query = db.selectFrom("thread_registry").selectAll();

    if (threadType) {
      query = query.where("thread_type", "=", threadType);
    }

    return await query.execute();
  }

  /**
   * Get all threads grouped by type
   */
  async getThreadsGroupedByType() {
    const threads = await db.selectFrom("thread_registry").selectAll().execute();

    const grouped: Record<string, typeof threads> = {};

    for (const thread of threads) {
      if (!grouped[thread.thread_type]) {
        grouped[thread.thread_type] = [];
      }
      grouped[thread.thread_type].push(thread);
    }

    return grouped;
  }
}

// Export singleton instance
export const threadDiscoveryService = new ThreadDiscoveryService();
