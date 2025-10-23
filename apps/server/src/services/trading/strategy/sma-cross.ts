import { SmaCrossParams, StrategyContext } from "@/types/strategy";
import { python } from "pythonia";

/**
 * Checks for a crossover between two Simple Moving Averages (SMAs).
 * Uses ta-lib via pythonia for accurate SMA calculations.
 *
 * @param params - The parameters for this strategy (fast_period, slow_period, signal_type).
 * @param context - The shared context containing historical market data.
 * @returns A boolean indicating if the exit condition was met.
 */
export async function check(
  params: SmaCrossParams,
  context: StrategyContext
): Promise<boolean> {
  const { fast_period, slow_period, signal_type } = params;
  const { historicalData, tradeActionId } = context;

  if (!historicalData || historicalData.length < slow_period) {
    console.warn(`[SMACross] Not enough historical data for trade ${tradeActionId}.`);
    return false;
  }

  const np = await python("numpy");
  const talib = await python("talib");
  const json = await python("json");

  const closingPrices = historicalData.map((data: any) => data.price);
  
  // Calculate Fast SMA
  const fast_sma_output = await talib.SMA(await np.array(closingPrices, "float64"), fast_period);
  const fast_sma_list = await fast_sma_output.tolist();
  const fast_sma_json = await json.dumps(fast_sma_list);
  const fast_sma_fixed = fast_sma_json.replace(/\bNaN\b/g, "null");
  const fastSma = JSON.parse(fast_sma_fixed);
  
  // Calculate Slow SMA
  const slow_sma_output = await talib.SMA(await np.array(closingPrices, "float64"), slow_period);
  const slow_sma_list = await slow_sma_output.tolist();
  const slow_sma_json = await json.dumps(slow_sma_list);
  const slow_sma_fixed = slow_sma_json.replace(/\bNaN\b/g, "null");
  const slowSma = JSON.parse(slow_sma_fixed);

  const lastFastSma = fastSma[fastSma.length - 1];
  const prevFastSma = fastSma[fastSma.length - 2];
  const lastSlowSma = slowSma[slowSma.length - 1];
  const prevSlowSma = slowSma[slowSma.length - 2];

  if (lastFastSma === null || prevFastSma === null || lastSlowSma === null || prevSlowSma === null) {
    console.warn(`[SMACross] SMA calculation returned null values for trade ${tradeActionId}. Not enough data.`);
    return false;
  }

  console.log(
    `[SMACross] Trade ${tradeActionId}: Fast SMA: ${lastFastSma}, Slow SMA: ${lastSlowSma}.`
  );

  // Check for bearish cross down (fast crosses below slow)
  const crossDown = (prevFastSma >= prevSlowSma && lastFastSma < lastSlowSma);
  
  // Check for bullish cross up (fast crosses above slow)  
  const crossUp = (prevFastSma <= prevSlowSma && lastFastSma > lastSlowSma);
  
  if ((signal_type === "cross_down" || signal_type === "both") && crossDown) {
    console.log(
      `[SMACross] BEARISH EXIT condition met for trade ${tradeActionId}: Fast SMA crossed below Slow SMA.`
    );
    return true;
  }

  if ((signal_type === "cross_up" || signal_type === "both") && crossUp) {
    console.log(
      `[SMACross] BULLISH EXIT condition met for trade ${tradeActionId}: Fast SMA crossed above Slow SMA.`
    );
    return true;
  }

  return false;
}
