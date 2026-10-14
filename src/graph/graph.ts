// Minimal Microsoft Graph caller. Delegated token only (see src/auth/graphAuth.ts).
// Never logs request or response bodies: some lists hold financial data.

import { getGraphToken, getToken } from "../auth/graphAuth";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export interface GraphResult<T> {
  ok: boolean;
  // HTTP status; 0 when the request never got a response (network error).
  status: number;
  // Graph error code from the response body, e.g. "accessDenied".
  code: string | null;
  data: T | null;
}

export async function graph<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  pathOrUrl: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {},
  // Explicit scopes for a permission test; token failures then become a result, not a throw.
  scopes?: readonly string[],
): Promise<GraphResult<T>> {
  let token: string;
  if (scopes) {
    try {
      token = await getToken(scopes);
    } catch (error) {
      const e = error as { errorCode?: string; message?: string };
      return { ok: false, status: 0, code: `token: ${e.errorCode || e.message || String(error)}`, data: null };
    }
  } else {
    token = await getGraphToken();
  }
  const url = pathOrUrl.startsWith("https://") ? pathOrUrl : `${GRAPH_BASE}${pathOrUrl}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, code: "networkError", data: null };
  }

  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (response.ok) {
    return { ok: true, status: response.status, code: null, data: json as T };
  }
  const code =
    (json as { error?: { code?: string } } | null)?.error?.code ?? null;
  return { ok: false, status: response.status, code, data: null };
}
