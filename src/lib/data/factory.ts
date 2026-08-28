/**
 * Repository factory - provides access to all repositories
 * Uses Drizzle ORM repositories connected to Neon PostgreSQL
 */

import type { IRepositoryFactory } from "./repositories";
import {
  DrizzleProfileRepository,
  DrizzleTaskRepository,
  DrizzleRecurringTemplateRepository,
  DrizzleScheduleRepository,
  DrizzleHistoryRepository,
  DrizzleAchievementRepository,
} from "./drizzle-repositories";

let factory: IRepositoryFactory | null = null;

/**
 * Get the global repository factory instance
 */
export function getRepositoryFactory(): IRepositoryFactory {
  if (!factory) {
    factory = {
      profiles: new DrizzleProfileRepository(),
      tasks: new DrizzleTaskRepository(),
      recurringTemplates: new DrizzleRecurringTemplateRepository(),
      schedule: new DrizzleScheduleRepository(),
      history: new DrizzleHistoryRepository(),
      achievements: new DrizzleAchievementRepository(),
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
    profiles: new DrizzleProfileRepository(),
    tasks: new DrizzleTaskRepository(),
    recurringTemplates: new DrizzleRecurringTemplateRepository(),
    schedule: new DrizzleScheduleRepository(),
    history: new DrizzleHistoryRepository(),
    achievements: new DrizzleAchievementRepository(),
  };
}
