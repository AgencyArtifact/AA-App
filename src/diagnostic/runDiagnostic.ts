// Stage 0 diagnostic: exercises sign-in, the SharePoint permission boundary
// and the own-items rule with the signed-in user's delegated token.
//
// Principals data rule: every TestFees request asks for ids only ($select=id,
// no fields expansion), and the search step keeps only hit counts and
// addresses, so no field value is ever shown, stored or logged.
// TestHours is operational: its Date, WorkDate and Title values may be shown.

import { config } from "../config";
import { getAuthStats, getHostInfo } from "../auth/graphAuth";
import type { GraphResult } from "../graph/graph";
import {
  countAt,
  countItems,
  createTestHoursItem,
  deleteTestHoursItem,
  getListId,
  getMe,
  listItemsById,
  listItemsByPath,
  listTestHoursRows,
  lookupPersonId,
  readTestHoursDates,
  resolveSiteId,
  searchListItems,
  updateTestHoursTitle,
  type HoursRow,
  type Me,
} from "../graph/sharepoint";
import { deviceTimeZone, localDate, localTime, utcOffset } from "../dates";
import { classify, type DiagnosticReport, type StepResult } from "./report";
import {
  DELETE_TARGET_DATE,
  DELETE_TARGET_TITLE,
  creatorName,
  hitsInSite,
  ownDeleteTarget,
  pickDeleteTarget,
  pickEditTarget,
} from "./rows";

const sp = config.sharepoint;
const hoursList = sp.operations.lists.testHours;
const feesList = sp.principals.lists.testFees;

// Appended to another user's row title during the edit test, then removed.
const EDIT_MARK = " [diag edit]";

let runCount = 0;

function step(name: string, r: GraphResult<unknown>, detail = ""): StepResult {
  return { name, outcome: classify(r.status), httpStatus: r.status, graphCode: r.code, detail };
}

function skipped(name: string, detail: string): StepResult {
  return { name, outcome: "SKIPPED", httpStatus: 0, graphCode: null, detail };
}

function status(r: GraphResult<unknown>): string {
  return `HTTP ${r.status}${r.code ? ` ${r.code}` : ""}`;
}

function raw(value: unknown): string {
  return value === null || value === undefined ? "(empty)" : JSON.stringify(value);
}

async function readStep(name: string, siteId: string, listName: string): Promise<StepResult> {
  const { count, result } = await countItems(siteId, listName);
  if (count === null) return step(name, result, "list read failed");
  return step(name, result, `items: ${count}`);
}

/**
 * Writes one row with Date and WorkDate set to the device-local date, reads
 * both back raw, then deletes the row. Returns the step and the moment
 * (performance.now) the create call returned.
 */
async function writeStep(
  siteId: string,
  personId: string | null,
  today: string,
): Promise<{ result: StepResult; writeAt: number }> {
  const name = `Operations write + delete (${hoursList})`;
  const personNote = personId ? "Person set" : "Person NOT set (user not found in site user list)";
  const created = await createTestHoursItem(siteId, {
    title: "stage0-diagnostic",
    date: today,
    workDate: today,
    hours: 0.5,
    personId,
  });
  const writeAt = performance.now();
  if (!created.ok || !created.data) {
    return { result: step(name, created, `create failed. ${personNote}`), writeAt };
  }
  const itemId = created.data.id;
  const notes = [`created item ${itemId} (HTTP ${created.status})`, `written Date and WorkDate "${today}"`];

  const back = await readTestHoursDates(siteId, itemId);
  notes.push(
    back.ok && back.data
      ? `Graph returns Date ${raw(back.data.date)}, WorkDate ${raw(back.data.workDate)}`
      : `read-back FAILED (${status(back)})`,
  );

  const deleted = await deleteTestHoursItem(siteId, itemId);
  notes.push(
    deleted.ok ? `deleted (HTTP ${deleted.status})` : `delete FAILED (${status(deleted)}); remove item ${itemId} by hand`,
  );
  notes.push(personNote);
  return { result: step(name, deleted, notes.join(". ")), writeAt };
}

