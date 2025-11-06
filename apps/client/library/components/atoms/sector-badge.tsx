import * as React from "react";
import { Badge } from "@/library/components/atoms/badge";
import type { SectorType } from "@/library/types/sector";

interface SectorBadgeProps {
  type: SectorType;
  className?: string;
}

const sectorConfig: Record<
  SectorType,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }
> = {
  live_trading: {
    label: "Live Trading",
    variant: "default",
    className: "bg-green-500 hover:bg-green-600 text-white border-green-600",
  },
  paper_trading: {
    label: "Paper Trading",
    variant: "secondary",
    className: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600",
  },
  experimental: {
    label: "Experimental",
    variant: "outline",
    className: "bg-orange-500 hover:bg-orange-600 text-white border-orange-600",
  },
};

function SectorBadge({ type, className }: SectorBadgeProps) {
  const config = sectorConfig[type];

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ""}`}>
      {config.label}
    </Badge>
  );
}

export { SectorBadge };
