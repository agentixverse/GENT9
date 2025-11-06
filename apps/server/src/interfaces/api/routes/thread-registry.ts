import { Router } from "express";
import { z } from "zod";

import threadRegistryController from "@/interfaces/api/controllers/threadRegistryController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

const getThreadsQuerySchema = z.object({
  query: z.object({
    type: z
      .enum(["dex", "bridge", "lending", "yield_farming", "network_infra", "other"])
      .optional(),
  }),
});

router.use(protect);

// GET /api/thread-registry - Get all available thread providers (optionally filtered by type)
router.get(
  "/",
  validate(getThreadsQuerySchema),
  threadRegistryController.getAvailableThreads
);

export default router;
