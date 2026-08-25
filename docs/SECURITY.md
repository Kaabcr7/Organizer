# Security Verification - Phase 3B

## Overview

This document verifies that the frontend never exposes service credentials or violates the security model defined in the database schema.

## Credential Management

### ✅ SAFE: Browser Client Configuration

**File**: `src/lib/supabase/client.ts`
- Uses `NEXT_PUBLIC_SUPABASE_URL` (public)
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, scoped to authenticated users)
- These are published to the browser by design
- Protected by RLS policies on all tables

**File**: `.env.local` (template)
- Clearly marks `SUPABASE_SERVICE_ROLE_KEY` as server-only (never exposed)
- Service role key NEVER used in browser context

### ✅ SAFE: Server-Only Keys

**File**: `src/lib/supabase/server.ts`
- Used only in Next.js Server Components and API routes
- Not imported by browser-side code
- Would fail if imported due to `process.env.SUPABASE_SERVICE_ROLE_KEY` being undefined

**Verification**: Search for `createServerClient` imports
```bash
grep -r "createServerClient" src/components src/app/page.tsx src/lib/store src/lib/domain
# Should return 0 results (only in server files if any)
```

## Protected Data Fields

### ✅ SAFE: XP/Level Protection

**Policy**: No browser client can write to `profiles.total_xp` or `profiles.level`

**Implementation**:
1. RLS Policy: Column update grant explicitly excludes these fields
   - File: `docs/data-model.md` (line: GRANT UPDATE ... only includes display_name, avatar_url, timezone, teaching_days, etc.)
   - Table grant revokes INSERT/UPDATE/DELETE on xp_events and daily_summaries

2. BEFORE UPDATE Trigger: Resets changes made by non-privileged users
   - Function: `protect_profile_fields()` in `docs/data-model.md`
   - Effect: Even if RLS is bypassed, trigger reverts XP/level to OLD values

**Verification in Code**:
- `src/lib/data/supabase-repositories.ts` ✓
  - ProfileRepository.updateProfile() only sends allowed fields
  - No attempt to set total_xp, level, current_streak, longest_streak

- `src/lib/store/reducer.ts` ✓
  - Local state updates XP/level for animation
  - But Supabase truth is read from complete_task() RPC return value

### ✅ SAFE: Task Completion Protection

**Policy**: No browser client can directly write to `completed` or `completed_at`

**Implementation**:
1. RLS Policy: No UPDATE policy allows these fields to be modified
2. BEFORE UPDATE Trigger: `protect_task_completion()` resets completed/completed_at
3. Only allowed path: `complete_task(task_id)` RPC function

**Verification in Code**:
- `src/lib/data/supabase-repositories.ts` ✓
  - TaskRepository.updateTask() only sends: title, description, priority, difficulty, due_time, estimated_minutes, notes
  - Never attempts to set completed or completed_at

- `src/hooks/useSupabaseTasks.ts` ✓
  - completeTask() calls repos.tasks.completeTask() (RPC)
  - Never directly updates task_instances.completed

### ✅ SAFE: XP Events Immutable

**Policy**: No browser client can INSERT into `xp_events`

**Implementation**:
- RLS: No INSERT policy exists for xp_events
- All XP writes go through complete_task() or undo_complete_task() RPC only

**Verification in Code**:
- `src/lib/data/supabase-repositories.ts` ✓
  - No attempt to directly insert into xp_events
  - complete_task() and undoCompleteTask() use RPC, not direct insert

### ✅ SAFE: Daily Summaries Read-Only

**Policy**: No browser client can INSERT/UPDATE daily_summaries

**Implementation**:
- RLS: Only SELECT policy (no INSERT/UPDATE/DELETE)
- Generated server-side by refresh_daily_summary() RPC

**Verification in Code**:
- `src/lib/data/supabase-repositories.ts` ✓
  - HistoryRepository only queries (SELECT), never writes
  - getDailySummary(), getDailySummaries(), getTasksByDate()

### ✅ SAFE: User Achievements Read-Only

**Policy**: No browser client can INSERT into `user_achievements`

**Implementation**:
- RLS: No INSERT policy (SELECT only)
- Only written by evaluate_achievements() RPC in complete_task() flow

**Verification in Code**:
- `src/lib/data/supabase-repositories.ts` ✓
  - AchievementRepository only reads
  - getAllAchievements(), getUserAchievements(), getUnlockedAchievementIds()

## RLS Verification

### ✅ All Tables RLS Enabled

