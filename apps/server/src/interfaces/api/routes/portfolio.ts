import { Router } from "express";
import { z } from "zod";

import portfolioController from "@/interfaces/api/controllers/portfolioController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validator";

const router = Router();

const sectorIdSchema = z.object({
  params: z.object({
    sectorId: z.string().regex(/^\d+$/, { message: "Invalid sector ID" }),
  }),
});

router.use(protect);

// GET /api/portfolio/aggregate - Get aggregated portfolio data across all user's sectors
router.get("/aggregate", portfolioController.getAggregateSnapshots);

// GET /api/portfolio/:sectorId - Get portfolio snapshots for authenticated user's sector
router.get("/:sectorId", validate(sectorIdSchema), portfolioController.getSnapshots);

export default router;
