import { db } from "@/infrastructure/database/turso-connection";
import { strategyQueue } from "@/infrastructure/queues/config";
import {
  JournalEntryContent,
  JournalEntryType,
  UserActionContent,
  UserFeedbackContent,
} from "@/types/journal";

export const tradeActionService = {
  // == Trade Action Functions ==

  // Get full trade action details
  async getTradeAction(tradeActionId: number) {
    return await db
      .selectFrom("trade_actions")
      .where("id", "=", tradeActionId)
      .selectAll()
      .executeTakeFirst();
  },

  // Helper function to get sector ID from trade action
  async getSectorIdFromTradeAction(tradeActionId: number) {
    const result = await db
      .selectFrom("trade_actions")
      .where("trade_actions.id", "=", tradeActionId)
      .select("trade_actions.sector_id")
      .executeTakeFirst();

    return result?.sector_id;
  },

  // Get execution journal entry for a trade
  async getExecutionJournalEntry(tradeActionId: number) {
    return await db
      .selectFrom("journal_entries")
      .where("trade_action_id", "=", tradeActionId)
      .where("type", "=", "POSITION_ENTERED")
      .orderBy("created_at", "desc")
      .select(["content"])
      .executeTakeFirst();
  },

  // Get sector with user information
  async getSectorWithUser(sectorId: number) {
    return await db
      .selectFrom("sectors")
      .where("id", "=", sectorId)
      .select(["id", "user_id", "name", "type"])
      .executeTakeFirst();
  },

  // Get trades by sector
  async getTradesBySector(sectorId: number, userId: number) {
    return await db
      .selectFrom("trade_actions")
      .innerJoin("sectors", "sectors.id", "trade_actions.sector_id")
      .where("sectors.id", "=", sectorId)
      .where("sectors.user_id", "=", userId)
      .select([
        "trade_actions.id",
        "trade_actions.sector_id",
        "trade_actions.status",
        "trade_actions.is_active",
        "trade_actions.summary",
        "trade_actions.created_at",
        "trade_actions.updated_at",
      ])
      .orderBy("trade_actions.created_at", "desc")
      .execute();
  },

  // Get all trades across all user's sectors
  async getAggregateTradesByUser(userId: number) {
    return await db
      .selectFrom("trade_actions")
      .innerJoin("sectors", "sectors.id", "trade_actions.sector_id")
      .where("sectors.user_id", "=", userId)
      .select([
        "trade_actions.id",
        "trade_actions.sector_id",
        "trade_actions.status",
        "trade_actions.is_active",
        "trade_actions.summary",
        "trade_actions.created_at",
        "trade_actions.updated_at",
        "sectors.name as sector_name", // Include sector name for context
      ])
      .orderBy("trade_actions.created_at", "desc")
      .execute();
  },

  async startNewTradeAction(sectorId: number) {
    return await db
      .insertInto("trade_actions")
      .values({
        sector_id: sectorId,
        status: "ANALYZING", // Start in the new 'ANALYZING' state
        is_active: true,
      })
      .returning("id")
      .executeTakeFirstOrThrow();
  },

  async updateTradeAction(
    tradeActionId: number,
    updates: {
      orb_id?: number;
      trading_pair?: string;
      status?: "ANALYZING" | "REJECTED" | "EXECUTING" | "SUCCEEDED" | "FAILED";
      is_active?: boolean;
      summary?: string;
    }
  ) {
    return await db
      .updateTable("trade_actions")
      .set({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", tradeActionId)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async getTradeActionById(tradeActionId: number, userId: number) {
    // Join with sectors to verify user ownership
    return await db
      .selectFrom("trade_actions")
      .innerJoin("sectors", "sectors.id", "trade_actions.sector_id")
      .where("trade_actions.id", "=", tradeActionId)
      .where("sectors.user_id", "=", userId)
      .select([
        "trade_actions.id",
        "trade_actions.sector_id",
        "trade_actions.status",
        "trade_actions.is_active",
        "trade_actions.summary",
        "trade_actions.created_at",
        "trade_actions.updated_at",
      ])
      .executeTakeFirst();
  },

  async getTradeStatus(tradeActionId: number) {
    return await db
      .selectFrom("trade_actions")
      .where("id", "=", tradeActionId)
      .select("status")
      .executeTakeFirst();
  },

  async setTradingPair(tradeActionId: number, orbId: number, tradingPair: string) {
    // First validate that the orb exists and belongs to the same sector as the trade
    const trade = await db
      .selectFrom("trade_actions")
      .where("id", "=", tradeActionId)
      .select(["sector_id", "orb_id", "trading_pair"])
      .executeTakeFirst();

    if (!trade) {
      throw new Error("Trade action not found");
    }

    if (trade.orb_id || trade.trading_pair) {
      throw new Error("Trading pair already set for this trade action");
    }

    // Validate orb belongs to the same sector
    const orb = await db
      .selectFrom("orbs")
      .where("id", "=", orbId)
      .where("sector_id", "=", trade.sector_id)
      .select(["id", "chain", "asset_pairs"])
      .executeTakeFirst();

    if (!orb) {
      throw new Error("Orb not found or does not belong to the same sector");
    }

    // Validate trading pair exists in orb's asset pairs
    const orbAssetPairs = orb.asset_pairs as Record<string, number> | null;
    if (!orbAssetPairs || !(tradingPair in orbAssetPairs)) {
      throw new Error("Trading pair not available in selected orb");
    }

    // Update the trade action
    await db
      .updateTable("trade_actions")
      .set({
        orb_id: orbId,
        trading_pair: tradingPair,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", tradeActionId)
      .execute();

    return { success: true };
  },

  async getTradingPairInfo(tradeActionId: number) {
    const result = await db
      .selectFrom("trade_actions")
      .innerJoin("orbs", "trade_actions.orb_id", "orbs.id")
      .where("trade_actions.id", "=", tradeActionId)
      .select([
        "trade_actions.trading_pair",
        "orbs.id as orb_id",
        "orbs.name as orb_name",
        "orbs.chain",
        "orbs.asset_pairs",
      ])
      .executeTakeFirst();

    return result;
  },

  async getOrbForTrade(tradeActionId: number) {
    const result = await db
      .selectFrom("trade_actions")
      .innerJoin("orbs", "trade_actions.orb_id", "orbs.id")
      .where("trade_actions.id", "=", tradeActionId)
      .select([
        "orbs.id",
        "orbs.name",
        "orbs.chain",
        "orbs.asset_pairs",
        "orbs.config_json",
      ])
      .executeTakeFirst();

    return result;
  },

  async getOrbById(orbId: number) {
    const result = await db
      .selectFrom("orbs")
      .where("id", "=", orbId)
      .selectAll()
      .executeTakeFirst();

    return result;
  },

  async updateTradeStatus(
    tradeActionId: number,
    status: "ANALYZING" | "REJECTED" | "EXECUTING" | "SUCCEEDED" | "FAILED"
  ) {
    const isActive = !["REJECTED", "SUCCEEDED", "FAILED"].includes(status);

    return await db
      .updateTable("trade_actions")
      .set({ status, is_active: isActive, updated_at: new Date().toISOString() })
      .where("id", "=", tradeActionId)
      .execute();
  },

  // == Journal Entry Functions ==

  async createJournalEntry({
    sectorId,
    tradeActionId,
    type,
    content,
    confidenceScore,
    isInternal = false,
  }: {
    sectorId: number;
    tradeActionId?: number;
    type: JournalEntryType;
    content: JournalEntryContent;
    confidenceScore?: number;
    isInternal?: boolean;
  }) {
    return await db
      .insertInto("journal_entries")
      .values({
        sector_id: sectorId,
        trade_action_id: tradeActionId,
        type,
        content: JSON.stringify(content),
        confidence_score: confidenceScore,
        is_internal: isInternal,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async getJournalForTradeAction(tradeActionId: number, includeInternal = false) {
    let query = db
      .selectFrom("journal_entries")
      .where("trade_action_id", "=", tradeActionId)
      .orderBy("created_at", "asc");

    if (!includeInternal) {
      query = query.where("is_internal", "=", false);
    }

    return await query.selectAll().execute();
  },

  // == User Interaction Journal Functions ==

  async addUserAction(tradeActionId: number, content: UserActionContent) {
    // Get sector ID from trade action
    const sectorId = await tradeActionService.getSectorIdFromTradeAction(tradeActionId);
    if (!sectorId) {
      throw new Error("Trade action not found or invalid");
    }

    // Automatically update the parent trade action's status
    if (content.action_type === "approve_trade") {
      await tradeActionService.updateTradeStatus(tradeActionId, "EXECUTING");
    } else if (content.action_type === "reject_trade") {
      await tradeActionService.updateTradeStatus(tradeActionId, "REJECTED");
    }

    return tradeActionService.createJournalEntry({
      sectorId,
      tradeActionId,
      type: "USER_ACTION",
      content,
    });
  },

  async interruptTradeAction(tradeActionId: number) {
    const schedulerId = `monitor-trade-${tradeActionId}`;

    // Get the trade action to check its status first
    const tradeAction = await tradeActionService.getTradeAction(tradeActionId);
    if (!tradeAction) {
      throw new Error("Trade action not found or invalid");
    }
    if (!tradeAction.is_active) {
      throw new Error("Cannot interrupt a trade that is already completed.");
    }

    const sectorId = tradeAction.sector_id;

    try {
      await strategyQueue.removeJobScheduler(schedulerId);
      console.log(
        `[trade-service] Removed job scheduler ${schedulerId} for interrupted trade action ${tradeActionId}.`
      );
    } catch (error) {
      console.error(
        `[trade-service] Failed to remove job scheduler for key ${schedulerId}:`,
        error
      );
      // Continue even if removal fails, to ensure trade status is updated.
    }

    await tradeActionService.updateTradeStatus(tradeActionId, "FAILED");

    return tradeActionService.createJournalEntry({
      sectorId,
      tradeActionId,
      type: "SYSTEM_ALERT",
      content: {
        message: "AI analysis was interrupted by the user.",
        alert_type: "info",
        severity: "low",
        requires_action: true,
      },
    });
  },

  async addUserFeedback(tradeActionId: number, content: UserFeedbackContent) {
    // Get sector ID from trade action
    const sectorId = await tradeActionService.getSectorIdFromTradeAction(tradeActionId);
    if (!sectorId) {
      throw new Error("Trade action not found or invalid");
    }

    // TODO: send message to the Mastra AI agent to update its model with this feedback.

    return tradeActionService.createJournalEntry({
      sectorId,
      tradeActionId,
      type: "USER_FEEDBACK",
      content,
    });
  },
};
