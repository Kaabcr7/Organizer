# Free Backend Migration — Detailed Implementation Plan

**Date**: August 24, 2026  
**Status**: PLANNING PHASE  
**Duration**: 2-3 days (estimated)  
**Effort**: One senior developer  
**Cost**: $0/month end state

---

## EXECUTIVE SUMMARY

This plan details the complete migration from Supabase (hit free tier limit) to free-tier architecture:
- **Neon PostgreSQL** (free tier: 512MB RAM, 3GB storage)
- **Better Auth** (self-hosted: unlimited users, no cost)
- **Drizzle ORM** (type-safe queries, free)
- **Next.js API Routes** (for server boundary enforcement)

**Zero UI changes. Zero domain logic changes. Zero feature changes.**

The migration preserves 100% of existing functionality while eliminating Supabase dependency and achieving $0/month cost.

---

## 1. ARCHITECTURE

### Current State (Supabase)

```
Browser (React)
  ↓ (ANON KEY)
Supabase Client (protected by RLS)
  ↓
Supabase PostgreSQL + Auth Service
  ↓ (SERVICE ROLE KEY)
Next.js Middleware
```

**Problem**: Supabase free tier limit hit → deployment blocked

### Target State (Neon + Better Auth + Drizzle)

```
Browser (React Components)
  ↓ (NO KEYS)
Hooks + Repository Interfaces
  ↓
Next.js API Routes ← [Session Boundary]
  ├─ /api/auth/*              (Better Auth endpoints)
  ├─ /api/tasks/*             (GET/POST/PUT/DELETE)
  ├─ /api/tasks/complete      (XP transaction)
  ├─ /api/tasks/undo          (XP reversal transaction)
  ├─ /api/profiles/*
  ├─ /api/schedule/*
  ├─ /api/history/*
  └─ [Middleware: authenticate & validate session]
       ↓ (DATABASE_URL server-only)
       Drizzle ORM
       ↓
       Neon PostgreSQL
```

**Key Principle**: No database credentials in browser. All queries go through authenticated API routes.

---

## 2. DATABASE SCHEMA MAPPING

### Preservation Strategy

**Keep 100% of existing schema structure:**
- Same table names
- Same column names
- Same constraints
- Same indexes
- Same relationships

**New Tables (Better Auth)**:
- `auth_accounts` — OAuth/credential accounts
- `auth_sessions` — Active sessions
- `auth_users` — User identity (replaces Supabase auth.users)
- `auth_verification_tokens` — Email verification

### Table-by-Table Mapping

#### Organizer Tables (UNCHANGED)

```typescript
// src/lib/db/schema.ts (Drizzle)

// 1. Profiles (User stats & settings)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),                              // FK to auth_users.id
  displayName: text("display_name").notNull().default(""),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  totalXp: integer("total_xp").notNull().default(0),       // Cache of SUM(xp_events.amount)
  level: integer("level").notNull().default(1),             // Derived from totalXp
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  tasksCompletedTotal: integer("tasks_completed_total").notNull().default(0),
  teachingDays: smallint("teaching_days").array().notNull().default([1,3,5]),
  collegeStart: time("college_start").notNull().default("09:00"),
  collegeEnd: time("college_end").notNull().default("17:00"),
  teachingStart: time("teaching_start").notNull().default("17:30"),
  teachingEnd: time("teaching_end").notNull().default("21:30"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 2. Task Instances (Individual tasks)
export const taskInstances = pgTable("task_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => recurringTemplates.id, { onDelete: "set null" }),
  date: date("date").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("normal"),
  difficulty: text("difficulty").notNull().default("medium"),
  xpReward: smallint("xp_reward").notNull(),
  estimatedMinutes: smallint("estimated_minutes"),
  dueTime: time("due_time"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  carriedFromTaskInstanceId: uuid("carried_from_task_instance_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
exports.taskInstancesIndex = index("idx_task_instances_user_date").on(taskInstances.userId, taskInstances.date);

// 3. Recurring Templates
export const recurringTemplates = pgTable("recurring_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("normal"),
  difficulty: text("difficulty").notNull().default("medium"),
  xpReward: smallint("xp_reward").notNull(),
  estimatedMinutes: smallint("estimated_minutes"),
  dueTime: time("due_time"),
  recurrenceType: text("recurrence_type").notNull().default("daily"),
  recurrenceDays: smallint("recurrence_days").array(),
  isActive: boolean("is_active").notNull().default(true),
  startsOn: date("starts_on").notNull().defaultNow(),
  endsOn: date("ends_on"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 4. XP Events (Audit trail)
export const xpEvents = pgTable("xp_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  amount: smallint("amount").notNull(),
  reason: text("reason").notNull(),  // "task_complete", "achievement", etc.
  idempotencyKey: text("idempotency_key"),                  // Prevent duplicate awards
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
exports.xpEventsIdempotencyIndex = uniqueIndex("idx_xp_events_idempotency").on(xpEvents.idempotencyKey);

// 5. Daily Summaries
export const dailySummaries = pgTable("daily_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  tasksTotal: integer("tasks_total").notNull().default(0),
  completionPercentage: integer("completion_percentage").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
exports.dailySummariesUserDateIndex = uniqueIndex("idx_daily_summaries_user_date").on(dailySummaries.userId, dailySummaries.date);

// 6. Schedule Blocks (College, teaching, custom)
export const scheduleBlocks = pgTable("schedule_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(),  // "college", "teaching", "custom", etc.
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  recurrenceDays: smallint("recurrence_days").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 7. Achievements (Global definitions)
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 8. User Achievements (Progress)
export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
exports.userAchievementsIndex = uniqueIndex("idx_user_achievements_unique").on(userAchievements.userId, userAchievements.achievementId);
```

