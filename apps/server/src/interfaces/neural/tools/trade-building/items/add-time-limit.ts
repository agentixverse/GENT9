import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyService } from "@/services/trading/strategy/strategy-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const addTimeLimitTool = createTool({
  id: "addTimeLimit",
  description:
    "Adds time-based exit conditions to prevent indefinite position holding. Consider market conditions and position management when choosing timing strategy and explain your reasoning. Available tools: removeStrategy (remove strategies), updateStrategy (modify strategies), viewBuildState (review current build).",
  inputSchema: z.object({
    duration_seconds: z.number().describe("Duration in seconds before action"),
    action: z
      .enum(["reassess", "close"])
      .default("reassess")
      .describe(
        "Action to take when time expires: reassess for manual evaluation, close for automatic exit"
      ),
    reasoning: z
      .string()
      .describe(
        "Explain why you chose this time limit and action strategy based on position management needs"
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
    const { duration_seconds, action, reasoning, confidenceScore } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const result = await strategyService.addStrategy(
      tradeActionId,
      "timeLimit",
      { duration_seconds, action, reasoning },
      "addTimeLimit"
    );

    // Log journal entry for time limit addition
    if (result.success) {
      try {
        const durationMinutes = Math.round(duration_seconds / 60);
        await tradeActionService.createJournalEntry({
          sectorId,
          tradeActionId,
          type: "TIME_LIMIT_ADDED",
          content: {
            duration_minutes: durationMinutes,
            action,
            reasoning,
          },
          confidenceScore,
          isInternal: false,
        });
      } catch (error) {
        console.error("Failed to log time limit addition:", error);
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
