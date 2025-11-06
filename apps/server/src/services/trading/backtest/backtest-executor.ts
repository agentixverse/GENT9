import { python } from "pythonia";
import { getVenvPath } from "@/infrastructure/python/python-env";
import { marketDataService } from "./market-data-service";

export interface BacktestResult {
  html_report: string;
  metrics: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    total_trades: number;
    profit_factor?: number;
    best_day?: number;
    worst_day?: number;
    avg_trade?: number;
  };
}

export interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  coinId?: string;
  days?: number;
}

export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class BacktestExecutorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BacktestExecutorError";
  }
}

export const backtestExecutor = {
  /**
   * Run a backtest using Python via pythonia
   *
   * This is the main entry point that replaces python-executor-service.
   * It uses pythonia to call Python directly (no spawn, no temp files).
   */
  async runBacktest(
    strategyCode: string,
    config: BacktestConfig
  ): Promise<BacktestResult> {
    try {
      // Step 1: Fetch OHLCV data
      const coinId = config.coinId || "bitcoin";
      const days = config.days || 365;
      console.log(`Fetching OHLCV data for ${coinId} (${days} days)...`);

      const ohlcvData = await this.fetchOHLCVData(coinId, days);
      console.log(`✓ Fetched ${ohlcvData.length} OHLCV candles`);

      // Step 2: Set up Python environment
      const venvPath = getVenvPath();
      process.env.VIRTUAL_ENV = venvPath;
      process.env.PATH = `${venvPath}/bin:${process.env.PATH}`;

      // Step 3: Import Python wrapper
      const wrapper = await python("./src/services/trading/backtest_wrapper");

      // Step 4: Call Python function
      console.log("Executing backtest via Python...");
      const result = await wrapper.run_backtest(
        strategyCode,
        config,
        ohlcvData
      );

      // Step 5: Convert result from Python to JavaScript
      const jsResult = {
        html_report: result.html_report ? String(result.html_report) : null,
        metrics: result.metrics ? {
          total_return: Number(result.metrics.total_return),
          sharpe_ratio: Number(result.metrics.sharpe_ratio),
          max_drawdown: Number(result.metrics.max_drawdown),
          win_rate: Number(result.metrics.win_rate),
          total_trades: Number(result.metrics.total_trades),
          profit_factor: result.metrics.profit_factor ? Number(result.metrics.profit_factor) : undefined,
          best_day: result.metrics.best_day ? Number(result.metrics.best_day) : undefined,
          worst_day: result.metrics.worst_day ? Number(result.metrics.worst_day) : undefined,
          avg_trade: result.metrics.avg_trade ? Number(result.metrics.avg_trade) : undefined,
        } : null,
        error: result.error ? String(result.error) : null,
      };

      // Check if Python returned an error
      if (jsResult.error) {
        throw new BacktestExecutorError(jsResult.error);
      }

      if (!jsResult.html_report || !jsResult.metrics) {
        throw new BacktestExecutorError("Python returned incomplete result");
      }

      console.log("✓ Backtest completed successfully");

      return {
        html_report: jsResult.html_report,
        metrics: jsResult.metrics,
      };
    } catch (error) {
      if (error instanceof BacktestExecutorError) {
        throw error;
      }
      throw new BacktestExecutorError(
        `Backtest execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      // Clean up Python
      python.exit();
    }
  },

  /**
   * Validate strategy code before running backtest
   * Fast validation without executing the backtest
   */
  async validateStrategy(strategyCode: string): Promise<ValidationResult> {
    try {
      // Set up Python environment
      const venvPath = getVenvPath();
      process.env.VIRTUAL_ENV = venvPath;
      process.env.PATH = `${venvPath}/bin:${process.env.PATH}`;

      // Import Python wrapper
      const wrapper = await python("./src/services/trading/backtest_wrapper");

      // Call validation function
      const result = await wrapper.validate_strategy(strategyCode);

      // Convert to JavaScript
      const jsResult = {
        valid: Boolean(result.valid),
        errors: result.errors ? Array.from(result.errors).map(String) : [],
        warnings: result.warnings ? Array.from(result.warnings).map(String) : [],
      };

      return jsResult;
    } catch (error) {
      throw new BacktestExecutorError(
        `Strategy validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      python.exit();
    }
  },

  /**
   * Fetch OHLCV data from market-data service
   */
  async fetchOHLCVData(coinId: string = "bitcoin", days: number = 365): Promise<OHLCVData[]> {
    try {
      const ohlcData = await marketDataService.getOHLC(coinId, "usd", days);

      const transformed: OHLCVData[] = ohlcData.map((candle) => ({
        timestamp: candle.x,
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
        volume: 0, // CoinGecko doesn't provide volume in OHLC endpoint
      }));

      return transformed;
    } catch (error) {
      throw new BacktestExecutorError(
        `Failed to fetch OHLCV data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
};
