import { RsiParams, StrategyContext } from "@/types/strategy";
import { python } from "pythonia";

/**
 * Checks if the Relative Strength Index (RSI) has crossed a certain level.
 * Uses ta-lib via pythonia for accurate RSI calculation.
 *
 * @param params - The parameters for this strategy (period, overbought, oversold).
 * @param context - The shared context containing historical market data.
 * @returns A boolean indicating if the exit condition was met.
 */
export async function check(
  params: RsiParams,
  context: StrategyContext
): Promise<boolean> {
  const { period, overbought, oversold } = params;
  const { historicalData, tradeActionId } = context;

  if (!historicalData || historicalData.length < period) {
    console.warn(`[RSI] Not enough historical data for trade ${tradeActionId}.`);
    return false;
  }

  const np = await python("numpy");
  const talib = await python("talib");
  const json = await python("json");

  const closingPrices = historicalData.map((data: any) => data.price);
  
  const rsi_output = await talib.RSI(await np.array(closingPrices, "float64"), period);
  const rsi_list = await rsi_output.tolist();
  
  const rsi_json_string = await json.dumps(rsi_list);
  const fixed_rsi_string = rsi_json_string.replace(/\bNaN\b/g, "null");
  const rsi_js_array = JSON.parse(fixed_rsi_string);
  
  const currentRsi = rsi_js_array[rsi_js_array.length - 1];
  
  if (currentRsi === null) {
    console.warn(`[RSI] RSI calculation returned null for trade ${tradeActionId}. Not enough data.`);
    return false;
  }

  console.log(
    `[RSI] Trade ${tradeActionId}: Current RSI(${period}) is ${currentRsi}. Overbought: ${overbought}, Oversold: ${oversold}.`
  );

  // Check for overbought condition (potential sell signal)
  if (currentRsi >= overbought) {
    console.log(
      `[RSI] EXIT condition met for trade ${tradeActionId}: RSI (${currentRsi}) is overbought (>= ${overbought}).`
    );
    return true;
  }

  // Check for oversold condition (potential buy signal, but we only do spot trading exits)
  if (currentRsi <= oversold) {
    console.log(
      `[RSI] EXIT condition met for trade ${tradeActionId}: RSI (${currentRsi}) is oversold (<= ${oversold}).`
    );
    return true;
  }

  return false;
}
