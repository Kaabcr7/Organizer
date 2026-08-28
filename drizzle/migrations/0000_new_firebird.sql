CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"tasks_total" integer DEFAULT 0 NOT NULL,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_completed_non_negative" CHECK ("daily_summaries"."tasks_completed" >= 0),
	CONSTRAINT "tasks_total_positive" CHECK ("daily_summaries"."tasks_total" > 0),
	CONSTRAINT "completion_percentage_valid" CHECK ("daily_summaries"."completion_percentage" >= 0 AND "daily_summaries"."completion_percentage" <= 100),
	CONSTRAINT "xp_earned_non_negative" CHECK ("daily_summaries"."xp_earned" >= 0)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"tasks_completed_total" integer DEFAULT 0 NOT NULL,
	"teaching_days" text DEFAULT '[1,3,5]' NOT NULL,
	"college_start" time DEFAULT '09:00' NOT NULL,
	"college_end" time DEFAULT '17:00' NOT NULL,
	"teaching_start" time DEFAULT '17:30' NOT NULL,
	"teaching_end" time DEFAULT '21:30' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "total_xp_positive" CHECK ("profiles"."total_xp" >= 0),
	CONSTRAINT "level_positive" CHECK ("profiles"."level" >= 1),
	CONSTRAINT "streak_positive" CHECK ("profiles"."current_streak" >= 0),
	CONSTRAINT "longest_streak_positive" CHECK ("profiles"."longest_streak" >= 0),
	CONSTRAINT "tasks_completed_positive" CHECK ("profiles"."tasks_completed_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "recurring_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"xp_reward" smallint NOT NULL,
	"estimated_minutes" smallint,
	"due_time" time,
	"recurrence_type" text DEFAULT 'daily' NOT NULL,
	"recurrence_days" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_on" date DEFAULT now() NOT NULL,
	"ends_on" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "title_not_empty" CHECK (char_length("recurring_templates"."title") > 0),
	CONSTRAINT "xp_reward_valid" CHECK ("recurring_templates"."xp_reward" IN (10, 25, 50, 100)),
	CONSTRAINT "estimated_minutes_positive" CHECK ("recurring_templates"."estimated_minutes" > 0),
	CONSTRAINT "ends_on_after_starts" CHECK ("recurring_templates"."ends_on" IS NULL OR "recurring_templates"."ends_on" >= "recurring_templates"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "schedule_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"recurrence_days" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "title_not_empty" CHECK (char_length("schedule_blocks"."title") > 0)
);
--> statement-breakpoint
CREATE TABLE "task_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid,
	"date" date NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"xp_reward" smallint NOT NULL,
	"estimated_minutes" smallint,
	"due_time" time,
	"notes" text,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"carried_from_task_instance_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "title_not_empty" CHECK (char_length("task_instances"."title") > 0),
	CONSTRAINT "xp_reward_valid" CHECK ("task_instances"."xp_reward" IN (10, 25, 50, 100)),
	CONSTRAINT "estimated_minutes_positive" CHECK ("task_instances"."estimated_minutes" > 0),
	CONSTRAINT "completed_at_only_when_completed" CHECK (("task_instances"."completed" = false AND "task_instances"."completed_at" IS NULL) OR ("task_instances"."completed" = true AND "task_instances"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" smallint NOT NULL,
	"reason" text NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_templates" ADD CONSTRAINT "recurring_templates_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_template_id_recurring_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."recurring_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_summaries_user_date" ON "daily_summaries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_recurring_templates_user_active" ON "recurring_templates" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_schedule_blocks_user_active" ON "schedule_blocks" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_task_instances_user_date" ON "task_instances" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_task_instances_user_completed" ON "task_instances" USING btree ("user_id","completed");--> statement-breakpoint
CREATE INDEX "idx_task_instances_template_id" ON "task_instances" USING btree ("template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_achievements_unique" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_xp_events_idempotency" ON "xp_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_xp_events_user_id" ON "xp_events" USING btree ("user_id");