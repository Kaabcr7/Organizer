# Organizer Drizzle Schema Migration Summary

## Overview
Local Drizzle schema and migration files created for Neon PostgreSQL (free tier).
**Status**: GENERATED but NOT APPLIED to production database.

## Key Details

### Project Configuration
- **Database**: Neon (PostgreSQL 18)
- **Project**: Organizer (ID: tiny-base-00161415)
- **Branch**: production
- **ORM**: Drizzle ORM 0.45.2
- **Migration Tool**: drizzle-kit 0.31.10
- **Database Driver**: postgres 3.4.9

### Schema Summary
**8 Organizer Tables Created** (no modifications to neon_auth schema):

1. **profiles** - User identity and cached stats
   - Primary key: `id` (UUID, no auto-gen - linked to neon_auth.user.id)
   - Fields: display_name, avatar_url, timezone, totalXp, level, streaks, teaching_days
   - Constraints: 5 CHECK constraints for non-negative values
   
2. **recurring_templates** - Task recurrence rules
   - Primary key: `id` (UUID, auto-gen)
   - Foreign key: user_id → profiles.id (ON DELETE CASCADE)
   - Fields: title, description, category, priority, difficulty, xp_reward, recurrence_type, recurrence_days
   - Indexes: idx_recurring_templates_user_active (user_id, is_active)
   
3. **task_instances** - Individual task occurrences
   - Primary key: `id` (UUID, auto-gen)
   - Foreign keys: user_id → profiles.id, template_id → recurring_templates.id
   - Fields: date, title, category, priority, difficulty, xp_reward, completed, completed_at
   - Indexes: user_date, user_completed, template_id (for query performance)
   
4. **xp_events** - XP audit trail
   - Primary key: `id` (UUID, auto-gen)
   - Foreign key: user_id → profiles.id (ON DELETE CASCADE)
   - Fields: amount, reason, idempotency_key (for idempotent retries)
   - Indexes: idempotency_key (UNIQUE), user_id
   
5. **daily_summaries** - Derived daily stats
   - Primary key: `id` (UUID, auto-gen)
   - Foreign key: user_id → profiles.id (ON DELETE CASCADE)
   - Fields: date, tasks_completed, tasks_total, completion_percentage, xp_earned
   - Indexes: (user_id, date) UNIQUE
   
6. **schedule_blocks** - User's fixed schedule
   - Primary key: `id` (UUID, auto-gen)
   - Foreign key: user_id → profiles.id (ON DELETE CASCADE)
   - Fields: title, type, start_time, end_time, recurrence_days
   
7. **achievements** - Global achievement definitions
   - Primary key: `id` (UUID, auto-gen)
   - Fields: title, description, icon, sort_order
   
8. **user_achievements** - User achievement progress
   - Primary key: `id` (UUID, auto-gen)
   - Foreign keys: user_id → profiles.id, achievement_id → achievements.id
   - Indexes: (user_id, achievement_id) UNIQUE

### Foreign Key Relationships

All user-owned tables (recurring_templates, task_instances, xp_events, daily_summaries, schedule_blocks, user_achievements) reference `profiles.id` with `ON DELETE CASCADE`.

**Neon Auth Integration**:
- `profiles.id` is intended to be a foreign key to `neon_auth.user.id`
- This relationship is documented but NOT enforced in the migration (to avoid cross-schema FK issues)
- Application code must validate profile creation only for existing neon_auth users

### Constraints & Validation

**CHECK Constraints** (data integrity at database level):
- profiles: total_xp ≥ 0, level ≥ 1, streaks ≥ 0, tasks_completed_total ≥ 0
- daily_summaries: tasks_completed ≥ 0, tasks_total > 0, completion_percentage 0-100, xp_earned ≥ 0
- recurring_templates: title length > 0, xp_reward IN (10,25,50,100), estimated_minutes > 0, ends_on ≥ starts_on
- task_instances: title length > 0, xp_reward IN (10,25,50,100), completed_at only set when completed=true
- schedule_blocks: title length > 0

**UNIQUE Constraints**:
- daily_summaries: (user_id, date)
- user_achievements: (user_id, achievement_id)
- xp_events: idempotency_key (allows retry deduplication)

**FOREIGN KEY Constraints**:
- All user-owned tables → profiles.id (ON DELETE CASCADE)
- task_instances.template_id → recurring_templates.id (ON DELETE SET NULL)
- user_achievements → achievements.id (ON DELETE CASCADE)

### Authorization Model

