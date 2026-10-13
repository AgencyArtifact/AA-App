// Stage 0 diagnostic: exercises sign-in and the SharePoint permission
// boundary with the signed-in user's delegated token.
//
// Principals data rule: the TestFees read requests item ids only
// ($select=id, no fields expansion), so no field value ever reaches the client.

import { config } from "../config";
import { getAuthStats, getHostInfo } from "../auth/graphAuth";
import type { GraphResult } from "../graph/graph";
import {
  countItems,
  createTestHoursItem,
  deleteTestHoursItem,
  getMe,
  lookupPersonId,
  resolveSiteId,
} from "../graph/sharepoint";
import { localDate, localTime } from "../dates";
import { classify, type DiagnosticReport, type StepResult } from "./report";

const sp = config.sharepoint;

function step(name: string, r: GraphResult<unknown>, detail = ""): StepResult {
  return { name, outcome: classify(r.status), httpStatus: r.status, graphCode: r.code, detail };
}

async function readStep(name: string, sitePath: string, listName: string): Promise<StepResult> {
  const site = await resolveSiteId(sitePath);
  if (!site.id) return step(name, site.result, "site lookup failed");
  const { count, result } = await countItems(site.id, listName);
  if (count === null) return step(name, result, "list read failed");
  return step(name, result, `items: ${count}`);
}

async function writeStep(upn: string): Promise<StepResult> {
  const name = `Operations write + delete (${sp.operations.lists.testHours})`;
  const site = await resolveSiteId(sp.operations.sitePath);
  if (!site.id) return step(name, site.result, "site lookup failed");

  const personId = await lookupPersonId(site.id, upn);
  const personNote = personId ? "Person set" : "Person NOT set (user not found in site user list)";
  const created = await createTestHoursItem(site.id, {
    title: "stage0-diagnostic",
    date: localDate(new Date()),
    hours: 0.5,
    personId,
  });
  if (!created.ok || !created.data) {
    return step(name, created, `create failed. ${personNote}`);
  }
  const itemId = created.data.id;
  const deleted = await deleteTestHoursItem(site.id, itemId);
  if (!deleted.ok) {
    return step(
      name,
      deleted,
      `created item ${itemId} (HTTP ${created.status}), delete FAILED; remove it by hand. ${personNote}`,
    );
  }
  return step(
    name,
    deleted,
    `created item ${itemId} (HTTP ${created.status}), deleted (HTTP ${deleted.status}). ${personNote}`,
  );
}

function timestamp(d: Date): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${d.toISOString()} (local ${localDate(d)} ${localTime(d)}, ${tz})`;
}

export async function runDiagnostic(): Promise<DiagnosticReport> {
  const report: DiagnosticReport = {
    timestamp: timestamp(new Date()),
    appUrl: window.location.href,
    user: "unknown",
    host: "unknown",
    authMode: "unknown",
    interactivePrompts: 0,
    lastSilentError: null,
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
      await readStep(
        `Operations read (${sp.operations.lists.testHours})`,
        sp.operations.sitePath,
        sp.operations.lists.testHours,
      ),
    );
    report.steps.push(await writeStep(me.data.userPrincipalName));
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
