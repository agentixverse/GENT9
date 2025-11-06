import { SandboxedJob } from "bullmq";

import { backtestService } from "@/services/trading/backtest/backtest-service";
import { backtestExecutor, BacktestConfig } from "@/services/trading/backtest/backtest-executor";
import { StrategyRevision } from "@/models/Strategy";

interface BacktestJobData {
  strategyId: number;
  userId: number;
  revisionIndex: number;
  config: BacktestConfig;
}

/**
 * This is the sandboxed processor for the backtest queue.
 * It runs in a separate process to avoid blocking the main event loop.
 *
 * Pipeline:
 * 1. Start backtest (update status to "running")
 * 2. Fetch strategy code from revisions array
 * 3. Call Python executor to run backtest
 * 4. On success: save results and update status to "completed"
 * 5. On failure: save error and update status to "failed"
 *
 * @param job The job from the backtest queue, containing strategyId, userId, revisionIndex, and config.
 */
module.exports = async (job: SandboxedJob<BacktestJobData>) => {
  const { strategyId, userId, revisionIndex, config } = job.data;

  console.log(
    `[backtest-queue] Processing backtest for strategy ${strategyId}, revision ${revisionIndex}, user ${userId}`
  );

  try {
    // Step 1: Mark backtest as started
    await job.log(`Starting backtest for strategy ${strategyId}, revision ${revisionIndex}`);
    await backtestService.startBacktest(strategyId, userId, revisionIndex);
    console.log(
      `[backtest-queue] Backtest started for strategy ${strategyId}, revision ${revisionIndex}`
    );

    // Step 2: Fetch strategy code
    await job.log(`Fetching strategy code for revision ${revisionIndex}`);
    const strategy = await backtestService.getStrategyById(strategyId, userId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found for user ${userId}`);
    }

    const revisions = strategy.revisions as unknown as StrategyRevision[];
    const revision = revisions[revisionIndex];
    if (!revision) {
      throw new Error(`Revision ${revisionIndex} not found for strategy ${strategyId}`);
    }

    const strategyCode = revision.code;
    console.log(
      `[backtest-queue] Retrieved strategy code (${strategyCode.length} characters)`
    );

    // Step 3: Execute backtest via Python executor (using pythonia)
    await job.log(`Executing Python backtest with config: ${JSON.stringify(config)}`);
    await job.updateProgress(25);

    const result = await backtestExecutor.runBacktest(strategyCode, config);

    await job.updateProgress(75);
    console.log(
      `[backtest-queue] Backtest execution completed. Metrics:`,
      result.metrics
    );

    // Step 4: Save successful results
    await job.log(`Saving backtest results for strategy ${strategyId}`);
    await backtestService.completeBacktest(strategyId, userId, revisionIndex, {
      metrics: result.metrics,
      html_report: result.html_report,
    });

    await job.updateProgress(100);
    console.log(
      `[backtest-queue] Successfully completed backtest for strategy ${strategyId}, revision ${revisionIndex}`
    );
  } catch (error) {
    // Step 5: Handle failure
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(
      `[backtest-queue] Backtest failed for strategy ${strategyId}, revision ${revisionIndex}:`,
      {
        message: errorMessage,
        stack: errorStack,
      }
    );

    await job.log(`Backtest failed: ${errorMessage}`);

    try {
      await backtestService.failBacktest(strategyId, userId, revisionIndex, errorMessage);
      console.log(
        `[backtest-queue] Marked backtest as failed for strategy ${strategyId}, revision ${revisionIndex}`
      );
    } catch (saveError) {
      console.error(
        `[backtest-queue] Failed to save error state for strategy ${strategyId}:`,
        saveError
      );
    }

    // Re-throw to let BullMQ mark the job as failed
    throw error;
  }
};