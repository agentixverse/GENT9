# Policies Feature Frontend Integration Plan

## Objective
Integrate the frontend "Policies" feature with the existing backend API, addressing the current gaps in API integration, sector context, and version history UI.

## Current Gaps (from POLICY_EXPECTATIONS.md)
1.  **No real API integration**: All frontend hooks currently use mock data.
2.  **Missing sector context**: Policies are scoped to sectors on the backend, but the frontend treats them as global.
3.  **No version history UI**: There's no UI to view, compare, or activate old policy versions.

## Plan of Action

### Phase 1: API Integration and Hook Refactoring

1.  **Refactor `use-policy.ts` hooks**:
    *   Locate `/apps/client/library/api/hooks/use-policy.ts`.
    *   Replace mock data fetching with actual API calls using a library like `react-query` or `swr` (if already in use, otherwise use `fetch` directly).
    *   Implement hooks for:
        *   `GET /api/policy/:sectorId` (fetch active policy)
        *   `GET /api/policy/:sectorId/history` (fetch all policy versions)
        *   `POST /api/policy/:sectorId` (create new policy version)
        *   `PUT /api/policy/:sectorId` (update active policy)
        *   `POST /api/policy/:sectorId/activate/:version` (activate a specific policy version)
    *   Ensure proper error handling and loading states for each hook.

### Phase 2: Sector Context Implementation

1.  **Update Policy Page Routing**:
    *   Modify the policy page route from `/app/(main)/policies/page.tsx` to `/app/(main)/sectors/[sectorId]/policies/page.tsx` to incorporate `sectorId` as a URL parameter.
    *   Adjust `layout.tsx` files as necessary to accommodate the new routing structure.

2.  **Implement Sector Selection/Context**:
    *   Determine how the `sectorId` will be passed to the policy page (e.g., from a global sector selector, or a list of sectors).
    *   Ensure all policy-related components and hooks receive the correct `sectorId`.

3.  **Display Sector Information**:
    *   Update the policy management UI to clearly indicate which sector's policy is currently being viewed/edited.

### Phase 3: Policy Version History and Activation UI

1.  **Create Policy History Component/Page**:
    *   Develop a new UI component or page (e.g., `/app/(main)/sectors/[sectorId]/policies/history/page.tsx`) to display the list of policy versions for a given `sectorId`.
    *   Each entry should show: version number, creation timestamp, and a "View" or "Activate" button.

2.  **Implement Version Activation**:
    *   Add an "Activate" button for each historical policy version.
    *   When clicked, trigger the `POST /api/policy/:sectorId/activate/:version` API call.
    *   Include a confirmation modal before activating an old version to prevent accidental changes.
    *   Upon successful activation, refresh the active policy view.

3.  **Version Comparison (Future Enhancement)**:
    *   Consider adding a UI to compare two different policy versions side-by-side. (Lower priority for initial integration).

### Phase 4: Replace Mock Data and Refine UI

1.  **Replace Mock Data**:
    *   Go through all policy-related components and replace hardcoded mock data with data fetched from the newly integrated API hooks.

2.  **Refine Create vs. Update Flow**:
    *   Clearly differentiate the UI/UX for creating a *new* policy version (POST) versus *updating* the *active* policy (PUT).
    *   Provide appropriate feedback (e.g., "Policy created successfully, new version X activated" or "Policy updated").

3.  **Error Handling and Notifications**:
    *   Implement user-friendly error messages for API failures (e.g., 404 Not Found, 403 Forbidden).
    *   Use toast notifications for success and error messages.

4.  **AI Critique Integration**:
    *   Review the `AIPolicyCritique` component.
    *   Determine the UX for generating/updating the AI critique and integrate it with the backend if applicable.

## Files to be Modified/Created

*   `/apps/client/library/api/hooks/use-policy.ts` (Modification)
*   `/apps/client/app/(main)/policies/page.tsx` (Modification/Rename to include `sectorId`)
*   `/apps/client/app/(main)/sectors/[sectorId]/policies/page.tsx` (New/Renamed)
*   `/apps/client/app/(main)/sectors/[sectorId]/policies/history/page.tsx` (New)
*   `/apps/client/library/components/organisms/PolicyHistory.tsx` (New component for history display)
*   `/apps/client/library/api/client.ts` (Potentially, to add new API functions)
*   `/apps/client/library/api/types/index.ts` (Verification, ensure types match backend)

## Verification
*   All policy API endpoints are correctly called and data is displayed.
*   Policy management is correctly scoped to sectors.
*   Users can view policy history and activate previous versions.
*   No mock data remains in the integrated policy features.
*   Error handling and user feedback are implemented.
