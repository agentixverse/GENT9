"use client";

import Link from "next/link";
import { useAggregateTrades } from "@/library/api/hooks/use-trades";
import { Badge } from "@/library/components/atoms/badge";
import { Card, CardContent } from "@/library/components/atoms/card";
import { Skeleton } from "@/library/components/atoms/skeleton";
import { Activity, TrendingUp, TrendingDown, Clock } from "lucide-react";

export default function ActionsPage() {
  const { data: trades, isLoading, error } = useAggregateTrades();

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Actions</h1>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Actions</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Failed to load trades. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PROPOSED":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
      case "APPROVED":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
      case "EXECUTING":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
      case "FAILED":
        return "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400";
      case "CANCELLED":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400";
    }
  };

  const getTradeIcon = (tradeType: string) => {
    switch (tradeType) {
      case "buy":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "sell":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "swap":
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Actions</h1>
        <div className="text-sm text-muted-foreground">
          {trades?.length || 0} total trades
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {trades?.map((trade) => (
          <Link key={trade.id} href={`/actions/${trade.id}`}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getTradeIcon(trade.tradeType)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-sm">
                        {trade.summary || `${trade.tradeType.toUpperCase()} Trade #${trade.id}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(trade.createdAt).toLocaleDateString()} at{" "}
                        {new Date(trade.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(trade.status)}
                  >
                    {trade.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        
        {trades?.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No trades found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
