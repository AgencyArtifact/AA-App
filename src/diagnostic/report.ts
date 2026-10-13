// Pure functions for the stage 0 diagnostic: outcome classification and the
// plain-text report. No I/O.

export type Outcome = "PASS" | "DENIED" | "ERROR";

export interface StepResult {
  name: string;
  outcome: Outcome;
  // HTTP status of the deciding call; 0 = no response.
  httpStatus: number;
  graphCode: string | null;
  // Non-financial detail only (counts, item ids, notes).
  detail: string;
}

export interface DiagnosticReport {
  timestamp: string;
  appUrl: string;
  user: string;
  host: string;
  authMode: string;
  interactivePrompts: number;
  lastSilentError: string | null;
  fatalError: string | null;
  steps: StepResult[];
}

/** 2xx is PASS; 401 and 403 are DENIED; anything else (including 404 and no response) is ERROR. */
export function classify(httpStatus: number): Outcome {
  if (httpStatus >= 200 && httpStatus < 300) return "PASS";
  if (httpStatus === 401 || httpStatus === 403) return "DENIED";
  return "ERROR";
}

export function formatReport(r: DiagnosticReport): string {
  const lines: string[] = [
    "Agency Artifact - stage 0 diagnostic",
    `Time:        ${r.timestamp}`,
    `App URL:     ${r.appUrl}`,
    `User:        ${r.user}`,
    `Host:        ${r.host}`,
    `Auth mode:   ${r.authMode}`,
    `Prompts:     ${r.interactivePrompts}${r.lastSilentError ? ` (silent failed: ${r.lastSilentError})` : ""}`,
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
