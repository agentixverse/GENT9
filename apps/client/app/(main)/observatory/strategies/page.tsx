"use client";

import { StrategyList } from "@/library/components/organisms/strategy-list";
import { useStrategies, useDeleteStrategy } from "@/library/api/hooks/use-strategies";

export default function StrategiesPage() {
  const { data: strategies, isLoading } = useStrategies();
  const { mutate: deleteStrategy } = useDeleteStrategy();

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
