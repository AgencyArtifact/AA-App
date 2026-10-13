import { describe, expect, it } from "vitest";
import { classify, formatReport, type DiagnosticReport } from "./report";

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

describe("formatReport", () => {
  it("produces the fixed plain-text layout", () => {
    const report: DiagnosticReport = {
      timestamp: "2026-10-12T22:00:00.000Z (local 2026-10-12 15:00, America/Los_Angeles)",
      appUrl: "https://example.github.io/aa/#/diagnostic",
      user: "aa.test@example.com",
      host: "Teams ios",
      authMode: "teams-naa",
      interactivePrompts: 0,
      lastSilentError: null,
      fatalError: null,
      steps: [
        { name: "Operations read (TestHours)", outcome: "PASS", httpStatus: 200, graphCode: null, detail: "items: 3" },
        { name: "Principals read (TestFees)", outcome: "DENIED", httpStatus: 403, graphCode: "accessDenied", detail: "" },
      ],
    };
    expect(formatReport(report)).toBe(
      [
        "Agency Artifact - stage 0 diagnostic",
        "Time:        2026-10-12T22:00:00.000Z (local 2026-10-12 15:00, America/Los_Angeles)",
        "App URL:     https://example.github.io/aa/#/diagnostic",
        "User:        aa.test@example.com",
        "Host:        Teams ios",
        "Auth mode:   teams-naa",
        "Prompts:     0",
        "",
        "Operations read (TestHours): PASS (HTTP 200)",
        "  items: 3",
        "Principals read (TestFees): DENIED (HTTP 403 accessDenied)",
      ].join("\n"),
    );
  });
});
