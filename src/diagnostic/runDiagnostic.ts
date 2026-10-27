// Diagnostic: sign-in, host, time zone and the Planner lines. The stage 1
// Harvest lines were removed 2026-10-27 (the app never calls Harvest; AA-Ops
// decision 15 and invariant 8). Kept until T8 passes (AA-Ops architecture/app.md).
//
// Money rule (CLAUDE.md, financial boundary): a step may report whether a
// money field is present, never its value.

import { getAuthStats, getHostInfo } from "../auth/graphAuth";
import type { GraphResult } from "../graph/graph";
import { getMe } from "../graph/me";
import { deviceTimeZone, localDate, localTime, utcOffset } from "../dates";
import { runPlannerSteps } from "./plannerSteps";
import { classify, type DiagnosticReport, type StepResult } from "./report";

let runCount = 0;

function step(name: string, r: GraphResult<unknown>, detail = ""): StepResult {
  return { name, outcome: classify(r.status), httpStatus: r.status, graphCode: r.code, detail };
}

function timestamp(d: Date): string {
  return `${d.toISOString()} (local ${localDate(d)} ${localTime(d)}, ${deviceTimeZone()})`;
}

export interface RunOptions {
  /** Complete and reset the Planner test task. Only from a click, so every write shows in a report someone sees. */
  plannerWrite?: boolean;
  /** Leave the Planner test task completed instead of resetting it to 0%. */
  keepPlannerCompleted?: boolean;
}

export async function runDiagnostic(options: RunOptions = {}): Promise<DiagnosticReport> {
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

  const fatal = (error: unknown) => {
    const e = error as { errorCode?: string; message?: string };
    // MSAL messages already start with the error code.
    const message = e.message || e.errorCode || String(error);
    report.fatalError = report.fatalError ? `${report.fatalError}; ${message}` : message;
  };

  let host: Awaited<ReturnType<typeof getHostInfo>> | null = null;
  try {
    host = await getHostInfo();
    report.host = host.inTeams
      ? `${host.hostName} ${host.clientType} (NAA recommended: ${host.naaRecommended})`
      : "plain browser (not in Teams)";
  } catch (error) {
    fatal(error);
  }

  if (host) {
    try {
      const me = await getMe();
      report.steps.push(step("Sign-in (Graph /me)", me));
      if (me.ok && me.data) {
        report.user = `${me.data.displayName} <${me.data.userPrincipalName}>`;
      }
      if (me.ok) report.steps.push(...(await runPlannerSteps({ write: options.plannerWrite ?? false, reset: !options.keepPlannerCompleted })));
    } catch (error) {
      fatal(error);
    }
  }

  const stats = getAuthStats();
  report.authMode = stats.mode ?? "not initialised";
  report.interactivePrompts = stats.interactivePrompts;
  report.lastSilentError = stats.lastSilentError;
  return report;
}
