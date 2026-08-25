import type { ScheduleBlock } from "@/types/schedule";

/**
 * Get the current time block from the schedule, or null if between blocks.
 */
export function getCurrentBlock(blocks: ScheduleBlock[]): ScheduleBlock | null {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  return (
    blocks.find(
      (block) => currentTime >= block.startTime && currentTime < block.endTime
    ) ?? null
  );
}

/**
 * Get the next upcoming block from the schedule.
 */
export function getNextBlock(blocks: ScheduleBlock[]): ScheduleBlock | null {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const upcoming = blocks
    .filter((block) => block.startTime > currentTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return upcoming[0] ?? null;
}

/**
 * Format a time string (HH:MM) to a readable 12-hour format.
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Get duration in minutes between two HH:MM times.
 */
export function getBlockDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}
