// The AA Hours list through Graph, delegated, scope Sites.Selected plus the
// site grant (Blueprint B3). One job: upsert the signed-in person's row for a
// task and a day. Never deletes, never writes the script's columns, never
// touches milestone tasks. No money anywhere near this file.
// SOP: AA-Ops architecture/hours-list.md and architecture/app.md.
// Link test L2: AA-Ops tools/check_graph_app.md.

import { config } from "../config";
import { buildRowFields, odataString, type HoursEntry } from "../tasks/hoursRules";
import { graph, type GraphResult } from "./graph";

interface ListItem {
  id: string;
  createdBy?: { user?: { email?: string; displayName?: string } };
  fields?: Record<string, unknown>;
}

interface Page<T> {
  value: T[];
}

export interface SaveResult {
  ok: boolean;
  action: "created" | "updated" | null;
  /** The list item ID, as a string, when known. */
  itemId: string | null;
  /** HTTP statuses in order, for the Link record (L2): "GET 200, POST 201, GET 200". */
  trace: string;
  /** createdBy email from the read-back; proves the row is the user's own. */
  createdBy: string | null;
  error: string | null;
}

const base = `/sites/${config.sharepoint.siteId}/lists/${config.sharepoint.hoursListId}/items`;

function describe(r: GraphResult<unknown>): string {
  return `HTTP ${r.status}${r.code ? ` ${r.code}` : ""}${r.message ? `: ${r.message}` : ""}`;
}

/**
 * Upsert one AA Hours row on its key (the Title column): read by filter, then
 * POST when no row exists or PATCH the one row found. Two or more rows for one
 * key is an error the app shows and never resolves by writing (hours-list.md, rule 1).
 */
export async function saveHours(entry: HoursEntry): Promise<SaveResult> {
  const built = buildRowFields(entry);
  if (!built.fields) return { ok: false, action: null, itemId: null, trace: "", createdBy: null, error: built.error };
  const fields = built.fields;
  const trace: string[] = [];

  // 1. Find the row. Title is indexed and unique, so the filter is exact.
  const filter = `fields/Title%20eq%20'${encodeURIComponent(odataString(fields.Title))}'`;
  const found = await graph<Page<ListItem>>("GET", `${base}?$expand=fields&$filter=${filter}`);
  trace.push(`GET ${found.status}`);
  if (!found.ok || !found.data) {
    return { ok: false, action: null, itemId: null, trace: trace.join(", "), createdBy: null, error: `Could not read the hours list (${describe(found)})` };
  }
  const rows = found.data.value;
  if (rows.length > 1) {
    return {
      ok: false,
      action: null,
      itemId: null,
      trace: trace.join(", "),
      createdBy: null,
      error: `${rows.length} rows exist for this key; nothing written. The list needs a hand fix (items ${rows.map((r) => r.id).join(", ")}).`,
    };
  }

  // 2. Create or update.
  let itemId: string;
  let action: "created" | "updated";
  if (rows.length === 0) {
    const created = await graph<ListItem>("POST", base, { fields });
    trace.push(`POST ${created.status}`);
    if (!created.ok || !created.data) {
      return { ok: false, action: null, itemId: null, trace: trace.join(", "), createdBy: null, error: `Could not create the row (${describe(created)})` };
    }
    itemId = created.data.id;
    action = "created";
  } else {
    itemId = rows[0].id;
    const updated = await graph<Record<string, unknown>>("PATCH", `${base}/${itemId}/fields`, fields);
    trace.push(`PATCH ${updated.status}`);
    if (!updated.ok) {
      return { ok: false, action: null, itemId, trace: trace.join(", "), createdBy: null, error: `Could not update row ${itemId} (${describe(updated)})` };
    }
    action = "updated";
  }

  // 3. Read back: the values written and who created the row.
  const back = await graph<ListItem>("GET", `${base}/${itemId}?$expand=fields`);
  trace.push(`GET ${back.status}`);
  if (!back.ok || !back.data) {
    return { ok: true, action, itemId, trace: trace.join(", "), createdBy: null, error: `Saved, but could not read row ${itemId} again (${describe(back)})` };
  }
  const f = back.data.fields ?? {};
  const mismatch = (["Title", "WorkDate", "Hours", "SyncStatus"] as const).filter((k) => f[k] !== fields[k]);
  return {
    ok: true,
    action,
    itemId,
    trace: trace.join(", "),
    createdBy: back.data.createdBy?.user?.email?.toLowerCase() ?? null,
    error: mismatch.length ? `Saved, but the read-back differs on ${mismatch.join(", ")}.` : null,
  };
}
