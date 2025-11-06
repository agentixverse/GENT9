"use client";

import * as React from "react";
import { MetricCard } from "@/library/components/atoms/metric-card";
import type { BacktestMetrics } from "@/library/types/backtest";

interface MetricsSummaryProps {
  metrics: BacktestMetrics | null;
}

function MetricsSummary({ metrics }: MetricsSummaryProps) {
  if (!metrics) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No metrics available yet.</p>
        <p className="text-sm mt-2">Run a backtest to see results.</p>
      </div>
    );
  }

  const getTrend = (value: number): "positive" | "negative" | "neutral" => {
    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        label="Total Return"
        value={metrics.total_return.toFixed(2)}
        suffix="%"
        trend={getTrend(metrics.total_return)}
      />
      <MetricCard
        label="Sharpe Ratio"
        value={metrics.sharpe_ratio.toFixed(2)}
        trend={metrics.sharpe_ratio > 1 ? "positive" : "neutral"}
      />
      <MetricCard
        label="Max Drawdown"
        value={metrics.max_drawdown.toFixed(2)}
        suffix="%"
        trend="negative"
      />
      <MetricCard
        label="Win Rate"
        value={metrics.win_rate.toFixed(1)}
        suffix="%"
        trend={metrics.win_rate > 50 ? "positive" : "negative"}
      />
      <MetricCard
        label="Total Trades"
        value={metrics.total_trades}
        trend="neutral"
      />
      {metrics.profit_factor !== undefined && (
        <MetricCard
          label="Profit Factor"
          value={metrics.profit_factor.toFixed(2)}
          trend={getTrend(metrics.profit_factor - 1)}
        />
      )}
    </div>
  );
}

export { MetricsSummary };
