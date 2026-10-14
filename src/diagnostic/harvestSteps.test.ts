import { describe, expect, it } from "vitest";
import { identityCheck, isProject } from "./harvestSteps";

// Fictional addresses only (public repo).
describe("identityCheck", () => {
  it("matches ignoring case and spaces", () => {
    expect(identityCheck("Test.User@example.test ", "test.user@example.test")).toMatch(/MATCH/);
    expect(identityCheck("Test.User@example.test", "test.user@example.test")).not.toMatch(/MISMATCH/);
  });
  it("flags another person", () => {
    expect(identityCheck("boss@example.test", "test.user@example.test")).toMatch(/MISMATCH/);
  });
  it("never prints an address", () => {
    expect(identityCheck("boss@example.test", "test.user@example.test")).not.toContain("@");
  });
  it("reports unknowns", () => {
    expect(identityCheck(undefined, "a@example.test")).toMatch(/absent/);
    expect(identityCheck("a@example.test", null)).toMatch(/unknown/);
  });
});

describe("isProject", () => {
  it.each([
    [{ code: "ZT-01", name: "ZT-01 Test Project" }, true],
    [{ code: null, name: "ZT-01 Test Project" }, true],
    [{ code: "", name: "Other" }, false],
    [{ code: "ZT-02", name: "ZT-02 Unassigned" }, false],
  ] as const)("%o is ZT-01: %s", (p, expected) => {
    expect(isProject(p, "ZT-01")).toBe(expected);
  });
});
