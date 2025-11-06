"use client";

import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Activity,
  Archive,
  Percent,
  Target,
  Zap,
} from "lucide-react";

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/library/components/atoms/card";
import { Badge } from "@/library/components/atoms/badge";
import { useDashboardMetrics } from "@/library/api/hooks/use-portfolio";
import { Skeleton } from "@/library/components/atoms/skeleton";

type MetricCardProps = {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  footerText: string;
  icon: React.ElementType;
};

const MetricCard = ({
  title,
  value,
  change,
  changeType,
  footerText,
  icon: Icon,
}: MetricCardProps) => (
  <Card className="@container/card">
    <CardHeader>
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-xl sm:text-2xl font-semibold tabular-nums break-all">
        {value}
      </CardTitle>
      <CardAction>
        <Badge
          variant="outline"
          className={`text-xs shrink-0 ${
            changeType === "positive"
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {changeType === "positive" ? (
            <TrendingUp className="mr-1" />
          ) : (
            <TrendingDown className="mr-1" />
          )}
          {change}
        </Badge>
      </CardAction>
    </CardHeader>
    <CardFooter className="flex-col items-start gap-1.5 text-sm">
      <div className="line-clamp-1 flex items-center gap-2 font-medium">
        <Icon className="size-4" /> {footerText}
      </div>
    </CardFooter>
  </Card>
);

const LoadingCard = () => (
  <Card className="@container/card">
    <CardHeader>
      <CardDescription>
        <Skeleton className="h-4 w-32" />
      </CardDescription>
      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
        <Skeleton className="h-8 w-24" />
      </CardTitle>
      <CardAction>
        <Skeleton className="h-6 w-16" />
      </CardAction>
    </CardHeader>
    <CardFooter className="flex-col items-start gap-1.5 text-sm">
      <div className="line-clamp-1 flex items-center gap-2 font-medium">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
    </CardFooter>
  </Card>
);

interface SectionCardsProps {
  sectorId: number | null;
}

export function SectionCards({ sectorId }: SectionCardsProps) {
  const { data: metrics, isLoading } = useDashboardMetrics(sectorId!);

  if (!sectorId) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>No Sector Selected</CardTitle>
            <CardDescription>
              Please select a sector from the sidebar to view your dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  if (!metrics) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatPercentage = (value: number) => 
    `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
      <MetricCard
        title="Total Portfolio Value"
        value={formatCurrency(metrics.totalValue)}
        change={formatPercentage(metrics.pnlPercentage)}
        changeType={metrics.pnlPercentage >= 0 ? "positive" : "negative"}
        footerText="Portfolio performance"
        icon={Wallet}
      />
      <MetricCard
        title="vs Inflation Performance"
        value={formatPercentage(metrics.vsInflationPerformance)}
        change={`${metrics.vsInflationPerformance > 0 ? 'Beating' : 'Behind'} inflation`}
        changeType={metrics.vsInflationPerformance >= 0 ? "positive" : "negative"}
        footerText="Inflation-adjusted returns"
        icon={Target}
      />
      <MetricCard
        title="Active Trades"
        value={metrics.activeTrades.toString()}
        change={`${metrics.winRate}% win rate`}
        changeType="positive"
        footerText="Current trading activity"
        icon={Activity}
      />
      <MetricCard
        title="Total P&L"
        value={formatCurrency(metrics.totalPnl)}
        change={metrics.bestTrade}
        changeType={metrics.totalPnl >= 0 ? "positive" : "negative"}
        footerText="Overall profitability"
        icon={Zap}
      />
    </div>
  );
}
