import { Request, Response } from "express";

import { portfolioService } from "@/services/trading/portfolio-service";
import { tradespaceService } from "@/services/user/tradespace-service";

const portfolioController = {
  async getSnapshots(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const userId = req.user.id;
      const sectorId = parseInt(req.params.sectorId);

      // Verify sector ownership
      const sector = await tradespaceService.getSectorById(sectorId, userId);
      if (!sector) {
        res.status(404).json({ error: "Sector not found" });
        return;
      }

      const snapshots = await portfolioService.getPortfolioSnapshots(sectorId);
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching portfolio snapshots:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching portfolio snapshots." });
    }
  },

  async getAggregateSnapshots(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const userId = req.user.id;
      const snapshots = await portfolioService.getAggregatePortfolioSnapshots(userId);
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching aggregate portfolio snapshots:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching aggregate portfolio snapshots." });
    }
  },
};

export default portfolioController;
