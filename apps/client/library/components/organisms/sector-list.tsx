"use client";

import * as React from "react";
import { SectorCard } from "@/library/components/molecules/sector-card";
import { Skeleton } from "@/library/components/atoms/skeleton";
import { Card } from "@/library/components/atoms/card";
import type { Sector } from "@/library/types/sector";

interface SectorListProps {
  sectors?: Sector[];
  isLoading?: boolean;
  onEditSector?: (sector: Sector) => void;
  onDeleteSector?: (sector: Sector) => void;
}

function SectorListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-3 w-1/3" />
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">No sectors yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Get started by creating your first trading sector. Organize your trading
        strategies into live, paper, or experimental environments.
      </p>
    </div>
  );
}

function SectorList({ sectors = [], isLoading, onEditSector, onDeleteSector }: SectorListProps) {
  if (isLoading) {
    return <SectorListSkeleton />;
  }

  if (!sectors || sectors.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sectors.map((sector) => (
        <SectorCard
          key={sector.id}
          sector={sector}
          onEdit={onEditSector ? () => onEditSector(sector) : undefined}
          onDelete={onDeleteSector ? () => onDeleteSector(sector) : undefined}
        />
      ))}
    </div>
  );
}

export { SectorList };
