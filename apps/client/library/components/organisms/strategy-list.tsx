"use client";

import * as React from "react";
import { StrategyCard } from "@/library/components/molecules/strategy-card";
import { Button } from "@/library/components/atoms/button";
import { Card, CardContent } from "@/library/components/atoms/card";
import { Plus, Lightbulb } from "lucide-react";
import Link from "next/link";
import type { Strategy } from "@/library/types/backtest";

interface StrategyListProps {
  strategies: Strategy[];
  onDelete?: (strategyId: number) => void;
  isLoading?: boolean;
}

function StrategyList({ strategies, onDelete, isLoading }: StrategyListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!strategies || strategies.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Lightbulb className="size-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No strategies yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Create your first backtesting strategy to start testing your trading ideas.
          </p>
          <Link href="/observatory/strategies/new">
            <Button>
              <Plus className="mr-2 size-4" />
              Create Strategy
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Strategies</h2>
          <p className="text-muted-foreground">
            {strategies.length} {strategies.length === 1 ? "strategy" : "strategies"}
          </p>
        </div>
        <Link href="/observatory/strategies/new">
          <Button>
            <Plus className="mr-2 size-4" />
            New Strategy
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            onDelete={onDelete ? () => onDelete(strategy.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export { StrategyList };
