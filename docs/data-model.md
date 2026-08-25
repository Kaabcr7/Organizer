# Organizer — Data Model & Supabase Schema (Revised)

## Architecture Overview

```
Client (Next.js)
  │
  ├─ READ: Direct Supabase queries (protected by RLS)
  │
  └─ WRITE (task completion, XP-sensitive):
       → Database Function (RPC)
         → Atomic transaction:
             1. Update task_instances.completed
             2. Insert xp_events
             3. Update profiles.total_xp (derived cache)
             4. Evaluate level transition
             5. Evaluate achievements
             6. Upsert daily_summaries
```

XP and level are **never** directly writable by the client. The client calls `rpc.complete_task(task_instance_id)` and receives the result.

---

## Tables

### 1. `profiles`

User profile, settings, and cached XP/level. Created by a database trigger on `auth.users` insert.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| id | uuid | | PK, FK → auth.users(id) ON DELETE CASCADE | |
| display_name | text | '' | NOT NULL | |
| avatar_url | text | NULL | | |
| timezone | text | 'Asia/Kolkata' | NOT NULL | IANA timezone identifier |
| total_xp | integer | 0 | NOT NULL, CHECK (total_xp >= 0) | **Cache** — derived from SUM(xp_events.amount) |
| level | integer | 1 | NOT NULL, CHECK (level >= 1) | **Cache** — derived from total_xp via calculate_level() |
| current_streak | integer | 0 | NOT NULL, CHECK (current_streak >= 0) | |
| longest_streak | integer | 0 | NOT NULL, CHECK (longest_streak >= 0) | |
| tasks_completed_total | integer | 0 | NOT NULL, CHECK (tasks_completed_total >= 0) | **Cache** |
| teaching_days | smallint[] | '{1,3,5}' | NOT NULL | ISO weekday numbers (1=Mon, 7=Sun) |
| college_start | time | '09:00' | NOT NULL | |
| college_end | time | '17:00' | NOT NULL | |
| teaching_start | time | '17:30' | NOT NULL | |
| teaching_end | time | '21:30' | NOT NULL | |
| created_at | timestamptz | now() | NOT NULL | |
| updated_at | timestamptz | now() | NOT NULL | |

**Indexes:**
- PK: `id`

**Trigger:** `on auth.users INSERT → create profiles row` (SECURITY DEFINER, `search_path = ''`)

---

### 2. `recurring_templates`

Recurring task definitions. Instances are generated on-demand during daily rollover, NOT pre-created.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| id | uuid | gen_random_uuid() | PK | |
| user_id | uuid | | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| title | text | | NOT NULL, CHECK (char_length(title) > 0) | |
| description | text | NULL | | |
| category | text | | NOT NULL, CHECK (category IN ('college','dsa','ml-ai','projects','fitness','personal','teaching','other')) | |
| priority | text | 'normal' | NOT NULL, CHECK (priority IN ('low','normal','high','critical')) | |
| difficulty | text | 'medium' | NOT NULL, CHECK (difficulty IN ('easy','medium','hard','epic')) | |
| xp_reward | smallint | | NOT NULL, CHECK (xp_reward IN (10, 25, 50, 100)) | |
| estimated_minutes | smallint | NULL | CHECK (estimated_minutes > 0) | |
| due_time | time | NULL | | Local time in user's timezone |
| recurrence_type | text | 'daily' | NOT NULL, CHECK (recurrence_type IN ('daily','weekdays','weekly','custom')) | |
| recurrence_days | smallint[] | NULL | | For 'custom': ISO weekday numbers {1..7}. NULL = every day for 'daily'. |
| is_active | boolean | true | NOT NULL | Soft-disable without deleting |
| starts_on | date | CURRENT_DATE | NOT NULL | First date this template applies |
| ends_on | date | NULL | CHECK (ends_on IS NULL OR ends_on >= starts_on) | NULL = no end date |
| created_at | timestamptz | now() | NOT NULL | |
| updated_at | timestamptz | now() | NOT NULL | |

