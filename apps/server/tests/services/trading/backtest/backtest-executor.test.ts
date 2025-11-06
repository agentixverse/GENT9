import { describe, test, expect, beforeAll } from "vitest";
import { backtestExecutor } from "@/services/trading/backtest/backtest-executor";
import { ensurePythonEnv } from "@/infrastructure/python/python-env";

// Simple RSI strategy for testing
const rsiStrategy = `
from backtesting import Strategy
import talib

class RsiStrategy(Strategy):
    rsi_period = 14
    rsi_lower = 30
    rsi_upper = 70

    def init(self):
        self.rsi = self.I(talib.RSI, self.data.Close, self.rsi_period)

    def next(self):
        if not self.position:
            if self.rsi[-1] < self.rsi_lower:
                self.buy()
        else:
            if self.rsi[-1] > self.rsi_upper:
                self.position.close()
`;

// Simple SMA crossover strategy for testing
const smaStrategy = `
from backtesting import Strategy
from backtesting.lib import crossover
import numpy as np

class SmaCrossover(Strategy):
    n1 = 10
    n2 = 20

    def init(self):
        close = self.data.Close
        self.sma1 = self.I(self._sma, close, self.n1)
        self.sma2 = self.I(self._sma, close, self.n2)

    def next(self):
        if not self.position:
            if crossover(self.sma1, self.sma2):
                self.buy()
        else:
            if crossover(self.sma2, self.sma1):
                self.position.close()

    @staticmethod
    def _sma(data, n):
        return np.convolve(data, np.ones(n) / n, mode='valid')[-len(data):]
`;

describe("Backtest Executor (Pythonia)", () => {
  beforeAll(async () => {
    // Ensure Python environment is set up before running tests
    await ensurePythonEnv();
  }, 120000); // 2 minute timeout for Python setup

  describe("validateStrategy", () => {
    test("should validate a valid RSI strategy", async () => {
      const result = await backtestExecutor.validateStrategy(rsiStrategy);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should validate a valid SMA strategy", async () => {
      const result = await backtestExecutor.validateStrategy(smaStrategy);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject strategy with dangerous import (os)", async () => {
      const maliciousStrategy = `
import os
from backtesting import Strategy

class BadStrategy(Strategy):
    def init(self):
        os.system('rm -rf /')

    def next(self):
        pass
`;

      const result = await backtestExecutor.validateStrategy(maliciousStrategy);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes("OS import"))).toBe(true);
    });

    test("should reject strategy with eval()", async () => {
      const maliciousStrategy = `
from backtesting import Strategy

class BadStrategy(Strategy):
    def init(self):
        eval("import os")

    def next(self):
        pass
`;

      const result = await backtestExecutor.validateStrategy(maliciousStrategy);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("eval"))).toBe(true);
    });

    test("should reject strategy without Strategy class", async () => {
      const invalidStrategy = `
def some_function():
    pass
`;

      const result = await backtestExecutor.validateStrategy(invalidStrategy);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Strategy"))).toBe(true);
    });
  });

  describe("runBacktest", () => {
    test(
      "should execute SMA strategy and return results",
      async () => {
        const config = {
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          initialCapital: 10000,
          commission: 0.002,
          coinId: "bitcoin",
          days: 365,
        };

        const result = await backtestExecutor.runBacktest(smaStrategy, config);

        expect(result).toBeDefined();
        expect(result.html_report).toBeDefined();
        expect(typeof result.html_report).toBe("string");
        expect(result.html_report.length).toBeGreaterThan(0);

        expect(result.metrics).toBeDefined();
        expect(typeof result.metrics.total_return).toBe("number");
        expect(typeof result.metrics.sharpe_ratio).toBe("number");
        expect(typeof result.metrics.max_drawdown).toBe("number");
        expect(typeof result.metrics.win_rate).toBe("number");
        expect(typeof result.metrics.total_trades).toBe("number");
      },
      120000
    ); // 2 minute timeout for backtest execution

    test("should handle syntax errors gracefully", async () => {
      const invalidStrategy = `
from backtesting import Strategy

class BrokenStrategy(Strategy):
    def init(self)  # Missing colon
        pass

    def next(self):
        pass
`;

      const config = {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        initialCapital: 10000,
        commission: 0.002,
        coinId: "bitcoin",
        days: 30,
      };

      await expect(
        backtestExecutor.runBacktest(invalidStrategy, config)
      ).rejects.toThrow();
    });
  });

  describe("fetchOHLCVData", () => {
    test("should fetch Bitcoin OHLCV data", async () => {
      const data = await backtestExecutor.fetchOHLCVData("bitcoin", 30);

      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const firstCandle = data[0];
      expect(firstCandle).toHaveProperty("timestamp");
      expect(firstCandle).toHaveProperty("open");
      expect(firstCandle).toHaveProperty("high");
      expect(firstCandle).toHaveProperty("low");
      expect(firstCandle).toHaveProperty("close");
    });

    test("should fetch Ethereum OHLCV data", async () => {
      const data = await backtestExecutor.fetchOHLCVData("ethereum", 30);

      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });
});
