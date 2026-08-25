/**
 * Get a greeting based on the current time.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

/**
 * Format today's date in a readable way.
 */
export function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
