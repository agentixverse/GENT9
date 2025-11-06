# Threads Feature Integration Plan

## Objective
Implement the client-side UI and logic necessary for users to manage "Threads" within their Orbs, integrating with the complete and sophisticated backend API and execution engine.

## Architectural Context
A "Thread" is a sandboxed, modular process (likely a `workerd` instance) that provides a specific capability to an Orb (e.g., connecting to a DEX, a bridge, or a paper trading simulator). The backend implementation is robust, secure, and central to the application's function, but there is currently **no client-side implementation** to manage these essential components.

## Plan of Action

### Phase 1: Core UI and Data Display

1.  **Create API Hooks for Threads**:
    *   Create a new file: `/apps/client/library/api/hooks/use-threads.ts`.
    *   Implement the following `react-query` hooks:
        *   `useThreadsByOrb(orbId)`: Fetches all threads for a given Orb using `GET /api/threads/:orbId`.
        *   `useThread(threadId)`: Fetches details for a single thread using `GET /api/threads/detail/:id`.

2.  **Develop Thread Display Components**:
    *   Create a `ThreadList` component that takes an `orbId` as a prop, uses the `useThreadsByOrb` hook, and displays a list of threads.
    *   Create a `ThreadCard` component to display information for a single thread, including its `type`, `provider_id`, `description`, and `enabled` status.
    *   Integrate the `ThreadList` component into the existing Orb detail view/page. Users should see the threads associated with each Orb.

3.  **Update Type Definitions**:
    *   In `/apps/client/library/api/types/index.ts`, add the necessary TypeScript interfaces for `Thread`, `ThreadType`, etc., to match the backend API responses.

### Phase 2: Thread Management (Create, Toggle, Delete)

1.  **Implement Create Thread Functionality**:
    *   Add a "Add Thread" button to the Orb detail view.
    *   Create an `AddThreadModal` component that opens when the button is clicked.
    *   The modal should contain a form with fields for `type`, `provider_id`, `config_json`, and `description`.
        *   The `provider_id` could be a simple text input initially, with a dropdown populated from a future provider registry as an enhancement.
    *   Implement a `useCreateThread` mutation hook that calls `POST /api/threads`.
    *   On successful creation, the modal should close and the thread list should automatically refetch and update.

2.  **Implement Toggle Functionality**:
    *   Add a toggle switch to the `ThreadCard` component representing the `enabled` state.
    *   Implement a `useToggleThread` mutation hook that calls `POST /api/threads/:id/toggle`.
    *   Clicking the toggle should trigger the mutation and optimistically update the UI.

3.  **Implement Delete Functionality**:
    *   Add a "Delete" button to the `ThreadCard` component.
    *   Implement a `useDeleteThread` mutation hook that calls `DELETE /api/threads/:id`.
    *   Clicking the delete button should open a confirmation modal to prevent accidental deletion.
    *   On successful deletion, the thread list should refetch and update.

### Phase 3: Advanced Features and Refinements

1.  **Implement Update Functionality**:
    *   Add an "Edit" button to the `ThreadCard` component.
    *   Create an `EditThreadModal` that allows users to change the `provider_id`, `config_json`, and `description`.
    *   Implement a `useUpdateThread` mutation hook that calls `PUT /api/threads/:id`.

2.  **Address Validation Discrepancy**:
    *   The backend Zod schema for creating threads is missing the `network_infra` and `other` types that exist in the database. This should be corrected on the backend in `/apps/server/src/interfaces/api/routes/thread.ts`.

3.  **Provider Registry (Future Enhancement)**:
    *   The backend file `/apps/server/src/constants/thread-registry.ts` is currently empty. Populating this on the backend would allow the frontend to fetch a list of available providers and display them in a user-friendly dropdown, rather than requiring manual text input.

## Files to be Modified/Created

### Frontend (All New or Heavily Modified)
*   `/apps/client/library/api/hooks/use-threads.ts` (New)
*   `/apps/client/library/api/types/index.ts` (Modification)
*   `/apps/client/library/components/organisms/ThreadList.tsx` (New)
*   `/apps/client/library/components/molecules/ThreadCard.tsx` (New)
*   `/apps/client/library/components/organisms/AddThreadModal.tsx` (New)
*   `/apps/client/library/components/organisms/EditThreadModal.tsx` (New)
*   The Orb detail page component (e.g., `/apps/client/app/(main)/orbs/[orbId]/page.tsx`) will need to be modified to include the `ThreadList`.

### Backend (Minor Correction)
*   `/apps/server/src/interfaces/api/routes/thread.ts` (Modification to fix validation schema).

## Verification
*   Users can view a list of threads associated with each Orb.
*   Users can add a new thread to an Orb.
*   Users can enable or disable a thread.
*   Users can delete a thread with confirmation.
*   The UI provides clear feedback for all operations (loading, success, error).
*   The client-side implementation allows users to harness the full power of the backend's thread-based execution architecture.
