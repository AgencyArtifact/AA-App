// Planner through Graph, delegated, scope Tasks.ReadWrite (slice 1).
// Reads the signed-in person's tasks with plan title and bucket name; sets and
// clears completion. Never creates, assigns or deletes tasks; never touches
// milestone tasks (filtered in taskRules before anything is shown or updated).
// SOP: AA-Ops architecture/app.md.

import { graph, type GraphResult } from "./graph";
import { compareTasks, isMilestone, isShown, localDay, type ShownTask } from "../tasks/taskRules";

interface PlannerTaskRaw {
  id: string;
  title: string;
  planId: string;
  bucketId: string | null;
  dueDateTime: string | null;
  percentComplete: number;
  completedDateTime: string | null;
  "@odata.etag": string;
}

interface Page<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

export interface LoadResult {
  tasks: ShownTask[];
  /** Tasks returned by Graph before filtering, for the diagnostic line. */
  total: number;
  error: string | null;
}

function describe(r: GraphResult<unknown>): string {
  return `HTTP ${r.status}${r.code ? ` ${r.code}` : ""}${r.message ? `: ${r.message}` : ""}`;
}

async function readAll<T>(path: string): Promise<GraphResult<T[]>> {
  const items: T[] = [];
  let next: string | null = path;
  while (next) {
    const page: GraphResult<Page<T>> = await graph<Page<T>>("GET", next);
    if (!page.ok || !page.data) return { ...page, data: null };
    items.push(...page.data.value);
    next = page.data["@odata.nextLink"] ?? null;
  }
  return { ok: true, status: 200, code: null, message: null, data: items };
}

/** Resolves names for a set of IDs with one call each, in parallel. Unreadable names become a marker. */
async function names(ids: string[], path: (id: string) => string, field: string, marker: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const r = await graph<Record<string, string>>("GET", path(id));
      result.set(id, r.ok && r.data && r.data[field] ? r.data[field] : marker);
    }),
  );
  return result;
}

function toShown(raw: PlannerTaskRaw, planTitles: Map<string, string>, bucketNames: Map<string, string>): ShownTask {
  return {
    taskId: raw.id,
    title: raw.title,
    planId: raw.planId,
    planTitle: planTitles.get(raw.planId) ?? "(plan unreadable)",
    bucketId: raw.bucketId,
    bucketName: raw.bucketId ? (bucketNames.get(raw.bucketId) ?? "(bucket unreadable)") : "(no bucket)",
    dueDate: localDay(raw.dueDateTime),
    complete: raw.percentComplete >= 100,
    completedDate: localDay(raw.completedDateTime),
    etag: raw["@odata.etag"],
  };
}

/** The signed-in person's tasks for the screen, filtered by the slice 1 rule and sorted. */
export async function loadMyTasks(today: Date = new Date()): Promise<LoadResult> {
  const list = await readAll<PlannerTaskRaw>("/me/planner/tasks");
  if (!list.ok || !list.data) return { tasks: [], total: 0, error: `Could not read tasks (${describe(list)})` };

  const shown = list.data.filter((t) => isShown(t, today));
  const planIds = [...new Set(shown.map((t) => t.planId))];
  const bucketIds = [...new Set(shown.map((t) => t.bucketId).filter((b): b is string => !!b))];
  const [planTitles, bucketNames] = await Promise.all([
    names(planIds, (id) => `/planner/plans/${id}`, "title", "(plan unreadable)"),
    names(bucketIds, (id) => `/planner/buckets/${id}`, "name", "(bucket unreadable)"),
  ]);
  const tasks = shown.map((t) => toShown(t, planTitles, bucketNames)).sort(compareTasks);
  return { tasks, total: list.data.length, error: null };
}

export interface UpdateResult {
  ok: boolean;
  /** The task after the update, with its new etag; null when the update failed. */
  task: ShownTask | null;
  error: string | null;
}

function patch(task: ShownTask, percentComplete: number): Promise<GraphResult<PlannerTaskRaw>> {
  return graph<PlannerTaskRaw>(
    "PATCH",
    `/planner/tasks/${task.taskId}`,
    { percentComplete },
    { "If-Match": task.etag, Prefer: "return=representation" },
  );
}

/**
 * Mark a task complete (100) or reopen it (0). Sends If-Match with the task's etag;
 * on 409 or 412 reads the task again and retries once, then reports the error
 * (AA-App findings 2026-10-15). Never for milestone tasks.
 */
export async function setTaskComplete(task: ShownTask, complete: boolean): Promise<UpdateResult> {
  if (isMilestone(task.title)) return { ok: false, task: null, error: "Milestone tasks are not edited here." };
  const percent = complete ? 100 : 0;
  let current = task;
  let result = await patch(current, percent);
  if (result.status === 409 || result.status === 412) {
    const fresh = await graph<PlannerTaskRaw>("GET", `/planner/tasks/${task.taskId}`);
    if (fresh.ok && fresh.data) {
      current = { ...task, etag: fresh.data["@odata.etag"] };
      result = await patch(current, percent);
    }
  }
  if (!result.ok) return { ok: false, task: null, error: `Could not update the task (${describe(result)})` };

  // Prefer: return=representation gives 200 with the task; a 204 means read it again.
  let raw = result.data;
  if (!raw || !raw["@odata.etag"]) {
    const again = await graph<PlannerTaskRaw>("GET", `/planner/tasks/${task.taskId}`);
    if (!again.ok || !again.data) return { ok: true, task: null, error: `Updated, but could not read the task again (${describe(again)})` };
    raw = again.data;
  }
  return {
    ok: true,
    task: {
      ...task,
      complete: raw.percentComplete >= 100,
      completedDate: localDay(raw.completedDateTime),
      etag: raw["@odata.etag"],
    },
    error: null,
  };
}