**Indexes:**
- PK: `id`
- `idx_recurring_templates_user_active` → `(user_id) WHERE is_active = true`

**Recurrence logic:**
- `daily`: generates every day between starts_on and ends_on
- `weekdays`: generates Mon-Fri (days 1-5) only
- `weekly`: generates once per week (on the weekday of starts_on)
- `custom`: generates on specific days in recurrence_days[]

---

### 3. `task_instances`

Individual task occurrences. One row per task per day. Fully denormalized.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| id | uuid | gen_random_uuid() | PK | |
| user_id | uuid | | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| template_id | uuid | NULL | FK → recurring_templates(id) ON DELETE SET NULL | NULL = ad-hoc task |
| date | date | | NOT NULL | Which calendar day this instance belongs to |
| title | text | | NOT NULL, CHECK (char_length(title) > 0) | |
| description | text | NULL | | |
| category | text | | NOT NULL, CHECK (category IN ('college','dsa','ml-ai','projects','fitness','personal','teaching','other')) | |
| priority | text | 'normal' | NOT NULL, CHECK (priority IN ('low','normal','high','critical')) | |
| difficulty | text | 'medium' | NOT NULL, CHECK (difficulty IN ('easy','medium','hard','epic')) | |
| xp_reward | smallint | | NOT NULL, CHECK (xp_reward IN (10, 25, 50, 100)) | Frozen at creation time |
| estimated_minutes | smallint | NULL | CHECK (estimated_minutes > 0) | |
| due_time | time | NULL | | Local time |
| completed | boolean | false | NOT NULL | |
| completed_at | timestamptz | NULL | | Set by server-side complete_task() |
| carried_from_task_instance_id | uuid | NULL | FK → task_instances(id) ON DELETE SET NULL | Exact provenance |
| notes | text | NULL | | |
| created_at | timestamptz | now() | NOT NULL | |
| updated_at | timestamptz | now() | NOT NULL | |

**Indexes:**
- PK: `id`
- `idx_task_instances_user_date` → `(user_id, date)`
- `idx_task_instances_user_incomplete` → `(user_id, date) WHERE completed = false`
- `idx_task_instances_template_date` → `(template_id, date) WHERE template_id IS NOT NULL`

**Unique constraint:**
- `uq_task_instances_template_date` → UNIQUE `(template_id, date) WHERE template_id IS NOT NULL`

---

### 4. `xp_events`

**Authoritative audit trail** for all XP changes. `profiles.total_xp = COALESCE(SUM(xp_events.amount), 0)`.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| id | uuid | gen_random_uuid() | PK | |
| user_id | uuid | | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| task_instance_id | uuid | NULL | FK → task_instances(id) ON DELETE SET NULL | NULL for non-task XP |
| amount | smallint | | NOT NULL, CHECK (amount <> 0) | Positive = gain, negative = reversal |
| reason | text | | NOT NULL, CHECK (reason IN ('task_complete','task_undo','bonus','achievement','adjustment')) | |
| idempotency_key | text | NULL | | Prevents duplicate processing |
| created_at | timestamptz | now() | NOT NULL | |

**Indexes:**
- PK: `id`
- `idx_xp_events_user_created` → `(user_id, created_at DESC)`
- `uq_xp_events_idempotency` → UNIQUE `(idempotency_key) WHERE idempotency_key IS NOT NULL`
- `idx_xp_events_task` → `(task_instance_id) WHERE task_instance_id IS NOT NULL`

---

### 5. `daily_summaries`

