import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyQueue } from "@/infrastructure/queues/config";
import { tokenService } from "@/services/system/token-service";
import { strategyService } from "@/services/trading/strategy/strategy-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const enterPositionTool = createTool({
  id: "enterPosition",
  description:
    "Executes a BUY order (OFFER) - selling quote currency (USDC/USDT) to acquire base currency from the selected trading pair. Can only be called once per trade action. Any subsequent calls will exit the position.",
  inputSchema: z.object({
    amount: z
      .string()
      .describe("Amount of quote currency (USDC/USDT) to spend on acquiring base currency"),
    reasoning: z
      .string()
      .describe("Explain your decision to execute this trade based on your analysis"),
    confidenceScore: z
      .number()
      .min(0)
      .max(1)
      .describe("Confidence level for your reasoning (0-1)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    error_message: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { amount, reasoning, confidenceScore } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const currentTrade = await tradeActionService.getTradeStatus(tradeActionId);

    if (currentTrade?.status === "EXECUTING") {
      return {
        success: false,
        message: "Running trade cannot be modified, exit position if trade is invalidated.",
        error_message: "Invalid call - enterPosition can only be called once per trade.",
      };
    }

    if (["SUCCEEDED", "FAILED"].includes(currentTrade?.status || "")) {
      return {
        success: false,
        message: "Trade is already completed and cannot be entered.",
        error_message: "Trade is in terminal state.",
      };
    }

    const strategies = await strategyService.getStrategies(tradeActionId);

    const analysis = await strategyService.analyzeStrategies(strategies);

    const hasPositionMonitor = strategies.some(
      (s) => s.strategy_type === "positionMonitor"
    );
    if (!hasPositionMonitor) {
      return {
        success: false,
        message: "Validation failed: A position monitor is required before execution.",
        error_message:
          "Validation failed: A position monitor is required before execution.",
      };
    }

    if (analysis.warnings.length > 0) {
      return {
        success: false,
        message: `Validation failed: ${analysis.warnings.join(" ")}`,
        error_message: `Validation failed: ${analysis.warnings.join(" ")}`,
      };
    }

    const schedulerId = `monitor-trade-${tradeActionId}`;
    await strategyQueue.upsertJobScheduler(
      schedulerId,
      { every: 20 * 1000 },
      {
        name: "monitor-trade",
        data: { tradeActionId },
      }
    );

    await tradeActionService.updateTradeStatus(tradeActionId, "EXECUTING");

    const tradingPairInfo = await tradeActionService.getTradingPairInfo(tradeActionId);

    if (!tradingPairInfo) {
      throw new Error("Trading pair info not found");
    }

    if (!tradingPairInfo.trading_pair) {
      throw new Error("Trading pair not set. Call setTradingPair first.");
    }

    const tradingPair = tradingPairInfo.trading_pair;
    const routingInfo = tokenService.getRoutingInfo(
      tradingPairInfo.chain as any,
      tradingPair
    );

    try {
      await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type: "POSITION_ENTERED",
        content: {
          trading_pair: tradingPair,
          amount: amount,
          chain: tradingPairInfo.chain as any,
          dex: routingInfo.isValid ? routingInfo.defaultDex : "Direct",
          reasoning: reasoning,
        },
        confidenceScore,
      });
    } catch (error) {
      console.error("Failed to log position enter:", error);
    }

    return {
      success: true,
      message: `Trade ${tradeActionId} has been executed and is now being monitored.`,
    };
  },
});
