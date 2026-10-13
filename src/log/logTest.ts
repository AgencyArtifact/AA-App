// Pure helpers for the #/log phone test screen. No I/O.

/** Timecard rule: hours move in half-hour steps. */
export const STEP_HOURS = 0.5;
export const MAX_HOURS = 24;

/** One stepper press: +1 or -1 half hour, kept within 0..24 and on the half-hour grid. */
export function stepHours(current: number, direction: 1 | -1): number {
  const snapped = Math.round(current / STEP_HOURS) * STEP_HOURS;
  const next = snapped + direction * STEP_HOURS;
  return Math.min(MAX_HOURS, Math.max(0, next));
}

/** "0:30", "1:00", "7:30". */
export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** Milliseconds as seconds with one decimal: "12.3 s". */
export function formatSeconds(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(1)} s`;
}
