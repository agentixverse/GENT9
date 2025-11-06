import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import threadCleanup from "@/infrastructure/cron/system/thread-cleanup";
import threadDiscoveryCron from "@/infrastructure/cron/system/thread-discovery";
import tradeCycler from "@/infrastructure/cron/trading/trade-cycler";
import { ensurePythonEnv } from "@/infrastructure/python/python-env";
import { errorHandler } from "@/interfaces/api/middleware/errorHandler";
import authRoutes from "@/interfaces/api/routes/auth";
import backtestRoutes from "@/interfaces/api/routes/backtest";
import orbRoutes from "@/interfaces/api/routes/orb";
import policyRoutes from "@/interfaces/api/routes/policy";
import portfolioRoutes from "@/interfaces/api/routes/portfolio";
import profileRoutes from "@/interfaces/api/routes/profile";
import sectorRoutes from "@/interfaces/api/routes/sector";
import threadRegistryManagementRoutes from "@/interfaces/api/routes/thread-registry";
import threadRegistryRoutes from "@/interfaces/api/routes/threadRegistry";
import threadRoutes from "@/interfaces/api/routes/thread";
import tradeRoutes from "@/interfaces/api/routes/trade";
import rpcRoutes from "@/interfaces/rpc";

// Import queue workers to start them
import "@/infrastructure/queues/backtesting/worker";
import "@/infrastructure/queues/trading/trade-analyser/worker";
import "@/infrastructure/queues/trading/strategy-monitor/worker";

dotenv.config();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/backtests", backtestRoutes);
app.use("/api/sectors", sectorRoutes);
app.use("/api/orbs", orbRoutes);
app.use("/api/thread-registry", threadRegistryManagementRoutes);
app.use("/api/thread-registry-assets", threadRegistryRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/internal/rpc", rpcRoutes);

app.use(errorHandler);

const BACKEND_PORT = process.env.BACKEND_PORT || 4848;

if (!process.env.BACKEND_PORT) {
  console.warn(
    `[agentix-server]: BACKEND_PORT is not set, using default port ${BACKEND_PORT}`
  );
}

app.listen(BACKEND_PORT, async () => {
  console.log(`[agentix-server]: running at http://localhost:${BACKEND_PORT}`);

  // Ensure Python environment is set up
  try {
    await ensurePythonEnv();
  } catch (error) {
    console.error("Failed to setup Python environment:", error);
    console.warn("Backtesting features will not be available");
  }

  // Start crons
  tradeCycler.start();
  threadCleanup.start();
  threadDiscoveryCron.start();
});