**Derived cache only.** Rebuilt from task_instances.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| id | uuid | gen_random_uuid() | PK | |
| user_id | uuid | | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| date | date | | NOT NULL | |
| total_tasks | smallint | 0 | NOT NULL, CHECK (total_tasks >= 0) | |
| completed_tasks | smallint | 0 | NOT NULL, CHECK (completed_tasks >= 0) | |
| completion_percentage | smallint | 0 | NOT NULL, CHECK (completion_percentage BETWEEN 0 AND 100) | |
| xp_earned | integer | 0 | NOT NULL, CHECK (xp_earned >= 0) | |
| streak_day | smallint | 0 | NOT NULL, CHECK (streak_day >= 0) | |

**Indexes:**
- PK: `id`
- `uq_daily_summaries_user_date` → UNIQUE `(user_id, date)`

**Regeneration:**

```sql
INSERT INTO daily_summaries (user_id, date, total_tasks, completed_tasks, completion_percentage, xp_earned)
SELECT
  user_id, date,
  COUNT(*)::smallint,
  COUNT(*) FILTER (WHERE completed)::smallint,
  CASE WHEN COUNT(*) > 0
    THEN (100.0 * COUNT(*) FILTER (WHERE completed) / COUNT(*))::smallint
    ELSE 0
  END,
  COALESCE(SUM(xp_reward) FILTER (WHERE completed), 0)::integer
FROM task_instances
WHERE user_id = p_user_id AND date = p_date
GROUP BY user_id, date
ON CONFLICT (user_id, date)
DO UPDATE SET
  total_tasks = EXCLUDED.total_tasks,
  completed_tasks = EXCLUDED.completed_tasks,
  completion_percentage = EXCLUDED.completion_percentage,
  xp_earned = EXCLUDED.xp_earned;
```

---

### 6. `schedule_blocks`

User's recurring schedule configuration. Times in user's local timezone.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| id | uuid | gen_random_uuid() | PK | |
| user_id | uuid | | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| title | text | | NOT NULL, CHECK (char_length(title) > 0) | |
| type | text | | NOT NULL, CHECK (type IN ('college','teaching','dsa','ml-ai','projects','fitness','personal','free')) | |
| start_time | time | | NOT NULL | |
| end_time | time | | NOT NULL | |
| is_fixed | boolean | false | NOT NULL | |
| days_of_week | smallint[] | '{1,2,3,4,5,6,7}' | NOT NULL, CHECK (array_length(days_of_week, 1) > 0) | |
| is_active | boolean | true | NOT NULL | |
| created_at | timestamptz | now() | NOT NULL | |
| updated_at | timestamptz | now() | NOT NULL | |

**Note:** The `CHECK (end_time > start_time)` constraint from the previous version is **removed** because it breaks for overnight blocks (e.g. 23:00–01:00). Validation of non-zero duration is handled at the application level.

**Indexes:**
- PK: `id`
- `idx_schedule_blocks_user_active` → `(user_id) WHERE is_active = true`

---

### 7. `achievements`

Global definitions. Seeded by migrations. Read-only for clients.

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| id | text | | PK | e.g. 'first-steps' |
| title | text | | NOT NULL | |
| description | text | | NOT NULL | |
| icon | text | | NOT NULL | |
| criteria_type | text | | NOT NULL, CHECK (criteria_type IN ('streak','tasks_total','level','perfect_day','xp_total')) | |
| criteria_value | integer | | NOT NULL, CHECK (criteria_value > 0) | |
| sort_order | smallint | 0 | NOT NULL | |

**Indexes:**
- PK: `id`

---

### 8. `user_achievements`

| Column | Type | Default | Constraints | Notes |
|--------|------|---------|-------------|-------|
| user_id | uuid | | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| achievement_id | text | | NOT NULL, FK → achievements(id) ON DELETE CASCADE | |
| unlocked_at | timestamptz | now() | NOT NULL | |

**Indexes/Constraints:**
- PK: `(user_id, achievement_id)`

---

## Row Level Security Policies

All RLS policies use `(select auth.uid())` (wrapped in subselect for performance) and specify `TO authenticated`.

