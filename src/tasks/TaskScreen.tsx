// Slice 1 screen (P2): the signed-in person's weekly tasks, complete and reopen.
// Hours entry and confirm arrive in P3. SOP: AA-Ops architecture/app.md.

import { useCallback, useEffect, useRef, useState } from "react";
import { getMe } from "../graph/me";
import { loadMyTasks, setTaskComplete } from "../graph/planner";
import type { ShownTask } from "./taskRules";

export function TaskScreen() {
  const [user, setUser] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ShownTask[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const busy = useRef(false); // React StrictMode mounts effects twice in development

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      setUser(me.ok && me.data ? me.data.displayName : null);
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
    if (busyTaskId) return;
    setBusyTaskId(task.taskId);
    setError(null);
    const result = await setTaskComplete(task, !task.complete);
    if (result.task) {
      const updated = result.task;
      setTasks((list) => list.map((t) => (t.taskId === updated.taskId ? updated : t)));
    }
    if (result.error) setError(result.error);
    setBusyTaskId(null);
  }

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
          <li key={task.taskId} className="task">
            <div className="task__main">
              <div className="task__title">{task.title}</div>
              <div className="task__meta">
                {task.planTitle} · {task.bucketName}
                {task.dueDate && ` · due ${task.dueDate}`}
                {task.complete && task.completedDate && ` · completed ${task.completedDate}`}
              </div>
            </div>
            <button
              type="button"
              className={task.complete ? "secondary" : ""}
              onClick={() => toggle(task)}
              disabled={busyTaskId !== null || loading}
            >
              {busyTaskId === task.taskId ? "…" : task.complete ? "Reopen" : "Complete"}
            </button>
          </li>
        ))}
      </ul>

      <div className="actions">
        <button type="button" className="secondary" onClick={() => void load()} disabled={loading}>
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
