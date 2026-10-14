import { describe, expect, it } from "vitest";
import { classify, formatElapsed, formatReport, type DiagnosticReport } from "./report";

describe("classify", () => {
  it.each([
    [200, "PASS"],
    [201, "PASS"],
    [204, "PASS"],
    [401, "DENIED"],
    [403, "DENIED"],
    [404, "ERROR"],
    [429, "ERROR"],
    [500, "ERROR"],
    [0, "ERROR"],
  ] as const)("HTTP %i is %s", (status, expected) => {
    expect(classify(status)).toBe(expected);
  });
});

describe("formatElapsed", () => {
  it.each([
    [0, "0.0 s"],
    [12345, "12.3 s"],
    [-5, "0.0 s"],
  ] as const)("%i ms is %s", (ms, expected) => {
    expect(formatElapsed(ms)).toBe(expected);
  });
});

const base: DiagnosticReport = {
  timestamp: "2026-10-12T22:00:00.000Z (local 2026-10-12 15:00:00, America/Los_Angeles)",
  appUrl: "https://example.github.io/aa/#/diagnostic",
  user: "aa.test@example.com",
  host: "Teams ios",
  timeZone: "America/Los_Angeles (UTC-07:00)",
  localToday: "2026-10-12",
  authMode: "teams-naa",
  interactivePrompts: 0,
  lastSilentError: null,
  writeElapsedMs: 8421,
  runNumber: 1,
  fatalError: null,
  steps: [
    { name: "Operations read (TestHours)", outcome: "PASS", httpStatus: 200, graphCode: null, detail: "items: 3" },
    { name: "Operations edit of another user's row (TestHours)", outcome: "SKIPPED", httpStatus: 0, graphCode: null, detail: "no row by another user" },
    { name: "Principals read (TestFees)", outcome: "DENIED", httpStatus: 403, graphCode: "accessDenied", detail: "" },
  ],
};

describe("formatReport", () => {
  it("produces the fixed plain-text layout", () => {
    expect(formatReport(base)).toBe(
      [
        "Agency Artifact - stage 1 diagnostic",
        "Time:        2026-10-12T22:00:00.000Z (local 2026-10-12 15:00:00, America/Los_Angeles)",
        "App URL:     https://example.github.io/aa/#/diagnostic",
        "User:        aa.test@example.com",
        "Host:        Teams ios",
        "Time zone:   America/Los_Angeles (UTC-07:00)",
        "Local today: 2026-10-12",
        "Auth mode:   teams-naa",
        "Prompts:     0",
        "Write:       8.4 s from page load (run 1, first run)",
        "",
        "Operations read (TestHours): PASS (HTTP 200)",
        "  items: 3",
        "Operations edit of another user's row (TestHours): SKIPPED (HTTP 0)",
        "  no row by another user",
        "Principals read (TestFees): DENIED (HTTP 403 accessDenied)",
      ].join("\n"),
    );
  });

  it("marks reruns and missing writes", () => {
    const rerun = formatReport({ ...base, runNumber: 2 });
    expect(rerun).toContain("Write:       8.4 s from page load (run 2, not a cold start)");
    const none = formatReport({ ...base, writeElapsedMs: null });
    expect(none).toContain("Write:       no write attempted");
  });
});