**No Row-Level Security (RLS)**:
- Supabase RLS policies are not replicated
- Authorization happens at API boundary (Next.js server-side)
- Server obtains authenticated user ID from Neon Auth/Better Auth session
- All queries filter by authenticated user_id

**Security Pattern**:
```
User Session (Neon Auth/Better Auth)
↓
API Handler (Next.js server route)
↓ Validate session, extract user_id
↓
Database Query (filtered by user_id)
```

### Timestamps & Defaults

All tables include:
- `created_at`: timestamp DEFAULT now() - record creation time
- `updated_at`: timestamp DEFAULT now() - last modification (application-managed)

Nullable timestamps:
- task_instances.completed_at - set when task is completed
- recurring_templates.ends_on - optional end date for recurrence
- schedule_blocks.recurrence_days - NULL = every day

### Data Types

- **UUIDs**: All primary keys use `gen_random_uuid()` for distributed generation
- **Enums as TEXT**: priority, difficulty, recurrence_type (prevents breaking migrations on enum changes)
- **Arrays as TEXT JSON**: teaching_days, recurrence_days stored as JSON strings (e.g., "[1,3,5]")
- **Times**: Local time fields (times are timezone-aware via user profile.timezone)

### Transaction Pattern for XP Operations

**Future implementation** (not yet coded):

1. **Complete Task**:
   - Read task_instances with user_id filter (validate ownership)
   - Begin transaction
   - Update task_instances.completed = true, completed_at = now()
   - Insert xp_events row with idempotency_key (prevents double-award on retry)
   - Update profiles.total_xp (SUM of xp_events)
   - Evaluate achievements based on new total_xp
   - Commit

2. **Undo Task**:
   - Read task_instances (validate ownership)
   - Begin transaction
   - Update task_instances.completed = false, completed_at = NULL
   - Insert xp_events row with negative amount
   - Update profiles.total_xp
   - Commit

3. **Daily Rollover** (scheduled/triggered):
   - For each active user:
     - Generate task_instances from recurring_templates
     - Calculate daily_summaries (completion stats)
     - Update streaks in profiles

## Generated Files

### Schema Definition
- `src/lib/db/schema.ts` - Drizzle ORM schema with TypeScript types

### Configuration
- `drizzle.config.ts` - Drizzle Kit configuration
- `src/lib/db/index.ts` - Database client factory (singleton)

### Migrations
- `drizzle/migrations/0000_new_firebird.sql` - All 8 tables, FKs, indexes, constraints
  - File size: ~8.5 KB
  - Statements: 8 CREATE TABLE + 8 ALTER TABLE (FKs) + 11 CREATE INDEX

### Dependencies Added
```json
"devDependencies": {
  "drizzle-kit": "^0.31.10",
  "drizzle-orm": "^0.45.2",
  "postgres": "^3.4.9"
}
```

## Verification Results

✅ **TypeScript**: `npx tsc --noEmit` - PASS (no errors)
✅ **Build**: `npm run build` - PASS (Turbopack: 26.4s, TypeScript: 17.1s)
✅ **Tests**: `npm run test` - PASS (54/54 tests pass, no new failures)
✅ **Migrations**: `drizzle-kit generate` - PASS (1 migration file generated)

## Next Steps (NOT YET DONE)

1. **DO NOT APPLY**: `drizzle-kit migrate` or `drizzle-kit push` - migration files are generated only
2. **DO NOT DELETE**: neon_auth schema remains untouched
3. **DO NOT REMOVE**: Supabase dependencies (removed in Phase 4)

### Future Phases
- Phase 2: Implement API routes with server-side transactions
- Phase 3: Integrate Better Auth for authentication
- Phase 4: Remove Supabase dependencies, apply migrations to Neon
- Phase 5: Data migration from Supabase (if existing data)

## Concerns & Notes

### None identified ✓

- Schema correctly references neon_auth user (documented as FK)
- All constraints and indexes are generated correctly
- No accidental neon_auth modifications
- Drizzle client properly configured for server-only access
- TYPE_URL configured to use server-only DATABASE_URL environment variable
- All user-owned tables correctly implement CASCADE deletion for data integrity

## Rollback Procedure

If needed before applying:
1. Delete `drizzle/migrations/` directory
2. Delete `src/lib/db/schema.ts`
3. Delete `src/lib/db/index.ts`
4. Remove Drizzle dependencies: `pnpm remove -D drizzle-orm drizzle-kit postgres`

No database changes have been made, so no rollback from Neon is needed.

---

**Generated**: 2026-08-25
**Migration Version**: 0000_new_firebird
**Neon Project**: tiny-base-00161415
**Status**: ✅ READY FOR REVIEW (NOT APPLIED)
