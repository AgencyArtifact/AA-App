// Pure helpers for the stage 0 diagnostic: which TestHours rows the edit and
// delete tests use. No I/O.

import type { HoursRow } from "../graph/sharepoint";

export interface Self {
  id: string; // Entra object id
  userPrincipalName: string;
}

// Each run keeps one row with this title, created by the signed-in user and
// dated 2026-01-01 (never "today", so it cannot silence the reminder flow).
// The other account's run tries to delete it.
export const DELETE_TARGET_TITLE = "stage0-delete-target";
export const DELETE_TARGET_DATE = "2026-01-01";

/** True if the row was created by the signed-in user (Entra id, else email against UPN). */
export function isMine(row: HoursRow, me: Self): boolean {
  const c = row.createdBy;
  if (!c) return false;
  if (c.id !== undefined && c.id === me.id) return true;
  return c.email !== undefined && c.email.toLowerCase() === me.userPrincipalName.toLowerCase();
}

function byOther(rows: HoursRow[], me: Self): HoursRow[] {
  return rows.filter((r) => r.createdBy !== null && !isMine(r, me));
}

/** Row for the edit test: another user's row, preferring one that is not a delete target. */
export function pickEditTarget(rows: HoursRow[], me: Self): HoursRow | null {
  const others = byOther(rows, me);
  return others.find((r) => r.title !== DELETE_TARGET_TITLE) ?? others[0] ?? null;
}

/** Row for the delete test: another user's delete target. */
export function pickDeleteTarget(rows: HoursRow[], me: Self): HoursRow | null {
  return byOther(rows, me).find((r) => r.title === DELETE_TARGET_TITLE) ?? null;
}

/** The signed-in user's own delete target, if one exists. */
export function ownDeleteTarget(rows: HoursRow[], me: Self): HoursRow | null {
  return rows.find((r) => r.title === DELETE_TARGET_TITLE && isMine(r, me)) ?? null;
}

export function creatorName(row: HoursRow): string {
  const c = row.createdBy;
  return c?.displayName || c?.email || c?.id || "unknown";
}

/** Search hits whose address is inside the given site path, e.g. "/sites/AAPrincipals". */
export function hitsInSite(webUrls: (string | undefined)[], sitePath: string): number {
  const needle = `${sitePath.toLowerCase()}/`;
  return webUrls.filter((u) => u !== undefined && u.toLowerCase().includes(needle)).length;
}
