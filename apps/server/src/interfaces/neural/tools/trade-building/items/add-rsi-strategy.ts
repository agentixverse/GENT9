import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyService } from "@/services/trading/strategy/strategy-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const addRsiStrategyTool = createTool({
  id: "addRsiStrategy",
  description:
    "Adds RSI-based exit conditions to the trade strategy composition. Consider market conditions when choosing parameters and explain your strategic reasoning. Available tools: removeStrategy (remove strategies), updateStrategy (modify strategies), viewBuildState (review current build).",
  inputSchema: z.object({
    period: z.number().describe("RSI calculation period"),
    overbought: z.number().describe("Overbought threshold"),
    oversold: z.number().describe("Oversold threshold"),
    action: z
      .enum(["reassess", "close"])
      .default("reassess")
      .describe(
        "Action to take when RSI signals trigger: reassess for manual evaluation, close for automatic exit"
      ),
    reasoning: z
      .string()
      .describe(
        "Explain why you chose these RSI parameters and action strategy based on market conditions"
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
  }),
  execute: async ({ context, runtimeContext }) => {
    const { period, overbought, oversold, action, reasoning, confidenceScore } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const result = await strategyService.addStrategy(
      tradeActionId,
      "rsi",
      { period, overbought, oversold, action, reasoning },
      "addRsiStrategy"
    );

    // Log journal entry for RSI strategy addition
    if (result.success) {
      try {
        await tradeActionService.createJournalEntry({
          sectorId,
          tradeActionId,
          type: "RSI_STRATEGY_ADDED",
          content: {
            rsi_upper: overbought,
            rsi_lower: oversold,
            action,
            reasoning,
          },
          confidenceScore,
        });
      } catch (error) {
        console.error("Failed to log RSI strategy addition:", error);
      }
    }

    return {
      success: result.success,
      current_strategies: result.strategies,
      warnings: result.analysis.warnings,
      suggestions: result.analysis.suggestions,
    };
  },
});
