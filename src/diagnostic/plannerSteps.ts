// Stage 1 diagnostic, Planner lines (T3). Interface I4 in docs/architecture/overview.md.
// Go criterion 1: are tasks in a Planner premium plan visible to, and
// completable through, Graph's basic Planner endpoints?

import { graph } from "../graph/graph";
import { classify, type StepResult } from "./report";

const TEST_TASK_TITLE = "AA Stage1 Test Task";

interface PlannerTask {
  id: string;
  title: string;
  planId: string;
  bucketId: string | null;
  percentComplete: number;
  "@odata.etag": string;
  [key: string]: unknown;
}

function step(name: string, status: number, code: string | null, detail: string): StepResult {
  return { name, outcome: classify(status), httpStatus: status, graphCode: code, detail };
}

function skipped(name: string, detail: string): StepResult {
  return { name, outcome: "SKIPPED", httpStatus: 0, graphCode: null, detail };
}

/** Graph has no documented parent field on plannerTask; report any key that names one. */
function parentKeys(task: PlannerTask): string {
  const keys = Object.keys(task).filter((k) => /parent/i.test(k));
  return keys.length ? `present (${keys.join(", ")})` : "absent";
}

/** PATCH percentComplete with If-Match, then read the task again. */
async function setPercent(
  name: string,
  task: PlannerTask,
  percent: number,
): Promise<{ result: StepResult; task: PlannerTask | null }> {
  const patch = await graph<unknown>(
    "PATCH",
    `/planner/tasks/${task.id}`,
    { percentComplete: percent },
    { "If-Match": task["@odata.etag"] },
  );
  const again = await graph<PlannerTask>("GET", `/planner/tasks/${task.id}`);
  const after = again.data ? `${again.data.percentComplete}%` : `read again failed, HTTP ${again.status}`;
  return {
    result: step(name, patch.status, patch.code, `PATCH percentComplete ${percent}; read again: ${after}`),
    task: again.data,
  };
}

export async function runPlannerSteps(): Promise<StepResult[]> {
  const steps: StepResult[] = [];

  // Planner my tasks
  const list = await graph<{ value: PlannerTask[] }>("GET", "/me/planner/tasks");
  const tasks = list.data?.value ?? [];
  const task = tasks.find((t) => t.title.trim() === TEST_TASK_TITLE);
  let detail = `count ${tasks.length}; "${TEST_TASK_TITLE}" ${task ? "found" : "NOT FOUND"}`;
  if (task) {
    const [plan, bucket] = await Promise.all([
      graph<{ title: string }>("GET", `/planner/plans/${task.planId}`),
      task.bucketId
        ? graph<{ name: string }>("GET", `/planner/buckets/${task.bucketId}`)
        : Promise.resolve(null),
    ]);
    detail +=
      `; plan ${plan.data ? `"${plan.data.title}"` : `unreadable (HTTP ${plan.status}${plan.code ? ` ${plan.code}` : ""})`}` +
      `; bucket ${bucket === null ? "none" : bucket.data ? `"${bucket.data.name}"` : `unreadable (HTTP ${bucket.status})`}` +
      `; parent ${parentKeys(task)}; ${task.percentComplete}% complete`;
  }
  steps.push(step("Planner my tasks", list.status, list.code, list.ok ? detail : ""));
  if (!task) {
    const why = list.ok ? "test task not listed" : "task list failed";
    steps.push(skipped("Planner complete", why), skipped("Planner reset", why));
    return steps;
  }

  // Planner complete, then reset so the run can repeat.
  const complete = await setPercent("Planner complete", task, 100);
  steps.push(complete.result);
  if (complete.result.outcome !== "PASS" || !complete.task) {
    // The brief: if Planner refuses, report it and stop resetting.
    steps.push(skipped("Planner reset", "complete was refused; not resetting"));
    return steps;
  }
  steps.push((await setPercent("Planner reset", complete.task, 0)).result);
  return steps;
}
