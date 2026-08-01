export const LOADER_TRIAD = ["Imagine.", "Build.", "Inspire."] as const;

/**
 * Progress values at which each triad word arrives. The first is present from the
 * start so the loader never shows an empty line; the rest land as loading advances,
 * which is what makes the triad double as the progress indicator.
 */
export const TRIAD_THRESHOLDS = [0, 34, 68] as const;

/**
 * Greeting for the visitor's local hour. Deliberately not "Good day" everywhere —
 * brand-guidelines.md asks for human language, and someone arriving at 02:00 knows
 * they are up late.
 */
export function greetingForHour(hour: number): string {
  if (hour < 5) return "Still up.";
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  if (hour < 22) return "Good evening.";
  return "Working late.";
}

/** How many triad words should be visible at a given progress percentage. */
export function wordsRevealed(percent: number): number {
  return TRIAD_THRESHOLDS.filter((threshold) => percent >= threshold).length;
}
