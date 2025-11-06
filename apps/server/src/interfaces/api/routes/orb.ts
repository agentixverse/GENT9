import { Router } from "express";
import { z } from "zod";

import orbController from "@/interfaces/api/controllers/orbController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

const createOrbSchema = z.object({
  body: z.object({
    sector_id: z.number().int().positive({ message: "Valid sector ID is required" }),
    name: z.string().min(1, { message: "Name is required" }),
    network_thread_registry_id: z.string().min(1, {
      message: "Network thread registry ID is required"
    }),
    asset_pairs: z.record(z.number().min(0).max(100), {
      message: "Asset pairs are required",
    }),
    config_json: z.record(z.any()).optional(),
  }),
});

const updateOrbSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "Invalid orb ID" }),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    asset_pairs: z.record(z.number().min(0).max(100)).optional(),
    config_json: z.record(z.any()).optional(),
  }),
});

const orbIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "Invalid orb ID" }),
  }),
});

const sectorIdSchema = z.object({
  params: z.object({
    sectorId: z.string().regex(/^\d+$/, { message: "Invalid sector ID" }),
  }),
});

router.use(protect);

// GET /api/orbs/:sectorId - Get all orbs for authenticated user's sector
router.get("/:sectorId", validate(sectorIdSchema), orbController.getOrbsBySector);

// GET /api/orbs/detail/:id - Get specific orb with threads for authenticated user
router.get("/detail/:id", validate(orbIdSchema), orbController.getOrbById);

// POST /api/orbs - Create new orb in authenticated user's sector
router.post("/", validate(createOrbSchema), orbController.createOrb);

// PUT /api/orbs/:id - Update authenticated user's orb
router.put("/:id", validate(updateOrbSchema), orbController.updateOrb);

// DELETE /api/orbs/:id - Delete authenticated user's orb
router.delete("/:id", validate(orbIdSchema), orbController.deleteOrb);

export default router;
