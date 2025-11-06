import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { cn } from "@/library/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title?: string;
  label?: string;
  value: string | number;
  description?: string;
  suffix?: string;
  trend?: "positive" | "negative" | "neutral" | "up" | "down";
  icon?: LucideIcon;
  className?: string;
}

function MetricCard({
  title,
  label,
  value,
  description,
  suffix,
  trend,
  icon: Icon,
  className
}: MetricCardProps) {
  const trendColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
    up: "text-green-600",
    down: "text-red-600",
  };

  const valueColor = trend ? trendColors[trend] : "text-gray-900";
  const displayLabel = title || label;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {displayLabel}
        </CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <p className={cn("text-2xl font-semibold", valueColor)}>
            {value}
          </p>
          {suffix && (
            <span className="text-sm font-medium text-gray-500">{suffix}</span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export { MetricCard };
