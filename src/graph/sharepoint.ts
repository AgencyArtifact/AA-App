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
export function countItems(
  siteId: string,
  listName: string,
): Promise<{ count: number | null; result: GraphResult<unknown> }> {
  return countAt(`${listPath(siteId, listName)}/items`);
}

/**
 * Counts the items at any Graph list-items address (by site id, by path or
 * by list id), requesting ids only, following paging.
 */
export async function countAt(
  itemsAddress: string,
): Promise<{ count: number | null; result: GraphResult<unknown> }> {
  type Page = { value: { id: string }[]; "@odata.nextLink"?: string };
  let next: string | undefined = `${itemsAddress}?$select=id&$top=500`;
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

export interface RowCreator {
  id?: string; // Entra object id
  email?: string;
  displayName?: string;
}

export interface HoursRow {
  id: string;
  title: string;
  createdBy: RowCreator | null;
}

/** Every TestHours row with its id, Title and creator, following paging. */
export async function listTestHoursRows(
  siteId: string,
): Promise<{ rows: HoursRow[] | null; result: GraphResult<unknown> }> {
  type Item = { id: string; createdBy?: { user?: RowCreator }; fields?: { Title?: string } };
  type Page = { value: Item[]; "@odata.nextLink"?: string };
  let next: string | undefined =
    `${testHoursItems(siteId)}?$select=id,createdBy&$expand=fields($select=Title)&$top=200`;
  let last: GraphResult<Page> = { ok: false, status: 0, code: null, data: null };
  const rows: HoursRow[] = [];
  while (next) {
    last = await graph<Page>("GET", next);
    if (!last.ok || !last.data) return { rows: null, result: last };
    for (const item of last.data.value) {
      rows.push({ id: item.id, title: item.fields?.Title ?? "", createdBy: item.createdBy?.user ?? null });
    }
    next = last.data["@odata.nextLink"];
  }
  return { rows, result: last };
}

export function updateTestHoursTitle(
  siteId: string,
  itemId: string,
  title: string,
  scopes?: readonly string[],
): Promise<GraphResult<unknown>> {
  return graph(
    "PATCH",
    `${testHoursItems(siteId)}/${encodeURIComponent(itemId)}/fields`,
    { Title: title },
    {},
    scopes,
  );
}

export function deleteTestHoursItem(
  siteId: string,
  itemId: string,
  scopes?: readonly string[],
): Promise<GraphResult<unknown>> {
  return graph("DELETE", `${testHoursItems(siteId)}/${encodeURIComponent(itemId)}`, undefined, {}, scopes);
}

// ---- Boundary routes (stage 0). Ids and counts only, never field values. ---

/** Items address of a list through the site's server-relative path, no site id needed. */
export function listItemsByPath(sitePath: string, listName: string): string {
  return `/sites/${sp.hostname}:${sitePath}:/lists/${encodeURIComponent(listName)}/items`;
}

/** Items address of a list by site id and list id (GUID). */
export function listItemsById(siteId: string, listId: string): string {
  return `/sites/${siteId}/lists/${encodeURIComponent(listId)}/items`;
}

/** The list's id (GUID). Requests the id only. */
export async function getListId(
  siteId: string,
  listName: string,
): Promise<GraphResult<{ id: string }>> {
  return graph("GET", `${listPath(siteId, listName)}?$select=id`);
}

/**
 * Microsoft Search over list items, as the signed-in user. Returns only the
 * total and each hit's address. The response also carries text snippets,
 * which are parsed in memory and dropped here: never shown, stored or logged.
 */
export async function searchListItems(
  queryString: string,
): Promise<GraphResult<{ total: number; webUrls: (string | undefined)[] }>> {
  type Hit = { resource?: { webUrl?: string } };
  type Response = { value?: { hitsContainers?: { total?: number; hits?: Hit[] }[] }[] };
  const r = await graph<Response>("POST", "/search/query", {
    requests: [
      { entityTypes: ["listItem"], query: { queryString }, fields: ["id", "webUrl"], size: 25 },
    ],
  });
  if (!r.ok || !r.data) return { ...r, data: null };
  const containers = r.data.value?.[0]?.hitsContainers ?? [];
  const hits = containers.flatMap((c) => c.hits ?? []);
  const total = containers.reduce((n, c) => n + (c.total ?? 0), 0);
  return { ...r, data: { total, webUrls: hits.map((h) => h.resource?.webUrl) } };
}
