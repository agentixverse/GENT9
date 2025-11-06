# Comprehensive Auth Integration Plan

**Date:** 2025-11-05

**Author:** Gemini

## 1. Issue Summary

Based on a comprehensive review of the authentication feature and the `AUTH_EXPECTATIONS.md` document, several critical issues have been identified that will prevent the authentication system from working correctly and securely. This plan addresses all of these issues.

### Critical Issues:

1.  **JWT Payload Mismatch:** The backend signs JWTs with a `userId` field, but the authentication middleware expects an `id` field. This will cause all protected routes to fail.
2.  **Missing `GET /api/auth/me` Endpoint:** The frontend relies on this endpoint to verify a user's session, but it is not implemented on the backend.
3.  **Missing Frontend Route Protection:** The frontend lacks a `middleware.ts` to protect routes, allowing unauthenticated users to access protected pages (although the pages will not function correctly).
4.  **User ID Type Mismatch:** There are inconsistencies in the `id` types used across different frontend interfaces (`number` vs. `string`), which can lead to bugs.

## 2. Resolution Plan

To fix the authentication system, we need to address all of the issues identified above.

### Backend Changes

#### Step 1: Fix JWT Payload Mismatch

In `apps/server/src/interfaces/api/controllers/authController.ts`, change the JWT signing to use `id` instead of `userId`.

```typescript
// apps/server/src/interfaces/api/controllers/authController.ts

// In register function:
const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
  expiresIn: "24h",
});

// In login function:
const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret", {
  expiresIn: "24h",
});
```

#### Step 2: Implement `GET /api/auth/me` Endpoint

In `apps/server/src/interfaces/api/routes/auth.ts`, add a new route for `GET /me`.

```typescript
// apps/server/src/interfaces/api/routes/auth.ts

// ... (imports)

router.get("/me", protect, authController.getMe); // Add this line

// ... (rest of the file)
```

In `apps/server/src/interfaces/api/controllers/authController.ts`, add the `getMe` function.

```typescript
// apps/server/src/interfaces/api/controllers/authController.ts

// ... (imports)

const authController = {
  // ... (register and login functions)

  async getMe(req: Request, res: Response) {
    try {
      // The 'protect' middleware has already attached the user to the request
      res.json(req.user);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching user data." });
    }
  },
};
```

### Frontend Changes

#### Step 3: Implement Frontend Route Protection

Uncomment and update the `apps/client/middleware.ts` file to protect the `(main)` routes.

```typescript
// apps/client/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // If the user is trying to access a protected route without a token, redirect to login
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/?auth=login", request.url));
  }

  // If the user is authenticated and tries to access the auth page, redirect to dashboard
  if (token && (pathname === "/" || pathname.startsWith("/?auth="))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

#### Step 4: Fix User ID Type Mismatches

In `apps/client/library/api/types/index.ts`, ensure all `id` and `userId` fields that refer to the user's ID are of type `number`.

```typescript
// apps/client/library/api/types/index.ts

export interface Trade {
  id: string; // This is likely a UUID for the trade itself, which is fine
  userId: number; // Change this to number
  // ...
}

export interface UserPolicy {
  id: string; // This is likely a UUID for the policy, which is fine
  sectorId: number;
  userId: number; // Change this to number
  // ...
}

// ... (and so on for all other interfaces)
```

## 3. Next Steps

Once these changes are implemented, the authentication system will be much more robust and secure. The next step would be to proceed with the analysis of the other features, starting with `BACKTESTS_EXPECTATIONS.md`.