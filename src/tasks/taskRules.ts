// Pure rules for the task list (slice 1). No I/O, no React.
// SOP: AA-Ops architecture/app.md. Tests: taskRules.test.ts (invented data only).

import { localDate } from "../dates";

/** Tasks whose title starts with this prefix are never shown or edited (decision 15). */
export const MILESTONE_PREFIX = "Milestone:";

/** A task as the screen shows it (AA-Ops CLAUDE.md, "Task as the app shows it", plus etag). */
export interface ShownTask {
  taskId: string;
  title: string;
  planId: string;
  planTitle: string;
  bucketId: string | null;
  bucketName: string;
  /** Due date as a local calendar day, YYYY-MM-DD, or null. */
  dueDate: string | null;
  complete: boolean;
  /** Completion as a local calendar day, YYYY-MM-DD, or null. */
  completedDate: string | null;
  /** Graph @odata.etag, needed for If-Match on updates. Kept in memory only. */
  etag: string;
}

/** The fields of a Graph plannerTask that the rules need. */
export interface TaskFacts {
  title: string;
  percentComplete: number;
  completedDateTime: string | null;
}

export function isMilestone(title: string): boolean {
  return title.trimStart().startsWith(MILESTONE_PREFIX);
}

/** Monday to Sunday of the week containing `today`, as local YYYY-MM-DD strings. */
export function weekBounds(today: Date): { start: string; end: string } {
  const day = today.getDay(); // 0 Sunday .. 6 Saturday
  const offsetToMonday = (day + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offsetToMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { start: localDate(monday), end: localDate(sunday) };
}

/** A Graph UTC timestamp as the device's local calendar day, or null. */
export function localDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : localDate(d);
}

/**
 * Slice 1 rule: show tasks assigned to me that are incomplete, or completed within
 * the current week Monday to Sunday in the device's time zone. Milestone tasks never.
 * (Placeholder rule until pilot step 2 settles "this week".)
 */
export function isShown(task: TaskFacts, today: Date): boolean {
  if (isMilestone(task.title)) return false;
  if (task.percentComplete < 100) return true;
  const completed = localDay(task.completedDateTime);
  if (!completed) return false;
  const { start, end } = weekBounds(today);
  return completed >= start && completed <= end;
}

/** Stable order for the list: incomplete first, then by due date (no due date last), then title. */
export function compareTasks(a: ShownTask, b: ShownTask): number {
  if (a.complete !== b.complete) return a.complete ? 1 : -1;
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.title.localeCompare(b.title);
}
