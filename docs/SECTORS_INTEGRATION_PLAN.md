
# Sectors Integration Plan

**Date:** 2025-11-05

**Author:** Gemini

## 1. Issue Summary

The "Sectors" feature is mostly implemented and consistent between the frontend and backend. However, there is one critical validation mismatch that will prevent users from creating "experimental" sectors, and the core business logic is still missing.

1.  **`experimental` Sector Type Mismatch:** The frontend UI allows users to select an "experimental" sector type, but the backend's `zod` validation schema only permits `"live_trading"` and `"paper_trading"`. This will cause a validation error upon submission.
2.  **Missing `tradespaceService` Implementation:** The `sectorController` depends entirely on the `tradespaceService` for all database interactions and business logic. The implementation of this service has not been seen and is critical for the feature to function.
3.  **Unknown `/onboarding/sector` Workflow:** The `SectorSwitcher` component redirects to an `/onboarding/sector` page for new sector creation, but the code for this alternative workflow is not visible.

## 2. Resolution Plan

To complete the "Sectors" feature, we need to align the backend validation with the frontend UI and implement the missing service logic.

### Backend Changes

#### Step 1: Update the Sector Validation Schema

Modify the `zod` schema in `apps/server/src/interfaces/api/routes/sector.ts` to include `"experimental"` as a valid sector type.

```typescript
// apps/server/src/interfaces/api/routes/sector.ts

// ... imports

const createSectorSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Name is required" }),
    // Add "experimental" to the enum
    type: z.enum(["live_trading", "paper_trading", "experimental"], { message: "Invalid sector type" }),
    settings: z.record(z.any()).optional(),
  }),
});

const updateSectorSchema = z.object({
  // ...
  body: z.object({
    name: z.string().min(1).optional(),
    // Also add "experimental" here for updates
    type: z.enum(["live_trading", "paper_trading", "experimental"]).optional(),
    settings: z.record(z.any()).optional(),
  }),
});

// ... rest of the file
```

### Other Issues to Address

*   **`tradespaceService` Implementation:** The `getUserSectors`, `getSectorById`, `createSector`, `updateSector`, and `deleteSector` methods need to be implemented within `apps/server/src/services/user/tradespace-service.ts`. These methods will handle the actual database operations for the `SectorsTable`.
*   **`/onboarding/sector` Workflow:** The code for the `/onboarding/sector` page and its associated components should be reviewed to understand how it differs from the `SectorCreateModal` and to ensure it is properly integrated with the backend.

## 3. Next Steps

With the validation schema updated, the immediate blocker for creating experimental sectors will be resolved. The highest priority is now to implement the `tradespaceService` methods, as no sector-related functionality can work without them.
