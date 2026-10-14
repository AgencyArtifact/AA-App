// Stage 1 diagnostic, Harvest lines (T3). Interface I3 in docs/architecture/overview.md.
//
// Money rule (CLAUDE.md): every response is checked for money fields by name,
// reported as present (VALUE / null) or absent. No value is printed or kept.

import { connectHarvest, getHarvestSession } from "../auth/harvestAuth";
import { config } from "../config";
import { localDate } from "../dates";
import {
  harvest,
  type HarvestMe,
  type HarvestProjectAssignment,
  type HarvestResult,
  type HarvestTimeEntry,
} from "../harvest/harvest";
import { moneySummary } from "../harvest/money";
import { classify, type StepResult } from "./report";

const TEST_PROJECT_CODE = "ZT-01";
const UNASSIGNED_PROJECT_CODE = "ZT-02";
const TEST_TASK = "SD";
const TEST_HOURS = 0.5;
const TEST_NOTE = "AA stage 1 diagnostic (deleted automatically)";

/** A project matches by its code, or by a name starting with the code ("ZT-01 Test Project"). */
export function isProject(p: { code: string | null; name: string }, code: string): boolean {
  return p.code?.trim() === code || p.name.trim().startsWith(code);
}

/** Non-financial list of assignments for the report: "name [code] (tasks)". */
function describeAssignments(list: HarvestProjectAssignment[]): string {
  return list
    .map((a) => `${a.project.name}${a.project.code ? ` [${a.project.code}]` : ""} (${a.task_assignments.map((t) => t.task.name).join(", ")})`)
    .join("; ");
}

function step(name: string, r: HarvestResult<unknown>, detail: string): StepResult {
  const parts = [r.message ? `Harvest: ${r.message}` : "", detail].filter(Boolean);
  return { name, outcome: classify(r.status), httpStatus: r.status, graphCode: null, detail: parts.join(" · ") };
}

function skipped(name: string, detail: string): StepResult {
  return { name, outcome: "SKIPPED", httpStatus: 0, graphCode: null, detail };
}

/** A refusal is the expected answer: a 4xx is reported as DENIED, an accepted call as ERROR. */
function refusalStep(name: string, r: HarvestResult<unknown>, detail: string): StepResult {
  const s = step(name, r, detail);
  if (r.status >= 400 && r.status < 500) s.outcome = "DENIED";
  else if (r.ok) s.outcome = "ERROR";
  return s;
}

export interface HarvestRun {
  steps: StepResult[];
  /** performance.now() when the write + delete passed, or null. */
  writePassedAt: number | null;
}

/**
 * Opens the Harvest sign-in popup if there is no session. Returns the error
 * message, or null. Call first thing after the click (popup blockers).
 */
