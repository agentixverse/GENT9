import { spawn } from "child_process";
import { promises as fs } from "fs";
import { getRandomPort } from "get-port-please";
import path from "path";

import { db } from "@/infrastructure/database/turso-connection";
import { ManagedProcess, ThreadConfig } from "@/types/threads";
import { createConfigHash } from "@/utils/threads";
import generateCapnp from "./workerd-capnp-generator";

const activeProcesses = new Map<string, ManagedProcess>();

export const threadService = {
  async getOrServeThread(
    orbId: number,
    sectorId: number,
    chain: string,
    providerId: string,
    config: ThreadConfig
  ) {
    const hash = createConfigHash(providerId, config);

    if (activeProcesses.has(hash)) {
      console.log(`[thread-service] Reusing existing worker for hash: ${hash}`);
      const managedProcess = activeProcesses.get(hash)!;
      managedProcess.lastUsed = Date.now();
      activeProcesses.set(hash, managedProcess);
      return { port: managedProcess.port };
    }

    console.log(`[thread-service] Creating new worker for hash: ${hash}`);
    const registryEntry = await db
      .selectFrom("thread_registry")
      .selectAll()
      .where("id", "=", providerId)
      .executeTakeFirst();

    if (!registryEntry) {
      throw new Error(`[thread-service] Provider '${providerId}' not found in registry.`);
    }

    // Transform database row to ThreadProvider format
    const provider = {
      id: registryEntry.id,
      source: registryEntry.logic_path,
      type: "module" as const, // Default to module for now
      threadType: registryEntry.thread_type,
      permissions: registryEntry.agx_manifest?.permissions || [],
    };

    const port = await getRandomPort();
    const tempDir = path.join(__dirname, "tmp", hash);
    const capnpConfigPath = path.join(tempDir, "config.capnp");

    try {
      // 1. Generate capnp config
      const capnpContent = await generateCapnp({
        port,
        provider,
        orbId,
        sectorId,
        chain,
        rpcUrl: "http://localhost:4848/rpc",
      });
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(capnpConfigPath, capnpContent);

      // 2. Spawn workerd process
      console.log(`[thread-service] Spawning workerd on port ${port}`);
      const workerdProcess = spawn("npx", ["workerd", "serve", capnpConfigPath], {
        stdio: "pipe",
      });
      workerdProcess.stdout.on("data", (data) => {
        console.log(`[thread-service] workerd-${hash}-stdout: ${data.toString().trim()}`);
      });
      workerdProcess.stderr.on("data", (data) => {
        console.error(`[thread-service] workerd-${hash}-stderr: ${data.toString().trim()}`);
      });

      const managedProcess: ManagedProcess = {
        process: workerdProcess,
        port,
        hash,
        lastUsed: Date.now(),
        tempDir,
      };
      activeProcesses.set(hash, managedProcess);

      return { port };
    } catch (error) {
      console.error("[thread-service] Failed to create worker:", error);
      // Clean up temp dir only on error
      await fs.rm(tempDir, { recursive: true, force: true });
      throw error;
    }
  },

  async cleanupUnusedThreads() {
    const now = Date.now();
    const maxLifetime = 20 * 60 * 1000; // 20 minutes

    console.log("Running cleanup for unused threads...");
    for (const [hash, managedProcess] of activeProcesses.entries()) {
      if (now - managedProcess.lastUsed > maxLifetime) {
        console.log(
          `Terminating stale worker (hash: ${hash}, port: ${managedProcess.port})`
        );
        managedProcess.process.kill("SIGTERM");

        // Clean up temp directory after process termination
        if (managedProcess.tempDir) {
          try {
            await fs.rm(managedProcess.tempDir, { recursive: true, force: true });
            console.log(`Cleaned up temp directory: ${managedProcess.tempDir}`);
          } catch (error) {
            console.error(
              `Failed to clean up temp directory ${managedProcess.tempDir}:`,
              error
            );
          }
        }

        activeProcesses.delete(hash);
      }
    }
    console.log("Cleanup finished.");
  },
};
