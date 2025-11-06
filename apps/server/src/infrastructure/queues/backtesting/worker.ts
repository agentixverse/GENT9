import { Worker } from "bullmq";
import path from "path";

import { backtestQueue } from "@/infrastructure/queues/config";

// Note: Python environment is validated on server startup in server.ts
// No need to validate here since server.ts calls ensurePythonEnv()

// Path to the processor file (will be compiled to .js)
const processorPath = path.join(__dirname, "processor.js");

const worker = new Worker("backtest-queue", processorPath, {
  connection: backtestQueue.opts.connection,
  concurrency: 2, // System-wide limit: max 2 backtests running simultaneously
  useWorkerThreads: true,
  limiter: {
    max: 2, // Process max 2 jobs
    duration: 1000, // per 1 second (rate limiting)
  },
});

worker.on("completed", (job) => {
  console.log(`[backtest-queue] Job ${job.id} has completed successfully!`);
});

worker.on("failed", (job, err) => {
  if (job) {
    console.error(
      `[backtest-queue] Job ${job.id} failed with error: ${err.message}`,
      {
        stack: err.stack,
        data: job.data,
      }
    );
  } else {
    console.error(`[backtest-queue] An unknown job failed with error: ${err.message}`, {
      stack: err.stack,
    });
  }
});

worker.on("error", (err) => {
  console.error("[backtest-queue] Worker error:", err);
});