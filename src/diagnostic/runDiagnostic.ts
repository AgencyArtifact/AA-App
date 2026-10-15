// Stage 1 diagnostic: sign-in, host, time zone and the Planner lines; with
// { harvest: true } (from a click), the Harvest lines too
// (docs/stages/stage-1-feasibility.md, T3).
//
// Money rule (CLAUDE.md, financial boundary): a step may report whether a
// money field is present, never its value.

import { getAuthStats, getHostInfo } from "../auth/graphAuth";
import type { GraphResult } from "../graph/graph";
import { getMe } from "../graph/me";
import { deviceTimeZone, localDate, localTime, utcOffset } from "../dates";
import { ensureHarvest, runHarvestSteps } from "./harvestSteps";
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
  /** Connect Harvest (popup, needs a click) and run the Harvest lines. */
  harvest: boolean;
  /** Complete and reset the Planner test task. Only from a click, so every write shows in a report someone sees. */
  plannerWrite?: boolean;
  /** Leave the Planner test task completed instead of resetting it to 0%. */
  keepPlannerCompleted?: boolean;
}

export async function runDiagnostic(options: RunOptions = { harvest: false }): Promise<DiagnosticReport> {
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
  let harvestConnectError: string | null = null;
  try {
    host = await getHostInfo();
    report.host = host.inTeams
      ? `${host.hostName} ${host.clientType} (NAA recommended: ${host.naaRecommended})`
      : "plain browser (not in Teams)";
    // The Harvest popup opens before the Graph calls, while the click still counts.
    if (options.harvest) harvestConnectError = await ensureHarvest(host.inTeams);
  } catch (error) {
    fatal(error);
  }

  // Graph and Harvest are independent: a Graph failure does not hide the Harvest lines.
  if (host) {
    let graphUpn: string | null = null;
    try {
      const me = await getMe();
      report.steps.push(step("Sign-in (Graph /me)", me));
      if (me.ok && me.data) {
        report.user = `${me.data.displayName} <${me.data.userPrincipalName}>`;
        graphUpn = me.data.userPrincipalName;
      }
      if (me.ok) report.steps.push(...(await runPlannerSteps({ write: options.plannerWrite ?? false, reset: !options.keepPlannerCompleted })));
    } catch (error) {
      fatal(error);
    }

    if (options.harvest) {
      const h = await runHarvestSteps(harvestConnectError, graphUpn);
      report.steps.push(...h.steps);
      // performance.now() counts from page load: the cold-start timing of criterion 6.
      if (h.writePassedAt !== null) report.writeElapsedMs = Math.round(h.writePassedAt);
    }
  }

  const stats = getAuthStats();
  report.authMode = stats.mode ?? "not initialised";
  report.interactivePrompts = stats.interactivePrompts;
  report.lastSilentError = stats.lastSilentError;
  return report;
}
