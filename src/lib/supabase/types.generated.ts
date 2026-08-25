/**
 * Auto-generated TypeScript types for Supabase schema
 * Generated from the database schema defined in Phase 3A
 * 
 * Run: npx supabase gen types typescript --local > src/lib/supabase/types.generated.ts
 */

/* eslint-disable @typescript-eslint/no-empty-object-type */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          timezone: string;
          total_xp: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          tasks_completed_total: number;
          teaching_days: number[];
          college_start: string;
          college_end: string;
          teaching_start: string;
          teaching_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          timezone?: string;
          total_xp?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          tasks_completed_total?: number;
          teaching_days?: number[];
          college_start?: string;
          college_end?: string;
          teaching_start?: string;
          teaching_end?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          timezone?: string;
          total_xp?: number;
          level?: number;
          current_streak?: number;
          longest_streak?: number;
          tasks_completed_total?: number;
          teaching_days?: number[];
          college_start?: string;
          college_end?: string;
          teaching_start?: string;
          teaching_end?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurring_templates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          priority: string;
          difficulty: string;
          xp_reward: number;
          estimated_minutes: number | null;
          due_time: string | null;
          recurrence_type: string;
          recurrence_days: number[] | null;
          is_active: boolean;
          starts_on: string;
          ends_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          priority?: string;
          difficulty?: string;
          xp_reward: number;
          estimated_minutes?: number | null;
          due_time?: string | null;
          recurrence_type?: string;
          recurrence_days?: number[] | null;
          is_active?: boolean;
          starts_on?: string;
          ends_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          priority?: string;
          difficulty?: string;
          xp_reward?: number;
          estimated_minutes?: number | null;
          due_time?: string | null;
          recurrence_type?: string;
          recurrence_days?: number[] | null;
          is_active?: boolean;
          starts_on?: string;
          ends_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_templates_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      task_instances: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          date: string;
          title: string;
          description: string | null;
          category: string;
          priority: string;
          difficulty: string;
          xp_reward: number;
          estimated_minutes: number | null;
          due_time: string | null;
          completed: boolean;
          completed_at: string | null;
          carried_from_task_instance_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          date: string;
          title: string;
          description?: string | null;
          category: string;
          priority?: string;
          difficulty?: string;
          xp_reward: number;
          estimated_minutes?: number | null;
          due_time?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          carried_from_task_instance_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          date?: string;
          title?: string;
          description?: string | null;
          category?: string;
          priority?: string;
          difficulty?: string;
          xp_reward?: number;
          estimated_minutes?: number | null;
          due_time?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          carried_from_task_instance_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_instances_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_instances_template_id_fk";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "recurring_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_instances_carried_from_fk";
            columns: ["carried_from_task_instance_id"];
            isOneToOne: false;
            referencedRelation: "task_instances";
            referencedColumns: ["id"];
          }
        ];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          task_instance_id: string | null;
          amount: number;
          reason: string;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_instance_id?: string | null;
          amount: number;
          reason: string;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_instance_id?: string | null;
          amount?: number;
          reason?: string;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "xp_events_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "xp_events_task_instance_id_fk";
            columns: ["task_instance_id"];
            isOneToOne: false;
            referencedRelation: "task_instances";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_summaries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          total_tasks: number;
          completed_tasks: number;
          completion_percentage: number;
          xp_earned: number;
          streak_day: number;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          total_tasks?: number;
          completed_tasks?: number;
          completion_percentage?: number;
          xp_earned?: number;
          streak_day?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          total_tasks?: number;
          completed_tasks?: number;
          completion_percentage?: number;
          xp_earned?: number;
          streak_day?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_summaries_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      schedule_blocks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: string;
          start_time: string;
          end_time: string;
          is_fixed: boolean;
          days_of_week: number[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type: string;
          start_time: string;
          end_time: string;
          is_fixed?: boolean;
          days_of_week?: number[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: string;
          start_time?: string;
          end_time?: string;
          is_fixed?: boolean;
          days_of_week?: number[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      achievements: {
        Row: {
          id: string;
          title: string;
          description: string;
          icon: string;
          criteria_type: string;
          criteria_value: number;
          sort_order: number;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          icon: string;
          criteria_type: string;
          criteria_value: number;
          sort_order?: number;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          icon?: string;
          criteria_type?: string;
          criteria_value?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fk";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      complete_task: {
        Args: {
          p_task_instance_id: string;
          p_idempotency_key?: string;
        };
        Returns: Json;
      };
      undo_complete_task: {
        Args: {
          p_task_instance_id: string;
        };
        Returns: Json;
      };
      calculate_level: {
        Args: {
          p_xp: number;
        };
        Returns: number;
      };
      evaluate_achievements: {
        Args: {
          p_user_id: string;
          p_xp: number;
          p_level: number;
        };
        Returns: string[];
      };
      refresh_daily_summary: {
        Args: {
          p_user_id: string;
          p_date: string;
        };
        Returns: undefined;
      };
      generate_daily_tasks: {
        Args: {
          p_user_id: string;
          p_date: string;
        };
        Returns: number;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
