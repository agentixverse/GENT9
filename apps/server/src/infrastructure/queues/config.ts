import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // Important for BullMQ
});

export const userTradingQueue = new Queue("trade-analyser-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const strategyQueue = new Queue("strategy-monitor-queue", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const backtestQueue = new Queue("backtest-queue", {
  connection,
  defaultJobOptions: {
    attempts: 1, // No retries for backtests
  },
});

process.on("SIGINT", async () => {
  await userTradingQueue.close();
  await strategyQueue.close();
  await backtestQueue.close();
  connection.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await userTradingQueue.close();
  await strategyQueue.close();
  await backtestQueue.close();
  connection.quit();
  process.exit(0);
});
