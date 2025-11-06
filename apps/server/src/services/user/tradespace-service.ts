import { db } from "@/infrastructure/database/turso-connection";
import { NewOrb, OrbUpdate } from "@/models/Orb";
import { PolicyUpdate } from "@/models/Policy";
import { NewSector, SectorUpdate } from "@/models/Sector";
import { NewThread, ThreadUpdate } from "@/models/Thread";
import { walletService } from "@/services/system/wallet/wallet-service";
import { ChainType } from "@/types/orb";
import { PolicyDocument } from "@/types/policy";
import { ThreadType } from "@/types/threads";

// TypeScript interfaces for getUserTradespace return type
interface TradespaceThread {
  id: number;
  type: ThreadType;
  provider_id: string;
  enabled: boolean;
  config_json: Record<string, any>;
}

interface TradespaceOrb {
  id: number;
  name: string;
  chain: ChainType;
  wallet_address: string;
  asset_pairs: Record<string, number>;
  config_json: Record<string, any> | null;
  threads: TradespaceThread[];
}

interface TradespaceSector {
  id: number;
  name: string;
  type: "live_trading" | "paper_trading";
  settings: Record<string, any> | null;
  created_at: Date;
  orbs: TradespaceOrb[];
}

interface UserTradespace {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date | null;
  password_hash: string;
  sectors: TradespaceSector[];
}

