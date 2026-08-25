/**
 * Helper utilities for Supabase operations
 */

export type SupabaseError = {
  code?: string;
  message: string;
  details?: unknown;
};

export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    error !== null &&
    typeof error === "object" &&
    ("message" in error || "code" in error)
  );
}

export function formatSupabaseError(error: unknown): string {
  if (isSupabaseError(error)) {
    return error.message || "An error occurred";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Convert Supabase timestamp strings to JavaScript Date objects
 */
export function parseTimestamp(ts: string | null | undefined): Date | null {
  if (!ts) return null;
  try {
    return new Date(ts);
  } catch {
    return null;
  }
}

/**
 * Format Date as YYYY-MM-DD for database operations
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get today's date in the user's timezone (for display/queries)
 * @param timezone IANA timezone string (e.g., 'Asia/Kolkata')
 */
export function getTodayInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Convert 24-hour time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to 24-hour time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
