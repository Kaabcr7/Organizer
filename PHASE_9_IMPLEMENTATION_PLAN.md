# PHASE 9 IMPLEMENTATION PLAN
## Authentication Migration: Supabase → Better Auth

**Date**: August 27, 2026

**Objective**: Replace Supabase authentication with Better Auth while maintaining:
- ✅ Neon PostgreSQL as single database
- ✅ Drizzle ORM repositories
- ✅ API routes and frontend data flow
- ✅ Session management and OAuth support

---

## CURRENT STATE (BEFORE PHASE 9)

### Authentication Flow (Supabase)
```
Frontend (React Context)
  ├─ useAuth hook
  ├─ signIn(), signUp(), signOut()
  └─ Supabase client library

Server-side Auth
  ├─ src/lib/auth/server.ts (getAuthenticatedUser, requireAuth)
  ├─ middleware.ts (route protection)
  └─ OAuth callback at /auth/callback

Session Management
  ├─ Supabase Auth services
  ├─ JWT tokens in browser
  └─ Server session validation

Database
  ├─ neon_auth schema (auto-created by Neon)
  ├─ Users table
  └─ Sessions table

Dependencies
  ├─ @supabase/supabase-js
  ├─ @supabase/ssr
  └─ Supabase hosted auth
```

### Key Files Using Supabase Auth
1. `src/lib/auth/context.tsx` - React auth provider
2. `src/lib/auth/server.ts` - Server-side auth logic
3. `src/middleware.ts` - Route protection
4. `src/app/auth/callback/route.ts` - OAuth callback
5. `src/app/auth/login/page.tsx` - Login UI
6. `src/app/auth/signup/page.tsx` - Signup UI
7. `src/lib/supabase/*` - Supabase client setup
8. `src/components/providers/supabase-sync-provider.tsx` - Sync provider

---

## TARGET STATE (AFTER PHASE 9)

### Authentication Flow (Better Auth)
```
Frontend (React Hooks)
  ├─ useSession hook
  ├─ useSignIn hook
  ├─ useSignUp hook
  └─ Better Auth client

Server-side Auth
  ├─ src/lib/auth/better-auth.ts (Better Auth server config)
  ├─ src/lib/auth/server.ts (refactored for Better Auth)
  ├─ middleware.ts (Better Auth session validation)
  └─ Better Auth built-in OAuth support

Session Management
  ├─ Better Auth sessions
  ├─ Cookies-based (more secure)
  └─ Server-side session store

Database
  ├─ Neon PostgreSQL (same database)
  ├─ Better Auth schema tables (users, sessions, accounts)
  └─ Drizzle ORM access

Dependencies
  ├─ better-auth
  ├─ next-auth (compatible)
  └─ Self-hosted auth
```

---

## MIGRATION STRATEGY

### Phase 9 Approach: Gradual Migration

**Stage 1: Setup (Tasks 1-4)**
- Inspect current implementation ✓
- Create implementation plan ✓
- Install Better Auth
- Create Better Auth server config
- Keep Supabase running (don't break existing)

**Stage 2: Server Migration (Tasks 5-7)**
- Migrate getAuthenticatedUser() to Better Auth
- Migrate OAuth callbacks
- Update middleware
- Test with Supabase clients still active

**Stage 3: Frontend Migration (Tasks 8-9)**
- Create Better Auth client hooks
- Update auth context to use Better Auth
- Update login/signup pages
- Phase out Supabase client

**Stage 4: Testing (Tasks 10-13)**
- Integration tests
- E2E tests
- OAuth testing
- Session management testing

**Stage 5: Cleanup & Verification (Tasks 14-17)**
- Verify Neon Auth schema
- Verify all existing tests pass
- Remove Supabase dependencies
- Final report

---

## DATABASE IMPACT

### Neon Auth Schema (auto-created)
```sql
-- Better Auth will create these tables
neon_auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  name VARCHAR,
  image VARCHAR,
  emailVerified TIMESTAMP,
  password VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)

neon_auth.sessions (
  id VARCHAR PRIMARY KEY,
  userId UUID REFERENCES neon_auth.users,
  expiresAt TIMESTAMP,
  token VARCHAR UNIQUE,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)

neon_auth.accounts (
  id VARCHAR PRIMARY KEY,
  userId UUID REFERENCES neon_auth.users,
  provider VARCHAR,
  providerAccountId VARCHAR,
  createdAt TIMESTAMP
)

neon_auth.verifications (
  id VARCHAR PRIMARY KEY,
  identifier VARCHAR,
  value VARCHAR,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP
)
```

### Profile Integration
```
neon_auth.users (Better Auth)
         ↓ (User ID)
profiles table (Neon - custom)
  ├─ id (references users.id)
  ├─ totalXp
  ├─ level
  ├─ streaks
  └─ created_at
```

**Action**: NO destructive changes to neon_auth schema. Better Auth creates its own tables.

---

## KEY IMPLEMENTATION DETAILS

### 1. Better Auth Server Setup
**File**: `src/lib/auth/better-auth.ts` (NEW)

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: "neon_auth.users",
      session: "neon_auth.sessions",
      account: "neon_auth.accounts",
      verification: "neon_auth.verifications"
    }
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
```

### 2. Server-side Auth Migration
**File**: `src/lib/auth/server.ts` (MODIFIED)

```typescript
import { auth } from "./better-auth";
import { headers } from "next/headers";

