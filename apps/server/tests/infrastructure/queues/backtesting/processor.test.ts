import { beforeEach, describe, expect, test, vi, Mock } from "vitest";
import { backtestService } from "@/services/trading/backtest/backtest-service";
import { backtestExecutor } from "@/services/trading/backtest/backtest-executor";
import { Strategy, StrategyRevision } from "@/models/Strategy";

// Mock dependencies
vi.mock("@/services/trading/backtest/backtest-service");
vi.mock("@/services/trading/backtest/backtest-executor");

// Import the processor function
// Note: The processor is exported via module.exports, so we need to require it
let processorFunction: any;

describe("Backtest Queue Processor", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Dynamically import the processor (since it uses module.exports)
    const processor = await import(
      "@/infrastructure/queues/backtesting/processor"
    );
    processorFunction = processor.default || processor;
  });

  const createMockJob = (data: any) => ({
    data,
    log: vi.fn(),
    updateProgress: vi.fn(),
  });

  describe("successful backtest execution", () => {
    test("should complete full backtest pipeline successfully", async () => {
      const jobData = {
        strategyId: 1,
        userId: 1,
        revisionIndex: 0,
        config: {
          startDate: "2020-01-01",
          endDate: "2021-01-01",
          initialCapital: 10000,
          commission: 0.002,
        },
      };

      const mockJob = createMockJob(jobData);

      const mockRevision: StrategyRevision = {
        code: "class Strategy: pass",
        created_at: "2025-10-22",
        results: null,
      };

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: [mockRevision] as any, // Kysely parses JSON, so return as array
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBacktestResult = {
        metrics: {
          total_return: 15.5,
          sharpe_ratio: 1.8,
          max_drawdown: -8.5,
          win_rate: 62.5,
          total_trades: 45,
        },
        html_report: "<html>Report</html>",
      };

      (backtestService.startBacktest as Mock).mockResolvedValue(undefined);
      (backtestService.getStrategyById as Mock).mockResolvedValue(mockStrategy);
      (backtestExecutor.runBacktest as Mock).mockResolvedValue(
        mockBacktestResult
      );
      (backtestService.completeBacktest as Mock).mockResolvedValue(undefined);

      // Execute processor
      await processorFunction(mockJob);

      // Verify execution flow
      expect(backtestService.startBacktest).toHaveBeenCalledWith(1, 1, 0);
      expect(backtestService.getStrategyById).toHaveBeenCalledWith(1, 1);
      expect(backtestExecutor.runBacktest).toHaveBeenCalledWith(
        mockRevision.code,
        jobData.config
      );
      expect(backtestService.completeBacktest).toHaveBeenCalledWith(1, 1, 0, {
        metrics: mockBacktestResult.metrics,
        html_report: mockBacktestResult.html_report,
      });

      // Verify job logging
      expect(mockJob.log).toHaveBeenCalled();
      expect(mockJob.updateProgress).toHaveBeenCalledWith(25);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(75);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });
  });

  describe("error handling", () => {
    test("should handle strategy not found error", async () => {
      const jobData = {
        strategyId: 999,
        userId: 1,
        revisionIndex: 0,
        config: {
          startDate: "2020-01-01",
          endDate: "2021-01-01",
          initialCapital: 10000,
          commission: 0.002,
        },
      };

      const mockJob = createMockJob(jobData);

      (backtestService.startBacktest as Mock).mockResolvedValue(undefined);
      (backtestService.getStrategyById as Mock).mockResolvedValue(null);
      (backtestService.failBacktest as Mock).mockResolvedValue(undefined);

      await expect(processorFunction(mockJob)).rejects.toThrow(
        "Strategy 999 not found for user 1"
      );

      expect(backtestService.failBacktest).toHaveBeenCalledWith(
        999,
        1,
        0,
        "Strategy 999 not found for user 1"
      );
    });

    test("should handle revision not found error", async () => {
      const jobData = {
        strategyId: 1,
        userId: 1,
        revisionIndex: 5, // Out of bounds (max 5 revisions, 0-4 index)
        config: {
          startDate: "2020-01-01",
          endDate: "2021-01-01",
          initialCapital: 10000,
          commission: 0.002,
        },
      };

      const mockJob = createMockJob(jobData);

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: [
          { code: "code", created_at: "2025-10-22", results: null },
        ] as any, // Kysely parses JSON, so return as array
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.startBacktest as Mock).mockResolvedValue(undefined);
      (backtestService.getStrategyById as Mock).mockResolvedValue(mockStrategy);
      (backtestService.failBacktest as Mock).mockResolvedValue(undefined);

      await expect(processorFunction(mockJob)).rejects.toThrow(
        "Revision 5 not found for strategy 1"
      );

      expect(backtestService.failBacktest).toHaveBeenCalled();
    });

    test("should handle Python execution error", async () => {
      const jobData = {
        strategyId: 1,
        userId: 1,
        revisionIndex: 0,
        config: {
          startDate: "2020-01-01",
          endDate: "2021-01-01",
          initialCapital: 10000,
          commission: 0.002,
        },
      };

      const mockJob = createMockJob(jobData);

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: [
          { code: "invalid code", created_at: "2025-10-22", results: null },
        ] as any, // Kysely parses JSON, so return as array
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.startBacktest as Mock).mockResolvedValue(undefined);
      (backtestService.getStrategyById as Mock).mockResolvedValue(mockStrategy);
      (backtestExecutor.runBacktest as Mock).mockRejectedValue(
        new Error("Python syntax error")
      );
      (backtestService.failBacktest as Mock).mockResolvedValue(undefined);

      await expect(processorFunction(mockJob)).rejects.toThrow(
        "Python syntax error"
      );

      expect(backtestService.failBacktest).toHaveBeenCalledWith(
        1,
        1,
        0,
        "Python syntax error"
      );
    });

    test("should handle timeout error", async () => {
      const jobData = {
        strategyId: 1,
        userId: 1,
        revisionIndex: 0,
        config: {
          startDate: "2020-01-01",
          endDate: "2021-01-01",
          initialCapital: 10000,
          commission: 0.002,
        },
      };

      const mockJob = createMockJob(jobData);

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: [
          { code: "long running code", created_at: "2025-10-22", results: null },
        ] as any, // Kysely parses JSON, so return as array
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.startBacktest as Mock).mockResolvedValue(undefined);
      (backtestService.getStrategyById as Mock).mockResolvedValue(mockStrategy);
      (backtestExecutor.runBacktest as Mock).mockRejectedValue(
        new Error("Execution timeout after 300000ms")
      );
      (backtestService.failBacktest as Mock).mockResolvedValue(undefined);

      await expect(processorFunction(mockJob)).rejects.toThrow(
        "Execution timeout after 300000ms"
      );

      expect(backtestService.failBacktest).toHaveBeenCalledWith(
        1,
        1,
        0,
        "Execution timeout after 300000ms"
      );
    });

    test("should log error even if failBacktest throws", async () => {
      const consoleSpy = vi.spyOn(console, "error");
      const jobData = {
        strategyId: 1,
        userId: 1,
        revisionIndex: 0,
        config: {
          startDate: "2020-01-01",
          endDate: "2021-01-01",
          initialCapital: 10000,
          commission: 0.002,
        },
      };

      const mockJob = createMockJob(jobData);

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: [
          { code: "code", created_at: "2025-10-22", results: null },
        ] as any, // Kysely parses JSON, so return as array
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.startBacktest as Mock).mockResolvedValue(undefined);
      (backtestService.getStrategyById as Mock).mockResolvedValue(mockStrategy);
      (backtestExecutor.runBacktest as Mock).mockRejectedValue(
        new Error("Python error")
      );
      (backtestService.failBacktest as Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(processorFunction(mockJob)).rejects.toThrow("Python error");

      // Should log both errors
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Backtest failed"),
        expect.any(Object)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to save error state"),
        expect.any(Error)
      );
    });
  });

  describe("progress tracking", () => {
    test("should update job progress at each stage", async () => {
      const jobData = {
        strategyId: 1,
        userId: 1,
        revisionIndex: 0,
        config: {
          startDate: "2020-01-01",
          endDate: "2021-01-01",
          initialCapital: 10000,
          commission: 0.002,
        },
      };

      const mockJob = createMockJob(jobData);

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: [
          { code: "code", created_at: "2025-10-22", results: null },
        ] as any, // Kysely parses JSON, so return as array
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.startBacktest as Mock).mockResolvedValue(undefined);
      (backtestService.getStrategyById as Mock).mockResolvedValue(mockStrategy);
      (backtestExecutor.runBacktest as Mock).mockResolvedValue({
        metrics: {
          total_return: 10,
          sharpe_ratio: 1.5,
          max_drawdown: -5,
          win_rate: 60,
          total_trades: 30,
        },
        html_report: "<html></html>",
      });
      (backtestService.completeBacktest as Mock).mockResolvedValue(undefined);

      await processorFunction(mockJob);

      expect(mockJob.updateProgress).toHaveBeenCalledWith(25);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(75);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    test("should log at each major step", async () => {
      const jobData = {
        strategyId: 1,
        userId: 1,
        revisionIndex: 0,
        config: {
          startDate: "2020-01-01",
          endDate: "2021-01-01",
          initialCapital: 10000,
          commission: 0.002,
        },
      };

      const mockJob = createMockJob(jobData);

      const mockStrategy: Strategy = {
        id: 1,
        user_id: 1,
        name: "Test Strategy",
        status: "queued",
        active_revision_index: 0,
        is_active: true,
        revisions: [
          { code: "code", created_at: "2025-10-22", results: null },
        ] as any, // Kysely parses JSON, so return as array
        created_at: new Date(),
        updated_at: new Date(),
      };

      (backtestService.startBacktest as Mock).mockResolvedValue(undefined);
      (backtestService.getStrategyById as Mock).mockResolvedValue(mockStrategy);
      (backtestExecutor.runBacktest as Mock).mockResolvedValue({
        metrics: {
          total_return: 10,
          sharpe_ratio: 1.5,
          max_drawdown: -5,
          win_rate: 60,
          total_trades: 30,
        },
        html_report: "<html></html>",
      });
      (backtestService.completeBacktest as Mock).mockResolvedValue(undefined);

      await processorFunction(mockJob);

      expect(mockJob.log).toHaveBeenCalledWith(
        expect.stringContaining("Starting backtest")
      );
      expect(mockJob.log).toHaveBeenCalledWith(
        expect.stringContaining("Fetching strategy code")
      );
      expect(mockJob.log).toHaveBeenCalledWith(
        expect.stringContaining("Executing Python backtest")
      );
      expect(mockJob.log).toHaveBeenCalledWith(
        expect.stringContaining("Saving backtest results")
      );
    });
  });
});
