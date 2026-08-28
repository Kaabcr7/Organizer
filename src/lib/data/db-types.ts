/**
 * Database TypeScript types
 * Originally generated from Supabase schema, now maintained manually.
 * These types define the Row/Insert/Update shapes used by repository interfaces.
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
