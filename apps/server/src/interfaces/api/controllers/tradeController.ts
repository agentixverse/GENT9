import { Request, Response } from "express";

import { neuralAgent } from "@/interfaces/neural";
import { tradeActionService } from "@/services/trading/trade-action-service";

const tradeController = {
  async getTradesBySector(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { sectorId } = req.params;
    const userId = req.user.id;

    try {
      const trades = await tradeActionService.getTradesBySector(
        parseInt(sectorId, 10),
        userId
      );
      res.status(200).json(trades);
      return;
    } catch (error) {
      console.error("Error fetching trades by sector:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async getAggregateTradesByUser(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.user.id;

    try {
      const trades = await tradeActionService.getAggregateTradesByUser(userId);
      res.status(200).json(trades);
      return;
    } catch (error) {
      console.error("Error fetching aggregate trades:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async getTradeDetails(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { tradeId } = req.params;
    const userId = req.user.id;

    try {
      const tradeAction = await tradeActionService.getTradeActionById(
        parseInt(tradeId, 10),
        userId
      );

      if (!tradeAction) {
        res.status(404).json({ error: "Trade action not found" });
        return;
      }

      const journalEntries = await tradeActionService.getJournalForTradeAction(
        tradeAction.id,
        false // Do not include internal entries
      );

      res.status(200).json({
        ...tradeAction,
        journal: journalEntries,
      });
      return;
    } catch (error) {
      console.error("Error fetching trade action details:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async postUserAction(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { tradeId } = req.params;
    const content = req.body; // Zod validation handles the shape
    const userId = req.user.id;

    try {
      const entry = await tradeActionService.addUserAction(parseInt(tradeId, 10), content);
      res.status(201).json(entry);
      return;
    } catch (error) {
      console.error("Error posting user action:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async interruptTrade(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { tradeId } = req.params;
    const userId = req.user.id;

    try {
      // First, log the user's intent to interrupt.
      await tradeActionService.interruptTradeAction(parseInt(tradeId, 10));

      // Then, signal the Neural Agent to stop the analysis.
      const wasRunning = neuralAgent.interruptAnalysis(parseInt(tradeId, 10));

      if (wasRunning) {
        res.status(200).json({ message: "Trade analysis interrupted successfully." });
      } else {
        res
          .status(404)
          .json({ error: "No active analysis found for this trade to interrupt." });
      }
      return;
    } catch (error) {
      console.error("Error interrupting trade action:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async postUserFeedback(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { tradeId } = req.params;
    const content = req.body; // Zod validation handles the shape
    const userId = req.user.id;

    try {
      const entry = await tradeActionService.addUserFeedback(
        parseInt(tradeId, 10),
        content
      );
      res.status(201).json(entry);
      return;
    } catch (error) {
      console.error("Error posting user feedback:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },
};

export default tradeController;
