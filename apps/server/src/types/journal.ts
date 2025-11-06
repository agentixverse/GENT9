import { ChainType } from "@/library/types/orb";

export type JournalEntryType =
  // Research Phase - Data Retrieval
  | "MARKET_DATA_RETRIEVED" // getMarketData tool output
  | "SENTIMENT_DATA_RETRIEVED" // getSentiment tool output
  | "TECHNICAL_DATA_RETRIEVED" // getOHLC, getMarketChart tool output
  | "COIN_DATA_RETRIEVED" // getCoinList tool output
  | "NEWS_DATA_RETRIEVED" // globalSearch tool output
  | "ORB_CONTEXT_RETRIEVED" // getOrbContext tool output
  // Research Phase - AI Analysis
  | "MARKET_DATA_ANALYSIS" // AI analysis of market data
  | "SENTIMENT_ANALYSIS" // AI analysis of sentiment data
  | "TECHNICAL_ANALYSIS" // AI analysis of technical data
  | "COIN_ANALYSIS" // AI analysis of coin data
  | "NEWS_ANALYSIS" // AI analysis of news data
  // Building Phase - Strategy Building
  | "ORB_LOCKED" // lockOrbSelection tool output
  | "RSI_STRATEGY_ADDED" // addRsiStrategy tool output
  | "SMA_STRATEGY_ADDED" // addSmaCrossStrategy tool output
  | "POSITION_MONITOR_ADDED" // addPositionMonitor tool output
  | "TIME_LIMIT_ADDED" // addTimeLimit tool output
  | "STRATEGY_REMOVED" // removeStrategy tool output
  | "STRATEGY_UPDATED" // updateStrategy tool output
  | "TRADING_PAIR_SELECTED" // setTradingPair tool output
  // Execution Phase
  | "POSITION_ENTERED" // enterPosition tool output
  | "POSITION_ADJUSTED" // adjustPosition tool output
  | "POSITION_EXITED" // exitPosition tool output
  // AI Reflection Entries
  | "RESEARCH_SYNTHESIS" // AI combines research findings
  | "EXECUTION_CONFIDENCE" // AI confidence before executing
  | "TRADE_REFLECTION" // AI post-trade analysis
  // User Interaction
  | "USER_ACTION" // User decisions (approve/reject/pause)
  | "USER_FEEDBACK" // User rating or commenting on AI actions
  // System & Monitoring
  | "PERFORMANCE_REPORT" // Periodic performance summaries
  | "SYSTEM_ALERT"; // System notifications, errors, warnings

// Type mapping for strict content validation
export type JournalContentMap = {
  MARKET_DATA_RETRIEVED: MarketDataRetrievedContent;
  SENTIMENT_DATA_RETRIEVED: SentimentDataRetrievedContent;
  TECHNICAL_DATA_RETRIEVED: TechnicalDataRetrievedContent;
  COIN_DATA_RETRIEVED: CoinDataRetrievedContent;
  NEWS_DATA_RETRIEVED: NewsDataRetrievedContent;
  ORB_CONTEXT_RETRIEVED: OrbContextRetrievedContent;
  MARKET_DATA_ANALYSIS: MarketDataAnalysisContent;
  SENTIMENT_ANALYSIS: SentimentAnalysisContent;
  TECHNICAL_ANALYSIS: TechnicalAnalysisContent;
  COIN_ANALYSIS: CoinAnalysisContent;
  NEWS_ANALYSIS: NewsAnalysisContent;
  ORB_LOCKED: OrbLockedContent;
  RSI_STRATEGY_ADDED: RsiStrategyAddedContent;
  SMA_STRATEGY_ADDED: SmaStrategyAddedContent;
  POSITION_MONITOR_ADDED: PositionMonitorAddedContent;
  TIME_LIMIT_ADDED: TimeLimitAddedContent;
  STRATEGY_REMOVED: StrategyRemovedContent;
  STRATEGY_UPDATED: StrategyUpdatedContent;
  TRADING_PAIR_SELECTED: TradingPairSelectedContent;
  POSITION_ENTERED: PositionEnteredContent;
  POSITION_EXITED: PositionExitedContent;
  RESEARCH_SYNTHESIS: ResearchSynthesisContent;
  EXECUTION_CONFIDENCE: ExecutionConfidenceContent;
  TRADE_REFLECTION: TradeReflectionContent;
  USER_ACTION: UserActionContent;
  USER_FEEDBACK: UserFeedbackContent;
  PERFORMANCE_REPORT: PerformanceReportContent;
  SYSTEM_ALERT: SystemAlertContent;
};

