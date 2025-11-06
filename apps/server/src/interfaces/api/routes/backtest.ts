import { Router } from "express";
import { z } from "zod";

import backtestController from "@/interfaces/api/controllers/backtestController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

// ============ Validation Schemas ============

const strategyIdSchema = z.object({
  params: z.object({
    strategyId: z.string().regex(/^\d+$/, { message: "Invalid strategy ID" }),
  }),
});

const strategyRevisionParamsSchema = z.object({
  params: z.object({
    strategyId: z.string().regex(/^\d+$/, { message: "Invalid strategy ID" }),
    revisionIndex: z.string().regex(/^\d+$/, { message: "Invalid revision index" }),
  }),
});

const createStrategySchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Strategy name is required" }).max(255),
    initialCode: z.string().min(1, { message: "Initial code is required" }),
  }),
});

const addRevisionSchema = z.object({
  params: z.object({
    strategyId: z.string().regex(/^\d+$/, { message: "Invalid strategy ID" }),
  }),
  body: z.object({
    code: z.string().min(1, { message: "Code is required" }),
  }),
});

const setActiveRevisionSchema = z.object({
  params: z.object({
    strategyId: z.string().regex(/^\d+$/, { message: "Invalid strategy ID" }),
  }),
  body: z.object({
    revisionIndex: z.number().int().min(0).max(4, {
      message: "Revision index must be between 0 and 4",
    }),
  }),
});

const runBacktestSchema = z.object({
  params: z.object({
    strategyId: z.string().regex(/^\d+$/, { message: "Invalid strategy ID" }),
    revisionIndex: z.string().regex(/^\d+$/, { message: "Invalid revision index" }),
  }),
  body: z.object({
    startDate: z.string().datetime({ message: "Invalid start date format (ISO 8601 required)" }),
    endDate: z.string().datetime({ message: "Invalid end date format (ISO 8601 required)" }),
    initialCapital: z
      .number()
      .positive({ message: "Initial capital must be positive" })
      .max(1000000000),
    commission: z
      .number()
      .min(0, { message: "Commission must be non-negative" })
      .max(1, { message: "Commission must be <= 1 (100%)" }),
    coinId: z.string().optional(),
    days: z.number().int().positive().optional(),
  }),
});

// ============ Apply Authentication to All Routes ============
router.use(protect);

// ============ Strategy Management Endpoints ============

// GET /api/backtests/strategies - List user strategies
router.get("/strategies", backtestController.listStrategies);

// POST /api/backtests/strategies - Create strategy with initial code
router.post("/strategies", validate(createStrategySchema), backtestController.createStrategy);

// GET /api/backtests/strategies/:strategyId - Get strategy with all revisions
router.get(
  "/strategies/:strategyId",
  validate(strategyIdSchema),
  backtestController.getStrategy
);

// POST /api/backtests/strategies/:strategyId/revisions - Add new code revision
router.post(
  "/strategies/:strategyId/revisions",
  validate(addRevisionSchema),
  backtestController.addRevision
);

// DELETE /api/backtests/strategies/:strategyId - Soft delete strategy
router.delete(
  "/strategies/:strategyId",
  validate(strategyIdSchema),
  backtestController.deleteStrategy
);

// GET /api/backtests/strategies/:strategyId/active - Get active revision
router.get(
  "/strategies/:strategyId/active",
  validate(strategyIdSchema),
  backtestController.getActiveRevision
);

// PATCH /api/backtests/strategies/:strategyId/active - Set active revision index
router.patch(
  "/strategies/:strategyId/active",
  validate(setActiveRevisionSchema),
  backtestController.setActiveRevision
);

// ============ Backtest Execution Endpoints ============

// POST /api/backtests/strategies/:strategyId/revisions/:revisionIndex/run - Queue backtest
router.post(
  "/strategies/:strategyId/revisions/:revisionIndex/run",
  validate(runBacktestSchema),
  backtestController.runBacktest
);

// GET /api/backtests/strategies/:strategyId/revisions/:revisionIndex/results - Get results
router.get(
  "/strategies/:strategyId/revisions/:revisionIndex/results",
  validate(strategyRevisionParamsSchema),
  backtestController.getRevisionResults
);

// GET /api/backtests/strategies/:strategyId/revisions/:revisionIndex/report - Get HTML report
router.get(
  "/strategies/:strategyId/revisions/:revisionIndex/report",
  validate(strategyRevisionParamsSchema),
  backtestController.getRevisionReport
);

export default router;