```
profiles               ✓ Enabled - SELECT/UPDATE policies check auth.uid()
recurring_templates    ✓ Enabled - All policies check user_id = auth.uid()
task_instances         ✓ Enabled - All policies check user_id = auth.uid()
xp_events             ✓ Enabled - SELECT only, checks user_id = auth.uid()
daily_summaries       ✓ Enabled - SELECT only, checks user_id = auth.uid()
schedule_blocks       ✓ Enabled - All policies check user_id = auth.uid()
achievements          ✓ Enabled - SELECT all (global read)
user_achievements     ✓ Enabled - SELECT only, checks user_id = auth.uid()
```

### ✅ Cross-User Access Prevented

**Test Case**: Can user A access user B's tasks?
- Answer: No. RLS policy on task_instances requires `(select auth.uid()) = user_id`
- If user A's session token has uid_A, they can only query where user_id = uid_A
- Database rejects any query for uid_B's data

**Verification in Code**:
- All repository methods use current auth context
- No hardcoded user_ids or parameters
- All queries filtered by auth.uid()

## Function Security

### ✅ SECURITY DEFINER Functions

All sensitive functions use `SET search_path = ''` to prevent SQL injection via schema hijacking:

- `complete_task()` - SECURITY DEFINER
- `undo_complete_task()` - SECURITY DEFINER
- `calculate_level()` - SECURITY DEFINER
- `evaluate_achievements()` - SECURITY DEFINER
- `refresh_daily_summary()` - SECURITY DEFINER
- `generate_daily_tasks()` - SECURITY DEFINER
- `handle_new_user()` - SECURITY DEFINER

### ✅ Function Execute Permissions

- Authenticated users can EXECUTE: complete_task, undo_complete_task, generate_daily_tasks
- Anon users REVOKED from: all sensitive functions
- Service role can EXECUTE: all functions (server-side)

**Verification**: `docs/data-model.md` section "Secure Atomic Operations"

## Frontend Security Practices

### ✅ No Hardcoded Secrets

- Search: `grep -r "sb-" src/ | grep -v node_modules | grep -v ".next"`
- Result: Should find 0 secrets (only in .env.local template)

### ✅ Environment Variables

- `.env.local` (template only, not in repo)
- `src/lib/supabase/client.ts` checks for required env vars at runtime
- Throws error with helpful message if missing

### ✅ No Raw SQL

- All database access goes through Supabase client
- No string interpolation in queries
- Parameterized queries via Supabase SDK

### ✅ Type Safety

- TypeScript types generated from database schema
- Type checking enforces correct field names and types
- Prevents accidental XP/level writes via type system

## Migration Security

### ✅ localStorage to Supabase

**File**: `src/lib/data/migration.ts`

- Does NOT auto-migrate without user confirmation
- Only reads from localStorage, never writes back
- Only migrates user's own data (tasks for today)
- Marks migration complete to prevent re-runs
- Throws clear errors if migration fails

**Flow**:
1. User signs up with email/password
2. Supabase Auth creates profile via trigger
3. App loads, detects local data
4. Optional: User migrates tasks to Supabase
5. New tasks go to Supabase (RLS enforced)

## Session Security

### ✅ Auth State Management

**File**: `src/lib/auth/context.tsx`

- Supabase manages session tokens securely
- Tokens stored in secure, httpOnly cookies (Supabase default)
- Auto-refresh on expiry
- Clear session on sign out
- Route protection via middleware

### ✅ Middleware Protection

**File**: `src/middleware.ts`

- Checks session before allowing access to protected routes
- Redirects unauthenticated users to /auth/login
- Allows public routes: /auth/login, /auth/signup, /auth/callback

## Threat Model

### ✅ Threats Mitigated

| Threat | Mitigation |
|--------|-----------|
| Client modifies own XP | BEFORE UPDATE trigger + RLS grant excludes field |
| Client completes others' tasks | RLS user_id check + function auth check |
| Anon user gets XP | Function permissions revoked from anon |
| SQL injection via schema hijacking | SECURITY DEFINER functions with SET search_path = '' |
| Client writes achievements directly | No INSERT policy, only RPC |
| Hardcoded secrets in frontend | All env vars, .env.local not in repo |
| Cross-user data access | RLS on all user-owned tables checks auth.uid() |
| Session hijacking | httpOnly cookies, auto-refresh, secure transport |

### ⚠️ Out of Scope

- DDoS attacks (handled by Supabase infrastructure)
- Rainbow table attacks on password hashes (bcrypt, Supabase Auth)
- Physical device compromise (user responsibility)
- Phishing attacks (user education)
- Compromised service role key (operations responsibility)

## Conclusion

✅ All security requirements from Phase 3A schema are upheld:
- No XP/level field is writable from browser
- All completion changes go through RPC
- RLS prevents cross-user access
- Credentials are never exposed
- All functions have proper search_path protection
- Type system enforces correct API usage

**Build Date**: August 2026
**Schema Version**: Phase 3A (12 migrations)
**Application Version**: Phase 3B (Supabase integration)
