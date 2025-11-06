import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyService } from "@/services/trading/strategy/strategy-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const addSmaCrossStrategyTool = createTool({
  id: "addSmaCrossStrategy",
  description:
    "Adds simple moving average crossover exit conditions. Consider market conditions and trend direction when choosing signal parameters and explain your strategic reasoning. Available tools: removeStrategy (remove strategies), updateStrategy (modify strategies), viewBuildState (review current build).",
  inputSchema: z.object({
    fast_period: z.number().describe("Fast moving average period"),
    slow_period: z.number().describe("Slow moving average period"),
    signal_type: z
      .enum(["cross_up", "cross_down", "both"])
      .default("both")
      .describe(
        "Which crossover signals to monitor: cross_up for bullish, cross_down for bearish, both for all"
      ),
    action: z
      .enum(["reassess", "close"])
      .default("reassess")
      .describe(
        "Action to take when signals trigger: reassess for manual evaluation, close for automatic exit"
      ),
    reasoning: z
      .string()
      .describe(
        "Explain why you chose these SMA parameters and signal strategy based on market conditions"
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
    const { fast_period, slow_period, signal_type, action, reasoning, confidenceScore } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const result = await strategyService.addStrategy(
      tradeActionId,
      "smaCross",
      { fast_period, slow_period, signal_type, action, reasoning },
      "addSmaCrossStrategy"
    );

    if (result.success) {
      try {
        await tradeActionService.createJournalEntry({
          sectorId,
          tradeActionId,
          type: "SMA_STRATEGY_ADDED",
          content: {
            fast_period,
            slow_period,
            signal_type,
            action,
            reasoning,
          },
          confidenceScore,
          isInternal: false,
        });
      } catch (error) {
        console.error("Failed to log SMA strategy addition:", error);
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
