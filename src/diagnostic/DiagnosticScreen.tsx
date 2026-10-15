import { useCallback, useEffect, useRef, useState } from "react";
import { runDiagnostic, type RunOptions } from "./runDiagnostic";
import { formatElapsed, formatReport, type DiagnosticReport, type Outcome } from "./report";

const outcomeColor: Record<Outcome, string> = {
  PASS: "var(--pass)",
  DENIED: "var(--denied)",
  ERROR: "var(--error)",
  SKIPPED: "var(--muted)",
};

export function DiagnosticScreen() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [running, setRunning] = useState(false);
  const [keepCompleted, setKeepCompleted] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Guards against overlapping runs (React StrictMode mounts effects twice in development).
  const busy = useRef(false);

  const run = useCallback(async (options: RunOptions = { harvest: false }) => {
    if (busy.current) return;
    busy.current = true;
    setRunning(true);
    setCopyState("idle");
    setReport(await runDiagnostic(options));
    setRunning(false);
    busy.current = false;
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const text = report ? formatReport(report) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      // Clipboard can be blocked inside Teams webviews: select the text instead.
      setCopyState("manual");
      textRef.current?.focus();
      textRef.current?.select();
    }
  }

  return (
    <main className="screen">
      <header className="brand">
        <span className="brand__name">Agency Artifact</span>
        <span className="brand__sub">Stage 1 diagnostic</span>
      </header>

      {running && <p className="muted">Running checks…</p>}

      {report && (
        <>
          <dl className="meta">
            <dt>User</dt>
            <dd>{report.user}</dd>
            <dt>Host</dt>
            <dd>{report.host}</dd>
            <dt>Time zone</dt>
            <dd>{report.timeZone}</dd>
            <dt>Today</dt>
            <dd>{report.localToday}</dd>
            <dt>Write</dt>
            <dd>
              {report.writeElapsedMs === null
                ? "no write attempted"
                : `${formatElapsed(report.writeElapsedMs)} from page load (run ${report.runNumber})`}
            </dd>
            <dt>Auth</dt>
            <dd>
              {report.authMode}, prompts: {report.interactivePrompts}
              {report.lastSilentError && ` (silent failed: ${report.lastSilentError})`}
            </dd>
            <dt>Time</dt>
            <dd>{report.timestamp}</dd>
          </dl>

          {report.fatalError && <p className="fatal">FATAL: {report.fatalError}</p>}

          <ul className="steps">
            {report.steps.map((s) => (
              <li key={s.name} className="step">
                <div className="step__head">
                  <span className="step__name">{s.name}</span>
                  <span className="step__outcome" style={{ color: outcomeColor[s.outcome] }}>
                    {s.outcome}
                  </span>
                </div>
                <div className="step__info">
                  HTTP {s.httpStatus}
                  {s.graphCode && ` · ${s.graphCode}`}
                  {s.detail && ` · ${s.detail}`}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="actions">
        <button type="button" onClick={() => run({ harvest: true, plannerWrite: true, keepPlannerCompleted: keepCompleted })} disabled={running}>
          Connect Harvest and run
        </button>
        <button type="button" className="secondary" onClick={copy} disabled={!report || running}>
          Copy report
        </button>
        <button type="button" className="secondary" onClick={() => run({ harvest: false, plannerWrite: true, keepPlannerCompleted: keepCompleted })} disabled={running}>
          Run again
        </button>
      </div>
      <label className="muted">
        <input type="checkbox" checked={keepCompleted} onChange={(e) => setKeepCompleted(e.target.checked)} /> Leave the
        Planner test task completed (to check it in Planner)
      </label>
      {copyState === "copied" && <p className="muted">Copied.</p>}
      {copyState === "manual" && (
        <p className="muted">Clipboard blocked here. The text below is selected: copy it by hand.</p>
      )}

      {report && <textarea ref={textRef} className="report" readOnly value={text} rows={14} />}
    </main>
  );
}