/**
 * Edits the Title of a row created by another user, then restores it.
 * Team (Contribute) is expected DENIED; coordinators and principals PASS.
 */
async function editOtherStep(siteId: string, row: HoursRow | null): Promise<StepResult> {
  const name = `Operations edit of another user's row (${hoursList})`;
  if (!row) return skipped(name, "no row created by another user exists; run the diagnostic once as the other account");
  // A previous run that failed to restore leaves the mark: restore to the unmarked title.
  const original = row.title.endsWith(EDIT_MARK) ? row.title.slice(0, -EDIT_MARK.length) : row.title;
  const target = `item ${row.id} by ${creatorName(row)}`;

  const edited = await updateTestHoursTitle(siteId, row.id, original + EDIT_MARK);
  if (!edited.ok) return step(name, edited, `${target}: edit refused, nothing changed`);

  const restored = await updateTestHoursTitle(siteId, row.id, original);
  if (!restored.ok) {
    return {
      ...step(name, restored, `${target}: edit PASS (HTTP ${edited.status}), restore FAILED; set Title back to "${original}" by hand`),
      outcome: "ERROR",
    };
  }
  return step(name, edited, `${target}: edited (HTTP ${edited.status}), restored (HTTP ${restored.status})`);
}

/**
 * Deletes the other account's delete-target row, then makes sure the
 * signed-in user has one for the other account's next run.
 * Team (Contribute) is expected DENIED; coordinators and principals PASS.
 */
async function deleteOtherStep(
  siteId: string,
  rows: HoursRow[],
  me: Me,
  personId: string | null,
): Promise<StepResult> {
  const name = `Operations delete of another user's row (${hoursList})`;

  let own = `own "${DELETE_TARGET_TITLE}" for the other account: `;
  const mine = ownDeleteTarget(rows, me);
  if (mine) {
    own += `item ${mine.id}, kept`;
  } else {
    const created = await createTestHoursItem(siteId, {
      title: DELETE_TARGET_TITLE,
      date: DELETE_TARGET_DATE,
      workDate: DELETE_TARGET_DATE,
      hours: 0.5,
      personId,
    });
    own += created.ok && created.data ? `created item ${created.data.id}` : `create FAILED (${status(created)})`;
  }

  const target = pickDeleteTarget(rows, me);
  if (!target) {
    return skipped(name, `no "${DELETE_TARGET_TITLE}" row by another user yet; run the diagnostic once as the other account, then again here. ${own}`);
  }
  const deleted = await deleteTestHoursItem(siteId, target.id);
  const what = `item ${target.id} by ${creatorName(target)}`;
  return step(
    name,
    deleted,
    `${deleted.ok ? `${what}: deleted (HTTP ${deleted.status})` : `${what}: delete refused, row kept`}. ${own}`,
  );
}

