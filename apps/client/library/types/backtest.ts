// ============================================================================
// Backtesting & Strategy Types
// ============================================================================

/**
 * Strategy status lifecycle:
 * idle → queued → running → completed/failed
 */
export type StrategyStatus = "idle" | "queued" | "running" | "completed" | "failed";

/**
 * Strategy - Main strategy entity with revisions
 */
export interface Strategy {
  id: number;
  user_id: number;
  name: string;
  status: StrategyStatus;
  active_revision_index: number;
  is_active: boolean;
  revisions: StrategyRevision[];
  created_at: string;
  updated_at: string;
}

/**
 * StrategyRevision - Code revision with optional backtest results
 * Max 5 revisions per strategy (FIFO)
 */
export interface StrategyRevision {
  code: string;
  created_at: string;
  results: BacktestResults | null;
}

/**
 * BacktestResults - Results from a completed backtest run
 */
export interface BacktestResults {
  metrics: BacktestMetrics | null;
  html_report: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * BacktestMetrics - Performance metrics from backtest
 */
export interface BacktestMetrics {
  total_return: number;      // Percentage (e.g., 15.5 = 15.5%)
  sharpe_ratio: number;       // Risk-adjusted return metric
  max_drawdown: number;       // Percentage (e.g., -8.5 = -8.5%)
  win_rate: number;           // Percentage (e.g., 62.5 = 62.5%)
  total_trades: number;       // Count
  profit_factor?: number;     // Optional
  best_day?: number;          // Optional
  worst_day?: number;         // Optional
  avg_trade?: number;         // Optional
}

/**
 * BacktestConfig - Configuration for running a backtest
 */
export interface BacktestConfig {
  startDate: string;          // ISO 8601 (e.g., "2024-01-01T00:00:00Z")
  endDate: string;            // ISO 8601
  initialCapital: number;     // Must be > 0, max 1,000,000,000
  commission: number;         // 0-1 (e.g., 0.002 = 0.2%)
  coinId?: string;            // CoinGecko ID (default: "bitcoin")
  days?: number;              // Alternative to date range (default: 365)
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

/**
 * CreateStrategyRequest - Payload for creating a new strategy
 */
export interface CreateStrategyRequest {
  name: string;
  initialCode: string;
}

/**
 * CreateStrategyResponse - Response from creating a strategy
 */
export interface CreateStrategyResponse {
  strategy: Strategy;
}

/**
 * GetStrategiesResponse - Response from listing all strategies
 */
export interface GetStrategiesResponse {
  strategies: Strategy[];
}

/**
 * GetStrategyResponse - Response from fetching a single strategy
 */
export interface GetStrategyResponse {
  strategy: Strategy;
}

/**
 * AddRevisionRequest - Payload for adding a new code revision
 */
export interface AddRevisionRequest {
  code: string;
}

/**
 * AddRevisionResponse - Response from adding a revision
 */
export interface AddRevisionResponse {
  strategy: Strategy;
}

/**
 * SetActiveRevisionRequest - Payload for setting active revision
 */
export interface SetActiveRevisionRequest {
  revisionIndex: number;
}

/**
 * SetActiveRevisionResponse - Response from setting active revision
 */
export interface SetActiveRevisionResponse {
  strategy: Strategy;
}

/**
 * RunBacktestRequest - Payload for running a backtest
 */
export interface RunBacktestRequest extends BacktestConfig {}

/**
 * RunBacktestResponse - Response from queuing a backtest
 */
export interface RunBacktestResponse {
  strategy: Strategy;
  message: string;
}

/**
 * GetBacktestResultsResponse - Response from fetching backtest results
 */
export interface GetBacktestResultsResponse {
  results: BacktestResults;
}

/**
 * GetActiveRevisionResponse - Response from fetching active revision
 */
export interface GetActiveRevisionResponse {
  revision: StrategyRevision;
}

// ============================================================================
// Client-Only UI State Types
// ============================================================================

/**
 * ComparisonData - Data for comparing multiple revisions
 */
export interface ComparisonData {
  revisionIndex: number;
  createdAt: string;
  metrics: BacktestMetrics | null;
}

/**
 * ResultsTab - Active tab in results panel
 */
export type ResultsTab = 'metrics' | 'report' | 'compare';
