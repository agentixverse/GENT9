import * as React from "react";
import { Badge } from "@/library/components/atoms/badge";
import { cn } from "@/library/utils";

interface RevisionBadgeProps {
  index: number;
  isActive?: boolean;
  className?: string;
}

const revisionColors = [
  "bg-blue-500 text-white",      // Latest (0)
  "bg-blue-400 text-white",      // 1
  "bg-blue-300 text-white",      // 2
  "bg-blue-200 text-gray-800",   // 3
  "bg-blue-100 text-gray-800",   // Oldest (4)
];

function RevisionBadge({ index, isActive, className }: RevisionBadgeProps) {
  const colorClass = revisionColors[index] || revisionColors[4];
  const label = index === 0 ? "Newest" : index === 4 ? "Oldest" : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge
        variant="outline"
        className={cn(colorClass, "font-mono font-semibold", className)}
      >
        #{index}
      </Badge>
      {label && (
        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
          {label}
        </Badge>
      )}
      {isActive && (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
          Active
        </Badge>
      )}
    </div>
  );
}

export { RevisionBadge };
