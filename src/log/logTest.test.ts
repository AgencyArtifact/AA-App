import { describe, expect, it } from "vitest";
import { formatHours, formatSeconds, stepHours } from "./logTest";

describe("stepHours", () => {
  it("moves in half-hour steps", () => {
    expect(stepHours(0, 1)).toBe(0.5);
    expect(stepHours(0.5, 1)).toBe(1);
    expect(stepHours(1, -1)).toBe(0.5);
  });
  it("never goes below 0 or above 24", () => {
    expect(stepHours(0, -1)).toBe(0);
    expect(stepHours(24, 1)).toBe(24);
  });
  it("snaps an off-grid value back onto the half-hour grid", () => {
    expect(stepHours(0.74, 1)).toBe(1);
    expect(stepHours(0.76, 1)).toBe(1.5);
  });
});

describe("formatHours", () => {
  it.each([
    [0, "0:00"],
    [0.5, "0:30"],
    [1, "1:00"],
    [7.5, "7:30"],
    [24, "24:00"],
  ])("%d h is %s", (hours, expected) => {
    expect(formatHours(hours)).toBe(expected);
  });
});

describe("formatSeconds", () => {
  it.each([
    [0, "0.0 s"],
    [12345, "12.3 s"],
    [29960, "30.0 s"],
    [-5, "0.0 s"],
  ])("%d ms is %s", (ms, expected) => {
    expect(formatSeconds(ms)).toBe(expected);
  });
});
