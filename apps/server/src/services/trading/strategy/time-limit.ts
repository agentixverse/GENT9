import { TimeLimitParams, StrategyContext } from "@/types/strategy";

/**
 * Checks if the trade has been open for longer than the specified time limit.
 *
 * @param params - The parameters for this strategy, containing the time limit in minutes.
 * @param context - The shared context containing the trade's creation timestamp.
 * @returns A boolean indicating if the exit condition was met.
 */
export async function check(
  params: TimeLimitParams,
  context: StrategyContext
): Promise<boolean> {
  const { duration_seconds } = params;
  const { tradeCreatedAt, tradeActionId } = context;

  const now = new Date();
  const elapsedMilliseconds = now.getTime() - tradeCreatedAt.getTime();
  const elapsedSeconds = elapsedMilliseconds / 1000;

  if (elapsedSeconds >= duration_seconds) {
    console.log(
      `[TimeLimit] Time limit of ${duration_seconds} seconds reached for trade ${tradeActionId}.`
    );
    return true;
  }

  return false;
}
