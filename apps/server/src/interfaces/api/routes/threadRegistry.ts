import { Router } from "express";
import { threadRegistryController } from "../controllers/threadRegistryController";

const router = Router();

router.get("/:registryId/assets", threadRegistryController.getThreadRegistryAssets);

export default router;
