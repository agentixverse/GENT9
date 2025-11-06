import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyService } from "@/services/trading/strategy/strategy-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const viewBuildStateTool = createTool({
  id: "viewBuildState",
  description:
    "Provides a comprehensive view of the current trade build without modifications. After reviewing, use logAIThought with EXECUTION_CONFIDENCE to express readiness and confidence factors.",
  outputSchema: z.object({
    success: z.boolean(),
    current_strategies: z.array(z.any()),
    warnings: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
    build_completeness: z.string(),
  }),
  execute: async ({ runtimeContext }) => {
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const strategies = await strategyService.getStrategies(tradeActionId);
    const analysis = await strategyService.analyzeStrategies(
      strategies,
      "viewBuildState"
    );

    const hasPositionMonitor = strategies.some(
      (s) => s.strategy_type === "positionMonitor"
    );

    const buildCompleteness = hasPositionMonitor
      ? "Ready for execution"
      : "Incomplete: Missing position monitor";

    return {
      success: true,
      current_strategies: strategies,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
      build_completeness: buildCompleteness,
    };
  },
});
