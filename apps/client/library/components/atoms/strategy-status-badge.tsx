import * as React from "react";
import { Badge } from "@/library/components/atoms/badge";
import type { StrategyStatus } from "@/library/types/backtest";

interface StrategyStatusBadgeProps {
  status: StrategyStatus;
  className?: string;
}

const statusConfig: Record<
  StrategyStatus,
  { label: string; className: string }
> = {
  idle: {
    label: "Idle",
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  queued: {
    label: "Queued",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  running: {
    label: "Running",
    className: "bg-blue-100 text-blue-700 border-blue-300 animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 border-red-300",
  },
};

function StrategyStatusBadge({ status, className }: StrategyStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`${config.className} ${className || ""}`}>
      {config.label}
    </Badge>
  );
}

export { StrategyStatusBadge };
