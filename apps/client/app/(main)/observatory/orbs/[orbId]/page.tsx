"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/library/components/atoms/button";
import { OrbBadge } from "@/library/components/atoms/orb-badge";
import { MetricCard } from "@/library/components/atoms/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/library/components/atoms/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import { Separator } from "@/library/components/atoms/separator";
import { Badge } from "@/library/components/atoms/badge";
import { useOrb } from "@/library/api/hooks/use-orbs";
import { useTrades } from "@/library/api/hooks/use-trades";
import { useStrategies } from "@/library/api/hooks/use-strategies";
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  PauseCircle,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function OrbDetailPage() {
  const params = useParams();
  const orbId = parseInt(params.orbId as string);

  const { data: orb, isLoading } = useOrb(orbId);
  const { data: trades } = useTrades(); // TODO: Filter by orbId
  const { data: strategies } = useStrategies();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading orb...</p>
        </div>
      </div>
    );
  }

  if (!orb) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Orb Not Found</h3>
          <Link href="/observatory/orbs">
            <Button>Back to Orbs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const orbTrades = trades?.filter((t) => t.orbId === orbId) || [];
  const activeTrades = orbTrades.filter((t) => t.isActive);
  const totalPnL = 0; // TODO: Calculate from trades
  const winRate = 0; // TODO: Calculate from completed trades

  const pairEntries = Object.entries(orb.asset_pairs || {});

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/observatory/orbs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{orb.name}</h1>
                <OrbBadge status="active" />
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {orb.chain} Network
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <PauseCircle className="mr-2 size-4" />
              Pause Trading
            </Button>
            <Button variant="destructive" size="sm">
              <AlertTriangle className="mr-2 size-4" />
              Emergency Stop
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="grid gap-6">
          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total P&L"
              value={`$${totalPnL.toFixed(2)}`}
              description="All-time profit/loss"
              icon={totalPnL >= 0 ? TrendingUp : TrendingDown}
              trend={totalPnL >= 0 ? "up" : "down"}
            />
            <MetricCard
              title="Active Trades"
              value={activeTrades.length.toString()}
              description="Currently executing"
              icon={Activity}
            />
            <MetricCard
              title="Win Rate"
              value={`${winRate}%`}
              description="Successful trades"
              icon={CheckCircle}
              trend={winRate >= 50 ? "up" : "down"}
            />
            <MetricCard
              title="Total Trades"
              value={orbTrades.length.toString()}
              description="All-time trades"
              icon={Activity}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Strategy & Settings */}
            <div className="lg:col-span-1 space-y-6">
              {/* Active Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Strategy</CardTitle>
                  <CardDescription>
                    Select the strategy for this orb
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select defaultValue="none">
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Strategy</SelectItem>
                      {strategies?.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id.toString()}>
                          {strategy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    The AI will use this strategy to make trading decisions
                  </p>
                </CardContent>
              </Card>

              {/* Wallet Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="size-5" />
                    Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-mono break-all">
                        {orb.wallet_address || "Not generated"}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Network</p>
                      <p className="text-sm capitalize">{orb.chain}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Pairs */}
              <Card>
                <CardHeader>
                  <CardTitle>Trading Pairs</CardTitle>
                  <CardDescription>
                    {pairEntries.length} active pairs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pairEntries.map(([pair, weight]) => (
                      <div
                        key={pair}
                        className="flex items-center justify-between p-2 rounded-md bg-accent/50"
                      >
                        <span className="text-sm font-medium">{pair}</span>
                        <Badge variant="secondary">Weight: {weight}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Activity & Trades */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                  <CardDescription>
                    Latest trading activity for this orb
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orbTrades.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No trades yet. Start trading to see activity here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orbTrades.slice(0, 10).map((trade) => (
                        <div
                          key={trade.id}
                          className="flex items-center justify-between p-3 rounded-md border"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {trade.trading_pair || "Unknown Pair"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(trade.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                trade.status === "COMPLETED"
                                  ? "default"
                                  : trade.status === "FAILED"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {trade.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground capitalize mt-1">
                              {trade.tradeType}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Decision Log */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Decision Log</CardTitle>
                  <CardDescription>
                    Recent agent decisions and reasoning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      AI decision history will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
