// Minimal Harvest API v2 caller. Uses the session from src/auth/harvestAuth.ts.
// Never logs request or response bodies (they can hold money values).
// Docs: https://help.getharvest.com/api-v2/
// No User-Agent header: browsers forbid setting it (docs/findings.md).

import { getHarvestSession } from "../auth/harvestAuth";

const HARVEST_BASE = "https://api.harvestapp.com/v2";

export interface HarvestResult<T> {
  ok: boolean;
  // HTTP status; 0 when the request never got a response (network error).
  status: number;
  // Harvest's error message on failure ("message", or "error: error_description").
  message: string | null;
  data: T | null;
}

export async function harvest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<HarvestResult<T>> {
  const session = getHarvestSession();
  if (!session) return { ok: false, status: 0, message: "Not connected to Harvest (or token expired).", data: null };
  let response: Response;
  try {
    response = await fetch(`${HARVEST_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Harvest-Account-Id": session.accountId,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    return { ok: false, status: 0, message: `network error: ${(error as Error).message}`, data: null };
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
  if (response.ok) return { ok: true, status: response.status, message: null, data: json as T };
  const e = (json ?? {}) as { message?: string; error?: string; error_description?: string };
  const message =
    e.message ?? (e.error ? `${e.error}${e.error_description ? `: ${e.error_description}` : ""}` : text.slice(0, 200) || null);
  return { ok: false, status: response.status, message, data: null };
}

// ---- Response shapes (only the fields the diagnostic reads) ---------------

export interface HarvestMe {
  id: number;
  first_name: string;
  last_name: string;
  access_roles?: string[];
}

export interface HarvestProjectAssignment {
  project: { id: number; name: string; code: string | null };
  task_assignments: { task: { id: number; name: string } }[];
}

export interface HarvestTimeEntry {
  id: number;
  user: { id: number };
}
