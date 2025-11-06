"use client";

import * as React from "react";
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
import { SectorBadge } from "@/library/components/atoms/sector-badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Sector } from "@/library/types/sector";

interface SectorCardProps {
  sector: Sector;
  onEdit?: () => void;
  onDelete?: () => void;
}

function SectorCard({ sector, onEdit, onDelete }: SectorCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{sector.name}</CardTitle>
            <SectorBadge type={sector.type} />
          </div>
          {(onEdit || onDelete) && (
            <CardAction>
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    aria-label="Edit sector"
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    aria-label="Delete sector"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </CardAction>
          )}
        </div>
      </CardHeader>

      {sector.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{sector.description}</p>
        </CardContent>
      )}

      <CardFooter className="text-xs text-muted-foreground">
        Created {formatDate(sector.created_at)}
      </CardFooter>
    </Card>
  );
}

export { SectorCard };