/** Every route to TestFees on AA Principals. Ids and counts only. */
async function principalsSteps(): Promise<StepResult[]> {
  const steps: StepResult[] = [];

  // Route 1: site by path.
  const site = await resolveSiteId(sp.principals.sitePath);
  let siteId: string | null = site.id;
  let listId: string | null = null;
  let detail = "";
  if (site.id) {
    const list = await getListId(site.id, feesList);
    if (list.ok && list.data) listId = list.data.id;
    detail = `site id ${site.id}; ${feesList} list id ${listId ?? `not read (${status(list)})`}`;
  } else {
    detail = "site lookup refused";
  }
  steps.push(step(`Principals site lookup (by path)`, site.result, detail));

  // Route 2: list items by path, no site id needed.
  const byPath = await countAt(listItemsByPath(sp.principals.sitePath, feesList));
  steps.push(step(`Principals read (${feesList}, by path)`, byPath.result, byPath.count === null ? "list read refused" : `items: ${byPath.count}`));

  // Route 3: list items by site id and list name. Site id from route 1, else from config.
  siteId = siteId ?? (sp.principals.siteId || null);
  const byName = `Principals read (${feesList}, by site id)`;
  if (siteId) {
    steps.push(await readStep(byName, siteId, feesList));
  } else {
    steps.push(skipped(byName, "site id unknown: copy it from a principal's report into config.ts"));
  }

  // Route 4: list items by site id and list id. List id from route 1, else from config.
  listId = listId ?? (sp.principals.testFeesListId || null);
  const byId = `Principals read (${feesList}, by list id)`;
  if (siteId && listId) {
    const r = await countAt(listItemsById(siteId, listId));
    steps.push(step(byId, r.result, r.count === null ? "list read refused" : `items: ${r.count}`));
  } else {
    steps.push(skipped(byId, "list id unknown: copy it from a principal's report into config.ts"));
  }

  // Route 5: Microsoft Search for the distinctive word. 0 hits in the site = not visible.
  const searchName = `Principals search ("${sp.principals.searchWord}")`;
  const found = await searchListItems(sp.principals.searchWord);
  if (!found.ok || !found.data) {
    steps.push(step(searchName, found, "search failed"));
  } else {
    const inSite = hitsInSite(found.data.webUrls, sp.principals.sitePath);
    steps.push({
      name: searchName,
      outcome: inSite > 0 ? "PASS" : "DENIED",
      httpStatus: found.status,
      graphCode: null,
      detail: `hits: ${found.data.total}, inside AA Principals: ${inSite}${inSite > 0 ? " (visible)" : " (not visible)"}`,
    });
  }
  return steps;
}

function timestamp(d: Date): string {
  return `${d.toISOString()} (local ${localDate(d)} ${localTime(d)}, ${deviceTimeZone()})`;
}

export async function runDiagnostic(): Promise<DiagnosticReport> {
  runCount += 1;
  const now = new Date();
  const report: DiagnosticReport = {
    timestamp: timestamp(now),
    appUrl: `${window.location.href} (build ${__BUILD_TIME__})`,
    user: "unknown",
    host: "unknown",
    timeZone: `${deviceTimeZone()} (${utcOffset(now)})`,
    localToday: localDate(now),
    authMode: "unknown",
    interactivePrompts: 0,
    lastSilentError: null,
    writeElapsedMs: null,
    runNumber: runCount,
    fatalError: null,
    steps: [],
  };

  try {
    const host = await getHostInfo();
    report.host = host.inTeams
      ? `${host.hostName} ${host.clientType} (NAA recommended: ${host.naaRecommended})`
      : "plain browser (not in Teams)";

    const me = await getMe();
    report.steps.push(step("Sign-in (Graph /me)", me));
    if (!me.ok || !me.data) throw new Error("Graph /me failed; see step result.");
    report.user = `${me.data.displayName} <${me.data.userPrincipalName}>`;

    const ops = await resolveSiteId(sp.operations.sitePath);
    if (ops.id) {
      report.steps.push(await readStep(`Operations read (${hoursList})`, ops.id, hoursList));
      const personId = await lookupPersonId(ops.id, me.data.userPrincipalName);
      const write = await writeStep(ops.id, personId, report.localToday);
      report.writeElapsedMs = write.writeAt;
      report.steps.push(write.result);

      const listed = await listTestHoursRows(ops.id);
      if (listed.rows) {
        report.steps.push(await editOtherStep(ops.id, pickEditTarget(listed.rows, me.data)));
        report.steps.push(await deleteOtherStep(ops.id, listed.rows, me.data, personId));
      } else {
        report.steps.push(step(`Operations edit of another user's row (${hoursList})`, listed.result, "list read failed"));
      }
    } else {
      report.steps.push(step(`Operations read (${hoursList})`, ops.result, "site lookup failed"));
    }

    report.steps.push(...(await principalsSteps()));
  } catch (error) {
    const e = error as { errorCode?: string; message?: string };
    // MSAL messages already start with the error code.
    report.fatalError = e.message || e.errorCode || String(error);
  }

  const stats = getAuthStats();
  report.authMode = stats.mode ?? "not initialised";
  report.interactivePrompts = stats.interactivePrompts;
  report.lastSilentError = stats.lastSilentError;
  return report;
}