### `profiles`
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY profiles_update ON profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);
```

**Column protection** via BEFORE UPDATE trigger (see below).

### `recurring_templates`
```sql
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY rt_select ON recurring_templates FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY rt_insert ON recurring_templates FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY rt_update ON recurring_templates FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY rt_delete ON recurring_templates FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
```

### `task_instances`
```sql
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY ti_select ON task_instances FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY ti_insert ON task_instances FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY ti_update ON task_instances FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY ti_delete ON task_instances FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
```

**Column protection** for `completed`/`completed_at` via BEFORE UPDATE trigger.

### `xp_events`
```sql
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY xe_select ON xp_events FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
-- No INSERT/UPDATE/DELETE policies → client cannot write
```

### `daily_summaries`
```sql
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY ds_select ON daily_summaries FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
-- No INSERT/UPDATE/DELETE policies → client cannot write
```

### `schedule_blocks`
```sql
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY sb_select ON schedule_blocks FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY sb_insert ON schedule_blocks FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY sb_update ON schedule_blocks FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY sb_delete ON schedule_blocks FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
```

### `achievements`
```sql
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY ach_select ON achievements FOR SELECT TO authenticated
  USING (true);
-- No write policies → globally read-only
```

### `user_achievements`
```sql
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY ua_select ON user_achievements FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
-- No write policies → only server functions insert
```

---

## Table Grants

Explicit grants (do NOT rely on Supabase defaults alone):

```sql
-- Revoke default PUBLIC grants on all tables
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, public;

-- Grant per-table
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url, timezone, teaching_days, college_start, college_end, teaching_start, teaching_end, updated_at) ON profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_instances TO authenticated;
GRANT SELECT ON xp_events TO authenticated;
GRANT SELECT ON daily_summaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_blocks TO authenticated;
GRANT SELECT ON achievements TO authenticated;
GRANT SELECT ON user_achievements TO authenticated;

-- Service role gets full access (for SECURITY DEFINER functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
```

---

## Protection Triggers

### Profile Protection Trigger

Prevents client-side mutation of protected columns:

```sql
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- If called from a SECURITY DEFINER function, current_user will be the function owner
  -- (e.g. postgres). Only allow protected field changes from privileged contexts.
  IF current_user NOT IN ('postgres', 'supabase_admin') THEN
    NEW.total_xp := OLD.total_xp;
    NEW.level := OLD.level;
    NEW.current_streak := OLD.current_streak;
    NEW.longest_streak := OLD.longest_streak;
    NEW.tasks_completed_total := OLD.tasks_completed_total;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_fields();
```

### Task Completion Protection Trigger

Prevents client-side mutation of `completed`/`completed_at`:

```sql
CREATE OR REPLACE FUNCTION public.protect_task_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin') THEN
    NEW.completed := OLD.completed;
    NEW.completed_at := OLD.completed_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_task_completion
  BEFORE UPDATE ON task_instances
  FOR EACH ROW
  EXECUTE FUNCTION protect_task_completion();
```

---

## Secure Atomic Operations

### `complete_task(p_task_instance_id uuid, p_idempotency_key text)`

```sql
CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_instance_id uuid,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_task record;
  v_user_id uuid;
  v_new_xp integer;
  v_new_level integer;
  v_old_level integer;
  v_level_up boolean := false;
  v_new_achievements text[] := '{}';
BEGIN
  -- Resolve caller identity
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Validate ownership and state (row lock)
  SELECT id, user_id, xp_reward, completed, date
  INTO v_task
  FROM public.task_instances
  WHERE id = p_task_instance_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Task not owned by caller';
  END IF;

  IF v_task.completed THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_completed', true,
      'xp_awarded', 0
    );
  END IF;

  -- 2. Mark task completed (bypasses protection trigger because current_user = postgres)
  UPDATE public.task_instances
  SET completed = true,
      completed_at = now(),
      updated_at = now()
  WHERE id = p_task_instance_id;

  -- 3. Insert XP event with idempotency protection
  BEGIN
    INSERT INTO public.xp_events (user_id, task_instance_id, amount, reason, idempotency_key)
    VALUES (v_user_id, p_task_instance_id, v_task.xp_reward, 'task_complete', p_idempotency_key);
  EXCEPTION
    WHEN unique_violation THEN
      -- Idempotency key collision — already processed
      RETURN jsonb_build_object(
        'success', true,
        'already_completed', true,
        'xp_awarded', 0
      );
  END;

  -- 4. Update cached XP and level
  SELECT total_xp, level INTO v_new_xp, v_old_level
  FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  v_new_xp := v_new_xp + v_task.xp_reward;
  v_new_level := public.calculate_level(v_new_xp);
  v_level_up := v_new_level > v_old_level;

  UPDATE public.profiles
  SET total_xp = v_new_xp,
      level = v_new_level,
      tasks_completed_total = tasks_completed_total + 1,
      updated_at = now()
  WHERE id = v_user_id;

  -- 5. Evaluate achievements
  v_new_achievements := public.evaluate_achievements(v_user_id, v_new_xp, v_new_level);

  -- 6. Refresh daily summary
  PERFORM public.refresh_daily_summary(v_user_id, v_task.date);

  -- 7. Return result
  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false,
    'xp_awarded', v_task.xp_reward,
    'new_total_xp', v_new_xp,
    'new_level', v_new_level,
    'level_up', v_level_up,
    'new_achievements', to_jsonb(v_new_achievements)
  );
