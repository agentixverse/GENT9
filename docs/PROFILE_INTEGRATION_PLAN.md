# Profile Feature Integration Plan (Corrected)

## Objective
Integrate the frontend "Profile" and "Settings" features with the backend API, resolving the architectural mismatch between the client UI and the Orb-based wallet management system.

## Core Architectural Correction
Based on a key insight, the initial analysis was flawed. The application's architecture dictates that **wallets are managed by Orbs, not directly by users.** Therefore, the user's profile/settings page should not be a place to manage wallet addresses.

## Current Gaps (Re-evaluated)

### Frontend Gaps
1.  **Architectural Mismatch (CRITICAL)**: The settings page at `/apps/client/app/(main)/settings/page.tsx` incorrectly includes input fields for "Ethereum Wallet Address" and "Solana Wallet Address." This contradicts the core concept that Orbs control wallets.
2.  **No API Integration**: The settings page is not connected to the backend. The "Save" button is non-functional.
3.  **Missing Profile Hooks**: There are no `react-query` hooks (`useProfile`, `useUpdateProfile`) for managing profile data.
4.  **Unsupported UI Fields**: The UI displays fields like language, timezone, and currency which have no backend support.

### Backend Gaps
1.  **Missing Flexible Settings Storage**: The `users` table lacks a flexible way to store non-critical user preferences from the UI (e.g., language, timezone).

## Plan of Action

### Phase 1: Frontend UI Correction - Align with Architecture

1.  **Remove Wallet Management from Settings**:
    *   In `/apps/client/app/(main)/settings/page.tsx`, **remove the input fields for "Ethereum Wallet Address" and "Solana Wallet Address."**
    *   This is the most critical step to align the frontend with the application's architecture. Wallet management should be handled exclusively within the UI for creating and editing Orbs.

### Phase 2: Backend Development - Add Support for User Preferences

1.  **Add Flexible Settings Column to Schema**:
    *   Modify `/apps/server/src/infrastructure/database/schema.ts`. Add a single `settings` JSON column to the `UsersTable`. This will allow for storing user-specific preferences like `language`, `timezone`, and `currency` without requiring future schema migrations for minor additions.
    *   Create a database migration to apply this schema change.

2.  **Update API to Handle Settings**:
    *   In `/apps/server/src/interfaces/api/routes/profile.ts`, update the `updateProfileSchema` to accept a `settings` object.
    *   In `/apps/server/src/services/user/profile-service.ts`, modify `updateUserProfile` to handle and store the `settings` object.
    *   Ensure `GET /api/profile` returns the `settings` object.

### Phase 3: Frontend Development - API Integration

1.  **Create Profile Hooks**:
    *   Create a new file: `/apps/client/library/api/hooks/use-profile.ts`.
    *   Implement `useProfile()` to fetch data from `GET /api/profile`.
    *   Implement `useUpdateProfile()` as a mutation hook for `PUT /api/profile`. This mutation will now send only the `email` and the new `settings` object.

2.  **Integrate Settings Page**:
    *   In `/apps/client/app/(main)/settings/page.tsx`:
        *   Use the `useProfile()` hook to fetch and display user data (`email` and settings).
        *   Wire the "Save Account Settings" button to the `useUpdateProfile()` mutation.
        *   Implement loading states and toast notifications for user feedback.

3.  **Update Type Definitions**:
    *   In `/apps/client/library/api/types/index.ts`, create `Profile` and `UpdateProfileData` interfaces that match the updated backend API, including the new `settings` object and excluding wallet addresses.

## Files to be Modified/Created

### Frontend
*   `/apps/client/app/(main)/settings/page.tsx` (**Modification: Remove wallet fields**)
*   `/apps/client/library/api/hooks/use-profile.ts` (New)
*   `/apps/client/library/api/types/index.ts` (Modification)

### Backend
*   `/apps/server/src/infrastructure/database/schema.ts` (Modification: Add `settings` column)
*   `[New Migration File]` (New)
*   `/apps/server/src/interfaces/api/routes/profile.ts` (Modification)
*   `/apps/server/src/services/user/profile-service.ts` (Modification)

## Verification
*   The wallet address fields are successfully removed from the user settings page.
*   The backend is updated to handle a `settings` object for user preferences.
*   The settings page correctly fetches, displays, and updates the user's `email` and `settings` via the new API hooks.
*   The user experience is now consistent with the application's Orb-based wallet architecture.
