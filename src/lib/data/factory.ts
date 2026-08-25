/**
 * Repository factory - provides access to all repositories
 * Can be used in both browser and server contexts
 */

import type { IRepositoryFactory } from "./repositories";
import {
  SupabaseProfileRepository,
  SupabaseTaskRepository,
  SupabaseRecurringTemplateRepository,
  SupabaseScheduleRepository,
  SupabaseHistoryRepository,
  SupabaseAchievementRepository,
} from "./supabase-repositories";

let factory: IRepositoryFactory | null = null;

/**
 * Get the global repository factory instance
 */
export function getRepositoryFactory(): IRepositoryFactory {
  if (!factory) {
    factory = {
      profiles: new SupabaseProfileRepository(),
      tasks: new SupabaseTaskRepository(),
      recurringTemplates: new SupabaseRecurringTemplateRepository(),
      schedule: new SupabaseScheduleRepository(),
      history: new SupabaseHistoryRepository(),
      achievements: new SupabaseAchievementRepository(),
    };
  }
  return factory;
}

/**
 * Reset factory (mainly for testing)
 */
export function resetRepositoryFactory(): void {
  factory = null;
}

/**
 * Create a new factory instance (for testing with mocks)
 */
export function createRepositoryFactory(): IRepositoryFactory {
  return {
    profiles: new SupabaseProfileRepository(),
    tasks: new SupabaseTaskRepository(),
    recurringTemplates: new SupabaseRecurringTemplateRepository(),
    schedule: new SupabaseScheduleRepository(),
    history: new SupabaseHistoryRepository(),
    achievements: new SupabaseAchievementRepository(),
  };
}
