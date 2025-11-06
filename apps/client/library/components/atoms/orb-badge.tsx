"use client";

import * as React from "react";
import { Badge } from "@/library/components/atoms/badge";
import { Circle } from "lucide-react";
import { cn } from "@/library/utils";

type OrbStatus = "active" | "paused" | "paper" | "error";

interface OrbBadgeProps {
  status: OrbStatus;
  className?: string;
}

const statusConfig = {
  active: {
    label: "Active",
    variant: "default" as const,
    className: "bg-green-500 text-white border-green-600",
  },
  paused: {
    label: "Paused",
    variant: "secondary" as const,
    className: "bg-yellow-500 text-white border-yellow-600",
  },
  paper: {
    label: "Paper Trading",
    variant: "outline" as const,
    className: "bg-blue-50 text-blue-700 border-blue-300",
  },
  error: {
    label: "Error",
    variant: "destructive" as const,
    className: "bg-red-500 text-white border-red-600",
  },
};

function OrbBadge({ status, className }: OrbBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      <Circle className="size-2 fill-current" />
      {config.label}
    </Badge>
  );
}

export { OrbBadge };
export type { OrbStatus };
