import { beforeEach, describe, expect, test, vi, Mock } from "vitest";
import { Request, Response } from "express";
import backtestController from "@/interfaces/api/controllers/backtestController";
import { backtestService } from "@/services/trading/backtest/backtest-service";
import { Strategy } from "@/models/Strategy";

// Mock dependencies
vi.mock("@/services/trading/backtest/backtest-service");

describe("Backtest Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));

    mockReq = {
      user: { id: 1 } as any,
      params: {},
      body: {},
    };

    mockRes = {
      json: jsonMock,
      status: statusMock as any,
    };
  });

  describe("listStrategies", () => {
    test("should return list of user strategies", async () => {
      const mockStrategies: Strategy[] = [
        {
          id: 1,
          user_id: 1,
          name: "Strategy 1",
          status: "idle",
          active_revision_index: 0,
          is_active: true,
          revisions: JSON.stringify([]),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (backtestService.getStrategiesByUser as Mock).mockResolvedValue(
        mockStrategies
      );

      await backtestController.listStrategies(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.getStrategiesByUser).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith({ strategies: mockStrategies });
    });

    test("should handle errors with 500 status", async () => {
      (backtestService.getStrategiesByUser as Mock).mockRejectedValue(
        new Error("Database error")
      );

      await backtestController.listStrategies(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to fetch strategies",
      });
    });
  });

  describe("createStrategy", () => {
    test("should create a new strategy", async () => {
      mockReq.body = {
        name: "RSI Strategy",
        initialCode: "class Strategy: pass",
      };

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "RSI Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.createStrategy as Mock).mockResolvedValue(mockStrategy);

      await backtestController.createStrategy(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.createStrategy).toHaveBeenCalledWith(
        1,
        "RSI Strategy",
        "class Strategy: pass"
      );
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ strategy: mockStrategy });
    });

    test("should handle errors with 500 status", async () => {
      mockReq.body = {
        name: "Test",
        initialCode: "code",
      };

      (backtestService.createStrategy as Mock).mockRejectedValue(
        new Error("Creation error")
      );

      await backtestController.createStrategy(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to create strategy",
      });
    });
  });

  describe("getStrategy", () => {
    test("should return strategy by id", async () => {
      mockReq.params = { strategyId: "1" };

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.getStrategyById as Mock).mockResolvedValue(mockStrategy);

      await backtestController.getStrategy(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.getStrategyById).toHaveBeenCalledWith(1, 1);
      expect(jsonMock).toHaveBeenCalledWith({ strategy: mockStrategy });
    });

    test("should return 404 if strategy not found", async () => {
      mockReq.params = { strategyId: "999" };

      (backtestService.getStrategyById as Mock).mockResolvedValue(null);

      await backtestController.getStrategy(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Strategy not found" });
    });

    test("should handle errors with 500 status", async () => {
      mockReq.params = { strategyId: "1" };

      (backtestService.getStrategyById as Mock).mockRejectedValue(
        new Error("Database error")
      );

      await backtestController.getStrategy(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to fetch strategy",
      });
    });
  });

  describe("addRevision", () => {
    test("should add new revision to strategy", async () => {
      mockReq.params = { strategyId: "1" };
      mockReq.body = { code: "new code" };

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.addRevision as Mock).mockResolvedValue(mockStrategy);

      await backtestController.addRevision(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.addRevision).toHaveBeenCalledWith(1, 1, "new code");
      expect(jsonMock).toHaveBeenCalledWith({ strategy: mockStrategy });
    });

    test("should return 404 if strategy not found", async () => {
      mockReq.params = { strategyId: "999" };
      mockReq.body = { code: "code" };

      (backtestService.addRevision as Mock).mockRejectedValue(
        new Error("Strategy 999 not found for user 1")
      );

      await backtestController.addRevision(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Strategy 999 not found for user 1",
      });
    });

    test("should handle generic errors with 500 status", async () => {
      mockReq.params = { strategyId: "1" };
      mockReq.body = { code: "code" };

      (backtestService.addRevision as Mock).mockRejectedValue(
        new Error("Database error")
      );

      await backtestController.addRevision(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to add revision",
      });
    });
  });

  describe("deleteStrategy", () => {
    test("should soft delete strategy", async () => {
      mockReq.params = { strategyId: "1" };

      (backtestService.deleteStrategy as Mock).mockResolvedValue(undefined);

      await backtestController.deleteStrategy(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.deleteStrategy).toHaveBeenCalledWith(1, 1);
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Strategy deleted successfully",
      });
    });

    test("should handle errors with 500 status", async () => {
      mockReq.params = { strategyId: "1" };

      (backtestService.deleteStrategy as Mock).mockRejectedValue(
        new Error("Database error")
      );

      await backtestController.deleteStrategy(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to delete strategy",
      });
    });
  });

  describe("getActiveRevision", () => {
    test("should return active revision", async () => {
      mockReq.params = { strategyId: "1" };

      const mockRevision = {
        code: "active code",
        created_at: "2025-10-22",
        results: null,
      };

      (backtestService.getActiveRevision as Mock).mockResolvedValue(
        mockRevision
      );

      await backtestController.getActiveRevision(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.getActiveRevision).toHaveBeenCalledWith(1, 1);
      expect(jsonMock).toHaveBeenCalledWith({ revision: mockRevision });
    });

    test("should return 404 if strategy not found", async () => {
      mockReq.params = { strategyId: "999" };

      (backtestService.getActiveRevision as Mock).mockResolvedValue(null);

      await backtestController.getActiveRevision(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Active revision not found" });
    });
  });

  describe("setActiveRevision", () => {
    test("should set active revision index", async () => {
      mockReq.params = { strategyId: "1" };
      mockReq.body = { revisionIndex: 2 };

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "idle",
        active_revision_index: 2,
        is_active: true,
        revisions: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.setActiveRevision as Mock).mockResolvedValue(
        mockStrategy
      );

      await backtestController.setActiveRevision(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.setActiveRevision).toHaveBeenCalledWith(1, 1, 2);
      expect(jsonMock).toHaveBeenCalledWith({ strategy: mockStrategy });
    });

    test("should return 400 for invalid revision index", async () => {
      mockReq.params = { strategyId: "1" };
      mockReq.body = { revisionIndex: 10 };

      (backtestService.setActiveRevision as Mock).mockRejectedValue(
        new Error("Invalid revision index")
      );

      await backtestController.setActiveRevision(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid revision index",
      });
    });
  });

  describe("runBacktest", () => {
    test("should queue backtest successfully", async () => {
      mockReq.params = { strategyId: "1", revisionIndex: "0" };
      mockReq.body = {
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        initialCapital: 10000,
        commission: 0.002,
      };

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.queueBacktest as Mock).mockResolvedValue(mockStrategy);

      await backtestController.runBacktest(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.queueBacktest).toHaveBeenCalledWith(1, 1, 0, {
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        initialCapital: 10000,
        commission: 0.002,
      });
      expect(jsonMock).toHaveBeenCalledWith({
        message: "Backtest queued successfully",
        strategy: mockStrategy,
      });
    });

    test("should return 429 if queue limit reached", async () => {
      mockReq.params = { strategyId: "1", revisionIndex: "0" };
      mockReq.body = {
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        initialCapital: 10000,
        commission: 0.002,
      };

      (backtestService.queueBacktest as Mock).mockRejectedValue(
        new Error("User already have a backtest running") // Uses "already have" to match controller check
      );

      await backtestController.runBacktest(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "User already have a backtest running",
      });
    });

    test("should return 429 if limit reached message", async () => {
      mockReq.params = { strategyId: "1", revisionIndex: "0" };
      mockReq.body = {
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        initialCapital: 10000,
        commission: 0.002,
      };

      (backtestService.queueBacktest as Mock).mockRejectedValue(
        new Error("Queue limit reached")
      );

      await backtestController.runBacktest(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Queue limit reached",
      });
    });

    test("should return 404 if strategy not found", async () => {
      mockReq.params = { strategyId: "999", revisionIndex: "0" };
      mockReq.body = {
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        initialCapital: 10000,
        commission: 0.002,
      };

      (backtestService.queueBacktest as Mock).mockRejectedValue(
        new Error("Strategy 999 not found")
      );

      await backtestController.runBacktest(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Strategy 999 not found",
      });
    });
  });

  describe("getRevisionResults", () => {
    test("should return results for specific revision", async () => {
      mockReq.params = { strategyId: "1", revisionIndex: "0" };

      const mockResults = {
        metrics: {
          total_return: 15.5,
          sharpe_ratio: 1.8,
          max_drawdown: -8.5,
          win_rate: 62.5,
          total_trades: 45,
        },
        html_report: "<html></html>",
        error_message: null,
        started_at: "2025-10-22T10:00:00Z",
        completed_at: "2025-10-22T10:05:00Z",
      };

      (backtestService.getRevisionResults as Mock).mockResolvedValue(
        mockResults
      );

      await backtestController.getRevisionResults(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.getRevisionResults).toHaveBeenCalledWith(1, 1, 0);
      expect(jsonMock).toHaveBeenCalledWith({ results: mockResults });
    });

    test("should return 404 if revision has no results", async () => {
      mockReq.params = { strategyId: "1", revisionIndex: "0" };

      (backtestService.getRevisionResults as Mock).mockResolvedValue(null);

      await backtestController.getRevisionResults(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Results not found or backtest not completed yet",
      });
    });
  });

  describe("getRevisionReport", () => {
    test("should return HTML report", async () => {
      mockReq.params = { strategyId: "1", revisionIndex: "0" };

      const mockResults = {
        metrics: {
          total_return: 15.5,
          sharpe_ratio: 1.8,
          max_drawdown: -8.5,
          win_rate: 62.5,
          total_trades: 45,
        },
        html_report: "<html><body>Report</body></html>",
        error_message: null,
        started_at: "2025-10-22T10:00:00Z",
        completed_at: "2025-10-22T10:05:00Z",
      };

      (backtestService.getRevisionResults as Mock).mockResolvedValue(
        mockResults
      );

      const sendMock = vi.fn();
      mockRes.send = sendMock;
      mockRes.setHeader = vi.fn();

      await backtestController.getRevisionReport(
        mockReq as Request,
        mockRes as Response
      );

      expect(backtestService.getRevisionResults).toHaveBeenCalledWith(1, 1, 0);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "text/html"
      );
      expect(sendMock).toHaveBeenCalledWith(
        "<html><body>Report</body></html>"
      );
    });

    test("should return 404 if report not available", async () => {
      mockReq.params = { strategyId: "1", revisionIndex: "0" };

      (backtestService.getRevisionResults as Mock).mockResolvedValue(null);

      await backtestController.getRevisionReport(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "HTML report not found or backtest not completed yet",
      });
    });

    test("should return 404 if html_report is null", async () => {
      mockReq.params = { strategyId: "1", revisionIndex: "0" };

      const mockResults = {
        metrics: null,
        html_report: null,
        error_message: "Backtest failed",
        started_at: "2025-10-22T10:00:00Z",
        completed_at: "2025-10-22T10:05:00Z",
      };

      (backtestService.getRevisionResults as Mock).mockResolvedValue(
        mockResults
      );

      await backtestController.getRevisionReport(
        mockReq as Request,
        mockRes as Response
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "HTML report not found or backtest not completed yet",
      });
    });
  });
});
