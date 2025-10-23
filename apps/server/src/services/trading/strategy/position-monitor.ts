import { PositionMonitorParams, StrategyContext } from "@/types/strategy";

/**
 * Checks if the current price has hit the stop-loss or take-profit levels.
 * This is the foundational risk management layer for every trade.
 *
 * @param params - The parameters for this strategy, containing stopLoss and takeProfit.
 * @param context - The shared context containing the current market price.
 * @returns A boolean indicating if the exit condition was met.
 */
export async function check(
  params: PositionMonitorParams,
  context: StrategyContext
): Promise<boolean> {
  const { stopLoss, takeProfit } = params;
  const { currentPrice, tradeActionId } = context;

  if (currentPrice <= stopLoss) {
    console.log(
      `[PositionMonitor] STOP-LOSS triggered for trade ${tradeActionId} at price ${currentPrice} (SL: ${stopLoss})`
    );
    return true;
  }

  if (currentPrice >= takeProfit) {
    console.log(
      `[PositionMonitor] TAKE-PROFIT triggered for trade ${tradeActionId} at price ${currentPrice} (TP: ${takeProfit})`
    );
    return true;
  }

  return false;
}
