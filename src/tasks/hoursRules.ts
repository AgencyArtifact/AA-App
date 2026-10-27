// Pure rules for hours entry (slice 1, P3). No I/O, no React.
// SOP: AA-Ops architecture/app.md and architecture/hours-list.md.
// Tests: hoursRules.test.ts (invented data only).

import { isMilestone, type ShownTask } from "./taskRules";

/** Half-hour steps from 0.5 to 24 (AA-Ops CLAUDE.md, hours list row). */
export const HOURS_STEP = 0.5;
export const HOURS_MIN = 0.5;
export const HOURS_MAX = 24;

/** True when `hours` is a multiple of 0.5 between 0.5 and 24. Zero is never a row. */
export function isValidHours(hours: number): boolean {
  if (!Number.isFinite(hours)) return false;
  if (hours < HOURS_MIN || hours > HOURS_MAX) return false;
  // Multiples of 0.5 are exact in binary floating point, so this test is safe.
  return (hours * 2) % 1 === 0;
}

/** The stepper: one half hour up or down, never outside the range. */
export function stepHours(current: number, direction: 1 | -1): number {
  const next = Math.round((current + direction * HOURS_STEP) * 2) / 2;
  return Math.min(HOURS_MAX, Math.max(HOURS_MIN, next));
}

/** "1.0", "0.5", "12.5": one decimal, as the list and Harvest show it. */
export function formatHours(hours: number): string {
  return hours.toFixed(1);
}

/** What the rules need from `GET /me`. */
export interface MeFacts {
  mail?: string | null;
  userPrincipalName?: string | null;
}

/**
 * PersonEmail: the signed-in user's Microsoft 365 email, lower case, `mail` if
 * present, otherwise `userPrincipalName` (Blueprint, task_plan.md section 4).
 * Null when neither is present: no row can be written then.
 */
export function personEmail(me: MeFacts): string | null {
  const value = (me.mail || me.userPrincipalName || "").trim().toLowerCase();
  return value ? value : null;
}

/** Row key, the list's Title: email, work date and task ID joined by "|". */
export function rowKey(email: string, workDate: string, taskId: string): string {
  return `${email}|${workDate}|${taskId}`;
}

/** Fields the app writes on every save. The script owns the rest (hours-list.md, rule 3). */
export interface HoursRowFields {
  Title: string;
  PersonEmail: string;
  WorkDate: string;
  Hours: number;
  PlannerTaskId: string;
  TaskTitle: string;
  PlannerPlanId: string;
  PlanTitle: string;
  BucketName: string;
  ConfirmedAt: string;
  SyncStatus: "Pending";
}

export interface HoursEntry {
  task: ShownTask;
  email: string;
  /** The person's calendar day, YYYY-MM-DD. */
  workDate: string;
  hours: number;
  /** The confirm instant, UTC. */
  confirmedAt: Date;
}

/**
 * The fields of one AA Hours row for an entry, or a reason why no row may be
 * written. Every save sets SyncStatus to Pending (hours-list.md, rule 2).
 */
export function buildRowFields(entry: HoursEntry): { fields: HoursRowFields; error: null } | { fields: null; error: string } {
  if (isMilestone(entry.task.title)) return { fields: null, error: "Milestone tasks take no hours." };
  if (!isValidHours(entry.hours)) return { fields: null, error: `Hours must be a half-hour step from ${HOURS_MIN} to ${HOURS_MAX}.` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.workDate)) return { fields: null, error: "Work date must be YYYY-MM-DD." };
  if (!entry.email.includes("@")) return { fields: null, error: "No email for the signed-in user." };
  return {
    fields: {
      Title: rowKey(entry.email, entry.workDate, entry.task.taskId),
      PersonEmail: entry.email,
      WorkDate: entry.workDate,
      Hours: entry.hours,
      PlannerTaskId: entry.task.taskId,
      TaskTitle: entry.task.title,
      PlannerPlanId: entry.task.planId,
      PlanTitle: entry.task.planTitle,
      BucketName: entry.task.bucketName,
      ConfirmedAt: entry.confirmedAt.toISOString(),
      SyncStatus: "Pending",
    },
    error: null,
  };
}

/** OData string literal: single quotes doubled. The caller URL-encodes the result. */
export function odataString(value: string): string {
  return value.replace(/'/g, "''");
}
