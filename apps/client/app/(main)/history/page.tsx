"use client";

import { usePortfolioHistory, usePerformanceMetrics } from "@/library/api/hooks/use-portfolio";
import { useTrades, useTradePerformanceDetails } from "@/library/api/hooks/use-trades";
import type { PerformanceMetrics, Trade } from "@/library/api/types";
import { Badge } from "@/library/components/atoms/badge";
import { Button } from "@/library/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/library/components/atoms/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import { Skeleton } from "@/library/components/atoms/skeleton";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Target,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

export default function HistoryPage() {
  const { data: trades, isLoading: tradesLoading } = useTrades();
  const { data: portfolioHistory, isLoading: portfolioLoading } = usePortfolioHistory();
  const { data: performanceMetrics, isLoading: metricsLoading } = usePerformanceMetrics();

  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30d");

  if (tradesLoading || portfolioLoading || metricsLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold">Trading History</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trading History</h1>
        <div className="text-sm text-muted-foreground">
          {trades?.length || 0} total trades
        </div>
      </div>

      {/* Performance Metrics Cards */}
      {performanceMetrics && <PerformanceMetricsSection metrics={performanceMetrics} />}

      {/* Trade History Filters */}
      <TradeHistoryFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* Trade History Table */}
      <TradeHistoryTable
        trades={trades || []}
        expandedTrade={expandedTrade}
        setExpandedTrade={setExpandedTrade}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
      />
    </div>
  );
}

function PerformanceMetricsSection({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-muted-foreground">Total Return</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            +{metrics.totalReturn.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            vs {metrics.inflationBeatRate.toFixed(1)}% inflation
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {metrics.totalTrades} total trades
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-muted-foreground">Sharpe Ratio</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {metrics.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Risk-adjusted return</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">Max Drawdown</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            -{metrics.maxDrawdown.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">Largest loss period</div>
        </CardContent>
      </Card>
    </div>
  );
}

function TradeHistoryFilters({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  dateRange,
  setDateRange,
}: {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="EXECUTING">Executing</SelectItem>
                <SelectItem value="PROPOSED">Proposed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="swap">Swap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function TradeHistoryTable({
  trades,
  expandedTrade,
  setExpandedTrade,
  statusFilter,
  typeFilter,
}: {
  trades: Trade[];
  expandedTrade: string | null;
  setExpandedTrade: (id: string | null) => void;
  statusFilter: string;
  typeFilter: string;
}) {
  // Filter trades based on selected filters
  const filteredTrades = trades.filter((trade) => {
    const statusMatch = statusFilter === "all" || trade.status === statusFilter;
    const typeMatch = typeFilter === "all" || trade.tradeType === typeFilter;
    return statusMatch && typeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROPOSED":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
      case "APPROVED":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
      case "EXECUTING":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
      case "FAILED":
        return "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400";
      case "CANCELLED":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
    }
  };

  const getTradeIcon = (tradeType: string) => {
    switch (tradeType) {
      case "buy":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "sell":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "swap":
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const toggleExpanded = (tradeId: string) => {
    setExpandedTrade(expandedTrade === tradeId ? null : tradeId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trades found matching the selected filters</p>
            </div>
          ) : (
            filteredTrades.map((trade) => (
              <div key={trade.id} className="border rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(trade.id)}
                >
                  <div className="flex items-center gap-3">
                    {getTradeIcon(trade.tradeType)}
                    <div>
                      <div className="font-medium">
                        {trade.summary ||
                          `${trade.tradeType.toUpperCase()} Trade #${trade.id}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(trade.createdAt).toLocaleDateString()} at{" "}
                        {new Date(trade.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(trade.status)}>
                      {trade.status}
                    </Badge>
                    {expandedTrade === trade.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {expandedTrade === trade.id && <TradeDetailsExpanded trade={trade} />}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TradeDetailsExpanded({ trade }: { trade: Trade }) {
  const { data: details } = useTradePerformanceDetails(trade.id);

  const pnlColor = details && details.pnl >= 0 ? "text-emerald-600" : "text-red-600";
  const pnlSign = details && details.pnl >= 0 ? "+" : "";

  return (
    <div className="border-t bg-muted/20 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Trade Information</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trade ID:</span>
              <span className="font-mono">#{trade.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="capitalize">{trade.tradeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="capitalize">{trade.status.toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active:</span>
              <span>{trade.isActive ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Timing</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(trade.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span>{new Date(trade.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>
                {Math.round(
                  (new Date(trade.updatedAt).getTime() -
                    new Date(trade.createdAt).getTime()) /
                    (1000 * 60)
                )}{" "}
                min
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Performance</h4>
          {details ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">P&L:</span>
                <span className={`font-medium ${pnlColor}`}>
                  {pnlSign}${details.pnl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return:</span>
                <span className={`font-medium ${pnlColor}`}>
                  {pnlSign}{details.returnPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee:</span>
                <span>${details.fee.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">AI Summary:</span>
          <Button variant="outline" size="sm">
            View Journal
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {trade.summary ||
            "AI detected favorable market conditions and executed trade according to user policy parameters."}
        </p>
      </div>
    </div>
  );
}
