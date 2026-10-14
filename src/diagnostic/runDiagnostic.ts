// Stage 1 diagnostic: sign-in, host and time zone. The Harvest and Planner
// steps are added in stage 1 T3 (docs/stages/stage-1-feasibility.md).
//
// Money rule (CLAUDE.md, financial boundary): a step may report whether a
// money field is present, never its value.

import { getAuthStats, getHostInfo } from "../auth/graphAuth";
import type { GraphResult } from "../graph/graph";
import { getMe } from "../graph/me";
import { deviceTimeZone, localDate, localTime, utcOffset } from "../dates";
import { classify, type DiagnosticReport, type StepResult } from "./report";

let runCount = 0;

function step(name: string, r: GraphResult<unknown>, detail = ""): StepResult {
  return { name, outcome: classify(r.status), httpStatus: r.status, graphCode: r.code, detail };
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
