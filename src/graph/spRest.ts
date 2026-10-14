// Minimal SharePoint REST caller. Delegated SharePoint token only
// (getSharePointToken). Same result shape as graph.ts, so the diagnostic
// reports both the same way. Never logs request or response bodies.
//
// Stage 0: tests coordinator corrections through the API the SharePoint
// interface itself uses (docs/architecture/data.md, Access routes).

import { getSharePointToken } from "../auth/graphAuth";
import { siteRestBase } from "../config";
import type { GraphResult } from "./graph";

export async function spRest<T>(
  method: "GET" | "POST",
  sitePath: string,
  path: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<GraphResult<T>> {
  let token: string;
  try {
    token = await getSharePointToken();
  } catch (error) {
    const e = error as { errorCode?: string; message?: string };
    return { ok: false, status: 0, code: `token: ${e.errorCode || e.message || String(error)}`, data: null };
  }
  const send = () =>
    fetch(`${siteRestBase(sitePath)}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json;odata=nometadata",
        ...(body !== undefined ? { "Content-Type": "application/json;odata=nometadata" } : {}),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  let response: Response;
  let firstFailure = "";
  try {
    response = await send();
  } catch (first) {
    // A browser reports a cross-origin response without CORS headers the same
    // way as a network failure, with no status. Keep the message, retry once.
    firstFailure = `first attempt failed (${(first as Error).message || String(first)}), retried: `;
    try {
      response = await send();
    } catch (second) {
      return {
        ok: false,
        status: 0,
        code: `networkError (CORS or network): ${firstFailure}${(second as Error).message || String(second)}`,
        data: null,
      };
    }
  }
  if (firstFailure) retryNotes.push(`${path.split("?")[0]}: ${firstFailure}HTTP ${response.status}`);

  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (response.ok) return { ok: true, status: response.status, code: null, data: json as T };
  type SpError = { "odata.error"?: { code?: string }; error?: { code?: string } };
  const err = json as SpError | null;
  const code = err?.["odata.error"]?.code ?? err?.error?.code ?? null;
  return { ok: false, status: response.status, code, data: null };
}

// Calls that only worked on the retry, for the diagnostic report.
const retryNotes: string[] = [];

/** Returns and clears the notes about calls that needed a retry. */
export function takeRetryNotes(): string[] {
  return retryNotes.splice(0);
}

/** Basic site read: the web's Title. */
export function spWebTitle(sitePath: string): Promise<GraphResult<{ Title: string }>> {
  return spRest("GET", sitePath, "/web?$select=Title");
}

const listByTitle =(title: string) => `/web/lists/getbytitle('${title.replace(/'/g, "''")}')`;

/** Counts list items by Id only. */
export async function spCountItems(
  sitePath: string,
  listTitle: string,
): Promise<{ count: number | null; result: GraphResult<unknown> }> {
  const r = await spRest<{ value: { Id: number }[] }>("GET", sitePath, `${listByTitle(listTitle)}/items?$select=Id&$top=5000`);
  return { count: r.ok && r.data ? r.data.value.length : null, result: r };
}

/** Sets a list item's Title (MERGE, as the classic interface does). */
export function spUpdateTitle(
  sitePath: string,
  listTitle: string,
  itemId: string,
  title: string,
): Promise<GraphResult<unknown>> {
  return spRest("POST", sitePath, `${listByTitle(listTitle)}/items(${Number(itemId)})`, { Title: title }, {
    "X-HTTP-Method": "MERGE",
    "IF-MATCH": "*",
  });
}

/** Moves a list item to the recycle bin, as the interface's Delete does. */
export function spRecycleItem(
  sitePath: string,
  listTitle: string,
  itemId: string,
): Promise<GraphResult<unknown>> {
  return spRest("POST", sitePath, `${listByTitle(listTitle)}/items(${Number(itemId)})/recycle()`);
}
