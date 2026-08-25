export type ScheduleBlockType =
  | "college"
  | "teaching"
  | "dsa"
  | "ml-ai"
  | "projects"
  | "fitness"
  | "personal"
  | "free";

export interface ScheduleBlock {
  id: string;
  title: string;
  type: ScheduleBlockType;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isFixed: boolean;
  dayOfWeek?: number; // 0=Sunday, 1=Monday, etc.
}

export interface DaySchedule {
  date: string;
  isTeachingDay: boolean;
  blocks: ScheduleBlock[];
}
