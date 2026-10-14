// SharePoint list helpers over Microsoft Graph (delegated token only).
// Used by the stage 0 diagnostic and the #/log phone test screen.

import { config } from "../config";
import { graph, type GraphResult } from "./graph";

const sp = config.sharepoint;

export async function resolveSiteId(
  sitePath: string,
): Promise<{ id: string | null; result: GraphResult<{ id: string }> }> {
  const result = await graph<{ id: string }>(
    "GET",
    `/sites/${sp.hostname}:${sitePath}?$select=id`,
  );
  return { id: result.ok && result.data ? result.data.id : null, result };
}

export function listPath(siteId: string, listName: string): string {
  return `/sites/${siteId}/lists/${encodeURIComponent(listName)}`;
}

function testHoursItems(siteId: string): string {
  return `${listPath(siteId, sp.operations.lists.testHours)}/items`;
}

/** Counts items by id only, following paging. Never downloads field values. */
export async function countItems(
  siteId: string,
  listName: string,
): Promise<{ count: number | null; result: GraphResult<unknown> }> {
  type Page = { value: { id: string }[]; "@odata.nextLink"?: string };
  let next: string | undefined = `${listPath(siteId, listName)}/items?$select=id&$top=500`;
  let count = 0;
  let last: GraphResult<Page> = { ok: false, status: 0, code: null, data: null };
  while (next) {
    last = await graph<Page>("GET", next);
    if (!last.ok || !last.data) return { count: null, result: last };
    count += last.data.value.length;
    next = last.data["@odata.nextLink"];
  }
  return { count, result: last };
}

/** Site user-list id of a user, needed to set a Person field. Best effort: null if not found. */
export async function lookupPersonId(siteId: string, upn: string): Promise<string | null> {
  type Page = { value: { id: string }[] };
  const filter = encodeURIComponent(`fields/UserName eq '${upn.replace(/'/g, "''")}'`);
  const r = await graph<Page>(
    "GET",
    `${listPath(siteId, "User Information List")}/items?$select=id&$filter=${filter}`,
    undefined,
    { Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly" },
  );
  return r.ok && r.data && r.data.value.length > 0 ? r.data.value[0].id : null;
}

export interface Me {
  id: string; // Entra object id
  displayName: string;
  userPrincipalName: string;
}

/** Signed-in user. */
export async function getMe(): Promise<GraphResult<Me>> {
  return graph("GET", "/me?$select=id,displayName,userPrincipalName");
}

// ---- TestHours (AA Operations). Schema: docs/architecture/data.md ----------

export interface TestHoursRow {
  title: string;
  date: string; // YYYY-MM-DD, device-local, written to the Date column
  workDate: string; // YYYY-MM-DD, device-local, written to the WorkDate text column
  hours: number;
  personId: string | null;
}

export function createTestHoursItem(
  siteId: string,
  row: TestHoursRow,
): Promise<GraphResult<{ id: string }>> {
  const fields: Record<string, unknown> = {
    Title: row.title,
    Date: row.date,
    WorkDate: row.workDate,
    Hours: row.hours,
  };
  if (row.personId) fields.PersonLookupId = row.personId;
  return graph("POST", testHoursItems(siteId), { fields });
}

/** Date and WorkDate exactly as Graph returns them (raw strings, not parsed). */
export async function readTestHoursDates(
  siteId: string,
  itemId: string,
): Promise<GraphResult<{ date: unknown; workDate: unknown }>> {
  type Item = { fields?: { Date?: unknown; WorkDate?: unknown } };
  const r = await graph<Item>(
    "GET",
    `${testHoursItems(siteId)}/${encodeURIComponent(itemId)}?$expand=fields($select=Date,WorkDate)`,
  );
  if (!r.ok || !r.data) return { ...r, data: null };
  return {
    ...r,
    data: { date: r.data.fields?.Date ?? null, workDate: r.data.fields?.WorkDate ?? null },
  };
}

export interface OtherUserRow {
  id: string;
  title: string;
  createdBy: string; // display name or email, for the report
}

/**
 * First TestHours row created by someone other than the signed-in user.
 * Compares the creator's Entra id with the user's id, and falls back to
 * email against UPN. Null if every row is the user's own.
 */
export async function findRowByOtherUser(
  siteId: string,
  me: Me,
): Promise<{ row: OtherUserRow | null; result: GraphResult<unknown> }> {
  type User = { id?: string; email?: string; displayName?: string };
  type Item = { id: string; createdBy?: { user?: User }; fields?: { Title?: string } };
  type Page = { value: Item[]; "@odata.nextLink"?: string };
  const upn = me.userPrincipalName.toLowerCase();
  let next: string | undefined =
    `${testHoursItems(siteId)}?$select=id,createdBy&$expand=fields($select=Title)&$top=200`;
  let last: GraphResult<Page> = { ok: false, status: 0, code: null, data: null };
  while (next) {
    last = await graph<Page>("GET", next);
    if (!last.ok || !last.data) return { row: null, result: last };
    for (const item of last.data.value) {
      const user = item.createdBy?.user;
      if (!user) continue;
      const mine =
        (user.id !== undefined && user.id === me.id) ||
        (user.email !== undefined && user.email.toLowerCase() === upn);
      if (!mine) {
        return {
          row: {
            id: item.id,
            title: item.fields?.Title ?? "",
            createdBy: user.displayName || user.email || user.id || "unknown",
          },
          result: last,
        };
      }
    }
    next = last.data["@odata.nextLink"];
  }
  return { row: null, result: last };
}

export function updateTestHoursTitle(
  siteId: string,
  itemId: string,
  title: string,
): Promise<GraphResult<unknown>> {
  return graph("PATCH", `${testHoursItems(siteId)}/${encodeURIComponent(itemId)}/fields`, {
    Title: title,
  });
}

export function deleteTestHoursItem(siteId: string, itemId: string): Promise<GraphResult<unknown>> {
  return graph("DELETE", `${testHoursItems(siteId)}/${encodeURIComponent(itemId)}`);
}
