# Corrected Backtesting Integration Plan (Frontend Focus)

**Date:** 2025-11-05

**Author:** Gemini

## 1. Issue Summary

Previous analysis incorrectly assumed the backend for backtesting was incomplete. After thorough verification, it has been confirmed that the **backend is complete and fully functional**, including all API endpoints, the queue system, the Python executor, and the market data service.

The actual integration gap is that the **frontend for the backtesting feature is entirely missing**. The task is to implement the necessary UI components, API hooks, and page routes to consume the existing backend.

## 2. Frontend Implementation Plan

This plan outlines the steps required to build the backtesting feature on the frontend, based on the requirements in `BACKTESTS_EXPECTATIONS.md`.

### Step 1: Create File Structure and Type Definitions

First, we need to create the necessary files and define the data structures.

1.  **Create Type Definition File:**
    *   Create `apps/client/library/api/types/backtest.ts`.
    *   Populate this file with the TypeScript interfaces for `Strategy`, `StrategyRevision`, `BacktestResults`, `BacktestConfig`, and all the request/response DTOs as defined in `BACKTESTS_EXPECTATIONS.md`.

2.  **Create API Hook Files:**
    *   Create `apps/client/library/api/hooks/use-strategies.ts`.
    *   Create `apps/client/library/api/hooks/use-backtest.ts`.
    *   Create `apps/client/library/api/hooks/use-revisions.ts` (optional, can be merged into the other hooks).

3.  **Create Page Route Files:**
    *   Create the directory `apps/client/app/(main)/observatory/strategies`.
    *   Create `.../strategies/page.tsx` (for the list view).
    *   Create `.../strategies/new/page.tsx` (for creating a new strategy).
    *   Create `.../strategies/[strategyId]/page.tsx` (for the main workspace view).

### Step 2: Implement API Hooks

Next, implement the data fetching and mutation logic in the API hook files.

1.  **`use-strategies.ts`:**
    *   Implement `useStrategies` to fetch all strategies (`GET /api/backtests/strategies`).
    *   Implement `useStrategy` to fetch a single strategy (`GET /api/backtests/strategies/:strategyId`).
    *   Implement `useCreateStrategy` to create a new strategy (`POST /api/backtests/strategies`).
    *   Implement `useDeleteStrategy` to delete a strategy (`DELETE /api/backtests/strategies/:strategyId`).

2.  **`use-backtest.ts`:**
    *   Implement `useRunBacktest` to initiate a backtest (`POST /api/backtests/strategies/:strategyId/revisions/:revisionIndex/run`).
    *   Implement `useBacktestResults` to fetch the results (`GET /api/backtests/strategies/:strategyId/revisions/:revisionIndex/results`).
    *   Implement `useBacktestReport` to fetch the HTML report (`GET /api/backtests/strategies/:strategyId/revisions/:revisionIndex/report`).
    *   Implement `useBacktestStatusPoller` to poll the strategy status every 3 seconds while it is "queued" or "running".

3.  **`use-revisions.ts` (or merge into `use-strategies.ts`):**
    *   Implement `useAddRevision` to save a new revision (`POST /api/backtests/strategies/:strategyId/revisions`).
    *   Implement `useSetActiveRevision` to set the active revision (`PATCH /api/backtests/strategies/:strategyId/active`).

### Step 3: Build UI Components

With the data layer in place, build the UI components.

1.  **Strategy List Page (`.../strategies/page.tsx`):**
    *   Use the `useStrategies` hook to fetch and display a list of strategies using a `StrategyList` organism component.

2.  **Strategy Workspace Page (`.../strategies/[strategyId]/page.tsx`):**
    *   This will be the main 3-column layout.
    *   Use `useStrategy` to fetch the strategy data.
    *   Implement the `StrategyEditor` organism, which will include the CodeMirror editor and the `BacktestConfigForm`.
    *   Implement the `ResultsPanel` organism, which will display the metrics and the HTML report in an iframe.
    *   Implement a `RevisionsSidebar` to list the revisions of the strategy.

3.  **Create New Strategy Page (`.../strategies/new/page.tsx`):**
    *   Provide a simple UI for naming a new strategy and selecting a template.
    *   Use the `useCreateStrategy` hook to create the new strategy and then redirect to the workspace page.

## 3. Next Steps

This plan provides a clear path to implementing the frontend for the backtesting feature. The first step is to create the file structure and type definitions.