#### Better Auth Tables (NEW)

Better Auth (via `better-auth`) provides:
- `auth_users` — User identity (replaces Supabase auth.users)
- `auth_sessions` — Session tokens
- `auth_accounts` — OAuth provider links
- `auth_verification_tokens` — Email verification tokens
- `auth_password_reset_tokens` — Password reset tokens (if needed)

**Configuration** (in Better Auth setup):
```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",  // PostgreSQL
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },
  emailVerification: {
    sendVerificationEmail: async (user, url) => {
      // Implement email sending (SendGrid free tier)
      await sendVerificationEmail(user.email, url);
    },
  },
  socialProviders: {
    // Optional: GitHub, Google OAuth (not required for v1)
  },
});
```

**Schema Drizzle Definition**:
```typescript
// Better Auth creates these automatically via schema export
export const authSchema = auth.schema;
```

### Schema Changes Summary

| Table | Action | Reason |
|-------|--------|--------|
| `profiles` | Migrate | Update FK: Supabase auth.users → Better Auth auth_users |
| `task_instances` | Migrate | No changes except PK integrity |
| `recurring_templates` | Migrate | No changes |
| `xp_events` | Migrate | No changes |
| `daily_summaries` | Migrate | No changes |
| `schedule_blocks` | Migrate | No changes |
| `achievements` | Migrate | No changes |
| `user_achievements` | Migrate | No changes |
| `auth_users` | New | Better Auth user identity |
| `auth_sessions` | New | Better Auth session management |
| `auth_accounts` | New | OAuth provider links (optional) |
| `auth_verification_tokens` | New | Email verification |

---

## 3. BETTER AUTH MAPPING

### Current Auth Flow (Supabase Auth)

```typescript
// Sign up
await client.auth.signUp({ email, password });

// Sign in
await client.auth.signInWithPassword({ email, password });

// Get session
const { data: { session } } = await client.auth.getSession();

// Listen to changes
client.auth.onAuthStateChange((event, session) => {
  setUser(session?.user);
});

// Sign out
await client.auth.signOut();
```

### Replacement Auth Flow (Better Auth)

```typescript
// Better Auth client-side
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

// Sign up
await authClient.signUp.email({
  email,
  password,
  name: "",
});

// Sign in
await authClient.signIn.email({
  email,
  password,
});

// Get session (cached)
const session = await authClient.getSession();

// Listen to changes
authClient.session.watch((session) => {
  setUser(session?.user);
});

// Sign out
await authClient.signOut();
```

### Mapping Table

| Supabase Auth | Better Auth | Implementation |
|---------------|-------------|-----------------|
| `client.auth.signUp()` | `authClient.signUp.email()` | Redirect form handler |
| `client.auth.signInWithPassword()` | `authClient.signIn.email()` | Redirect form handler |
| `client.auth.getSession()` | `authClient.getSession()` | Use session state |
| `client.auth.onAuthStateChange()` | `authClient.session.watch()` | useEffect hook |
| `client.auth.signOut()` | `authClient.signOut()` | Button handler |
| `auth.uid()` in RLS | `session.user.id` | Server-side validation |
| Email verification | Better Auth built-in | Configure SendGrid |
| Sessions | JWT + HTTP-only cookie | Better Auth built-in |
| Refresh tokens | Automatic | Better Auth built-in |

### Email Verification (Better Auth)

Better Auth handles email verification automatically. Need to configure email provider:

```typescript
// src/lib/auth.ts
import { sendEmail } from "@/lib/email";  // SendGrid or Resend

export const auth = betterAuth({
  // ...
  emailVerification: {
    sendVerificationEmail: async (user, url) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        html: `Click <a href="${url}">here</a> to verify`,
      });
    },
  },
});
```

### Session Table Schema (Better Auth)

```typescript
// Automatically created by Better Auth
export const sessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});
```

---

## 4. API/SERVER BOUNDARY

### Principle: No DB Credentials in Browser

**Browser**:
- ✅ Can only call `/api/*` endpoints
- ✅ Cannot connect to database directly
- ✅ Cannot access environment variables
- ✅ Must send session/auth header (cookie-based)

**Server (Next.js)**:
- ✅ Validates session from request
- ✅ Checks user ownership (never trusts user_id from browser)
- ✅ Executes database operations
- ✅ Returns JSON responses

### API Route Pattern

Every API route follows this pattern:

