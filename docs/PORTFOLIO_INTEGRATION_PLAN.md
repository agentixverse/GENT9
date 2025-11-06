# Portfolio Feature Integration Plan

## Objective
Integrate the frontend "Portfolio" feature with a fully functional backend API, addressing the current gaps in data availability, aggregation, and snapshot generation.

## Current Gaps (Verified from Codebase)

### Backend Gaps
1.  **Missing Aggregated Metrics**: The backend currently provides raw `portfolio_snapshots` or a basic aggregation of `total_value`, `total_pnl`, `pnl_percentage`, and `vs_inflation_performance`. It does *not* calculate or provide `activeTrades`, `winRate`, `avgHoldTime`, `bestTrade`, `worstTrade`, `totalReturn`, `annualizedReturn`, `sharpeRatio`, `maxDrawdown`, `totalTrades`, `avgTradeReturn`, or `inflationBeatRate` which are expected by the frontend.
2.  **No Automated Snapshot Generation**: There is no visible mechanism (e.g., cron job, scheduled task) to automatically generate new `portfolio_snapshots`. The data is static.
3.  **`getWalletBalances` Not Implemented**: The `portfolio-service.ts` has a `TODO` for implementing wallet balance fetching from on-chain data.

### Frontend Gaps
1.  **API Integration**: All portfolio-related hooks (`usePortfolioSnapshots`, `usePortfolioHistory`, `useDashboardMetrics`, `usePerformanceMetrics`) use mock data only.
2.  **Data Shape Mismatch**: The frontend expects specific aggregated data structures (`DashboardMetrics`, `PerformanceMetrics`) that the current backend does not provide.
3.  **ID Type Inconsistency**: Frontend expects `id` as `string`, backend returns `number`.
4.  **Inflation Calculation Discrepancy**: Frontend hardcodes inflation calculation; backend `vs_inflation_performance` population is unclear.

## Plan of Action

### Phase 1: Backend Development - Data Aggregation and Snapshot Generation

1.  **Implement `getWalletBalances`**: In `/apps/server/src/services/trading/portfolio-service.ts`, implement the logic to fetch real-time wallet balances from all orb wallets for a given user.

2.  **Create Snapshot Generation Logic**: Develop a new service method (e.g., `generatePortfolioSnapshot(sectorId: number)`) that:
    *   Calculates the `total_value`, `total_pnl`, `pnl_percentage`, and `vs_inflation_performance` for a given sector.
    *   Utilizes `getWalletBalances` and `getOpenPositions` to gather necessary data.
    *   Saves a new entry into the `portfolio_snapshots` table.

3.  **Implement Automated Snapshot Generation (Cron Job)**:
    *   Create a new cron job (e.g., in `/apps/server/src/infrastructure/cron/trading/`) that runs periodically (e.g., daily).
    *   This cron job should iterate through all active sectors for all users and call the `generatePortfolioSnapshot` method for each.

4.  **Develop Aggregation Logic for Dashboard Metrics**: In `/apps/server/src/services/trading/portfolio-service.ts`, create new methods to calculate the complex metrics required by the frontend:
    *   `getDashboardMetrics(userId: number)`: Should aggregate `activeTrades`, `winRate`, `avgHoldTime`, `bestTrade`, `worstTrade` from `journal_entries`, `trade_actions`, and `portfolio_snapshots`.
    *   `getPerformanceMetrics(userId: number)`: Should calculate `totalReturn`, `annualizedReturn`, `sharpeRatio`, `maxDrawdown`, `totalTrades`, `avgTradeReturn`, `bestTrade`, `worstTrade`, `inflationBeatRate`.

5.  **Add New Backend Endpoints**: In `/apps/server/src/interfaces/api/routes/portfolio.ts` and `portfolioController.ts`:
    *   `GET /api/portfolio/metrics`: Returns `DashboardMetrics`.
    *   `GET /api/portfolio/performance`: Returns `PerformanceMetrics`.
    *   `GET /api/portfolio/:sectorId/history`: Returns historical snapshots for a specific sector (this is partially covered by `GET /api/portfolio/:sectorId` but needs to be explicitly defined for clarity and potential future filtering).

### Phase 2: Frontend Development - API Integration and UI Alignment

1.  **Update API Hooks (`use-portfolio.ts`)**:
    *   Locate `/apps/client/library/api/hooks/use-portfolio.ts`.
    *   Replace mock data fetching with actual API calls to the newly created backend endpoints.
    *   `usePortfolioSnapshots()`: Call `GET /api/portfolio/:sectorId` (or a new endpoint for latest snapshot).
    *   `usePortfolioHistory(days: number)`: Call `GET /api/portfolio/:sectorId/history` with appropriate query parameters.
    *   `useDashboardMetrics()`: Call `GET /api/portfolio/metrics`.
    *   `usePerformanceMetrics()`: Call `GET /api/portfolio/performance`.
    *   Ensure proper error handling, loading states, and `react-query` configurations (stale time, refetch intervals).

2.  **Align Type Definitions**: In `/apps/client/library/api/types/index.ts`:
    *   Update `PortfolioSnapshot` to reflect the backend's `id: number`.
    *   Ensure `DashboardMetrics` and `PerformanceMetrics` types precisely match the data structures returned by the new backend aggregation endpoints.

3.  **Update UI Components**:
    *   Modify `/apps/client/library/components/organisms/section-cards.tsx` and `/apps/client/library/components/organisms/chart-area-interactive.tsx` to consume data from the integrated API hooks instead of mock data.
    *   Adjust any UI logic that currently relies on client-side inflation calculation to use the `vs_inflation_performance` from the backend if available, or standardize the calculation approach.

## Files to be Modified/Created

### Backend
*   `/apps/server/src/services/trading/portfolio-service.ts` (Modification)
*   `/apps/server/src/interfaces/api/controllers/portfolioController.ts` (Modification)
*   `/apps/server/src/interfaces/api/routes/portfolio.ts` (Modification)
*   `/apps/server/src/infrastructure/cron/trading/portfolio-snapshot-cron.ts` (New)
*   `/apps/server/src/server.ts` (Modification - to start new cron job)

### Frontend
*   `/apps/client/library/api/hooks/use-portfolio.ts` (Modification)
*   `/apps/client/library/api/types/index.ts` (Modification)
*   `/apps/client/library/components/organisms/section-cards.tsx` (Modification)
*   `/apps/client/library/components/organisms/chart-area-interactive.tsx` (Modification)

## Verification
*   New backend endpoints (`/metrics`, `/performance`, `/history`) are functional and return correct aggregated data.
*   Portfolio snapshots are automatically generated and updated.
*   Frontend UI components display live, accurate portfolio data.
*   All mock data is replaced with real API calls.
*   Error handling and loading states are properly implemented in the frontend.