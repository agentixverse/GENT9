# Corrected Orbs Integration Plan (Frontend Focus)

**Date:** 2025-11-05

**Author:** Gemini

## 1. Issue Summary

Previous analysis incorrectly assumed the backend for the "Orbs" feature was incomplete and had API route mismatches. After a thorough verification by tracing the implementation from `server.ts`, it has been confirmed that the **backend is complete and fully functional**.

The actual integration gap is that the **frontend for the "Orbs" feature is entirely missing**. The task is to implement the necessary UI components, API hooks, and page routes to consume the existing backend.

## 2. Frontend Implementation Plan

This plan outlines the steps required to build the "Orbs" feature on the frontend, based on the requirements in `ORBS_EXPECTATIONS.md`.

### Step 1: Update API Hooks to Match Backend Routes

The first step is to ensure the frontend is calling the correct API endpoints.

**File to Edit:** `apps/client/library/api/hooks/use-orbs.ts`

**Required Changes:**

*   **`useOrbs`:** Change the API call from `GET /orbs?sector_id={id}` to `GET /api/orbs/{sectorId}`.
*   **`useOrb`:** Change the API call from `GET /orbs/{id}` to `GET /api/orbs/detail/{id}`.
*   **`useCreateOrb`:** Change the API call from `POST /sectors/{sectorId}/orbs` to `POST /api/orbs`. The `sector_id` should be part of the request body.
*   **`useUpdateOrb`:** The API call `PUT /api/orbs/{id}` is correct.
*   **`useDeleteOrb`:** The API call `DELETE /api/orbs/{id}` is correct.

### Step 2: Create File Structure and Type Definitions

Next, create the necessary files and define the data structures.

1.  **Create Type Definition File:**
    *   Create `apps/client/library/api/types/orb.ts`.
    *   Populate this file with the TypeScript interfaces for `Orb`, `ChainType`, and `CreateOrbData` as defined in `ORBS_EXPECTATIONS.md`.

2.  **Create Page Route Files:**
    *   Create the directory `apps/client/app/(main)/sectors/[sectorId]`.
    *   Create `.../[sectorId]/page.tsx` (for the sector detail view, which will list the orbs).
    *   Create the directory `apps/client/app/(main)/orbs/[orbId]`.
    *   Create `.../[orbId]/page.tsx` (for the orb detail view).

### Step 3: Build UI Components

With the data layer in place, build the UI components.

1.  **`OrbCard` (`.../molecules/orb-card.tsx`):**
    *   Create a component to display the orb's name, chain, wallet address, and asset pair allocations.

2.  **`OrbsList` (`.../organisms/orbs-list.tsx`):**
    *   Create a component that uses the `useOrbs` hook to fetch and display a list of `OrbCard` components for a given sector.

3.  **`CreateOrbForm` (`.../organisms/create-orb-form.tsx`):**
    *   Create a form that allows the user to create a new orb. This should include fields for the name, a chain selector, and an `AssetPairsInput` component.
    *   Use the `useCreateOrb` hook to submit the form.

4.  **`AssetPairsInput` (`.../molecules/asset-pairs-input.tsx`):**
    *   Create a component for dynamically adding and removing asset pairs and their allocations, with validation to ensure the total allocation does not exceed 100%.

5.  **`OrbDetail` (`.../organisms/orb-detail.tsx`):**
    *   Create a component to display the full details of an orb, including a button to copy the wallet address and a list of associated threads.

### Step 4: Implement Page Views

Finally, assemble the components into the page views.

1.  **Sector Detail Page (`.../sectors/[sectorId]/page.tsx`):**
    *   Use the `OrbsList` component to display the orbs for the sector.
    *   Include a button that opens a modal with the `CreateOrbForm` to create a new orb.

2.  **Orb Detail Page (`.../orbs/[orbId]/page.tsx`):**
    *   Use the `OrbDetail` component to display the details of the selected orb.

## 3. Next Steps

This plan provides a clear path to implementing the frontend for the "Orbs" feature. The first step is to update the `use-orbs.ts` hook to call the correct backend endpoints.