```typescript
// src/app/api/tasks/route.ts
import { getSession } from "better-auth/next";
import { db } from "@/lib/db";
import { taskInstances } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tasks?date=2024-08-24
export async function GET(req: NextRequest) {
  // Step 1: Authenticate
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Get user ID from AUTHENTICATED session (never from request params)
  const userId = session.user.id;

  // Step 3: Validate ownership + get data
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  try {
    const tasks = await db.query.taskInstances.findMany({
      where: and(
        eq(taskInstances.userId, userId),      // ← SCOPED BY AUTH USER
        eq(taskInstances.date, date)
      ),
      orderBy: (fields, { asc }) => asc(fields.createdAt),
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  // Validate input
  if (!body.title || !body.date || !body.category || !body.difficulty) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const newTask = await db.insert(taskInstances).values({
      userId,                           // ← ENFORCED SERVER-SIDE
      title: body.title,
      description: body.description,
      date: body.date,
      category: body.category,
      priority: body.priority || "normal",
      difficulty: body.difficulty,
      xpReward: calculateXP(body.difficulty),
      estimatedMinutes: body.estimatedMinutes,
      dueTime: body.dueTime,
      completed: false,
    }).returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id]
export async function PUT(req: NextRequest, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;
  const body = await req.json();

  try {
    // Step 1: Verify ownership
    const existing = await db.query.taskInstances.findFirst({
      where: and(
        eq(taskInstances.id, id),
        eq(taskInstances.userId, userId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Not found or not authorized" },
        { status: 404 }
      );
    }

    // Step 2: Update
    const updated = await db.update(taskInstances)
      .set({
        title: body.title || existing.title,
        description: body.description ?? existing.description,
        priority: body.priority || existing.priority,
        difficulty: body.difficulty || existing.difficulty,
        dueTime: body.dueTime ?? existing.dueTime,
        estimatedMinutes: body.estimatedMinutes ?? existing.estimatedMinutes,
        updatedAt: new Date(),
      })
      .where(eq(taskInstances.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(req: NextRequest, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = params;

  try {
    // Verify ownership before delete
    const existing = await db.query.taskInstances.findFirst({
      where: and(
        eq(taskInstances.id, id),
        eq(taskInstances.userId, userId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Not found or not authorized" },
        { status: 404 }
      );
    }

    await db.delete(taskInstances).where(eq(taskInstances.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Security Checklist for Every Route

```
[ ] GET session from request (not from body)
[ ] Check if session exists → return 401 if not
[ ] Extract userId from session.user.id
[ ] Never trust user_id from request parameters
[ ] For UPDATE/DELETE: verify ownership first
[ ] Return 404 (not "forbidden") if unauthorized (prevents user enumeration)
[ ] Always use parameterized queries (Drizzle prevents SQL injection)
[ ] Log errors server-side, don't leak details to client
[ ] Validate input types and ranges
[ ] Set appropriate HTTP status codes
```

### API Routes to Create

```
src/app/api/
├── auth/
│   └── [...auth]/route.ts              ← Better Auth core routes
├── tasks/
│   ├── route.ts                        ← GET/POST (list, create)
│   ├── today/route.ts                  ← GET (today's tasks)
│   ├── [id]/route.ts                   ← GET/PUT/DELETE (single task)
│   ├── complete/route.ts               ← POST (XP transaction)
│   └── undo/route.ts                   ← POST (reverse XP)
├── profiles/
│   ├── route.ts                        ← GET/PUT (current user)
│   └── [id]/route.ts                   ← GET (public profile if needed)
├── schedule/
│   ├── route.ts                        ← GET/POST (list, create)
│   └── [id]/route.ts                   ← GET/PUT/DELETE
├── history/
│   ├── route.ts                        ← GET (daily summaries)
│   └── stats/route.ts                  ← GET (aggregations)
└── achievements/
    └── route.ts                        ← GET (all + unlocked)
```

---

## 5. TRANSACTION STRATEGY

### Problem: Race Conditions on XP Award

**Without transactions**, this sequence breaks:

```
User A: Click "Complete Task" (50 XP)
  ├─ Browser calls /api/tasks/complete
  ├─ Server: Check task exists
  ├─ Server: Mark completed ✓
  ├─ [Browser timeout, user retries]
  ├─ Server: Award 50 XP ✓
Browser retry: Click "Complete Task" again
  ├─ Server: Award 50 XP AGAIN ✗ (XP doubled)
```

### Solution: Database Transactions + Idempotency Keys

**With transactions + idempotency**:

```
User A: Click "Complete Task"
  → Browser sends { taskId, idempotencyKey: "task-uuid-timestamp" }

Server Transaction:
  ├─ Step 1: Check task exists and belongs to user
  ├─ Step 2: Mark completed
  ├─ Step 3: Check if idempotency key exists
  │   ├─ If exists → return cached result (no new XP)
  │   └─ If not exists → proceed
  ├─ Step 4: Create XP event with idempotency key
  ├─ Step 5: Update profile.total_xp cache
  ├─ Step 6: Evaluate level-up
  ├─ Step 7: Evaluate achievements
  ├─ [COMMIT or ROLLBACK as atomic unit]
  └─ Return result
```

### Implementation: Complete Task Transaction

```typescript
// src/app/api/tasks/complete/route.ts
import { db } from "@/lib/db";
import {
  taskInstances,
  xpEvents,
  profiles,
  userAchievements,
  achievements,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "better-auth/next";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { taskId, idempotencyKey } = await req.json();

  if (!taskId || !idempotencyKey) {
    return NextResponse.json(
      { error: "taskId and idempotencyKey required" },
      { status: 400 }
    );
  }

  try {
    // Execute in a database transaction
    const result = await db.transaction(async (tx) => {
      // Step 1: Get task and verify ownership + not already completed
      const task = await tx.query.taskInstances.findFirst({
        where: and(
          eq(taskInstances.id, taskId),
          eq(taskInstances.userId, userId),
          eq(taskInstances.completed, false)  // ← Not already completed
        ),
      });

      if (!task) {
        throw new Error("Task not found or already completed");
      }

      // Step 2: Mark task as completed
      await tx.update(taskInstances)
        .set({
          completed: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(taskInstances.id, taskId));

      // Step 3: Check for duplicate XP award (idempotency)
      const existingXpEvent = await tx.query.xpEvents.findFirst({
        where: eq(xpEvents.idempotencyKey, idempotencyKey),
      });

      let xpAmount = task.xpReward;  // Default to task reward

      if (!existingXpEvent) {
        // Step 4: Record XP event
        await tx.insert(xpEvents).values({
          userId,
          amount: xpAmount,
          reason: "task_complete",
          idempotencyKey,
        });

        // Step 5: Update profile's total_xp cache
        // (This is a cached value, authoritative is SUM of xp_events)
        const totalXpResult = await tx.select({
          total: sql`COALESCE(SUM(${xpEvents.amount}), 0)`,
        }).from(xpEvents)
          .where(eq(xpEvents.userId, userId));

        const newTotalXp = (totalXpResult[0]?.total as number) || 0;

        // Calculate new level
        const oldLevel = (await tx.query.profiles.findFirst({
          where: eq(profiles.id, userId),
        }))?.level || 1;

        const newLevel = calculateLevel(newTotalXp);
        const leveledUp = newLevel > oldLevel;

        // Update profile
        await tx.update(profiles)
          .set({
            totalXp: newTotalXp,
            level: newLevel,
            tasksCompletedTotal: sql`${profiles.tasksCompletedTotal} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, userId));

        // Step 6: Check for achievement unlocks
        if (leveledUp) {
          // Example: "Level 5" achievement
          const levelAchievement = await tx.query.achievements.findFirst({
            where: sql`${achievements.title} LIKE ${"level-%"}`,
          });

          if (levelAchievement) {
            const existingAchievement = await tx.query.userAchievements.findFirst({
              where: and(
                eq(userAchievements.userId, userId),
                eq(userAchievements.achievementId, levelAchievement.id)
              ),
            });

            if (!existingAchievement) {
              await tx.insert(userAchievements).values({
                userId,
                achievementId: levelAchievement.id,
                unlockedAt: new Date(),
              });
            }
          }
        }

        // Other achievements could be checked here (first task, 10 tasks, etc.)
      }

      return {
        success: true,
        task: {
          ...task,
          completed: true,
          completedAt: new Date().toISOString(),
        },
        xpAwarded: xpAmount,
        isDuplicate: !!existingXpEvent,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Complete task failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to complete task" },
      { status: 500 }
    );
  }
}

// Helper: Calculate level from XP (same as domain logic)
function calculateLevel(xp: number): number {
  if (xp < 50) return 1;
  if (xp < 150) return 2;
  if (xp < 350) return 3;
  if (xp < 650) return 4;
  if (xp < 1050) return 5;
  if (xp < 1550) return 6;
  return Math.floor(Math.sqrt(xp / 100));
}
```

### Implementation: Undo Complete Task

```typescript
// src/app/api/tasks/undo/route.ts
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { taskId } = await req.json();

  try {
    const result = await db.transaction(async (tx) => {
      // Step 1: Get task and verify ownership + is completed
      const task = await tx.query.taskInstances.findFirst({
        where: and(
          eq(taskInstances.id, taskId),
          eq(taskInstances.userId, userId),
          eq(taskInstances.completed, true)  // ← Must be completed
        ),
      });

      if (!task) {
        throw new Error("Task not found or not completed");
      }

      // Step 2: Mark task as not completed
      await tx.update(taskInstances)
        .set({
          completed: false,
          completedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(taskInstances.id, taskId));

      // Step 3: Remove the XP event (reverse operation)
      await tx.delete(xpEvents)
        .where(
          and(
            eq(xpEvents.userId, userId),
            eq(xpEvents.reason, "task_complete"),
            // Find XP event for this task (by approximate time matching)
            sql`${xpEvents.createdAt} > ${task.completedAt} - INTERVAL '5 seconds'
                AND ${xpEvents.createdAt} < ${task.completedAt} + INTERVAL '5 seconds'`
          )
        );

      // Step 4: Recalculate and update profile stats
      const totalXpResult = await tx.select({
        total: sql`COALESCE(SUM(${xpEvents.amount}), 0)`,
      }).from(xpEvents)
        .where(eq(xpEvents.userId, userId));

      const newTotalXp = (totalXpResult[0]?.total as number) || 0;
      const newLevel = calculateLevel(newTotalXp);

      await tx.update(profiles)
        .set({
          totalXp: newTotalXp,
          level: newLevel,
          tasksCompletedTotal: sql`GREATEST(${profiles.tasksCompletedTotal} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      return {
        success: true,
        task: {
          ...task,
          completed: false,
          completedAt: null,
        },
        xpReversed: task.xpReward,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Undo failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to undo task" },
      { status: 500 }
    );
  }
}
```

### Generate Daily Tasks (Idempotent)

```typescript
// src/app/api/tasks/generate-daily/route.ts
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { date } = await req.json();  // e.g., "2024-08-24"

  try {
    const result = await db.transaction(async (tx) => {
      // Step 1: Check if tasks already generated for this date
      const existingTasks = await tx.query.taskInstances.findMany({
        where: and(
          eq(taskInstances.userId, userId),
          eq(taskInstances.date, date)
        ),
      });

      if (existingTasks.length > 0) {
        // Already generated, return (idempotent)
        return {
          success: true,
          generated: 0,
          message: "Tasks already generated for this date",
        };
      }

      // Step 2: Get active recurring templates
      const templates = await tx.query.recurringTemplates.findMany({
        where: and(
          eq(recurringTemplates.userId, userId),
          eq(recurringTemplates.isActive, true)
          // Verify date is in range (if ends_on set)
        ),
      });

      // Step 3: Filter templates by recurrence rule
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getUTCDay();  // 0=Sun, 1=Mon, ..., 6=Sat
      const isoWeekday = dayOfWeek === 0 ? 7 : dayOfWeek;  // 1=Mon, ..., 7=Sun

      const tasksToCreate = templates.filter((template) => {
        if (template.recurrenceType === "daily") return true;
        if (template.recurrenceType === "weekdays") {
          return isoWeekday >= 1 && isoWeekday <= 5;  // Mon-Fri
        }
        if (template.recurrenceType === "weekly") {
          // Match day of week from starts_on
          const templateStart = new Date(template.startsOn);
          const templateDayOfWeek = templateStart.getUTCDay();
          return templateDayOfWeek === dayOfWeek;
        }
        if (template.recurrenceType === "custom") {
          // Check recurrence_days array
          return template.recurrenceDays?.includes(isoWeekday);
        }
        return false;
      });

      // Step 4: Create task instances
      const createdTasks = await tx.insert(taskInstances).values(
        tasksToCreate.map((template) => ({
          userId,
          templateId: template.id,
          date,
          title: template.title,
          description: template.description,
          category: template.category,
          priority: template.priority,
          difficulty: template.difficulty,
          xpReward: template.xpReward,
          estimatedMinutes: template.estimatedMinutes,
          dueTime: template.dueTime,
          completed: false,
        }))
      ).returning();

      return {
        success: true,
        generated: createdTasks.length,
        tasks: createdTasks,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate daily tasks failed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate tasks" },
      { status: 500 }
    );
  }
}
```

---

## 6. SECURITY MODEL

### Core Principles

1. **Authentication Boundary**: Better Auth session is source of truth
2. **Authorization Check**: Every route verifies user ownership
3. **Never Trust Client**: User ID always extracted from session, never from request
4. **Fail Secure**: Return 404 (not "forbidden") to prevent user enumeration
5. **No Credential Leaks**: DATABASE_URL never in browser, never in responses

### Request/Response Examples

#### Good ✅

```
GET /api/tasks?date=2024-08-24
Request Headers:
  Cookie: auth.session=jwt_token_here

Server:
  ├─ Extract session from cookie
  ├─ Verify JWT signature
  ├─ Get userId from session.user.id
  ├─ Query: tasks WHERE user_id = userId AND date = 2024-08-24
  └─ Return tasks

Response:
  [{
    id: "uuid",
    title: "Task 1",
    // ... no user_id in response (client doesn't need it)
  }]
```

#### Bad ❌

```
GET /api/tasks?user_id=other-user-uuid&date=2024-08-24

Server should:
  ├─ Ignore user_id from query params
  ├─ Use userId from session instead
  ├─ Query: tasks WHERE user_id = session.userId (NOT other-user-uuid)
  └─ If other-user-uuid !== session.userId, return 404
```

#### Ownership Verification

```typescript
// Before any data operation:
const session = await getSession();
const userId = session.user.id;  // ← Source of truth

// Get the resource
const resource = await db.query.someTable.findFirst({
  where: eq(someTable.id, resourceId),
});

// Verify ownership
if (resource.userId !== userId) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// Proceed
```

### Middleware: Session Validation

Better Auth provides middleware, but we may need custom:

```typescript
// src/lib/middleware/auth.ts
import { getSession } from "better-auth/next";
import { NextRequest, NextResponse } from "next/server";

export async function authMiddleware(
  req: NextRequest,
  response: NextResponse
) {
  // Skip auth for public routes
  if (req.nextUrl.pathname.startsWith("/auth")) {
    return response;
  }

  // Check session for API routes
  if (req.nextUrl.pathname.startsWith("/api")) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return response;
}
```

### Database-Level Constraints (Defense in Depth)

Even with application auth, use DB constraints:

```typescript
// In migration/schema:
export const taskInstances = pgTable("task_instances", {
  // ...
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  // ...
});

// NOT NULL + FK constraint ensures referential integrity
// Prevents orphaned tasks
```

---

## 7. MIGRATION STAGES

### Stage 1: Infrastructure Setup (Day 1, ~4 hours)

**Goal**: Database schema ready, Better Auth configured, no code changes yet

**Tasks**:
1. Create Neon PostgreSQL database
   - [ ] Sign up for Neon free tier
   - [ ] Create project
   - [ ] Get DATABASE_URL
2. Setup Drizzle migrations
   - [ ] Install `drizzle-orm`, `drizzle-kit`, `pg` packages
   - [ ] Create `src/lib/db/schema.ts` with all table definitions
   - [ ] Create `drizzle.config.ts` configuration
3. Create Drizzle migrations
   - [ ] Generate initial migration for all Organizer tables
   - [ ] Generate migration for Better Auth tables
4. Apply migrations to Neon
   - [ ] `drizzle-kit push` to create schema
5. Setup Better Auth
   - [ ] Install `better-auth` package
   - [ ] Create `src/lib/auth.ts` configuration
   - [ ] Setup email service (SendGrid free tier)
6. Verify
   - [ ] [ ] Connect to Neon via psql/pgAdmin
   - [ ] [ ] List tables (confirm schema exists)
   - [ ] [ ] Test Better Auth endpoints locally

**Deliverables**:
- Neon database with complete Organizer schema
- Drizzle ORM migrations in version control
- Better Auth configuration ready

**Blockers**: None (no code changes yet)

---

### Stage 2: Create API Routes (Day 1-2, ~8 hours)

**Goal**: All API endpoints implemented, session-based auth, no frontend changes yet

**Tasks**:
1. Create Better Auth routes
   - [ ] `src/app/api/auth/[...auth]/route.ts` — Better Auth endpoints
2. Create task API routes
   - [ ] `src/app/api/tasks/route.ts` (GET/POST)
   - [ ] `src/app/api/tasks/today/route.ts` (GET)
   - [ ] `src/app/api/tasks/[id]/route.ts` (GET/PUT/DELETE)
   - [ ] `src/app/api/tasks/complete/route.ts` (POST, transaction)
   - [ ] `src/app/api/tasks/undo/route.ts` (POST, transaction)
3. Create profile API routes
   - [ ] `src/app/api/profiles/route.ts` (GET/PUT)
4. Create schedule API routes
   - [ ] `src/app/api/schedule/route.ts` (GET/POST)
   - [ ] `src/app/api/schedule/[id]/route.ts` (GET/PUT/DELETE)
5. Create history API routes
   - [ ] `src/app/api/history/route.ts` (GET)
   - [ ] `src/app/api/history/stats/route.ts` (GET)
6. Create achievement API routes
   - [ ] `src/app/api/achievements/route.ts` (GET)

**Implementation Pattern**:
- Each route: [ ] Session check → [ ] Ownership verification → [ ] DB operation

**Deliverables**:
- All API routes with session-based auth
- Transaction logic for XP operations
- Ownership validation on all user-scoped queries

**Testing**:
- [ ] Test with Postman (manually pass auth cookies)
- [ ] Test ownership isolation (try accessing other user's tasks)
- [ ] Test authorization (401 without session, 404 for unauthorized)

---

### Stage 3: Update Frontend Repositories (Day 2, ~4 hours)

**Goal**: Frontend calls new API routes instead of Supabase client

**Tasks**:
1. Create API client wrapper
   - [ ] `src/lib/api/client.ts` — Fetch wrapper with session handling
2. Update repository implementations
   - [ ] Convert `SupabaseProfileRepository` to call `/api/profiles`
   - [ ] Convert `SupabaseTaskRepository` to call `/api/tasks`
   - [ ] Convert `SupabaseRecurringTemplateRepository` to call `/api/schedule`
   - [ ] Convert `SupabaseHistoryRepository` to call `/api/history`
   - [ ] Convert `SupabaseScheduleRepository` to call `/api/schedule`
   - [ ] Convert `SupabaseAchievementRepository` to call `/api/achievements`
3. Update auth context
   - [ ] Replace Supabase Auth with Better Auth client
   - [ ] Update `useAuth()` to use Better Auth session
   - [ ] Update sign up/sign in/sign out handlers
4. Update data sync hook
   - [ ] `useSupabaseSync()` now calls API routes
5. Update middleware
   - [ ] `src/middleware.ts` uses Better Auth session check

**Deliverables**:
- Frontend completely decoupled from Supabase
- All repositories now call API routes
- Auth context uses Better Auth

**Testing**:
- [ ] Unit tests still pass (they're mocked)
- [ ] Manual testing: sign up, create task, complete task
- [ ] Verify XP is awarded correctly

---

### Stage 4: Remove Supabase (Day 2, ~2 hours)

**Goal**: Remove Supabase dependencies from codebase

**Tasks**:
1. Delete Supabase client files
   - [ ] Delete `src/lib/supabase/client.ts`
   - [ ] Delete `src/lib/supabase/server.ts`
2. Remove Supabase from environment
   - [ ] Remove `NEXT_PUBLIC_SUPABASE_URL`
   - [ ] Remove `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - [ ] Remove `SUPABASE_SERVICE_ROLE_KEY`
3. Clean up imports
   - [ ] Remove all `@supabase/ssr` imports
   - [ ] Remove all `@supabase/supabase-js` imports
4. Update package.json
   - [ ] Remove Supabase packages

**Deliverables**:
- Zero Supabase references in codebase
- Package.json cleaned up
- Build succeeds

---

### Stage 5: Full Verification (Day 2-3, ~4 hours)

**Goal**: Complete end-to-end testing, production readiness

**Tasks**:
1. Test critical flows
   - [ ] Sign up new user
   - [ ] Sign in existing user
   - [ ] Create task
   - [ ] Edit task
   - [ ] Delete task
   - [ ] Complete task (verify XP awarded)
   - [ ] Undo task (verify XP reversed)
   - [ ] Recurring task generation
   - [ ] Daily rollover
   - [ ] View history
   - [ ] View stats
   - [ ] View achievements
   - [ ] View schedule
2. Test security
   - [ ] User A cannot access User B's tasks
   - [ ] Unauthenticated user cannot access protected routes
   - [ ] Invalid session token rejected
3. Test edge cases
   - [ ] Complete same task twice (idempotency test)
   - [ ] Undo non-completed task (should fail)
   - [ ] Timezone handling
   - [ ] Leap second edge case
4. Run full test suite
   - [ ] `pnpm test` — all unit tests pass
   - [ ] `pnpm run build` — production build succeeds
   - [ ] `pnpm lint` — 0 errors/warnings

**Deliverables**:
- Full test coverage verified
- Production build ready
- Security model validated

---

## 8. PACKAGE CHANGES

### Packages to Remove

```json
{
  "@supabase/ssr": "^0.12.4",
  "@supabase/supabase-js": "^2.112.3"
}
```

### Packages to Add

```json
{
  "drizzle-orm": "^0.30.0",
  "pg": "^8.11.0",
  "drizzle-kit": "^0.20.0",
  "better-auth": "^0.1.0",
  "resend": "^0.1.0"  // or SendGrid for email
}
```

### Updated package.json

```json
{
  "name": "organizer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "@base-ui/react": "^1.7.0",
    "@tanstack/react-query": "^5.0.0",
    "better-auth": "^0.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.30.0",
    "lucide-react": "^1.33.0",
    "motion": "^13.1.1",
    "next": "16.3.2",
    "pg": "^8.11.0",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "recharts": "^3.10.1",
    "resend": "^0.1.0",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.62.1",
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/pg": "^8.11.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^6.1.0",
    "drizzle-kit": "^0.20.0",
    "eslint": "^9",
    "eslint-config-next": "16.3.2",
    "jsdom": "^30.0.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.1.11"
  }
}
```

---

## 9. FILE CHANGES

### Files to Delete

```
src/lib/supabase/client.ts              (Supabase browser client)
src/lib/supabase/server.ts              (Supabase server client)
src/lib/supabase/types.generated.ts     (Auto-generated types)
src/lib/supabase/index.ts               (Barrel exports)
```

### Files to Rewrite

```
src/lib/supabase/helpers.ts
  → src/lib/api/client.ts               (Fetch wrapper + error handling)

src/lib/auth/context.tsx
  → Updated to use Better Auth (keep same interface)

src/lib/data/supabase-repositories.ts
  → Updated to call API routes instead of Supabase

src/hooks/useSupabaseSync.ts
  → Updated to call API routes

src/hooks/useSupabaseTasks.ts
  → Updated to call API routes

src/middleware.ts
  → Updated to use Better Auth session

src/app/auth/callback/route.ts
  → Updated for Better Auth

src/app/auth/login/page.tsx
  → Minor: form submission updates

src/app/auth/signup/page.tsx
  → Minor: form submission updates

src/lib/data/migration.ts
  → Update Supabase insert to API call
```

### Files to Create

```
src/lib/db/index.ts                    (Drizzle setup)
src/lib/db/schema.ts                   (Drizzle schema + migrations)
src/lib/auth.ts                        (Better Auth config)
src/lib/email.ts                       (Email service: Resend/SendGrid)

src/app/api/auth/[...auth]/route.ts    (Better Auth routes)
src/app/api/tasks/route.ts             (Task CRUD)
src/app/api/tasks/today/route.ts       (Today's tasks)
src/app/api/tasks/[id]/route.ts        (Single task)
src/app/api/tasks/complete/route.ts    (XP transaction)
src/app/api/tasks/undo/route.ts        (XP reversal)
src/app/api/tasks/recurring/route.ts   (Generate recurring)

src/app/api/profiles/route.ts          (Profile operations)
src/app/api/schedule/route.ts          (Schedule blocks)
src/app/api/schedule/[id]/route.ts     (Single block)
src/app/api/history/route.ts           (Daily summaries)
src/app/api/history/stats/route.ts     (Aggregations)
src/app/api/achievements/route.ts      (Achievements)

drizzle.config.ts                      (Drizzle configuration)
```

### Files Unchanged

```
src/lib/domain/*                       (Pure business logic)
src/lib/store/*                        (Redux-like state)
src/components/*                       (React components)
src/types/*                            (Type definitions)
src/app/page.tsx                       (Homepage)
src/app/layout.tsx                     (Root layout)
All other page components
All E2E tests
All unit tests
```

---

## 10. TESTING STRATEGY

### Unit Tests (Unchanged)

All existing tests pass without modification because they:
- Don't directly depend on Supabase
- Use mock repositories
- Test pure logic

```bash
pnpm test
# Should pass 54/54 tests
```

### Integration Tests (New)

Test API routes + database:

```typescript
// tests/api/tasks.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { profiles, taskInstances } from "@/lib/db/schema";

describe("POST /api/tasks", () => {
  let userId: string;
  let authToken: string;

  beforeEach(async () => {
    // Setup: Create test user
    // Setup: Create test session
  });

  afterEach(async () => {
    // Cleanup: Delete test data
  });

  it("creates task for authenticated user", async () => {
    // Act
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({
        title: "Test Task",
        date: "2024-08-24",
        category: "personal",
        priority: "normal",
        difficulty: "easy",
      }),
    });

    // Assert
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("Test Task");
    expect(data.userId).toBe(userId);

    // Verify in DB
    const task = await db.query.taskInstances.findFirst({
      where: eq(taskInstances.id, data.id),
    });
    expect(task).toBeDefined();
  });

  it("returns 401 without auth", async () => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
    });

    expect(res.status).toBe(401);
  });

  it("prevents access to other user's tasks", async () => {
    // Create task for userA
    // Login as userB
    // Try to GET taskA
    // Expect 404 (not 403, to prevent enumeration)
  });
});
```

### Critical Security Tests

```typescript
// tests/security/authorization.test.ts
describe("Authorization", () => {
  it("User A cannot read User B tasks", async () => {
    // UserA creates task
    // UserB tries to GET task
    // Expect 404
  });

  it("User A cannot modify User B tasks", async () => {
    // UserB creates task
    // UserA tries to PUT task
    // Expect 404
  });

  it("Unauthenticated user cannot access protected routes", async () => {
    // GET /api/tasks without auth
    // Expect 401
  });

  it("Invalid session token rejected", async () => {
    // GET /api/tasks with bad token
    // Expect 401
  });
});
```

### XP Transaction Tests

```typescript
// tests/transactions/xp.test.ts
describe("Complete Task Transaction", () => {
  it("awards XP exactly once", async () => {
    // User completes task
    // Call POST /api/tasks/complete twice with same idempotencyKey
    // Verify XP only awarded once
  });

  it("reverses XP on undo", async () => {
    // User completes task (50 XP)
    // User undoes task
    // Verify XP reduced by 50
  });

  it("marks task as completed atomically", async () => {
    // Complete task
    // Verify: task.completed=true AND xp_event exists
    // Both must succeed or both must fail
  });

  it("prevents race conditions", async () => {
    // Send 10 concurrent complete_task requests with same idempotencyKey
    // Verify XP awarded exactly once
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/auth-flow.spec.ts
test("complete signup → signin → create task → complete", async ({ page }) => {
  // 1. Signup
  await page.goto("/auth/signup");
  await page.fill("input[type=email]", "test@example.com");
  await page.fill("input[type=password]", "password123");
  await page.click("button[type=submit]");

  // 2. Verify email (mock)
  // ...

  // 3. Signin
  await page.goto("/auth/login");
  await page.fill("input[type=email]", "test@example.com");
  await page.fill("input[type=password]", "password123");
  await page.click("button[type=submit]");

  // 4. Create task
  await page.goto("/tasks");
  await page.click("button:has-text('Add Task')");
  await page.fill("input[placeholder='Task title']", "Buy groceries");
  await page.click("button:has-text('Create')");

  // 5. Complete task
  await page.click("input[type=checkbox]");

  // 6. Verify XP awarded
  await expect(page.locator("text=/XP Earned/")).toBeVisible();
});
```

---

## 11. ROLLBACK STRATEGY

### If Migration Fails Halfway

**Assumption**: Supabase project still exists (not deleted)

**Rollback Steps**:

1. **Revert code to Supabase version**:
   ```bash
   git checkout HEAD~N -- src/lib/supabase/
   git checkout HEAD~N -- src/hooks/
   git checkout HEAD~N -- src/app/api/
   # Revert API routes deletion
   ```

2. **Restore environment variables**:
   ```bash
   # Vercel: Revert env vars
   NEXT_PUBLIC_SUPABASE_URL=<restore>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<restore>
   SUPABASE_SERVICE_ROLE_KEY=<restore>
   ```

3. **Deploy**:
   ```bash
   git push
   # Vercel deploys automatically
   ```

**Data Safety**: 
- Neon database remains (can keep for reference)
- Organizer data preserved in both databases during migration
- No data loss

### If Better Auth Setup Fails

**Fallback**: Return to Supabase Auth, keep Neon database

```bash
# Revert to Supabase Auth client
git checkout HEAD~N -- src/lib/auth/context.tsx
git checkout HEAD~N -- src/app/auth/

# Keep using Neon (don't revert database)
```

### If Drizzle Migration Fails

**Fallback**: Use manual PostgreSQL + old data access layer

```bash
# If migrations fail to apply:
# 1. Manually run SQL via psql
# 2. Revert to old repository pattern using raw SQL

# If Drizzle types wrong:
# 1. Adjust schema.ts
# 2. Regenerate migrations
```

---

## 12. ESTIMATED IMPLEMENTATION EFFORT

### Timeline Breakdown

| Stage | Task | Hours | Day |
|-------|------|-------|-----|
| **1** | Neon setup | 1 | Day 1 |
| **1** | Drizzle schema | 2 | Day 1 |
| **1** | Migrations | 1 | Day 1 |
| **1** | Better Auth setup | 1.5 | Day 1 |
| **1** | Verify infrastructure | 1.5 | Day 1 |
| **Subtotal 1** | | **7** | |
| | | | |
| **2** | Auth API routes | 1.5 | Day 2 |
| **2** | Tasks API routes | 3 | Day 2 |
| **2** | Profile/Schedule/History routes | 2 | Day 2 |
| **2** | Achievements routes | 0.5 | Day 2 |
| **2** | XP transaction logic | 1.5 | Day 2 |
| **Subtotal 2** | | **8.5** | |
| | | | |
| **3** | API client wrapper | 1 | Day 2-3 |
| **3** | Update repositories | 2 | Day 2-3 |
| **3** | Update auth context | 1 | Day 2-3 |
| **3** | Update hooks | 1 | Day 2-3 |
| **Subtotal 3** | | **5** | |
| | | | |
| **4** | Remove Supabase | 1 | Day 3 |
| **Subtotal 4** | | **1** | |
| | | | |
| **5** | Testing & verification | 3 | Day 3 |
| **5** | Bug fixes | 2 | Day 3 |
| **Subtotal 5** | | **5** | |
| | | | |
| **TOTAL** | | **26.5 hours** | **3 days** |

### Parallelizable Work

- Stage 1 (infrastructure) can proceed independently
- Stages 2 & 3 can overlap (create routes while updating frontend)
- Testing can happen parallel to development

**Realistic Timeline with Parallelism**: **2-2.5 days**

---

## SUMMARY

### Architecture Decision

```
Browser (React)
  ↓ (no keys)
Hooks + Repositories (abstraction layer)
  ↓
Next.js API Routes (session boundary)
  ├─ Authentication (Better Auth)
  ├─ Authorization (app-level ownership checks)
  └─ Database transactions (Drizzle)
       ↓
       Neon PostgreSQL (free tier)
```

### Database Changes

- 8 Organizer tables: UNCHANGED (same schema)
- 4 Better Auth tables: NEW (auth_users, auth_sessions, etc.)
- No data loss during migration

### Security Model

- No RLS needed (app-level auth + ownership checks)
- Session-based authorization
- Database credentials server-only
- Defense in depth with constraints

### Migration Stages

1. Infrastructure + schema setup (Day 1, 7h)
2. API routes + transactions (Day 2, 8.5h)
3. Frontend integration (Day 2-3, 5h)
4. Remove Supabase (Day 3, 1h)
5. Full verification (Day 3, 5h)

### End Result

- ✅ $0/month cost (Neon free + Better Auth self-hosted)
- ✅ Zero UI changes
- ✅ Zero domain logic changes
- ✅ All tests pass unchanged
- ✅ Full feature parity with Supabase version
- ✅ Improved control & debuggability

---

**Implementation Plan Complete** ✅

Ready for approval to proceed with Stage 1 setup.

