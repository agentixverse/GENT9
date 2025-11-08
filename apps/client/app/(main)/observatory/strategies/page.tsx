"use client";

import { StrategyList } from "@/library/components/organisms/strategy-list";
import { useStrategies, useDeleteStrategy } from "@/library/api/hooks/use-strategies";
import { Button } from "@/library/components/atoms/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/library/components/atoms/alert";

export default function StrategiesPage() {
  const { data: strategies, isLoading, isError, error, refetch } = useStrategies();
  const { mutate: deleteStrategy } = useDeleteStrategy();

  // FIX #3: Persistent error state with retry option
  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="size-4" />
          <AlertTitle>Failed to Load Strategies</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred while fetching your strategies. Please try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <StrategyList
        strategies={strategies || []}
        onDelete={deleteStrategy}
        isLoading={isLoading}
      />
    </div>
  );
}
