import { Router } from "express";
import { z } from "zod";

import tradeController from "@/interfaces/api/controllers/tradeController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

const sectorIdSchema = z.object({
  params: z.object({
    sectorId: z.string().regex(/^\d+$/, { message: "Invalid sector ID" }),
  }),
});

const tradeIdSchema = z.object({
  params: z.object({
    tradeId: z.string().regex(/^\d+$/, { message: "Invalid trade ID" }),
  }),
});

const userActionSchema = z.object({
  params: z.object({
    tradeId: z.string().regex(/^\d+$/, { message: "Invalid trade ID" }),
  }),
  body: z.object({
    contentType: z.literal("USER_ACTION"),
    message: z.string(),
    action_type: z.enum([
      "approve",
      "reject",
      "modify",
      "manual_trade",
      "stop_ai",
      "resume_ai",
    ]),
    target_entry_id: z.number().optional(),
    details: z.record(z.any()).optional(),
    timestamp: z.string().datetime(),
  }),
});

const userFeedbackSchema = z.object({
  params: z.object({
    tradeId: z.string().regex(/^\d+$/, { message: "Invalid trade ID" }),
  }),
  body: z.object({
    contentType: z.literal("USER_FEEDBACK"),
    message: z.string(),
    target_entry_id: z.number(),
    feedback_type: z.enum(["rating", "comment", "suggestion"]),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
    helpful: z.boolean(),
  }),
});

router.use(protect);

// GET /api/trades/aggregate - Get all trades across all user's sectors
router.get("/aggregate", tradeController.getAggregateTradesByUser);

// GET /api/trades/sector/:sectorId - Get trades for authenticated user's sector
router.get(
  "/sector/:sectorId",
  validate(sectorIdSchema),
  tradeController.getTradesBySector
);

// GET /api/trades/:tradeId - Get trade details for authenticated user
router.get("/:tradeId", validate(tradeIdSchema), tradeController.getTradeDetails);

// POST /api/trades/:tradeId/action - Submit user action for authenticated user's trade
router.post("/:tradeId/action", validate(userActionSchema), tradeController.postUserAction);

// POST /api/trades/:tradeId/interrupt - Interrupt authenticated user's trade
router.post("/:tradeId/interrupt", validate(tradeIdSchema), tradeController.interruptTrade);

// POST /api/trades/:tradeId/feedback - Submit feedback for authenticated user's trade
router.post(
  "/:tradeId/feedback",
  validate(userFeedbackSchema),
  tradeController.postUserFeedback
);

export default router;
