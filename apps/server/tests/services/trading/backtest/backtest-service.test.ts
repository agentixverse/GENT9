import { beforeEach, describe, expect, test, vi } from "vitest";
import { backtestService } from "@/services/trading/backtest/backtest-service";
import { Strategy, StrategyRevision } from "@/models/Strategy";

type MockDb = {
  insertInto: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  executeTakeFirstOrThrow: ReturnType<typeof vi.fn>;
  selectFrom: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  updateTable: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  selectAll: ReturnType<typeof vi.fn>;
  executeTakeFirst: ReturnType<typeof vi.fn>;
};

// Mock the database
vi.mock("@/infrastructure/database/turso-connection", () => ({
  db: {
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    selectFrom: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    updateTable: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    selectAll: vi.fn().mockReturnThis(),
    executeTakeFirstOrThrow: vi.fn(),
    executeTakeFirst: vi.fn(),
  },
}));

import { db } from "@/infrastructure/database/turso-connection";
const mockDb = db as unknown as MockDb;

describe("Backtest Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createStrategy", () => {
    test("should create a new strategy with initial code revision", async () => {
      const userId = 1;
      const name = "RSI Strategy";
      const code = "class Strategy: pass";

      mockDb.insertInto.mockReturnThis();
      mockDb.values.mockReturnThis();
      mockDb.executeTakeFirstOrThrow.mockResolvedValue({ insertId: 1 });

      const mockStrategy: Strategy = {
        id: 1,
        user_id: userId,
        name,
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([
          {
            code,
            created_at: expect.any(String),
            results: null,
          },
        ]),
        created_at: expect.any(Date),
        updated_at: expect.any(String),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ insertId: 1 });
      mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(mockStrategy);

      const result = await backtestService.createStrategy(userId, name, code);

      expect(mockDb.insertInto).toHaveBeenCalledWith("strategies");
      expect(result).toBeDefined();
      expect(result.name).toBe(name);
      expect(result.user_id).toBe(userId);
    });
  });

  describe("getStrategiesByUser", () => {
    test("should return all active strategies for a user ordered by updated_at desc", async () => {
      const userId = 1;
      const mockStrategies: Strategy[] = [
        {
          id: 1,
          user_id: userId,
          name: "Strategy 1",
          status: "idle",
          active_revision_index: 0,
          is_active: true,
          revisions: JSON.stringify([{ code: "code1", created_at: "", results: null }]),
          created_at: new Date("2025-10-01"),
          updated_at: new Date("2025-10-03"),
        },
        {
          id: 2,
          user_id: userId,
          name: "Strategy 2",
          status: "completed",
          active_revision_index: 0,
          is_active: true,
          revisions: JSON.stringify([{ code: "code2", created_at: "", results: null }]),
          created_at: new Date("2025-10-02"),
          updated_at: new Date("2025-10-02"),
        },
      ];

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.execute.mockResolvedValue(mockStrategies);

      const result = await backtestService.getStrategiesByUser(userId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("strategies");
      expect(mockDb.where).toHaveBeenCalledWith("user_id", "=", userId);
      expect(mockDb.where).toHaveBeenCalledWith("is_active", "=", true);
      expect(mockDb.orderBy).toHaveBeenCalledWith("updated_at", "desc");
      expect(result).toEqual(mockStrategies);
    });

    test("should return empty array when user has no strategies", async () => {
      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.execute.mockResolvedValue([]);

      const result = await backtestService.getStrategiesByUser(1);

      expect(result).toEqual([]);
    });
  });

  describe("getStrategyById", () => {
    test("should return strategy by id and userId", async () => {
      const userId = 1;
      const strategyId = 1;
      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([{ code: "code", created_at: "", results: null }]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValue(mockStrategy);

      const result = await backtestService.getStrategyById(strategyId, userId);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("strategies");
      expect(result).toEqual(mockStrategy);
    });

    test("should return undefined if strategy not found", async () => {
      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValue(undefined);

      const result = await backtestService.getStrategyById(999, 1);

      expect(result).toBeUndefined();
    });
  });

  describe("addRevision", () => {
    test("should add new revision to revisions array (max 5)", async () => {
      const strategyId = 1;
      const userId = 1;
      const newCode = "new code";

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([
          { code: "old code", created_at: "2025-10-01", results: null },
        ]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStrategy);

      mockDb.updateTable.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.execute.mockResolvedValue({});

      mockDb.executeTakeFirstOrThrow.mockResolvedValue({
        ...mockStrategy,
        revisions: JSON.stringify([
          { code: newCode, created_at: expect.any(String), results: null },
          { code: "old code", created_at: "2025-10-01", results: null },
        ]),
      });

      const result = await backtestService.addRevision(strategyId, userId, newCode);

      expect(mockDb.updateTable).toHaveBeenCalledWith("strategies");
      expect(mockDb.set).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test("should throw error if strategy not found", async () => {
      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValue(undefined);

      await expect(
        backtestService.addRevision(999, 1, "code")
      ).rejects.toThrow("Strategy 999 not found for user 1");
    });

    test("should keep only last 5 revisions (FIFO)", async () => {
      const strategyId = 1;
      const userId = 1;

      // Create strategy with 5 revisions
      const revisions: StrategyRevision[] = Array.from({ length: 5 }, (_, i) => ({
        code: `code${i}`,
        created_at: `2025-10-0${i + 1}`,
        results: null,
      }));

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify(revisions),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStrategy);

      mockDb.updateTable.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.execute.mockResolvedValue({});

      // Mock the returned strategy after update
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(mockStrategy);

      await backtestService.addRevision(strategyId, userId, "code6");

      // Verify that set was called with revisions array that has exactly 5 items
      expect(mockDb.set).toHaveBeenCalled();
      const setCall = (mockDb.set as any).mock.calls[0][0];
      const updatedRevisions = JSON.parse(setCall.revisions);
      expect(updatedRevisions).toHaveLength(5);
      expect(updatedRevisions[0].code).toBe("code6"); // New one at front
    });
  });

  describe("deleteStrategy", () => {
    test("should soft delete strategy by setting is_active to false", async () => {
      const strategyId = 1;
      const userId = 1;

      mockDb.updateTable.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.execute.mockResolvedValue({});

      await backtestService.deleteStrategy(strategyId, userId);

      expect(mockDb.updateTable).toHaveBeenCalledWith("strategies");
      expect(mockDb.set).toHaveBeenCalled();
      const setCall = (mockDb.set as any).mock.calls[0][0];
      expect(setCall.is_active).toBe(false);
    });
  });

  describe("getActiveRevision", () => {
    test("should return active revision by active_revision_index", async () => {
      const strategyId = 1;
      const userId = 1;

      const revisions: StrategyRevision[] = [
        { code: "code0", created_at: "2025-10-01", results: null },
        { code: "code1", created_at: "2025-10-02", results: null },
      ];

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 1,
        is_active: true,
        revisions: JSON.stringify(revisions),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValue(mockStrategy);

      const result = await backtestService.getActiveRevision(strategyId, userId);

      expect(result).toEqual(revisions[1]);
      expect(result?.code).toBe("code1");
    });
  });

  describe("setActiveRevision", () => {
    test("should update active_revision_index", async () => {
      const strategyId = 1;
      const userId = 1;

      const revisions: StrategyRevision[] = [
        { code: "code0", created_at: "2025-10-01", results: null },
        { code: "code1", created_at: "2025-10-02", results: null },
      ];

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify(revisions),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStrategy);

      mockDb.updateTable.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.execute.mockResolvedValue({});

      const updatedStrategy = { ...mockStrategy, active_revision_index: 1 };
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(updatedStrategy);

      const result = await backtestService.setActiveRevision(strategyId, userId, 1);

      expect(mockDb.updateTable).toHaveBeenCalledWith("strategies");
      const setCall = (mockDb.set as any).mock.calls[0][0];
      expect(setCall.active_revision_index).toBe(1);
      expect(result.active_revision_index).toBe(1);
    });

    test("should throw error if revision index out of bounds", async () => {
      const strategyId = 1;
      const userId = 1;

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([{ code: "code", created_at: "", results: null }]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValue(mockStrategy);

      await expect(
        backtestService.setActiveRevision(strategyId, userId, 5)
      ).rejects.toThrow("Invalid revision index");
    });
  });

  describe("queueBacktest", () => {
    test("should update strategy status to queued", async () => {
      const strategyId = 1;
      const userId = 1;
      const revisionIndex = 0;

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([{ code: "code", created_at: "", results: null }]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStrategy);

      mockDb.updateTable.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.execute.mockResolvedValue({});

      const queuedStrategy = { ...mockStrategy, status: "queued" };
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(queuedStrategy);

      const config = {
        startDate: "2025-01-01",
        endDate: "2025-10-17",
        initialCapital: 10000,
        commission: 0.001,
      };

      const result = await backtestService.queueBacktest(
        strategyId,
        userId,
        revisionIndex,
        config
      );

      expect(result.status).toBe("queued");
    });
  });

  describe("startBacktest", () => {
    test("should update status to running and set started_at", async () => {
      const strategyId = 1;
      const userId = 1;
      const revisionIndex = 0;

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([{ code: "code", created_at: "", results: null }]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStrategy);

      mockDb.updateTable.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.execute.mockResolvedValue({});

      const runningStrategy = { ...mockStrategy, status: "running" };
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(runningStrategy);

      const result = await backtestService.startBacktest(strategyId, userId, revisionIndex);

      expect(result.status).toBe("running");
      expect(mockDb.set).toHaveBeenCalled();
    });
  });

  describe("completeBacktest", () => {
    test("should update status to completed and store results", async () => {
      const strategyId = 1;
      const userId = 1;
      const revisionIndex = 0;

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "running",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([
          {
            code: "code",
            created_at: "",
            results: {
              metrics: null,
              html_report: null,
              error_message: null,
              started_at: new Date().toISOString(),
              completed_at: null,
            },
          },
        ]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStrategy);

      mockDb.updateTable.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.execute.mockResolvedValue({});

      const results = {
        metrics: {
          total_return: 15.3,
          sharpe_ratio: 1.8,
          max_drawdown: -8.5,
          win_rate: 62.5,
          total_trades: 45,
        },
        html_report: "<html></html>",
      };

      const completedStrategy = { ...mockStrategy, status: "completed" };
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(completedStrategy);

      const result = await backtestService.completeBacktest(
        strategyId,
        userId,
        revisionIndex,
        results
      );

      expect(result.status).toBe("completed");
      expect(mockDb.set).toHaveBeenCalled();
      const setCall = (mockDb.set as any).mock.calls[0][0];
      const revisions = JSON.parse(setCall.revisions);
      expect(revisions[revisionIndex].results.metrics).toBeDefined();
    });
  });

  describe("failBacktest", () => {
    test("should update status to failed and store error message", async () => {
      const strategyId = 1;
      const userId = 1;
      const revisionIndex = 0;
      const errorMessage = "Invalid Python syntax";

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "running",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([
          {
            code: "invalid code",
            created_at: "",
            results: {
              metrics: null,
              html_report: null,
              error_message: null,
              started_at: new Date().toISOString(),
              completed_at: null,
            },
          },
        ]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockStrategy);

      mockDb.updateTable.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.execute.mockResolvedValue({});

      const failedStrategy = { ...mockStrategy, status: "failed" };
      mockDb.executeTakeFirstOrThrow.mockResolvedValue(failedStrategy);

      const result = await backtestService.failBacktest(
        strategyId,
        userId,
        revisionIndex,
        errorMessage
      );

      expect(result.status).toBe("failed");
      const setCall = (mockDb.set as any).mock.calls[0][0];
      const revisions = JSON.parse(setCall.revisions);
      expect(revisions[revisionIndex].results.error_message).toBe(errorMessage);
    });
  });

  describe("getRevisionResults", () => {
    test("should return results for specific revision", async () => {
      const strategyId = 1;
      const userId = 1;
      const revisionIndex = 0;

      const results = {
        metrics: {
          total_return: 15.3,
          sharpe_ratio: 1.8,
          max_drawdown: -8.5,
          win_rate: 62.5,
          total_trades: 45,
        },
        html_report: "<html></html>",
        error_message: null,
        started_at: "2025-10-17T10:00:00Z",
        completed_at: "2025-10-17T10:05:00Z",
      };

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "completed",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([
          {
            code: "code",
            created_at: "2025-10-17",
            results,
          },
        ]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValue(mockStrategy);

      const result = await backtestService.getRevisionResults(
        strategyId,
        userId,
        revisionIndex
      );

      expect(result).toEqual(results);
    });

    test("should return null if revision has no results yet", async () => {
      const strategyId = 1;
      const userId = 1;
      const revisionIndex = 0;

      const mockStrategy: Strategy = {
        id: strategyId,
        user_id: userId,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([{ code: "code", created_at: "", results: null }]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.selectFrom.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.selectAll.mockReturnThis();
      mockDb.executeTakeFirst.mockResolvedValue(mockStrategy);

      const result = await backtestService.getRevisionResults(
        strategyId,
        userId,
        revisionIndex
      );

      expect(result).toBeNull();
    });
  });
});
