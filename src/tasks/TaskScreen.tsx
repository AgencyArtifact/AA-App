// Slice 1 screen: the signed-in person's weekly tasks (P2: complete and reopen;
// P3: hours in half-hour steps on a chosen task, confirm). SOP: AA-Ops architecture/app.md.

import { useCallback, useEffect, useRef, useState } from "react";
import { localDate } from "../dates";
import { saveHours, type SaveResult } from "../graph/hours";
import { getMe } from "../graph/me";
import { loadMyTasks, setTaskComplete } from "../graph/planner";
import { formatHours, HOURS_MAX, HOURS_MIN, personEmail, stepHours } from "./hoursRules";
import type { ShownTask } from "./taskRules";

export function TaskScreen() {
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ShownTask[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const busy = useRef(false); // React StrictMode mounts effects twice in development

  // Hours entry (P3): one task, today, half-hour steps.
  const [selected, setSelected] = useState<ShownTask | null>(null);
  const [hours, setHours] = useState(HOURS_MIN);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ task: ShownTask; hours: number; workDate: string; result: SaveResult } | null>(null);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      setUser(me.ok && me.data ? me.data.displayName : null);
      setEmail(me.ok && me.data ? personEmail(me.data) : null);
      const result = await loadMyTasks();
      setTasks(result.tasks);
      setTotal(result.total);
      setError(result.error);
    } catch (e) {
      // Sign-in failures surface here (MSAL messages start with the error code).
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(task: ShownTask) {
    if (busyTaskId || saving) return;
    setBusyTaskId(task.taskId);
    setError(null);
    const result = await setTaskComplete(task, !task.complete);
    if (result.task) {
      const updated = result.task;
      setTasks((list) => list.map((t) => (t.taskId === updated.taskId ? updated : t)));
      setSelected((s) => (s && s.taskId === updated.taskId ? updated : s));
    }
    if (result.error) setError(result.error);
    setBusyTaskId(null);
  }

  function pick(task: ShownTask) {
    if (saving) return;
    setSelected((s) => (s && s.taskId === task.taskId ? null : task));
    setHours(HOURS_MIN);
    setSaved(null);
    setError(null);
  }

  async function confirm() {
    if (!selected || saving) return;
    if (!email) {
      setError("No email for the signed-in user; nothing saved.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(null);
    const workDate = localDate(new Date());
    const task = selected;
    const value = hours;
    try {
      const result = await saveHours({ task, email, workDate, hours: value, confirmedAt: new Date() });
      setSaved({ task, hours: value, workDate, result });
      if (!result.ok) setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const today = localDate(new Date());

  return (
    <main className="screen">
      <header className="brand">
        <span className="brand__name">Agency Artifact</span>
        <span className="brand__sub">Time card{user ? ` · ${user}` : ""}</span>
      </header>

      {loading && <p className="muted">Loading your tasks…</p>}
      {error && <p className="fatal">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p className="muted">No tasks assigned to you this week.</p>
      )}

      <ul className="tasks">
        {tasks.map((task) => (
          <li key={task.taskId} className={`task${selected?.taskId === task.taskId ? " task--selected" : ""}`}>
            <div className="task__main">
              <div className="task__title">{task.title}</div>
              <div className="task__meta">
                {task.planTitle} · {task.bucketName}
                {task.dueDate && ` · due ${task.dueDate}`}
                {task.complete && task.completedDate && ` · completed ${task.completedDate}`}
              </div>
            </div>
            <div className="task__buttons">
              <button
                type="button"
                className={selected?.taskId === task.taskId ? "" : "secondary"}
                onClick={() => pick(task)}
                disabled={loading || saving}
              >
                Hours
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => toggle(task)}
                disabled={busyTaskId !== null || loading || saving}
              >
                {busyTaskId === task.taskId ? "…" : task.complete ? "Reopen" : "Complete"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selected && (
        <section className="entry" aria-label="Hours entry">
          <p className="entry__task">
            {selected.title}
            <span className="muted"> · {selected.planTitle} · {selected.bucketName} · {today}</span>
          </p>
          <div className="stepper">
            <button
              type="button"
              className="stepper__btn secondary"
              onClick={() => setHours((h) => stepHours(h, -1))}
              disabled={saving || hours <= HOURS_MIN}
              aria-label="Half an hour less"
            >
              −
            </button>
            <span className="stepper__value" aria-live="polite">
              {formatHours(hours)} h
            </span>
            <button
              type="button"
              className="stepper__btn secondary"
              onClick={() => setHours((h) => stepHours(h, 1))}
              disabled={saving || hours >= HOURS_MAX}
              aria-label="Half an hour more"
            >
              +
            </button>
          </div>
          <button type="button" className="confirm" onClick={() => void confirm()} disabled={saving || !email}>
            {saving ? "Saving…" : `Confirm ${formatHours(hours)} h for today`}
          </button>
        </section>
      )}

      {saved && saved.result.ok && (
        <div className="result">
          <p className="result__ok">
            Saved {formatHours(saved.hours)} h on {saved.task.title} for {saved.workDate} (row {saved.result.action}
            {saved.result.itemId ? `, item ${saved.result.itemId}` : ""}).
          </p>
          <p className="muted footnote">
            {saved.result.trace}
            {saved.result.createdBy ? ` · created by ${saved.result.createdBy}` : ""}
          </p>
        </div>
      )}
      {saved && !saved.result.ok && saved.result.trace && (
        <p className="muted footnote">{saved.result.trace}</p>
      )}

      <div className="actions">
        <button type="button" className="secondary" onClick={() => void load()} disabled={loading || saving}>
          Refresh
        </button>
      </div>

      <p className="muted footnote">
        {total !== null && `${total} task${total === 1 ? "" : "s"} assigned, ${tasks.length} shown. `}
        <a href="#/diagnostic">Diagnostic</a>
      </p>
    </main>
  );
}
