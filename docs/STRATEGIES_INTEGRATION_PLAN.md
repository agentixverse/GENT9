
# Strategies Integration Plan

**Date:** 2025-11-05

**Author:** Gemini

## 1. Feature Summary

The "Strategies" feature allows users to create, edit, and manage their Python-based trading strategies. These strategies are then used within the "Backtesting" feature to test their performance against historical market data.

## 2. Integration Analysis

Upon analysis, it has been determined that the "Strategies" feature is not a standalone module. Instead, it is an integral part of the "Backtesting" feature.

*   **Frontend:** The frontend UI for managing strategies (e.g., `use-strategies.ts`, `StrategyEditor`, `StrategyList`) makes API calls to endpoints prefixed with `/api/backtests/strategies`.
*   **Backend:** The backend logic for all CRUD (Create, Read, Update, Delete) operations on strategies is handled by the `backtestController.ts` and `backtest-service.ts`, which were analyzed as part of the "Backtesting" feature.

The `apps/server/src/services/trading/strategy/strategy-service.ts` file was found to be unrelated to this user-facing feature. It appears to be an internal service for an AI agent's trade-building process.

## 3. Integration Plan

There are no new integration gaps for the "Strategies" feature beyond what has already been identified for the "Backtesting" feature.

**Therefore, this integration plan defers to the `BACKTESTING_INTEGRATION_PLAN.md` file.**

The steps outlined in that document, particularly the implementation of the backtest queue processor, are the necessary steps to make the strategy management and execution functionality work.

## 4. Next Steps

Proceed with the analysis of the next feature on the TODO list: "Trades."
