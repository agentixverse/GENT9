"use client";

import * as React from "react";
import { OrbCard } from "@/library/components/molecules/orb-card";
import { Button } from "@/library/components/atoms/button";
import { Plus } from "lucide-react";
import type { Orb } from "@/library/types/orb";

interface OrbListProps {
  orbs: Orb[];
  sectorId: number;
  onCreateNew?: () => void;
  onPause?: (orbId: number) => void;
  onResume?: (orbId: number) => void;
  onEdit?: (orbId: number) => void;
  onDelete?: (orbId: number) => void;
  isLoading?: boolean;
}

function OrbList({
  orbs,
  sectorId,
  onCreateNew,
  onPause,
  onResume,
  onEdit,
  onDelete,
  isLoading,
}: OrbListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!orbs || orbs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-semibold mb-2">No orbs yet</h3>
        <p className="text-muted-foreground mb-4 text-center max-w-sm">
          Create your first orb to start trading. Orbs are multi-chain asset
          collections with specific infrastructure and strategies.
        </p>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 size-4" />
            Create Orb
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Orbs</h2>
          <p className="text-muted-foreground">
            {orbs.length} {orbs.length === 1 ? "orb" : "orbs"}
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 size-4" />
            New Orb
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orbs.map((orb) => (
          <OrbCard
            key={orb.id}
            orb={orb}
            sectorId={sectorId}
            status="active" // TODO: Get actual status from orb config or trades
            currentPnL={0} // TODO: Calculate from trades/portfolio
            activeStrategyName={undefined} // TODO: Get from orb config
            onPause={onPause ? () => onPause(orb.id) : undefined}
            onResume={onResume ? () => onResume(orb.id) : undefined}
            onEdit={onEdit ? () => onEdit(orb.id) : undefined}
            onDelete={onDelete ? () => onDelete(orb.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export { OrbList };
