import { db } from "@/infrastructure/database/turso-connection";
import { Strategy, StrategyRevision } from "@/models/Strategy";

export const backtestService = {
  // ============ Strategy Code Operations ============

  async createStrategy(
    userId: number,
    name: string,
    initialCode: string
  ): Promise<Strategy> {
    const now = new Date().toISOString();
    const newRevision: StrategyRevision = {
      code: initialCode,
      created_at: now,
      results: null,
    };

    const result = await db
      .insertInto("strategies")
      .values({
        user_id: userId,
        name,
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([newRevision]),
        created_at: now,
        updated_at: now,
      })
      .executeTakeFirstOrThrow();

    // Fetch and return the created strategy
    return await db
      .selectFrom("strategies")
      .where("id", "=", Number(result.insertId))
      .selectAll()
      .executeTakeFirstOrThrow();
  },

  async getStrategiesByUser(userId: number): Promise<Strategy[]> {
    return await db
      .selectFrom("strategies")
      .where("user_id", "=", userId)
      .where("is_active", "=", true)
      .orderBy("updated_at", "desc")
      .selectAll()
      .execute();
  },

  async getStrategyById(strategyId: number, userId: number): Promise<Strategy | undefined> {
    return await db
      .selectFrom("strategies")
      .where("id", "=", strategyId)
      .where("user_id", "=", userId)
      .selectAll()
      .executeTakeFirst();
  },

  async addRevision(
    strategyId: number,
    userId: number,
    code: string
  ): Promise<Strategy> {
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions: StrategyRevision[] = JSON.parse(strategy.revisions as string);
    const newRevision: StrategyRevision = {
      code,
      created_at: new Date().toISOString(),
      results: null,
    };

    // Keep max 5 revisions (FIFO queue)
    const updatedRevisions = [newRevision, ...revisions].slice(0, 5);

    await db
      .updateTable("strategies")
      .where("id", "=", strategyId)
      .set({
        revisions: JSON.stringify(updatedRevisions),
        updated_at: new Date().toISOString(),
      })
      .execute();

    return await db
      .selectFrom("strategies")
      .where("id", "=", strategyId)
      .selectAll()
      .executeTakeFirstOrThrow();
  },

  async deleteStrategy(strategyId: number, userId: number): Promise<void> {
    await db
      .updateTable("strategies")
      .where("id", "=", strategyId)
      .where("user_id", "=", userId)
      .set({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .execute();
  },

  async getActiveRevision(
    strategyId: number,
    userId: number
  ): Promise<StrategyRevision | null> {
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions: StrategyRevision[] = JSON.parse(strategy.revisions as string);
    return revisions[strategy.active_revision_index] || null;
  },

  async setActiveRevision(
    strategyId: number,
    userId: number,
    revisionIndex: number
  ): Promise<Strategy> {
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions: StrategyRevision[] = JSON.parse(strategy.revisions as string);
    if (revisionIndex < 0 || revisionIndex >= revisions.length) {
      throw new Error(
        `Invalid revision index ${revisionIndex}. Must be between 0 and ${revisions.length - 1}`
      );
    }

    await db
      .updateTable("strategies")
      .where("id", "=", strategyId)
      .set({
        active_revision_index: revisionIndex,
        updated_at: new Date().toISOString(),
      })
      .execute();

    return await db
      .selectFrom("strategies")
      .where("id", "=", strategyId)
      .selectAll()
      .executeTakeFirstOrThrow();
  },

  // ============ Backtest Execution Operations ============

  async queueBacktest(
    strategyId: number,
    userId: number,
    revisionIndex: number,
    config: {
      startDate: string;
      endDate: string;
      initialCapital: number;
      commission: number;
    }
  ): Promise<Strategy> {
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions: StrategyRevision[] = JSON.parse(strategy.revisions as string);
    if (revisionIndex < 0 || revisionIndex >= revisions.length) {
      throw new Error(
        `Invalid revision index ${revisionIndex}. Must be between 0 and ${revisions.length - 1}`
      );
    }

    // TODO: Check queue limits (1 per user, 2 system-wide)
    // This will be implemented when queue is set up

    await db
      .updateTable("strategies")
      .where("id", "=", strategyId)
      .set({
        status: "queued",
        updated_at: new Date().toISOString(),
      })
      .execute();

    return await db
      .selectFrom("strategies")
      .where("id", "=", strategyId)
      .selectAll()
      .executeTakeFirstOrThrow();
  },

  async startBacktest(
    strategyId: number,
    userId: number,
    revisionIndex: number
  ): Promise<Strategy> {
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions: StrategyRevision[] = JSON.parse(strategy.revisions as string);
    const revision = revisions[revisionIndex];
    if (!revision) {
      throw new Error(`Revision ${revisionIndex} not found`);
    }

    // Set started_at for this revision
    revision.results = revision.results || {
      metrics: null,
      html_report: null,
      error_message: null,
      started_at: new Date().toISOString(),
      completed_at: null,
    };
    revision.results.started_at = new Date().toISOString();

    revisions[revisionIndex] = revision;

    await db
      .updateTable("strategies")
      .where("id", "=", strategyId)
      .set({
        status: "running",
        revisions: JSON.stringify(revisions),
        updated_at: new Date().toISOString(),
      })
      .execute();

    return await db
      .selectFrom("strategies")
      .where("id", "=", strategyId)
      .selectAll()
      .executeTakeFirstOrThrow();
  },

  async completeBacktest(
    strategyId: number,
    userId: number,
    revisionIndex: number,
    results: {
      metrics: {
        total_return: number;
        sharpe_ratio: number;
        max_drawdown: number;
        win_rate: number;
        total_trades: number;
      };
      html_report: string;
    }
  ): Promise<Strategy> {
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions: StrategyRevision[] = JSON.parse(strategy.revisions as string);
    const revision = revisions[revisionIndex];
    if (!revision) {
      throw new Error(`Revision ${revisionIndex} not found`);
    }

    revision.results = {
      metrics: results.metrics,
      html_report: results.html_report,
      error_message: null,
      started_at: revision.results?.started_at || new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    revisions[revisionIndex] = revision;

    await db
      .updateTable("strategies")
      .where("id", "=", strategyId)
      .set({
        status: "completed",
        revisions: JSON.stringify(revisions),
        updated_at: new Date().toISOString(),
      })
      .execute();

    return await db
      .selectFrom("strategies")
      .where("id", "=", strategyId)
      .selectAll()
      .executeTakeFirstOrThrow();
  },

  async failBacktest(
    strategyId: number,
    userId: number,
    revisionIndex: number,
    errorMessage: string
  ): Promise<Strategy> {
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions: StrategyRevision[] = JSON.parse(strategy.revisions as string);
    const revision = revisions[revisionIndex];
    if (!revision) {
      throw new Error(`Revision ${revisionIndex} not found`);
    }

    revision.results = {
      metrics: null,
      html_report: null,
      error_message: errorMessage,
      started_at: revision.results?.started_at || new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    revisions[revisionIndex] = revision;

    await db
      .updateTable("strategies")
      .where("id", "=", strategyId)
      .set({
        status: "failed",
        revisions: JSON.stringify(revisions),
        updated_at: new Date().toISOString(),
      })
      .execute();

    return await db
      .selectFrom("strategies")
      .where("id", "=", strategyId)
      .selectAll()
      .executeTakeFirstOrThrow();
  },

  async getRevisionResults(
    strategyId: number,
    userId: number,
    revisionIndex: number
  ): Promise<StrategyRevision["results"] | null> {
    const strategy = await this.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions: StrategyRevision[] = JSON.parse(strategy.revisions as string);
    const revision = revisions[revisionIndex];
    if (!revision) {
      throw new Error(`Revision ${revisionIndex} not found`);
    }

    return revision.results || null;
  },
};