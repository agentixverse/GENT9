
# Trades Integration Plan

**Date:** 2025-11-05

**Author:** Gemini

## 1. Issue Summary

The "Trades" feature is the most complex and has the most significant gaps in the application. The frontend is making numerous API calls to endpoints that are not implemented on the backend, which will cause most of the trade-related functionality to fail.

### Missing Endpoints

The following endpoints are used by the frontend but are not defined on the backend:

*   `GET /trades/{tradeId}/journal`: To fetch the journal (log of events) for a trade.
*   `GET /trades/{tradeId}/details`: To fetch performance details for a trade.
*   `GET /trading/status`: To fetch the overall trading status.
*   `POST /trades/{tradeId}/approve`: To approve a proposed trade.
*   `POST /trades/{tradeId}/reject`: To reject a proposed trade.
*   `POST /trading/pause`: To pause all trading.
*   `POST /trading/resume`: To resume all trading.

### Other Gaps

*   **Inconsistent Naming:** The frontend uses the term "trade," while the backend uses "trade action."
*   **Unknown `neuralAgent`:** The `tradeController` interacts with a `neuralAgent`, but its implementation is unknown.

## 2. Resolution Plan

To make the "Trades" feature functional, we need to implement the missing backend endpoints.

### Backend Changes

#### Step 1: Implement Missing Trade Endpoints

In `apps/server/src/interfaces/api/routes/trade.ts`, add the following routes:

```typescript
// ... imports and schemas

// GET /api/trades/:tradeId/journal - Get journal entries for a trade
router.get("/:tradeId/journal", validate(tradeIdSchema), tradeController.getTradeJournal);

// GET /api/trades/:tradeId/details - Get performance details for a trade
router.get("/:tradeId/details", validate(tradeIdSchema), tradeController.getTradePerformanceDetails);

// POST /api/trades/:tradeId/approve - Approve a trade
router.post("/:tradeId/approve", validate(tradeIdSchema), tradeController.approveTrade);

// POST /api/trades/:tradeId/reject - Reject a trade
router.post("/:tradeId/reject", validate(tradeIdSchema), tradeController.rejectTrade);

// ... other routes
```

In `apps/server/src/interfaces/api/controllers/tradeController.ts`, add the corresponding controller functions:

```typescript
// ... existing controller

const tradeController = {
  // ... existing functions

  async getTradeJournal(req: Request, res: Response) {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const journal = await tradeActionService.getJournalForTradeAction(tradeId);
      res.json(journal);
    } catch (error) {
      console.error("Error fetching trade journal:", error);
      res.status(500).json({ error: "Failed to fetch trade journal" });
    }
  },

  async getTradePerformanceDetails(req: Request, res: Response) {
    // TODO: Implement logic to calculate and return trade performance details
    res.status(501).json({ message: "Not implemented" });
  },

  async approveTrade(req: Request, res: Response) {
    try {
      const tradeId = parseInt(req.params.tradeId);
      await tradeActionService.addUserAction(tradeId, { action_type: "approve_trade" });
      res.status(200).json({ message: "Trade approved" });
    } catch (error) {
      console.error("Error approving trade:", error);
      res.status(500).json({ error: "Failed to approve trade" });
    }
  },

  async rejectTrade(req: Request, res: Response) {
    try {
      const tradeId = parseInt(req.params.tradeId);
      await tradeActionService.addUserAction(tradeId, { action_type: "reject_trade" });
      res.status(200).json({ message: "Trade rejected" });
    } catch (error) {
      console.error("Error rejecting trade:", error);
      res.status(500).json({ error: "Failed to reject trade" });
    }
  },
};
```

#### Step 2: Implement Missing Trading Status Endpoints

Create a new route file `apps/server/src/interfaces/api/routes/trading.ts`:

```typescript
import { Router } from "express";
import { protect } from "@/interfaces/api/middleware/auth";
import tradingController from "@/interfaces/api/controllers/tradingController";

const router = Router();

router.use(protect);

router.get("/status", tradingController.getStatus);
router.post("/pause", tradingController.pauseTrading);
router.post("/resume", tradingController.resumeTrading);

export default router;
```

Create a new controller file `apps/server/src/interfaces/api/controllers/tradingController.ts`:

```typescript
import { Request, Response } from "express";

const tradingController = {
  async getStatus(req: Request, res: Response) {
    // TODO: Implement logic to get the overall trading status
    res.status(501).json({ message: "Not implemented" });
  },

  async pauseTrading(req: Request, res: Response) {
    // TODO: Implement logic to pause all trading
    res.status(501).json({ message: "Not implemented" });
  },

  async resumeTrading(req: Request, res: Response) {
    // TODO: Implement logic to resume all trading
    res.status(501).json({ message: "Not implemented" });
  },
};

export default tradingController;
```

Then, in `apps/server/src/server.ts`, add the new routes:

```typescript
// ... other imports
import tradingRoutes from './interfaces/api/routes/trading';

// ... app setup

app.use('/api/trading', tradingRoutes);

// ... other routes
```

## 3. Next Steps

This concludes the initial analysis phase. We have identified numerous gaps and created integration plans for each feature. The next phase would be to implement the changes outlined in these plans, starting with the most critical issues, such as the missing `tradespaceService` and the various API route mismatches.
