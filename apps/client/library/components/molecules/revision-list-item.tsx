"use client";

import * as React from "react";
import { Button } from "@/library/components/atoms/button";
import { RevisionBadge } from "@/library/components/atoms/revision-badge";
import { Play, Star, Check } from "lucide-react";
import type { StrategyRevision } from "@/library/types/backtest";
import { cn } from "@/library/utils";

interface RevisionListItemProps {
  revision: StrategyRevision;
  index: number;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRun: () => void;
  onSetActive: () => void;
}

function RevisionListItem({
  revision,
  index,
  isActive,
  isSelected,
  onSelect,
  onRun,
  onSetActive,
}: RevisionListItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasResults = revision.results !== null;

  return (
    <div
      className={cn(
        "p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm",
        isSelected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <RevisionBadge index={index} isActive={isActive} />
        <div className="flex gap-1">
          {!isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => {
                e.stopPropagation();
                onSetActive();
              }}
              aria-label="Set as active"
            >
              <Star className="size-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
            aria-label="Run backtest"
          >
            <Play className="size-3" />
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {formatDate(revision.created_at)}
      </div>

      {hasResults && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <Check className="size-3" />
          Has Results
        </div>
      )}
    </div>
  );
}

export { RevisionListItem };