export const tradespaceService = {
  // ==================== SECTOR OPERATIONS ====================

  async getUserSectors(userId: number) {
    return await db
      .selectFrom("sectors")
      .selectAll()
      .where("user_id", "=", userId)
      .orderBy("created_at", "desc")
      .execute();
  },

  async getSectorById(sectorId: number, userId: number) {
    return await db
      .selectFrom("sectors")
      .selectAll()
      .where("id", "=", sectorId)
      .where("user_id", "=", userId)
      .executeTakeFirst();
  },

  async createSector(userId: number, sectorData: Omit<NewSector, "user_id">) {
    const newSector: NewSector = {
      ...sectorData,
      user_id: userId,
    };

    return await db
      .insertInto("sectors")
      .values(newSector)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async updateSector(sectorId: number, userId: number, updates: SectorUpdate) {
    // Verify ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    const updateData: SectorUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return await db
      .updateTable("sectors")
      .set(updateData)
      .where("id", "=", sectorId)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async deleteSector(sectorId: number, userId: number) {
    // Verify ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    await db.deleteFrom("sectors").where("id", "=", sectorId).execute();
  },

  // ==================== ORB OPERATIONS ====================

  async getOrbsBySector(sectorId: number, userId: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .selectFrom("orbs")
      .selectAll()
      .where("sector_id", "=", sectorId)
      .orderBy("created_at", "desc")
      .execute();
  },

  async getOrbById(orbId: number, userId: number) {
    return await db
      .selectFrom("orbs")
      .innerJoin("sectors", "orbs.sector_id", "sectors.id")
      .selectAll("orbs")
      .where("orbs.id", "=", orbId)
      .where("sectors.user_id", "=", userId)
      .executeTakeFirst();
  },

  async getOrbWithThreads(orbId: number, userId: number) {
    const orb = await this.getOrbById(orbId, userId);
    if (!orb) {
      return null;
    }

    const threads = await db
      .selectFrom("threads")
      .innerJoin("thread_registry", "threads.registry_id", "thread_registry.id")
      .selectAll("threads")
      .select([
        "thread_registry.name as registry_name",
        "thread_registry.thread_type",
        "thread_registry.supported_networks",
      ])
      .where("orb_id", "=", orbId)
      .execute();

    // Derive chain from network thread
    const networkThread = threads.find((t) => t.thread_type === "network_infra");
    const chain = networkThread?.supported_networks?.[0] || null;

    return { ...orb, threads, chain };
  },

  async createOrb(
    userId: number,
    orbData: {
      sector_id: number;
      name: string;
      network_thread_registry_id: string;
      asset_pairs: Record<string, number>;
      config_json?: Record<string, any>;
      context?: string;
    }
  ) {
    // Verify sector ownership
    const sector = await this.getSectorById(orbData.sector_id, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    // Fetch the network thread from registry
    const registryEntry = await db
      .selectFrom("thread_registry")
      .selectAll()
      .where("id", "=", orbData.network_thread_registry_id)
      .where("thread_type", "=", "network_infra")
      .executeTakeFirst();

    if (!registryEntry) {
      throw new Error("Network thread not found in registry");
    }

    // Get the chain from the registry's supported_networks
    const chain = registryEntry.supported_networks[0] as ChainType;
    if (!chain) {
      throw new Error("Registry entry has no supported networks");
    }

    // Generate wallet for the orb
    let walletAddress: string;
    let privyWalletId: string;

    try {
      const orbId = `orb_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const walletResult = await walletService.generateWallet({
        id: orbId,
        chain: chain,
        wallet_address: "",
        privy_wallet_id: "string",
        sectorType: sector.type,
      });
      walletAddress = walletResult.address;

      // For EVM chains, store the privy wallet ID (from publicKey field)
      if (chain !== "icp") {
        privyWalletId = walletResult.publicKey || walletResult.address;
      } else {
        // For ICP, we use a different identifier
        privyWalletId = orbId; // Use the generated orb ID as privy wallet ID for ICP
      }
    } catch (error) {
      console.error(`Failed to generate wallet for orb: ${error}`);
      throw new Error(`Failed to generate ${chain} wallet for orb`);
    }

    // Create the orb (without network_thread_id yet)
    const newOrb: NewOrb = {
      sector_id: orbData.sector_id,
      name: orbData.name,
      network_thread_id: null, // Will be set after creating thread
      wallet_address: walletAddress,
      privy_wallet_id: privyWalletId,
      asset_pairs: JSON.stringify(orbData.asset_pairs),
      config_json: orbData.config_json ? JSON.stringify(orbData.config_json) : "{}",
      context: orbData.context || null,
    };

    const createdOrb = await db
      .insertInto("orbs")
      .values(newOrb)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Create the network thread instance
    const networkThread = await db
      .insertInto("threads")
      .values({
        orb_id: createdOrb.id,
        registry_id: orbData.network_thread_registry_id,
        enabled: true,
        config_json: JSON.stringify({}), // Default empty config
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Link the orb to the network thread
    const updatedOrb = await db
      .updateTable("orbs")
      .set({ network_thread_id: networkThread.id })
      .where("id", "=", createdOrb.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return updatedOrb;
  },

  async updateOrb(
    orbId: number,
    userId: number,
    updates: {
      name?: string;
      asset_pairs?: Record<string, number>;
      config_json?: Record<string, any>;
      context?: string;
    }
  ) {
    // Verify ownership through sector
    const orb = await this.getOrbById(orbId, userId);
    if (!orb) {
      throw new Error("Orb not found");
    }

    const { asset_pairs, config_json, context, ...otherUpdates } = updates;
    const updateData: OrbUpdate = {
      ...otherUpdates,
      ...(asset_pairs && { asset_pairs: JSON.stringify(asset_pairs) }),
      ...(config_json && { config_json: JSON.stringify(config_json) }),
      ...(context !== undefined && { context }),
      updated_at: new Date().toISOString(),
    };

    return await db
      .updateTable("orbs")
      .set(updateData)
      .where("id", "=", orbId)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async deleteOrb(orbId: number, userId: number) {
    // Verify ownership through sector
    const orb = await this.getOrbById(orbId, userId);
    if (!orb) {
      throw new Error("Orb not found");
    }

    await db.deleteFrom("orbs").where("id", "=", orbId).execute();
  },

  // ==================== THREAD OPERATIONS ====================

  async getThreadsByOrb(orbId: number, userId: number) {
    // Verify orb ownership
    const orb = await this.getOrbById(orbId, userId);
    if (!orb) {
      throw new Error("Orb not found");
    }

    return await db
      .selectFrom("threads")
      .innerJoin("thread_registry", "threads.registry_id", "thread_registry.id")
      .selectAll("threads")
      .select([
        "thread_registry.name as registry_name",
        "thread_registry.provider_id",
        "thread_registry.thread_type",
        "thread_registry.supported_networks",
        "thread_registry.agx_manifest",
      ])
      .where("threads.orb_id", "=", orbId)
      .orderBy("threads.created_at", "desc")
      .execute();
  },

  async getThreadById(threadId: number, userId: number) {
    return await db
      .selectFrom("threads")
      .innerJoin("thread_registry", "threads.registry_id", "thread_registry.id")
      .innerJoin("orbs", "threads.orb_id", "orbs.id")
      .innerJoin("sectors", "orbs.sector_id", "sectors.id")
      .selectAll("threads")
      .select([
        "thread_registry.name as registry_name",
        "thread_registry.provider_id",
        "thread_registry.thread_type",
        "thread_registry.supported_networks",
        "thread_registry.agx_manifest",
      ])
      .where("threads.id", "=", threadId)
      .where("sectors.user_id", "=", userId)
      .executeTakeFirst();
  },

  async createThread(
    userId: number,
    threadData: {
      orb_id: number;
      type: ThreadType;
      provider: string;
      enabled?: boolean;
      config_json?: Record<string, any>;
      description?: string;
    }
  ) {
    // Verify orb ownership
    const orb = await this.getOrbById(threadData.orb_id, userId);
    if (!orb) {
      throw new Error("Orb not found");
    }

    const newThread: NewThread = {
      orb_id: threadData.orb_id,
      type: threadData.type,
      provider_id: threadData.provider,
      enabled: threadData.enabled ?? true,
      config_json: threadData.config_json ? JSON.stringify(threadData.config_json) : "{}",
      description: threadData.description || null,
    };

    return await db
      .insertInto("threads")
      .values(newThread)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async updateThread(
    threadId: number,
    userId: number,
    updates: {
      provider?: string;
      enabled?: boolean;
      config_json?: Record<string, any>;
      description?: string;
    }
  ) {
    // Verify ownership through orb->sector
    const thread = await this.getThreadById(threadId, userId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const { config_json, description, ...otherUpdates } = updates;
    const updateData: ThreadUpdate = {
      ...otherUpdates,
      ...(config_json && { config_json: JSON.stringify(config_json) }),
      ...(description !== undefined && { description }),
      updated_at: new Date().toISOString(),
    };

    return await db
      .updateTable("threads")
      .set(updateData)
      .where("id", "=", threadId)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async deleteThread(threadId: number, userId: number) {
    // Verify ownership through orb->sector
    const thread = await this.getThreadById(threadId, userId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    await db.deleteFrom("threads").where("id", "=", threadId).execute();
  },

  // ==================== POLICY OPERATIONS ====================

  async getSectorPolicy(sectorId: number, userId: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .selectAll()
      .executeTakeFirst();
  },

  async getSectorPolicyByVersion(sectorId: number, userId: number, version: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .where("version", "=", version)
      .selectAll()
      .executeTakeFirst();
  },

  async createSectorPolicy(
    sectorId: number,
    userId: number,
    policyDocument: PolicyDocument,
    aiCritique?: string
  ) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    const maxVersionResult = await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .select(db.fn.max("version").as("max_version"))
      .executeTakeFirst();

    const nextVersion = (maxVersionResult?.max_version || 0) + 1;

    // Deactivate current active policy
    await db
      .updateTable("sector_policies")
      .set({ is_active: false })
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .execute();

    // Create new policy version
    const newPolicy = await db
      .insertInto("sector_policies")
      .values({
        sector_id: sectorId,
        policy_document: JSON.stringify(policyDocument),
        version: nextVersion,
        is_active: true,
        ai_critique: aiCritique || null,
      })
      .returningAll()
      .executeTakeFirst();

    // Update sector to reference this policy version
    if (newPolicy) {
      await db
        .updateTable("sectors")
        .set({ active_policy_version: nextVersion })
        .where("id", "=", sectorId)
        .execute();
    }

    return newPolicy;
  },

  async updateSectorPolicy(sectorId: number, userId: number, policyUpdate: PolicyUpdate) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .updateTable("sector_policies")
      .set(policyUpdate)
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .execute();
  },

  async getSectorPolicyHistory(sectorId: number, userId: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .orderBy("version", "desc")
      .selectAll()
      .execute();
  },

  async activatePolicyVersion(sectorId: number, userId: number, version: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    // Deactivate current active policy
    await db
      .updateTable("sector_policies")
      .set({ is_active: false })
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .execute();

    // Activate specified version
    await db
      .updateTable("sector_policies")
      .set({ is_active: true })
      .where("sector_id", "=", sectorId)
      .where("version", "=", version)
      .execute();

    // Update sector to reference this policy version
    await db
      .updateTable("sectors")
      .set({ active_policy_version: version })
      .where("id", "=", sectorId)
      .execute();

    return await this.getSectorPolicyByVersion(sectorId, userId, version);
  },

  // ==================== COMPLEX QUERIES ====================

  async getUserTradespace(userId: number): Promise<UserTradespace | null> {
    // Get user first
    const user = await db
      .selectFrom("users")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirst();

    if (!user) return null;

    // Get user's sectors using existing method
    const sectors = await this.getUserSectors(userId);

    // For each sector, get its orbs with threads using existing methods
    const sectorsWithOrbs: TradespaceSector[] = await Promise.all(
      sectors.map(async (sector) => {
        const orbs = await this.getOrbsBySector(sector.id, userId);

        // For each orb, get its threads using existing method
        const orbsWithThreads: TradespaceOrb[] = await Promise.all(
          orbs.map(async (orb) => {
            const threads = await this.getThreadsByOrb(orb.id, userId);

            // Derive chain from network thread
            const networkThread = threads.find((t) => t.thread_type === "network_infra");
            const chain = (networkThread?.supported_networks?.[0] as ChainType) || "ethereum";

            return {
              id: orb.id,
              name: orb.name,
              chain,
              wallet_address: orb.wallet_address,
              asset_pairs:
                typeof orb.asset_pairs === "string"
                  ? JSON.parse(orb.asset_pairs)
                  : orb.asset_pairs,
              config_json:
                typeof orb.config_json === "string"
                  ? JSON.parse(orb.config_json)
                  : orb.config_json,
              threads: threads.map((thread) => ({
                id: thread.id,
                type: thread.type,
                provider_id: thread.provider_id,
                enabled: thread.enabled,
                config_json:
                  typeof thread.config_json === "string"
                    ? JSON.parse(thread.config_json)
                    : thread.config_json,
              })),
            };
          })
        );

        return {
          id: sector.id,
          name: sector.name,
          type: sector.type,
          settings: sector.settings,
          created_at: sector.created_at,
          orbs: orbsWithThreads,
        };
      })
    );

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      password_hash: user.password_hash,
      sectors: sectorsWithOrbs,
    };
  },
};
