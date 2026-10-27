import { describe, expect, it } from "vitest";
import { compareTasks, isMilestone, isShown, localDay, weekBounds, type ShownTask } from "./taskRules";

// Invented data only: project 9901 Sample, no real people.

describe("isMilestone", () => {
  it.each([
    ["Milestone: permit issued", true],
    ["  Milestone: with leading spaces", true],
    ["Milestone:", true],
    ["milestone: lower case is not the prefix", false],
    ["Site plan for Milestone: review", false],
    ["Slice 1 test: site plan", false],
    ["", false],
  ])("%j is %s", (title, expected) => {
    expect(isMilestone(title)).toBe(expected);
  });
});

describe("weekBounds", () => {
  it.each([
    // local dates; constructor args are year, month index, day
    [new Date(2026, 9, 28), "2026-10-26", "2026-11-01"], // Wednesday
    [new Date(2026, 9, 26), "2026-10-26", "2026-11-01"], // Monday
    [new Date(2026, 10, 1), "2026-10-26", "2026-11-01"], // Sunday
    [new Date(2026, 10, 2), "2026-11-02", "2026-11-08"], // next Monday
    [new Date(2026, 0, 1), "2025-12-29", "2026-01-04"], // across a year end
  ])("%s is in the week %s to %s", (today, start, end) => {
    expect(weekBounds(today)).toEqual({ start, end });
  });
});

describe("localDay", () => {
  it("returns null for empty or invalid input", () => {
    expect(localDay(null)).toBeNull();
    expect(localDay(undefined)).toBeNull();
    expect(localDay("not a date")).toBeNull();
  });
  it("returns a YYYY-MM-DD string for a timestamp", () => {
    expect(localDay("2026-10-28T12:00:00Z")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("isShown", () => {
  const wednesday = new Date(2026, 9, 28, 12);
  const midWeekUtc = new Date(2026, 9, 27, 12).toISOString(); // Tuesday noon local, as Graph would return it
  const lastWeekUtc = new Date(2026, 9, 20, 12).toISOString();

  it("shows incomplete tasks", () => {
    expect(isShown({ title: "Slice 1 test: site plan", percentComplete: 0, completedDateTime: null }, wednesday)).toBe(true);
    expect(isShown({ title: "Half done", percentComplete: 50, completedDateTime: null }, wednesday)).toBe(true);
  });

  it("hides milestone tasks whatever their state", () => {
    expect(isShown({ title: "Milestone: Slice 1 test", percentComplete: 0, completedDateTime: null }, wednesday)).toBe(false);
    expect(isShown({ title: "Milestone: done", percentComplete: 100, completedDateTime: midWeekUtc }, wednesday)).toBe(false);
  });

  it("shows tasks completed this week and hides older ones", () => {
    expect(isShown({ title: "Done Tuesday", percentComplete: 100, completedDateTime: midWeekUtc }, wednesday)).toBe(true);
    expect(isShown({ title: "Done last week", percentComplete: 100, completedDateTime: lastWeekUtc }, wednesday)).toBe(false);
    expect(isShown({ title: "Done, no date", percentComplete: 100, completedDateTime: null }, wednesday)).toBe(false);
  });
});

describe("compareTasks", () => {
  const task = (over: Partial<ShownTask>): ShownTask => ({
    taskId: "t",
    title: "a",
    planId: "p",
    planTitle: "9901 Sample",
    bucketId: "b",
    bucketName: "Concept",
    dueDate: null,
    complete: false,
    completedDate: null,
    etag: "W/\"1\"",
    ...over,
  });

  it("orders incomplete first, then by due date with no due date last, then by title", () => {
    const list = [
      task({ title: "z no due" }),
      task({ title: "done", complete: true, dueDate: "2026-10-01" }),
      task({ title: "b", dueDate: "2026-10-30" }),
      task({ title: "a", dueDate: "2026-10-30" }),
      task({ title: "early", dueDate: "2026-10-27" }),
    ];
    expect(list.sort(compareTasks).map((t) => t.title)).toEqual(["early", "a", "b", "z no due", "done"]);
  });
});
