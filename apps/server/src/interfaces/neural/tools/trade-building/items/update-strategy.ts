import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyService } from "@/services/trading/strategy/strategy-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const updateStrategyTool = createTool({
  id: "updateStrategy",
  description:
    "Modifies existing strategies by requiring full parameter matching for safety. Explain your strategic reasoning for modification decisions.",
  inputSchema: z.object({
    current_strategy: z.object({
      type: z.string(),
      params: z.record(z.any()),
    }),
    updated_strategy: z.object({
      type: z.string(),
      params: z.record(z.any()),
    }),
    reasoning: z
      .string()
      .describe(
        "Explain why you are updating this strategy and how the changes improve the trade build"
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
    const { current_strategy, updated_strategy, reasoning, confidenceScore } =
      context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const result = await strategyService.updateStrategy(
      tradeActionId,
      current_strategy,
      updated_strategy,
      "updateStrategy"
    );

    // Log journal entry for strategy update
    if (result.success) {
      try {
        await tradeActionService.createJournalEntry({
          sectorId,
          tradeActionId,
          type: "STRATEGY_UPDATED",
          content: {
            strategy_type: current_strategy.type,
            strategy_id: `${current_strategy.type}-${JSON.stringify(
              current_strategy.params
            )}`,
            reasoning,
          },
          confidenceScore,
          isInternal: false,
        });
      } catch (error) {
        console.error("Failed to log strategy update:", error);
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
