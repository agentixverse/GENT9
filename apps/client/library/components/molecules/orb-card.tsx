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
import { OrbBadge, type OrbStatus } from "@/library/components/atoms/orb-badge";
import { Pause, Play, Settings, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { Orb } from "@/library/types/orb";

interface OrbCardProps {
  orb: Orb;
  sectorId: number;
  status?: OrbStatus;
  currentPnL?: number;
  activeStrategyName?: string;
  onPause?: () => void;
  onResume?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function OrbCard({
  orb,
  sectorId,
  status = "active",
  currentPnL = 0,
  activeStrategyName,
  onPause,
  onResume,
  onEdit,
  onDelete,
}: OrbCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const isProfitable = currentPnL >= 0;
  const pairCount = Object.keys(orb.asset_pairs || {}).length;

  return (
    <Link href={`/observatory/orbs/${orb.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{orb.name}</CardTitle>
              <CardDescription className="capitalize text-sm">
                {orb.chain} Network
              </CardDescription>
              <div className="mt-2">
                <OrbBadge status={status} />
              </div>
            </div>
            <CardAction>
              <div className="flex gap-1">
                {status === "active" && onPause && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      onPause();
                    }}
                    aria-label="Pause orb"
                  >
                    <Pause className="size-4" />
                  </Button>
                )}
                {status === "paused" && onResume && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      onResume();
                    }}
                    aria-label="Resume orb"
                  >
                    <Play className="size-4" />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit();
                    }}
                    aria-label="Edit orb"
                  >
                    <Settings className="size-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete();
                    }}
                    aria-label="Delete orb"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </CardAction>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Active Strategy */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Strategy</span>
              <span className="text-sm font-medium">
                {activeStrategyName || "No strategy"}
              </span>
            </div>

            {/* P&L */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">P&L</span>
              <div
                className={`flex items-center gap-1 text-sm font-semibold ${
                  isProfitable ? "text-green-600" : "text-red-600"
                }`}
              >
                {isProfitable ? (
                  <TrendingUp className="size-4" />
                ) : (
                  <TrendingDown className="size-4" />
                )}
                {formatCurrency(Math.abs(currentPnL))}
              </div>
            </div>

            {/* Trading Pairs */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pairs</span>
              <span className="text-sm font-medium">
                {pairCount} {pairCount === 1 ? "pair" : "pairs"}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          {orb.wallet_address && (
            <div className="truncate">
              Wallet: {orb.wallet_address.slice(0, 6)}...
              {orb.wallet_address.slice(-4)}
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

export { OrbCard };
