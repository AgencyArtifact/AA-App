// Stage 0 diagnostic: exercises sign-in, the SharePoint permission boundary
// and the own-items rule with the signed-in user's delegated token.
//
// Principals data rule: the TestFees read requests item ids only
// ($select=id, no fields expansion), so no field value ever reaches the client.
// TestHours is operational: its Date, WorkDate and Title values may be shown.

import { config } from "../config";
import { getAuthStats, getHostInfo } from "../auth/graphAuth";
import type { GraphResult } from "../graph/graph";
import {
  countItems,
  createTestHoursItem,
  deleteTestHoursItem,
  findRowByOtherUser,
  getMe,
  lookupPersonId,
  readTestHoursDates,
  resolveSiteId,
  updateTestHoursTitle,
  type Me,
} from "../graph/sharepoint";
import { deviceTimeZone, localDate, localTime, utcOffset } from "../dates";
import { classify, type DiagnosticReport, type StepResult } from "./report";

const sp = config.sharepoint;
const hoursList = sp.operations.lists.testHours;

// Appended to another user's row title during the edit test, then removed.
const EDIT_MARK = " [diag edit]";

let runCount = 0;

function step(name: string, r: GraphResult<unknown>, detail = ""): StepResult {
  return { name, outcome: classify(r.status), httpStatus: r.status, graphCode: r.code, detail };
}

function raw(value: unknown): string {
  return value === null || value === undefined ? "(empty)" : JSON.stringify(value);
}

async function readStep(name: string, sitePath: string, listName: string): Promise<StepResult> {
  const site = await resolveSiteId(sitePath);
  if (!site.id) return step(name, site.result, "site lookup failed");
  const { count, result } = await countItems(site.id, listName);
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
  me: Me,
  today: string,
): Promise<{ result: StepResult; writeAt: number }> {
  const name = `Operations write + delete (${hoursList})`;
  const personId = await lookupPersonId(siteId, me.userPrincipalName);
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
      : `read-back FAILED (HTTP ${back.status}${back.code ? ` ${back.code}` : ""})`,
  );

  const deleted = await deleteTestHoursItem(siteId, itemId);
  notes.push(
    deleted.ok
      ? `deleted (HTTP ${deleted.status})`
      : `delete FAILED (HTTP ${deleted.status}${deleted.code ? ` ${deleted.code}` : ""}); remove item ${itemId} by hand`,
  );
  notes.push(personNote);
  return { result: step(name, deleted, notes.join(". ")), writeAt };
}

/**
 * Edits the Title of a row created by another user, then restores it.
 * Team (Contribute) is expected DENIED; coordinators and principals PASS.
 */
async function editOtherStep(siteId: string, me: Me): Promise<StepResult> {
  const name = `Operations edit of another user's row (${hoursList})`;
  const found = await findRowByOtherUser(siteId, me);
  if (!found.result.ok) return step(name, found.result, "list read failed");
  if (!found.row) {
    return {
      name,
      outcome: "SKIPPED",
      httpStatus: 0,
      graphCode: null,
      detail: "no row created by another user exists; add one as another account and run again",
    };
  }
  const { id, createdBy } = found.row;
  // A previous run that failed to restore leaves the mark: restore to the unmarked title.
  const original = found.row.title.endsWith(EDIT_MARK)
    ? found.row.title.slice(0, -EDIT_MARK.length)
    : found.row.title;
  const target = `item ${id} by ${createdBy}`;

  const edited = await updateTestHoursTitle(siteId, id, original + EDIT_MARK);
  if (!edited.ok) return step(name, edited, `${target}: edit refused, nothing changed`);

  const restored = await updateTestHoursTitle(siteId, id, original);
  if (!restored.ok) {
    return {
      ...step(name, restored, `${target}: edit PASS (HTTP ${edited.status}), restore FAILED; set Title back to "${original}" by hand`),
      outcome: "ERROR",
    };
  }
  return step(name, edited, `${target}: edited (HTTP ${edited.status}), restored (HTTP ${restored.status})`);
}

function timestamp(d: Date): string {
  return `${d.toISOString()} (local ${localDate(d)} ${localTime(d)}, ${deviceTimeZone()})`;
}

export async function runDiagnostic(): Promise<DiagnosticReport> {
  runCount += 1;
  const now = new Date();
  const report: DiagnosticReport = {
    timestamp: timestamp(now),
    appUrl: window.location.href,
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

    report.steps.push(
      await readStep(`Operations read (${hoursList})`, sp.operations.sitePath, hoursList),
    );

    const ops = await resolveSiteId(sp.operations.sitePath);
    if (ops.id) {
      const write = await writeStep(ops.id, me.data, report.localToday);
      report.writeElapsedMs = write.writeAt;
      report.steps.push(write.result);
      report.steps.push(await editOtherStep(ops.id, me.data));
    } else {
      report.steps.push(step(`Operations write + delete (${hoursList})`, ops.result, "site lookup failed"));
    }

    report.steps.push(
      await readStep(
        `Principals read (${sp.principals.lists.testFees})`,
        sp.principals.sitePath,
        sp.principals.lists.testFees,
      ),
    );
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
