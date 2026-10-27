import { describe, expect, it } from "vitest";
import { buildRowFields, formatHours, isValidHours, odataString, personEmail, rowKey, stepHours } from "./hoursRules";
import type { ShownTask } from "./taskRules";

// Invented data only: project 9901 Sample, people at example.com.

describe("isValidHours", () => {
  it.each([
    [0.5, true],
    [1, true],
    [1.5, true],
    [24, true],
    [0, false],
    [0.25, false],
    [1.3, false],
    [24.5, false],
    [-0.5, false],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
  ])("%s is %s", (hours, expected) => {
    expect(isValidHours(hours)).toBe(expected);
  });
});

describe("stepHours", () => {
  it("moves by half an hour", () => {
    expect(stepHours(1, 1)).toBe(1.5);
    expect(stepHours(1.5, -1)).toBe(1);
  });
  it("never leaves the range", () => {
    expect(stepHours(0.5, -1)).toBe(0.5);
    expect(stepHours(24, 1)).toBe(24);
  });
  it("lands on a half hour from an odd start", () => {
    expect(stepHours(0.7, 1)).toBe(1);
  });
});

describe("formatHours", () => {
  it("shows one decimal", () => {
    expect(formatHours(1)).toBe("1.0");
    expect(formatHours(0.5)).toBe("0.5");
    expect(formatHours(12.5)).toBe("12.5");
  });
});

describe("personEmail", () => {
  it("prefers mail, lower case", () => {
    expect(personEmail({ mail: "Person@Example.com", userPrincipalName: "person_example.com#EXT#@x.example" })).toBe("person@example.com");
  });
  it("falls back to userPrincipalName", () => {
    expect(personEmail({ mail: null, userPrincipalName: "Person@Example.com" })).toBe("person@example.com");
    expect(personEmail({ userPrincipalName: " person@example.com " })).toBe("person@example.com");
  });
  it("is null when neither exists", () => {
    expect(personEmail({ mail: "", userPrincipalName: null })).toBeNull();
    expect(personEmail({})).toBeNull();
  });
});

describe("rowKey", () => {
  it("joins email, date and task ID with |", () => {
    expect(rowKey("person@example.com", "2026-10-27", "task-1")).toBe("person@example.com|2026-10-27|task-1");
  });
});

describe("odataString", () => {
  it("doubles single quotes", () => {
    expect(odataString("o'brien@example.com|2026-10-27|t")).toBe("o''brien@example.com|2026-10-27|t");
    expect(odataString("plain")).toBe("plain");
  });
});

describe("buildRowFields", () => {
  const task: ShownTask = {
    taskId: "task-1",
    title: "Sample task",
    planId: "plan-1",
    planTitle: "9901 Sample",
    bucketId: "bucket-1",
    bucketName: "Concept",
    dueDate: "2026-10-30",
    complete: false,
    completedDate: null,
    etag: "W/\"1\"",
  };
  const confirmedAt = new Date(Date.UTC(2026, 9, 27, 18, 42, 0));

  it("builds every app column with SyncStatus Pending", () => {
    const r = buildRowFields({ task, email: "person@example.com", workDate: "2026-10-27", hours: 1, confirmedAt });
    expect(r.error).toBeNull();
    expect(r.fields).toEqual({
      Title: "person@example.com|2026-10-27|task-1",
      PersonEmail: "person@example.com",
      WorkDate: "2026-10-27",
      Hours: 1,
      PlannerTaskId: "task-1",
      TaskTitle: "Sample task",
      PlannerPlanId: "plan-1",
      PlanTitle: "9901 Sample",
      BucketName: "Concept",
      ConfirmedAt: "2026-10-27T18:42:00.000Z",
      SyncStatus: "Pending",
    });
  });

  it("writes no script-owned column", () => {
    const r = buildRowFields({ task, email: "person@example.com", workDate: "2026-10-27", hours: 1, confirmedAt });
    const keys = Object.keys(r.fields ?? {});
    for (const owned of ["SyncMessage", "HarvestEntryId", "SyncedAt"]) expect(keys).not.toContain(owned);
  });

  it("refuses milestone tasks", () => {
    const r = buildRowFields({ task: { ...task, title: "Milestone: sample" }, email: "person@example.com", workDate: "2026-10-27", hours: 1, confirmedAt });
    expect(r.fields).toBeNull();
    expect(r.error).toMatch(/Milestone/);
  });

  it("refuses invalid hours, dates and emails", () => {
    expect(buildRowFields({ task, email: "person@example.com", workDate: "2026-10-27", hours: 0, confirmedAt }).error).toMatch(/half-hour/);
    expect(buildRowFields({ task, email: "person@example.com", workDate: "27/10/2026", hours: 1, confirmedAt }).error).toMatch(/YYYY-MM-DD/);
    expect(buildRowFields({ task, email: "nobody", workDate: "2026-10-27", hours: 1, confirmedAt }).error).toMatch(/email/);
  });
});