END;
$$;

-- Restrict execute permissions
REVOKE EXECUTE ON FUNCTION public.complete_task(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.complete_task(uuid, text) TO authenticated;
```

### `undo_complete_task(p_task_instance_id uuid)`

```sql
CREATE OR REPLACE FUNCTION public.undo_complete_task(
  p_task_instance_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_task record;
  v_user_id uuid;
  v_new_xp integer;
  v_new_level integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, user_id, xp_reward, completed, date
  INTO v_task
  FROM public.task_instances
  WHERE id = p_task_instance_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Task not owned by caller';
  END IF;

  IF NOT v_task.completed THEN
    RETURN jsonb_build_object('success', true, 'already_incomplete', true);
  END IF;

  -- Mark incomplete
  UPDATE public.task_instances
  SET completed = false, completed_at = NULL, updated_at = now()
  WHERE id = p_task_instance_id;

  -- Insert reversal XP event
  INSERT INTO public.xp_events (user_id, task_instance_id, amount, reason)
  VALUES (v_user_id, p_task_instance_id, -(v_task.xp_reward), 'task_undo');

  -- Recalculate XP
  SELECT COALESCE(SUM(amount), 0) INTO v_new_xp
  FROM public.xp_events WHERE user_id = v_user_id;

  v_new_level := public.calculate_level(v_new_xp);

  UPDATE public.profiles
  SET total_xp = v_new_xp,
      level = v_new_level,
      tasks_completed_total = GREATEST(tasks_completed_total - 1, 0),
      updated_at = now()
  WHERE id = v_user_id;

  PERFORM public.refresh_daily_summary(v_user_id, v_task.date);

  RETURN jsonb_build_object(
    'success', true,
    'xp_removed', v_task.xp_reward,
    'new_total_xp', v_new_xp,
    'new_level', v_new_level
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.undo_complete_task(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.undo_complete_task(uuid) TO authenticated;
```

### `calculate_level(p_xp integer) → integer`

```sql
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp integer)
RETURNS integer
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_xp >= 14200 THEN 15
    WHEN p_xp >= 11600 THEN 14
    WHEN p_xp >= 9400  THEN 13
    WHEN p_xp >= 7500  THEN 12
    WHEN p_xp >= 5900  THEN 11
    WHEN p_xp >= 4600  THEN 10
    WHEN p_xp >= 3500  THEN 9
    WHEN p_xp >= 2600  THEN 8
    WHEN p_xp >= 1900  THEN 7
    WHEN p_xp >= 1300  THEN 6
    WHEN p_xp >= 850   THEN 5
    WHEN p_xp >= 500   THEN 4
    WHEN p_xp >= 250   THEN 3
    WHEN p_xp >= 100   THEN 2
    ELSE 1
  END;
$$;
```

### `evaluate_achievements(p_user_id uuid, p_xp integer, p_level integer) → text[]`

```sql
CREATE OR REPLACE FUNCTION public.evaluate_achievements(
  p_user_id uuid,
  p_xp integer,
  p_level integer
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new text[] := '{}';
  v_ach record;
  v_stats record;
BEGIN
  -- Gather user stats
  SELECT current_streak, tasks_completed_total
  INTO v_stats
  FROM public.profiles WHERE id = p_user_id;

  FOR v_ach IN
    SELECT a.id, a.criteria_type, a.criteria_value
    FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    IF (v_ach.criteria_type = 'level' AND p_level >= v_ach.criteria_value)
       OR (v_ach.criteria_type = 'xp_total' AND p_xp >= v_ach.criteria_value)
       OR (v_ach.criteria_type = 'streak' AND v_stats.current_streak >= v_ach.criteria_value)
       OR (v_ach.criteria_type = 'tasks_total' AND v_stats.tasks_completed_total >= v_ach.criteria_value)
    THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_ach.id)
      ON CONFLICT DO NOTHING;
      v_new := array_append(v_new, v_ach.id);
    END IF;
  END LOOP;

  RETURN v_new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.evaluate_achievements(uuid, integer, integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.evaluate_achievements(uuid, integer, integer) TO service_role;
```

### `generate_daily_tasks(p_user_id uuid, p_date date)`

```sql
CREATE OR REPLACE FUNCTION public.generate_daily_tasks(
  p_user_id uuid,
  p_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid;
  v_day_of_week smallint;
  v_template record;
  v_count integer := 0;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL OR v_caller <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- ISO weekday: 1=Mon, 7=Sun
  v_day_of_week := EXTRACT(ISODOW FROM p_date)::smallint;

  FOR v_template IN
    SELECT * FROM public.recurring_templates
    WHERE user_id = p_user_id
      AND is_active = true
      AND starts_on <= p_date
      AND (ends_on IS NULL OR ends_on >= p_date)
  LOOP
    -- Check recurrence match
    IF v_template.recurrence_type = 'daily' THEN
      -- matches every day
    ELSIF v_template.recurrence_type = 'weekdays' AND v_day_of_week BETWEEN 1 AND 5 THEN
      -- matches
    ELSIF v_template.recurrence_type = 'weekly'
      AND EXTRACT(ISODOW FROM v_template.starts_on)::smallint = v_day_of_week THEN
      -- matches
    ELSIF v_template.recurrence_type = 'custom'
      AND v_template.recurrence_days IS NOT NULL
      AND v_day_of_week = ANY(v_template.recurrence_days) THEN
      -- matches
    ELSE
      CONTINUE;
    END IF;

    -- Insert (unique constraint prevents duplicates)
    BEGIN
      INSERT INTO public.task_instances (
        user_id, template_id, date, title, description,
        category, priority, difficulty, xp_reward,
        estimated_minutes, due_time
      ) VALUES (
        p_user_id, v_template.id, p_date, v_template.title, v_template.description,
        v_template.category, v_template.priority, v_template.difficulty, v_template.xp_reward,
        v_template.estimated_minutes, v_template.due_time
      );
      v_count := v_count + 1;
    EXCEPTION
      WHEN unique_violation THEN
        -- Already generated for this date, skip
        NULL;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_daily_tasks(uuid, date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.generate_daily_tasks(uuid, date) TO authenticated;
```

### `refresh_daily_summary(p_user_id uuid, p_date date)`

```sql
CREATE OR REPLACE FUNCTION public.refresh_daily_summary(
  p_user_id uuid,
  p_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.daily_summaries (user_id, date, total_tasks, completed_tasks, completion_percentage, xp_earned)
  SELECT
    p_user_id, p_date,
    COUNT(*)::smallint,
    COUNT(*) FILTER (WHERE completed)::smallint,
    CASE WHEN COUNT(*) > 0
      THEN (100.0 * COUNT(*) FILTER (WHERE completed) / COUNT(*))::smallint
      ELSE 0
    END,
    COALESCE(SUM(xp_reward) FILTER (WHERE completed), 0)::integer
  FROM public.task_instances
  WHERE user_id = p_user_id AND date = p_date
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_tasks = EXCLUDED.total_tasks,
    completed_tasks = EXCLUDED.completed_tasks,
    completion_percentage = EXCLUDED.completion_percentage,
    xp_earned = EXCLUDED.xp_earned;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_daily_summary(uuid, date) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.refresh_daily_summary(uuid, date) TO service_role;
```

### `handle_new_user()` — Profile creation trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Daily Rollover Strategy

Client-initiated:

1. Client detects new local day (visibility change or app open)
2. Client calls `rpc.generate_daily_tasks(user_id, today_local_date)`
3. Server generates instances from active recurring templates (idempotent via unique constraint)
4. Client refreshes today's task list

Streak calculation happens separately — can be triggered by the client calling a `refresh_streak` RPC or handled lazily when viewing stats.

---

## Carry-Forward Strategy

1. Client queries yesterday's incomplete tasks: `task_instances WHERE user_id = me AND date = yesterday AND completed = false`
2. User selects tasks to carry forward
3. Client INSERTs new `task_instances` with `carried_from_task_instance_id` = source UUID, `date` = today
4. RLS allows because `auth.uid() = user_id`
5. Deduplication: client checks `WHERE carried_from_task_instance_id = source_id` before inserting

---

## Migration Order

1. `001_create_profiles` — table + handle_new_user trigger
2. `002_create_recurring_templates` — depends on profiles
3. `003_create_task_instances` — depends on profiles, recurring_templates, self-reference
4. `004_create_xp_events` — depends on profiles, task_instances
5. `005_create_daily_summaries` — depends on profiles
6. `006_create_schedule_blocks` — depends on profiles
7. `007_create_achievements` — standalone
8. `008_create_user_achievements` — depends on profiles, achievements
9. `009_create_functions` — calculate_level, evaluate_achievements, refresh_daily_summary, complete_task, undo_complete_task, generate_daily_tasks
10. `010_create_rls_and_grants` — ENABLE RLS + policies + grants + revokes
11. `011_create_protection_triggers` — protect_profile_fields, protect_task_completion
12. `012_seed_achievements` — initial achievement data

---

## Security Summary

| Vector | Protection |
|--------|-----------|
| Client modifies total_xp | BEFORE UPDATE trigger resets to OLD value |
| Client modifies level | BEFORE UPDATE trigger resets to OLD value |
| Client marks task completed directly | BEFORE UPDATE trigger resets completed/completed_at |
| Client inserts xp_events | No INSERT RLS policy → denied |
| Client calls complete_task for another user's task | Function checks `v_task.user_id <> v_user_id` → exception |
| Double completion (retry) | Idempotency key unique constraint + already-completed check |
| Anon calls complete_task | EXECUTE revoked from anon |
| Anon calls generate_daily_tasks | EXECUTE revoked from anon |
| Client writes to daily_summaries | No INSERT/UPDATE/DELETE RLS policies → denied |
| Client writes to user_achievements | No write policies → denied |
| Client writes to achievements | No write policies → denied |
| SECURITY DEFINER function search_path injection | All functions use `SET search_path = ''` |
| Cross-user task access | RLS: `(select auth.uid()) = user_id` on all user-owned tables |
