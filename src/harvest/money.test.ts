import { describe, expect, it } from "vitest";
import { moneySummary, scanMoney } from "./money";

// Fictional figures only (public repo).
describe("scanMoney", () => {
  it("finds values at any depth, never returning them", () => {
    const r = scanMoney({
      project_assignments: [
        { hourly_rate: 150, budget: null, task_assignments: [{ budget: "4000.0", billable: true }] },
      ],
    });
    expect(Object.fromEntries(r)).toEqual({ hourly_rate: "VALUE", budget: "VALUE" });
  });

  it("reports null-only keys as null", () => {
    expect(Object.fromEntries(scanMoney({ cost_rate: null }))).toEqual({ cost_rate: "null" });
  });

  it("ignores flags and non-numeric strings", () => {
    const r = scanMoney({ notify_when_over_budget: true, budget_by: "task", budget_is_monthly: false });
    expect(r.size).toBe(0);
  });
});

describe("moneySummary", () => {
  it("says none", () => {
    expect(moneySummary({ id: 1, hours: 0.5 })).toBe("money fields: none");
  });
  it("flags values without printing them", () => {
    const s = moneySummary({ billable_rate: 150, cost_rate: null });
    expect(s).toBe("money fields: billable_rate VALUE, cost_rate null (MONEY VALUES PRESENT: 1 keys)");
    expect(s).not.toContain("150");
  });
});
