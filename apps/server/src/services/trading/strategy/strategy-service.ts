import { Selectable } from "kysely";

import { TradeStrategiesTable } from "@/infrastructure/database/schema";
import { db } from "@/infrastructure/database/turso-connection";

export interface StrategyAnalysis {
  warnings: string[];
  suggestions: string[];
}

export interface Strategy {
  type: string;
  params: Record<string, any>;
}

export interface StrategyResult {
  success: boolean;
  strategies: Selectable<TradeStrategiesTable>[];
  analysis: StrategyAnalysis;
  errorMessage?: string;
}

// NOTE: This list is hardcoded to avoid circular dependencies.
// It should be kept in sync with the tools in 'interfaces/neural/tools/trade-building/index.ts'
const allTradeBuildingToolNames = [
  "addPositionMonitor",
  "addRsiStrategy",
  "addSmaCrossStrategy",
  "addTimeLimit",
  "removeStrategy",
  "updateStrategy",
  "viewBuildState",
];

// Internal analysis helper functions
const analyzeStrategies = (
  strategies: Selectable<TradeStrategiesTable>[],
  currentToolId?: string
): StrategyAnalysis => {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Rule: Must have a position monitor
  const hasPositionMonitor = strategies.some((s) => s.strategy_type === "positionMonitor");
  if (!hasPositionMonitor) {
    warnings.push(
      "A position monitor with stop-loss and take-profit is required before execution."
    );
    suggestions.push(
      "Consider adding a position monitor to protect your trade. Use the `addPositionMonitor` tool."
    );
  }

  // Rule: Prevent duplicate strategies
  const strategyCounts = new Map<string, number>();
  for (const strategy of strategies) {
    const key = `${strategy.strategy_type}:${JSON.stringify(
      strategy.strategy_params_json
    )}`;
    strategyCounts.set(key, (strategyCounts.get(key) || 0) + 1);
  }
  for (const [key, count] of strategyCounts.entries()) {
    if (count > 1) {
      const [type] = key.split(":", 1);
      warnings.push(`Duplicate strategy found: ${type}. Consolidate or remove duplicates.`);
    }
  }

  // New suggestion logic
  if (currentToolId) {
    const otherTools = allTradeBuildingToolNames.filter(
      (toolName) => toolName !== currentToolId
    );
    suggestions.push(
      ...otherTools.map(
        (toolName) =>
          `You can also use the '${toolName}' tool to further configure the trade.`
      )
    );
  }

  return { warnings, suggestions };
};

export const strategyService = {
  async addStrategy(
    tradeActionId: number,
    strategyType: string,
    params: Record<string, any>,
    toolId?: string
  ): Promise<StrategyResult> {
    // Check for existing position monitor if adding another one
    if (strategyType === "positionMonitor") {
      const existingMonitor = await db
        .selectFrom("trade_strategies")
        .where("trade_action_id", "=", tradeActionId)
        .where("strategy_type", "=", "positionMonitor")
        .executeTakeFirst();

      if (existingMonitor) {
        const strategies = await this.getStrategies(tradeActionId);
        return {
          success: false,
          strategies,
          analysis: analyzeStrategies(strategies, toolId),
          errorMessage: "A position monitor already exists for this trade.",
        };
      }
    }

    await db
      .insertInto("trade_strategies")
      .values({
        trade_action_id: tradeActionId,
        strategy_type: strategyType,
        strategy_params_json: JSON.stringify(params),
        is_active: true,
      })
      .execute();

    const strategies = await this.getStrategies(tradeActionId);
    const analysis = analyzeStrategies(strategies, toolId);

    return {
      success: true,
      strategies,
      analysis,
    };
  },

  async getStrategies(tradeActionId: number): Promise<Selectable<TradeStrategiesTable>[]> {
    return await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();
  },

  async updateStrategy(
    tradeActionId: number,
    currentStrategy: Strategy,
    updatedStrategy: Strategy,
    toolId?: string
  ): Promise<StrategyResult> {
    const result = await db
      .updateTable("trade_strategies")
      .set({ strategy_params_json: JSON.stringify(updatedStrategy.params) })
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", currentStrategy.type)
      .where("strategy_params_json", "=", currentStrategy.params)
      .executeTakeFirst();

    const strategies = await this.getStrategies(tradeActionId);

    if (result.numUpdatedRows === 0n) {
      return {
        success: false,
        strategies,
        analysis: analyzeStrategies(strategies, toolId),
        errorMessage: "No matching strategy found to update.",
      };
    }

    const analysis = analyzeStrategies(strategies, toolId);

    return {
      success: true,
      strategies,
      analysis,
    };
  },

  async removeStrategy(
    tradeActionId: number,
    strategy: Strategy,
    toolId?: string
  ): Promise<StrategyResult> {
    // Prevent removing position monitor if other strategies exist
    if (strategy.type === "positionMonitor") {
      const otherStrategies = await db
        .selectFrom("trade_strategies")
        .where("trade_action_id", "=", tradeActionId)
        .where("strategy_type", "!=", "positionMonitor")
        .selectAll()
        .execute();

      if (otherStrategies.length > 0) {
        const allStrategies = await this.getStrategies(tradeActionId);
        return {
          success: false,
          strategies: allStrategies,
          analysis: analyzeStrategies(allStrategies, toolId),
          errorMessage: "Cannot remove position monitor when other strategies exist.",
        };
      }
    }

    const result = await db
      .deleteFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", strategy.type)
      .where("strategy_params_json", "=", strategy.params)
      .executeTakeFirst();

    const strategies = await this.getStrategies(tradeActionId);

    if (result.numDeletedRows === 0n) {
      return {
        success: false,
        strategies,
        analysis: analyzeStrategies(strategies, toolId),
        errorMessage: "No matching strategy found to remove.",
      };
    }

    const analysis = analyzeStrategies(strategies, toolId);

    return {
      success: true,
      strategies,
      analysis,
    };
  },

  async closeAllStrategies(tradeActionId: number): Promise<StrategyResult> {
    await db
      .updateTable("trade_strategies")
      .set({ is_active: false })
      .where("trade_action_id", "=", tradeActionId)
      .execute();

    const strategies = await this.getStrategies(tradeActionId);
    const analysis = analyzeStrategies(strategies);

    return {
      success: true,
      strategies,
      analysis,
    };
  },

  async analyzeStrategies(
    strategies: Selectable<TradeStrategiesTable>[],
    toolId?: string
  ): Promise<StrategyAnalysis> {
    return analyzeStrategies(strategies, toolId);
  },
};
