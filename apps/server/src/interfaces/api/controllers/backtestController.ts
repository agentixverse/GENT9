import { Request, Response } from "express";

import { backtestService } from "@/services/trading/backtest/backtest-service";

interface CreateStrategyRequestBody {
  name: string;
  initialCode: string;
}

interface AddRevisionRequestBody {
  code: string;
}

interface SetActiveRevisionRequestBody {
  revisionIndex: number;
}

interface RunBacktestRequestBody {
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  coinId?: string;
  days?: number;
}

const backtestController = {
  // ============ Strategy Management ============

  async listStrategies(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategies = await backtestService.getStrategiesByUser(userId);
      res.json({ strategies });
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  },

  async createStrategy(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { name, initialCode }: CreateStrategyRequestBody = req.body;

      const strategy = await backtestService.createStrategy(userId, name, initialCode);
      res.status(201).json({ strategy });
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(500).json({ error: "Failed to create strategy" });
    }
  },

  async getStrategy(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategyId = parseInt(req.params.strategyId);

      const strategy = await backtestService.getStrategyById(strategyId, userId);
      if (!strategy) {
        res.status(404).json({ error: "Strategy not found" });
        return;
      }

      res.json({ strategy });
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ error: "Failed to fetch strategy" });
    }
  },

  async addRevision(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategyId = parseInt(req.params.strategyId);
      const { code }: AddRevisionRequestBody = req.body;

      const strategy = await backtestService.addRevision(strategyId, userId, code);
      res.json({ strategy });
    } catch (error) {
      console.error("Error adding revision:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to add revision" });
      }
    }
  },

  async deleteStrategy(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategyId = parseInt(req.params.strategyId);

      await backtestService.deleteStrategy(strategyId, userId);
      res.json({ message: "Strategy deleted successfully" });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ error: "Failed to delete strategy" });
    }
  },

  async getActiveRevision(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategyId = parseInt(req.params.strategyId);

      const revision = await backtestService.getActiveRevision(strategyId, userId);
      if (!revision) {
        res.status(404).json({ error: "Active revision not found" });
        return;
      }

      res.json({ revision });
    } catch (error) {
      console.error("Error fetching active revision:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to fetch active revision" });
      }
    }
  },

  async setActiveRevision(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategyId = parseInt(req.params.strategyId);
      const { revisionIndex }: SetActiveRevisionRequestBody = req.body;

      const strategy = await backtestService.setActiveRevision(
        strategyId,
        userId,
        revisionIndex
      );
      res.json({ strategy });
    } catch (error) {
      console.error("Error setting active revision:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof Error && error.message.includes("Invalid revision index")) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to set active revision" });
      }
    }
  },

  // ============ Backtest Execution ============

  async runBacktest(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategyId = parseInt(req.params.strategyId);
      const revisionIndex = parseInt(req.params.revisionIndex);
      const config: RunBacktestRequestBody = req.body;

      const strategy = await backtestService.queueBacktest(
        strategyId,
        userId,
        revisionIndex,
        config
      );
      res.json({ strategy, message: "Backtest queued successfully" });
    } catch (error) {
      console.error("Error queueing backtest:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else if (
        error instanceof Error &&
        (error.message.includes("limit reached") || error.message.includes("already have"))
      ) {
        res.status(429).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to queue backtest" });
      }
    }
  },

  async getRevisionResults(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategyId = parseInt(req.params.strategyId);
      const revisionIndex = parseInt(req.params.revisionIndex);

      const results = await backtestService.getRevisionResults(
        strategyId,
        userId,
        revisionIndex
      );

      if (!results) {
        res.status(404).json({ error: "Results not found or backtest not completed yet" });
        return;
      }

      res.json({ results });
    } catch (error) {
      console.error("Error fetching revision results:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to fetch revision results" });
      }
    }
  },

  async getRevisionReport(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const strategyId = parseInt(req.params.strategyId);
      const revisionIndex = parseInt(req.params.revisionIndex);

      const results = await backtestService.getRevisionResults(
        strategyId,
        userId,
        revisionIndex
      );

      if (!results || !results.html_report) {
        res.status(404).json({ error: "HTML report not found or backtest not completed yet" });
        return;
      }

      // Return HTML directly for iframe display
      res.setHeader("Content-Type", "text/html");
      res.send(results.html_report);
    } catch (error) {
      console.error("Error fetching revision report:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to fetch revision report" });
      }
    }
  },
};

export default backtestController;
