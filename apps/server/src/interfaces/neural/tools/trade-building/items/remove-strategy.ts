import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyService } from "@/services/trading/strategy/strategy-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const removeStrategyTool = createTool({
  id: "removeStrategy",
  description:
    "Removes strategies from the current build by exact parameter matching. Explain your strategic reasoning for removal decisions.",
  inputSchema: z.object({
    strategy: z.object({
      type: z.string(),
      params: z.record(z.any()),
    }),
    reasoning: z
      .string()
      .describe(
        "Explain why you are removing this strategy and how it affects the overall trade build"
      ),
    confidenceScore: z
      .number()
      .min(0)
      .max(1)
      .describe("Confidence level for your reasoning (0-1)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    current_strategies: z.array(z.any()),
    warnings: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
    error_message: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { strategy, reasoning, confidenceScore } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const result = await strategyService.removeStrategy(
      tradeActionId,
      strategy,
      "removeStrategy"
    );

    // Log journal entry for strategy removal
    if (result.success) {
      try {
        await tradeActionService.createJournalEntry({
          sectorId,
          tradeActionId,
          type: "STRATEGY_REMOVED",
          content: {
            strategy_type: strategy.type,
            strategy_id: `${strategy.type}-${JSON.stringify(strategy.params)}`,
            reasoning,
          },
          confidenceScore,
          isInternal: false,
        });
      } catch (error) {
        console.error("Failed to log strategy removal:", error);
      }
    }

    return {
      success: result.success,
      current_strategies: result.strategies,
      error_message: result.errorMessage,
      warnings: result.analysis.warnings,
      suggestions: result.analysis.suggestions,
    };
  },
});