export async function ensureHarvest(inTeams: boolean): Promise<string | null> {
  try {
    if (!getHarvestSession()) await connectHarvest(inTeams);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

/** Runs the Harvest lines. connectError comes from ensureHarvest. */
export async function runHarvestSteps(connectError: string | null): Promise<HarvestRun> {
  const steps: StepResult[] = [];
  let writePassedAt: number | null = null;

  // Harvest connect
  if (connectError || !getHarvestSession()) {
    steps.push({
      name: "Harvest connect",
      outcome: "ERROR",
      httpStatus: 0,
      graphCode: null,
      detail: connectError ?? "Not connected to Harvest.",
    });
    return { steps, writePassedAt };
  }
  const session = getHarvestSession()!;
  const me = await harvest<HarvestMe>("GET", "/users/me");
  const roles = me.data?.access_roles ? me.data.access_roles.join(", ") || "(empty)" : "access_roles absent";
  steps.push(
    step(
      "Harvest connect",
      me,
      me.data
        ? `account ${session.accountId}${session.accountIds.length > 1 ? ` (of ${session.accountIds.join(", ")})` : ""}; user ${me.data.first_name} ${me.data.last_name}, Harvest user ID ${me.data.id}; roles: ${roles}; ${moneySummary(me.data)}`
        : `account ${session.accountId}`,
    ),
  );
  if (!me.ok || !me.data) return { steps, writePassedAt };
  const myId = me.data.id;

  // Harvest my assignments
  const pa = await harvest<{ project_assignments: HarvestProjectAssignment[] }>(
    "GET",
    "/users/me/project_assignments?per_page=100",
  );
  const assignments = pa.data?.project_assignments ?? [];
  steps.push(step("Harvest my assignments", pa, pa.ok ? `count ${assignments.length}: ${describeAssignments(assignments)}; ${moneySummary(pa.data)}` : ""));

  // Harvest write + delete
  const test = assignments.find((a) => isProject(a.project, TEST_PROJECT_CODE));
  const sd = test?.task_assignments.find((t) => t.task.name === TEST_TASK);
  if (!test || !sd) {
    steps.push(
      skipped(
        "Harvest write + delete",
        `no assignment to project ${TEST_PROJECT_CODE} with task ${TEST_TASK} for this person`,
      ),
    );
  } else {
    const created = await harvest<HarvestTimeEntry>("POST", "/time_entries", {
      project_id: test.project.id,
      task_id: sd.task.id,
      spent_date: localDate(new Date()),
      hours: TEST_HOURS,
      notes: TEST_NOTE,
    });
    if (!created.ok || !created.data) {
      steps.push(step("Harvest write + delete", created, `write ${TEST_HOURS} h on ${TEST_PROJECT_CODE} / ${TEST_TASK} failed`));
    } else {
      const id = created.data.id;
      const writeMoney = moneySummary(created.data);
      const del = await harvest<unknown>("DELETE", `/time_entries/${id}`);
      steps.push(
        step(
          "Harvest write + delete",
          del,
          `write HTTP ${created.status}, entry ${id}; delete HTTP ${del.status}${del.ok ? "" : ` (ENTRY ${id} LEFT IN HARVEST)`}; write response ${writeMoney}`,
        ),
      );
      if (del.ok) writePassedAt = performance.now();
    }
  }

  // Harvest unassigned write
  let unassignedId: string = config.harvest.test.unassignedProjectId;
  let lookupNote = "";
  if (!unassignedId) {
    // Only an Administrator (or a manager of the project) can list it.
    const projects = await harvest<{ projects: { id: number; code: string | null; name: string }[] }>(
      "GET",
      "/projects?is_active=true&per_page=100",
    );
    const found = projects.data?.projects.find((p) => isProject(p, UNASSIGNED_PROJECT_CODE));
    if (found) {
      unassignedId = String(found.id);
      lookupNote = `; ${UNASSIGNED_PROJECT_CODE} project ID ${found.id}: put it in config.harvest.test.unassignedProjectId`;
    }
  }
  if (!unassignedId) {
    steps.push(
      skipped(
        "Harvest unassigned write",
        `${UNASSIGNED_PROJECT_CODE} project ID unknown: set config.harvest.test.unassignedProjectId (the Administrator run prints it)`,
      ),
    );
  } else if (!sd) {
    steps.push(
      skipped("Harvest unassigned write", `task ${TEST_TASK} ID unknown (no ${TEST_PROJECT_CODE} assignment)${lookupNote}`),
    );
  } else {
    const r = await harvest<HarvestTimeEntry>("POST", "/time_entries", {
      project_id: Number(unassignedId),
      task_id: sd.task.id,
      spent_date: localDate(new Date()),
      hours: TEST_HOURS,
      notes: TEST_NOTE,
    });
    let cleanup = "";
    if (r.ok && r.data) {
      const del = await harvest<unknown>("DELETE", `/time_entries/${r.data.id}`);
      cleanup = `; ACCEPTED, entry ${r.data.id} deleted: HTTP ${del.status}`;
    }
    steps.push(refusalStep("Harvest unassigned write", r, `expected: refused${cleanup}${lookupNote}`));
  }

  // Harvest other person's time
  const otherId: string = config.harvest.test.otherUserId;
  if (!otherId || otherId === String(myId)) {
    steps.push(
      skipped(
        "Harvest other person's time",
        `${otherId ? "other user is this user" : "other user ID not set"}: set config.harvest.test.otherUserId (your Harvest user ID is ${myId})`,
      ),
    );
  } else {
    const r = await harvest<{ time_entries: HarvestTimeEntry[] }>(
      "GET",
      `/time_entries?user_id=${encodeURIComponent(otherId)}&per_page=100`,
    );
    const entries = r.data?.time_entries ?? [];
    const others = entries.filter((e) => e.user.id !== myId).length;
    steps.push(
      refusalStep(
        "Harvest other person's time",
        r,
        r.ok
          ? `expected: refused or only own entries; returned ${entries.length} entries, ${others} by other people${others > 0 ? " (OTHER PEOPLE'S TIME VISIBLE)" : ""}; ${moneySummary(r.data)}`
          : "expected: refused or only own entries",
      ),
    );
    // A 200 with no one else's entries meets the proposed rule (stage 1 handoff, item 7).
    if (r.ok && others === 0) steps[steps.length - 1].outcome = "PASS";
  }

  return { steps, writePassedAt };
}