export async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) return null;
  
  return {
    userId: session.user.id,
    email: session.user.email,
  };
}
```

### 3. Middleware Update
**File**: `src/middleware.ts` (MODIFIED)

```typescript
import { betterAuth } from "better-auth";
import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
  if (publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const session = await betterAuth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // Redirect to login
  }

  return NextResponse.next();
}
```

### 4. Frontend Auth Context
**File**: `src/lib/auth/context.tsx` (MODIFIED)

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

export function useSession() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authClient.getSession().then(session => {
      setSession(session);
      setIsLoading(false);
    });
  }, []);

  return { session, isLoading };
}

export function useSignIn() {
  return useCallback(async (email: string, password: string) => {
    return authClient.signIn.email({ email, password });
  }, []);
}
```

### 5. Frontend Auth Client
**File**: `src/lib/auth/client.ts` (NEW)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const {
  useSession,
  useSignIn,
  useSignUp,
  useSignOut,
} = authClient;
```

---

## ENVIRONMENT VARIABLES NEEDED

```bash
# Better Auth
BETTER_AUTH_SECRET=<generate-uuid>

# OAuth (if using Google)
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>

# Database (already set)
DATABASE_URL=postgresql://...neon.tech/neondb

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## TESTING STRATEGY

### Integration Tests (Tasks 12)
```typescript
- Test session creation after login
- Test session validation on API routes
- Test ownership verification still works
- Test OAuth flow (if implemented)
- Test session expiration
```

### E2E Tests (Task 13)
```
1. Login flow
   - Enter credentials
   - Verify session created
   - Verify redirect to dashboard
   
2. Logout flow
   - Click logout
   - Verify session destroyed
   - Verify redirect to login

3. Protected routes
   - Try accessing without session
   - Verify redirect to login

4. Task operations
   - Create task (verify auth required)
   - Complete task (verify auth required)
   - Verify XP updates with auth user
```

---

## ROLLBACK PLAN

If Better Auth migration fails:

1. **Keep both systems running initially**
   - Better Auth in parallel with Supabase
   - Routes check Better Auth first, fall back to Supabase

2. **Feature flag approach**
   - `USE_BETTER_AUTH=true/false` env var
   - Route decision logic checks flag

3. **Database recovery**
   - Neon Auth schema is separate
   - profiles table unchanged
   - Easy to revert app code

---

## VERIFICATION CHECKLIST

### Before Declaring Phase 9 Complete

- [ ] Better Auth installed and configured
- [ ] Server-side auth functions migrated
- [ ] Middleware using Better Auth
- [ ] Frontend auth context refactored
- [ ] Login page working with Better Auth
- [ ] Signup page working with Better Auth
- [ ] OAuth callback working
- [ ] Sessions persist across page refresh
- [ ] Logout clears session
- [ ] Protected routes redirect unauthenticated users
- [ ] API routes verify authenticated user correctly
- [ ] Ownership verification still works
- [ ] XP calculations work with Better Auth user ID
- [ ] All 65 existing tests still pass
- [ ] New auth integration tests pass
- [ ] E2E auth tests pass
- [ ] Neon Auth schema intact
- [ ] No data loss
- [ ] Supabase dependencies can be removed
- [ ] Build succeeds
- [ ] No TypeScript errors

---

## TIMELINE ESTIMATE

| Phase | Tasks | Time |
|-------|-------|------|
| Setup | 1-4 | 30 min |
| Server Migration | 5-7 | 45 min |
| Frontend Migration | 8-9 | 45 min |
| Testing | 10-13 | 60 min |
| Cleanup & Report | 14-17 | 30 min |
| **Total** | **17** | **3 hours** |

---

## RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking existing sessions | High | Keep Supabase running during migration |
| Profile table orphaned users | Medium | Ensure user IDs match between auth and profile |
| API route auth failures | High | Test auth before removing Supabase |
| OAuth callback breaks | High | Test OAuth flow thoroughly |
| Database schema conflicts | Medium | Use separate schema (neon_auth) |

---

## SUCCESS CRITERIA

Phase 9 is COMPLETE when:

1. ✅ **Auth works**: Login, logout, sessions all function
2. ✅ **No data loss**: All profiles and tasks accessible
3. ✅ **Backward compatible**: Existing API routes still work
4. ✅ **Tests pass**: All 65 existing + new auth tests
5. ✅ **Build clean**: No errors or warnings
6. ✅ **Verified**: Integration + E2E tests confirm auth flow
7. ✅ **Database ready**: Neon Auth schema in place, profiles linked

---

## NEXT STEPS

1. Mark task 1 complete (inspection done)
2. Create this implementation plan (task 2)
3. Install Better Auth and dependencies (task 3)
4. Begin server migration (task 4)
5. Continue through testing and cleanup phases
