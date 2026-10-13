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

/** Signed-in user's UPN. */
export async function getMe(): Promise<
  GraphResult<{ displayName: string; userPrincipalName: string }>
> {
  return graph("GET", "/me?$select=displayName,userPrincipalName");
}

export interface TestHoursRow {
  date: string; // YYYY-MM-DD
  hours: number;
  personId: string | null;
  title: string;
}

export function createTestHoursItem(
  siteId: string,
  row: TestHoursRow,
): Promise<GraphResult<{ id: string }>> {
  const fields: Record<string, unknown> = {
    Title: row.title,
    Date: row.date,
    Hours: row.hours,
  };
  if (row.personId) fields.PersonLookupId = row.personId;
  return graph("POST", `${listPath(siteId, sp.operations.lists.testHours)}/items`, { fields });
}

export function deleteTestHoursItem(siteId: string, itemId: string): Promise<GraphResult<unknown>> {
  return graph(
    "DELETE",
    `${listPath(siteId, sp.operations.lists.testHours)}/items/${encodeURIComponent(itemId)}`,
  );
}
