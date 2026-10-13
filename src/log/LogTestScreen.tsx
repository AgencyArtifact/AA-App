// Stage 0 phone test screen (#/log). Not the timecard.
// One date, one half-hour stepper, an explicit Confirm, one row written to
// TestHours. Shows the time from this screen loading to the confirmed write.

import { useEffect, useRef, useState } from "react";
import { config } from "../config";
import {
  createTestHoursItem,
  deleteTestHoursItem,
  getMe,
  lookupPersonId,
  resolveSiteId,
} from "../graph/sharepoint";
import { localDate } from "../dates";
import { formatHours, formatSeconds, stepHours } from "./logTest";

interface Target {
  siteId: string;
  personId: string | null;
}

type Status =
  | { kind: "editing" }
  | { kind: "saving" }
  | { kind: "saved"; itemId: string; screenMs: number; pageMs: number; personSet: boolean }
  | { kind: "deleted" }
  | { kind: "error"; message: string };

// Sign-in, site lookup and Person lookup start as soon as the screen opens,
// so Confirm only has to write.
async function prepare(): Promise<Target> {
  const me = await getMe();
  if (!me.ok || !me.data) throw new Error(`Sign-in check failed (HTTP ${me.status} ${me.code ?? ""})`);
  const site = await resolveSiteId(config.sharepoint.operations.sitePath);
  if (!site.id) {
    throw new Error(`Operations site lookup failed (HTTP ${site.result.status} ${site.result.code ?? ""})`);
  }
  const personId = await lookupPersonId(site.id, me.data.userPrincipalName);
  return { siteId: site.id, personId };
}

export function LogTestScreen() {
  // performance.now() counts from page navigation start; this marks the screen.
  const screenStart = useRef(performance.now());
  const target = useRef<Promise<Target> | null>(null);
  const [date, setDate] = useState(() => localDate(new Date()));
  const [hours, setHours] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: "editing" });

  useEffect(() => {
    if (!target.current) {
      target.current = prepare();
      // Errors surface on Confirm; avoid an unhandled rejection meanwhile.
      target.current.catch(() => undefined);
    }
  }, []);

  async function confirm() {
    if (status.kind === "saving" || hours <= 0) return;
    setStatus({ kind: "saving" });
    try {
      if (!target.current) target.current = prepare();
      const t = await target.current;
      const created = await createTestHoursItem(t.siteId, {
        title: "stage0-log",
        date,
        hours,
        personId: t.personId,
      });
      if (!created.ok || !created.data) {
        throw new Error(`Write failed (HTTP ${created.status} ${created.code ?? ""})`);
      }
      const now = performance.now();
      setStatus({
        kind: "saved",
        itemId: created.data.id,
        screenMs: now - screenStart.current,
        pageMs: now,
        personSet: t.personId !== null,
      });
    } catch (error) {
      target.current = null; // retry prepares again
      setStatus({ kind: "error", message: (error as Error).message ?? String(error) });
    }
  }

  async function deleteRow(itemId: string) {
    const t = await target.current;
    if (!t) return;
    const r = await deleteTestHoursItem(t.siteId, itemId);
    setStatus(
      r.ok
        ? { kind: "deleted" }
        : { kind: "error", message: `Delete failed (HTTP ${r.status} ${r.code ?? ""}); remove item ${itemId} by hand.` },
    );
  }

  function again() {
    screenStart.current = performance.now();
    setHours(0);
    setStatus({ kind: "editing" });
  }

  const locked = status.kind === "saving" || status.kind === "saved";

  return (
    <main className="screen">
      <header className="brand">
        <span className="brand__name">Agency Artifact</span>
        <span className="brand__sub">Phone test: log half an hour</span>
      </header>

      <label className="field">
        <span className="field__label">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={locked}
        />
      </label>

      <div className="stepper" role="group" aria-label="Hours">
        <button
          type="button"
          className="secondary stepper__btn"
          aria-label="Half an hour less"
          onClick={() => setHours((h) => stepHours(h, -1))}
          disabled={locked || hours <= 0}
        >
          −
        </button>
        <output className="stepper__value" aria-live="polite">
          {formatHours(hours)}
        </output>
        <button
          type="button"
          className="secondary stepper__btn"
          aria-label="Half an hour more"
          onClick={() => setHours((h) => stepHours(h, 1))}
          disabled={locked}
        >
          +
        </button>
      </div>

      <button
        type="button"
        className="confirm"
        onClick={confirm}
        disabled={locked || hours <= 0 || !date}
      >
        {status.kind === "saving" ? "Saving…" : "Confirm"}
      </button>

      {status.kind === "saved" && (
        <div className="result">
          <p className="result__ok">Confirmed. Saved to {config.sharepoint.operations.lists.testHours}.</p>
          <p className="result__time">Screen open → confirmed: {formatSeconds(status.screenMs)}</p>
          <p className="muted">
            Page load → confirmed: {formatSeconds(status.pageMs)} · item {status.itemId}
            {status.personSet ? "" : " · Person not set"}
          </p>
          <div className="actions">
            <button type="button" className="secondary" onClick={() => deleteRow(status.itemId)}>
              Delete this test row
            </button>
            <button type="button" className="secondary" onClick={again}>
              Again
            </button>
          </div>
        </div>
      )}
      {status.kind === "deleted" && (
        <div className="result">
          <p className="muted">Test row deleted.</p>
          <button type="button" className="secondary" onClick={again}>
            Again
          </button>
        </div>
      )}
      {status.kind === "error" && <p className="fatal">{status.message}</p>}
    </main>
  );
}