// Specific content types for each journal entry
export type JournalEntryContent =
  // Research Phase - Data Retrieval
  | MarketDataRetrievedContent
  | SentimentDataRetrievedContent
  | TechnicalDataRetrievedContent
  | CoinDataRetrievedContent
  | NewsDataRetrievedContent
  | OrbContextRetrievedContent
  // Research Phase - AI Analysis
  | MarketDataAnalysisContent
  | SentimentAnalysisContent
  | TechnicalAnalysisContent
  | CoinAnalysisContent
  | NewsAnalysisContent
  // Building Phase - Strategy Building
  | OrbLockedContent
  | RsiStrategyAddedContent
  | SmaStrategyAddedContent
  | PositionMonitorAddedContent
  | TimeLimitAddedContent
  | StrategyRemovedContent
  | StrategyUpdatedContent
  | TradingPairSelectedContent
  // Execution Phase
  | PositionEnteredContent
  | PositionExitedContent
  // AI Reflection Entries
  | ResearchSynthesisContent
  | StrategyReasoningContent
  | RiskAssessmentContent
  | ExecutionConfidenceContent
  | TradeReflectionContent
  // System & Monitoring (Carried Over)
  | PerformanceReportContent
  | SystemAlertContent
  // User Interaction (Carried Over)
  | UserActionContent
  | UserFeedbackContent;

// ============================================================================
// RESEARCH PHASE - DATA RETRIEVAL CONTENT TYPES
// ============================================================================

export interface MarketDataRetrievedContent {
  rawData: Record<string, any>;
}

export interface SentimentDataRetrievedContent {
  rawData: Record<string, any>;
}

export interface TechnicalDataRetrievedContent {
  rawData: Record<string, any>;
}

export interface CoinDataRetrievedContent {
  rawData: Record<string, any>;
}

export interface NewsDataRetrievedContent {
  rawData: Record<string, any>;
}

export interface OrbContextRetrievedContent {
  orbId: number;
  orbName: string;
  threadsCount: number;
  context: string | null;
}

// ============================================================================
// RESEARCH PHASE - AI ANALYSIS CONTENT TYPES
// ============================================================================

export interface MarketDataAnalysisContent {
  reasoning: string;
}

export interface SentimentAnalysisContent {
  reasoning: string;
}

export interface TechnicalAnalysisContent {
  reasoning: string;
}

export interface CoinAnalysisContent {
  reasoning: string;
}

export interface NewsAnalysisContent {
  reasoning: string;
}

// ============================================================================
// BUILDING PHASE - STRATEGY CONTENT TYPES
// ============================================================================

export interface OrbLockedContent {
  orbId: number;
  orbName: string;
  reasoning: string;
}

export interface RsiStrategyAddedContent {
  rsi_upper: number;
  rsi_lower: number;
  action: "reassess" | "close";
  reasoning: string;
}

export interface SmaStrategyAddedContent {
  fast_period: number;
  slow_period: number;
  signal_type: "cross_up" | "cross_down" | "both";
  action: "reassess" | "close";
  reasoning: string;
}

export interface PositionMonitorAddedContent {
  stop_loss: number;
  take_profit: number;
  reasoning: string;
}

export interface TimeLimitAddedContent {
  duration_minutes: number;
  action: "reassess" | "close";
  reasoning: string;
}

export interface StrategyRemovedContent {
  strategy_type: string;
  strategy_id: string;
  reasoning: string;
}

export interface StrategyUpdatedContent {
  strategy_type: string;
  strategy_id: string;
  reasoning: string;
}

export interface TradingPairSelectedContent {
  orb_id: number;
  trading_pair: string;
  chain: string;
  available_dexes: string[];
  reasoning: string;
}

// ============================================================================
// EXECUTION PHASE CONTENT TYPES
// ============================================================================

export interface PositionEnteredContent {
  trading_pair: string;
  amount: string;
  chain: ChainType;
  dex: string;
  transaction_hash?: string;
  reasoning: string;
}

export interface PositionExitedContent {
  exit_type: "stop_loss" | "take_profit" | "user";
  exit_amount: string;
  pnl: string;
  reasoning: string;
}

// ============================================================================
// AI REFLECTION CONTENT TYPES
// ============================================================================

export interface ResearchSynthesisContent {
  reasoning: string;
}

export interface StrategyReasoningContent {
  reasoning: string;
}

export interface RiskAssessmentContent {
  reasoning: string;
}

export interface ExecutionConfidenceContent {
  reasoning: string;
}

export interface TradeReflectionContent {
  reasoning: string;
}

// ============================================================================
// USER INTERACTION CONTENT TYPES
// ============================================================================

export interface UserActionContent {
  message: string;
  action_type: "approve_trade" | "reject_trade" | "pause_trade";
  timestamp: string;
}

export interface UserFeedbackContent {
  comment: string;
  timestamp: string;
}

// ============================================================================
// SYSTEM & MONITORING CONTENT TYPES
// ============================================================================
export interface PerformanceReportContent {
  pnl: string;
  entry_price: string;
  current_price: string;
  stop_loss: string;
  take_profit: string;
  position_duration: string;
  risk_reward_ratio: string;
  rsi_14: number;
  macd_signal: "bullish" | "bearish" | "neutral";
  sma_20: string;
  sma_50: string;
  volume_24h: string;
  price_change_24h: string;
  nearest_support: string;
  nearest_resistance: string;
  active_strategies: number;
}

export interface SystemAlertContent {
  message: string;
  alert_type: "error" | "warning" | "info" | "maintenance";
  severity: "low" | "medium" | "high" | "critical";
  requires_action: boolean;
  resolution_steps?: string[];
  error_code?: string;
}
