"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/library/components/atoms/card";
import { Button } from "@/library/components/atoms/button";
import { StrategyStatusBadge } from "@/library/components/atoms/strategy-status-badge";
import { Play, Trash2, FileCode } from "lucide-react";
import type { Strategy } from "@/library/types/backtest";

interface StrategyCardProps {
  strategy: Strategy;
  onDelete?: () => void;
}

function StrategyCard({ strategy, onDelete }: StrategyCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const hasResults = strategy.revisions.some((rev) => rev.results !== null);

  return (
    <Link href={`/observatory/strategies/${strategy.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{strategy.name}</CardTitle>
              <div className="flex items-center gap-2">
                <StrategyStatusBadge status={strategy.status} />
                {hasResults && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <FileCode className="size-3" />
                    Has Results
                  </span>
                )}
              </div>
            </div>
            {onDelete && (
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete();
                  }}
                  aria-label="Delete strategy"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardAction>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Revisions</p>
              <p className="font-semibold">{strategy.revisions.length} / 5</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Rev</p>
              <p className="font-semibold">#{strategy.active_revision_index}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          Updated {formatDate(strategy.updated_at)}
        </CardFooter>
      </Card>
    </Link>
  );
}

export { StrategyCard };
