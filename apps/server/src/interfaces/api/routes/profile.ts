import { Router } from "express";
import { z } from "zod";

import profileController from "@/interfaces/api/controllers/profileController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

const userSchema = z.object({
  id: z
    .number()
    .int()
    .positive({ message: "Authentication required - protect middleware missing" }),
  email: z.string().email({ message: "Invalid user email from authentication" }),
});

const getProfileSchema = z.object({
  user: userSchema,
});

const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    settings: z.record(z.any()).optional(),
  }),
  user: userSchema,
});

router.use(protect);

// GET /api/profile - Get authenticated user's basic profile
router.get("/", validate(getProfileSchema), profileController.getProfile);

// GET /api/profile/full - Get authenticated user's full profile with sectors and orbs
router.get("/full", validate(getProfileSchema), profileController.getFullProfile);

// PUT /api/profile - Update authenticated user's profile
router.put("/", validate(updateProfileSchema), profileController.updateProfile);

export default router;
