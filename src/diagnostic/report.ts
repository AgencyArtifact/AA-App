// Pure functions for the stage 1 diagnostic: outcome classification and the
// plain-text report. No I/O.

// SKIPPED: the step could not be attempted (for example, no row by another
// user exists to edit). It is neither a pass nor a denial.
export type Outcome = "PASS" | "DENIED" | "ERROR" | "SKIPPED";

export interface StepResult {
  name: string;
  outcome: Outcome;
  // HTTP status of the deciding call; 0 = no response or no call made.
  httpStatus: number;
  graphCode: string | null;
  // Non-financial detail only (counts, item ids, operational values, notes).
  detail: string;
}

export interface DiagnosticReport {
  timestamp: string;
  appUrl: string;
  user: string;
  host: string;
  // Device IANA time zone and its UTC offset, e.g. "Asia/Kolkata (UTC+05:30)".
  timeZone: string;
  // The local date the app uses as "today", YYYY-MM-DD.
  localToday: string;
  authMode: string;
  interactivePrompts: number;
  lastSilentError: string | null;
  // Milliseconds from page load to a write result; always null since the stage 1 Harvest lines were removed.
  writeElapsedMs: number | null;
  // 1 for the run started when the screen opened; higher for "Run again".
  runNumber: number;
  fatalError: string | null;
  steps: StepResult[];
}

/** 2xx is PASS; 401 and 403 are DENIED; anything else (including 404 and no response) is ERROR. */
export function classify(httpStatus: number): Outcome {
  if (httpStatus >= 200 && httpStatus < 300) return "PASS";
  if (httpStatus === 401 || httpStatus === 403) return "DENIED";
  return "ERROR";
}

/** Milliseconds as seconds with one decimal: "12.3 s". */
export function formatElapsed(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(1)} s`;
}

export function formatReport(r: DiagnosticReport): string {
  const elapsed =
    r.writeElapsedMs === null
      ? "no write attempted"
      : `${formatElapsed(r.writeElapsedMs)} from page load (run ${r.runNumber}${r.runNumber === 1 ? ", first run" : ", not a cold start"})`;
  const lines: string[] = [
    "Agency Artifact - stage 1 diagnostic",
    `Time:        ${r.timestamp}`,
    `App URL:     ${r.appUrl}`,
    `User:        ${r.user}`,
    `Host:        ${r.host}`,
    `Time zone:   ${r.timeZone}`,
    `Local today: ${r.localToday}`,
    `Auth mode:   ${r.authMode}`,
    `Prompts:     ${r.interactivePrompts}${r.lastSilentError ? ` (silent failed: ${r.lastSilentError})` : ""}`,
    `Write:       ${elapsed}`,
  ];
  if (r.fatalError) lines.push(`FATAL:       ${r.fatalError}`);
  lines.push("");
  for (const s of r.steps) {
    const code = s.graphCode ? ` ${s.graphCode}` : "";
    lines.push(`${s.name}: ${s.outcome} (HTTP ${s.httpStatus}${code})`);
    if (s.detail) lines.push(`  ${s.detail}`);
  }
  return lines.join("\n");
}
