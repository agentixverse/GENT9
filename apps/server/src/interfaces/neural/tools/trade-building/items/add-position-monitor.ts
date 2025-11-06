import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyService } from "@/services/trading/strategy/strategy-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const addPositionMonitorTool = createTool({
  id: "addPositionMonitor",
  description:
    "Establishes the foundational risk layer with stop-loss and take-profit parameters. Consider market volatility and position size when setting risk parameters and explain your risk management reasoning. Available tools: removeStrategy (remove strategies), updateStrategy (modify strategies), viewBuildState (review current build).",
  inputSchema: z.object({
    stopLoss: z
      .number()
      .describe("Stop loss in the price of the asset and not percentages"),
    takeProfit: z
      .number()
      .describe("Take profit in the price of the asset and not percentages"),
    reasoning: z
      .string()
      .describe(
        "Explain why you chose these risk parameters based on market conditions and position management strategy"
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
    const { stopLoss, takeProfit, reasoning, confidenceScore } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    // Check if trading pair has been set first
    const tradingPairInfo = await tradeActionService.getTradingPairInfo(tradeActionId);
    if (!tradingPairInfo || !tradingPairInfo.trading_pair) {
      return {
        success: false,
        current_strategies: [],
        warnings: [
          "Trading pair must be set before adding position monitor. Use setTradingPair tool first.",
        ],
        suggestions: [
          "Use the setTradingPair tool to select an orb and trading pair before setting position monitor.",
        ],
      };
    }

    const result = await strategyService.addStrategy(
      tradeActionId,
      "positionMonitor",
      { stopLoss, takeProfit, reasoning, action: "close" },
      "addPositionMonitor"
    );

    // Log journal entry for position monitor addition
    if (result.success) {
      try {
        await tradeActionService.createJournalEntry({
          sectorId,
          tradeActionId,
          type: "POSITION_MONITOR_ADDED",
          content: {
            stop_loss: stopLoss,
            take_profit: takeProfit,
            reasoning,
          },
          confidenceScore,
          isInternal: false,
        });
      } catch (error) {
        console.error("Failed to log position monitor addition:", error);
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
