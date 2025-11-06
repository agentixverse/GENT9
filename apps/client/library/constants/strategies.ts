import type { StrategyType } from "../store/onboarding-store";

export interface StrategyOption {
  value: StrategyType;
  label: string;
  description: string;
}

export const STRATEGY_TYPES: StrategyOption[] = [
  {
    value: "rsi",
    label: "RSI",
    description: "Relative Strength Index - Trade based on overbought/oversold conditions",
  },
  {
    value: "sma_cross",
    label: "SMA Crossover",
    description: "Simple Moving Average - Trade when fast and slow moving averages cross",
  },
  {
    value: "position_monitor",
    label: "Position Monitor",
    description: "Monitor positions with stop-loss and take-profit levels",
  },
  {
    value: "time_limit",
    label: "Time Limit",
    description: "Exit positions after a specific time duration",
  },
];
