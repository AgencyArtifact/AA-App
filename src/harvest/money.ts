// Money-field check for the financial boundary (CLAUDE.md). Pure, no I/O.
//
// Walks a Harvest response and reports, for every money-like key, whether it
// carries a value, is null, or is absent. It never returns a value itself.

/** Key names that can hold money in Harvest responses (rates, budgets, costs, amounts, fees). */
const MONEY_KEY = /(rate|budget|cost|amount|fee|price|revenue)/i;

export type MoneyState = "VALUE" | "null";

/**
 * Money-like keys found anywhere in `json`, with whether any occurrence holds a
 * value (a number or numeric string) or only null. Booleans and non-numeric
 * strings (flags such as notify_when_over_budget, budget_by "task") are not money.
 */
export function scanMoney(json: unknown): Map<string, MoneyState> {
  const found = new Map<string, MoneyState>();
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (MONEY_KEY.test(key)) {
        const isValue =
          typeof value === "number" || (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)));
        if (isValue) found.set(key, "VALUE");
        else if (value === null && !found.has(key)) found.set(key, "null");
      }
      if (value && typeof value === "object") walk(value);
    }
  };
  walk(json);
  return found;
}

/** One line for the report: "money: none", or each key with VALUE or null, values never shown. */
export function moneySummary(json: unknown): string {
  const found = scanMoney(json);
  if (found.size === 0) return "money fields: none";
  const parts = [...found.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, s]) => `${k} ${s}`);
  const values = [...found.values()].filter((s) => s === "VALUE").length;
  return `money fields: ${parts.join(", ")}${values > 0 ? ` (MONEY VALUES PRESENT: ${values} keys)` : ""}`;
}
