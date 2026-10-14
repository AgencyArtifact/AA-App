// Harvest sign-in (stage 1, T2). Interface I2 in docs/architecture/overview.md.
//
// Harvest's client-side OAuth2 flow (response_type=token): no secret, no
// server, no refresh token. One page, harvest-auth.html, is both the start
// page of the popup (it redirects to Harvest) and the Redirect URL Harvest
// returns to.
//
// Inside Teams the popup is opened with authentication.authenticate(); the
// start page must be on the app's domain (already in validDomains), and the
// Harvest domain need not be listed. Source:
// https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/auth-tab-aad
// In a plain browser it is a normal popup that answers with postMessage.
//
// Money and secrets rule (CLAUDE.md): the token is held in a module variable
// only. Never in local or session storage, IndexedDB, the URL or logs. The
// popup hands it back directly (notifySuccess or postMessage), not through
// storage as Microsoft's sample does.
//
// Harvest docs: https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/

import { app, authentication } from "@microsoft/teams-js";
import { appOrigin, config, harvestAuthUrl } from "../config";

export interface HarvestSession {
  accessToken: string;
  /** Harvest account ID to send as Harvest-Account-Id. */
  accountId: string;
  /** Every Harvest account ID the token grants, from the scope. */
  accountIds: string[];
  /** Epoch milliseconds. */
  expiresAt: number;
}

type PopupMode = "teams" | "browser";

/** What the popup page hands back to the app. */
export type PopupResult =
  | { ok: true; accessToken: string; expiresIn: number; scope: string; state: string }
  | { ok: false; error: string; state: string };

const AUTHORIZE_URL = "https://id.getharvest.com/oauth2/authorize";
const MESSAGE_TYPE = "aa-harvest-auth";
const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;

let session: HarvestSession | null = null;

// ---- Pure helpers (tested in harvestAuth.test.ts) -------------------------

/** Parameters from both the query and the fragment: Harvest's docs do not say which it uses. */
export function readParams(url: string): URLSearchParams {
  const u = new URL(url);
  const params = new URLSearchParams(u.search);
  for (const [k, v] of new URLSearchParams(u.hash.replace(/^#/, ""))) params.set(k, v);
  return params;
}

/** Harvest account IDs in a scope such as "harvest:123 forecast:456". "harvest:all" and "all" name none. */
export function harvestAccountIds(scope: string): string[] {
  return scope
    .split(/\s+/)
    .map((s) => /^harvest:(\d+)$/.exec(s)?.[1])
    .filter((id): id is string => Boolean(id));
}

/** The state carries the popup mode, so the callback knows how to answer. */
export function makeState(mode: PopupMode, nonce: string): string {
  return `${mode}.${nonce}`;
}

export function modeFromState(state: string): PopupMode {
  return state.startsWith("teams.") ? "teams" : "browser";
}

export function authorizeUrl(clientId: string, state: string, redirectUri: string): string {
  const q = new URLSearchParams({
    client_id: clientId,
    response_type: "token",
    state,
    redirect_uri: redirectUri,
  });
  return `${AUTHORIZE_URL}?${q}`;
}

/** Turns the callback's parameters into a result for the app. */
export function popupResult(params: URLSearchParams): PopupResult {
  const state = params.get("state") ?? "";
  const accessToken = params.get("access_token");
  if (params.get("error") || !accessToken) {
    const error = params.get("error") ?? "no_access_token";
    const description = params.get("error_description");
    return { ok: false, error: description ? `${error}: ${description}` : error, state };
  }
  return {
    ok: true,
    accessToken,
    expiresIn: Number(params.get("expires_in") ?? "0"),
    scope: params.get("scope") ?? "",
    state,
  };
}

/** Checks a popup result against the state the app sent, and builds the session. */
export function sessionFrom(result: PopupResult, expectedState: string, now: number): HarvestSession {
  if (result.state !== expectedState) throw new Error("Harvest sign-in: state does not match.");
  if (!result.ok) throw new Error(`Harvest sign-in failed: ${result.error}`);
  const accountIds = harvestAccountIds(result.scope);
  if (accountIds.length === 0) {
    // "harvest:all" or no scope: the account ID would need id.getharvest.com,
    // a link not proved yet. Report rather than build around it.
    throw new Error(`Harvest sign-in: no account ID in scope "${result.scope}".`);
  }
  return {
    accessToken: result.accessToken,
    accountId: accountIds[0],
    accountIds,
    expiresAt: now + result.expiresIn * 1000,
  };
}

// ---- App side -------------------------------------------------------------

/** The current Harvest session, or null if not connected or expired. */
export function getHarvestSession(): HarvestSession | null {
  if (session && Date.now() >= session.expiresAt) session = null;
  return session;
}

export function clearHarvestSession(): void {
  session = null;
}

function startUrl(state: string): string {
  return `${harvestAuthUrl}?${new URLSearchParams({ start: "1", state })}`;
}

function parseResult(raw: string): PopupResult {
  return JSON.parse(raw) as PopupResult;
}

async function openTeamsPopup(state: string): Promise<PopupResult> {
  try {
    const raw = await authentication.authenticate({
      url: startUrl(state),
      width: POPUP_WIDTH,
      height: POPUP_HEIGHT,
    });
    return parseResult(raw);
  } catch (error) {
    // Teams rejects with the reason given to notifyFailure, or its own
    // (CancelledByUser, FailedToOpenWindow).
    const reason = error instanceof Error ? error.message : String(error);
    try {
      return parseResult(reason);
    } catch {
      return { ok: false, error: reason, state };
    }
  }
}

function openBrowserPopup(state: string): Promise<PopupResult> {
  return new Promise((resolve) => {
    const popup = window.open(
      startUrl(state),
      "aa-harvest-auth",
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT}`,
    );
    if (!popup) {
      resolve({ ok: false, error: "FailedToOpenWindow", state });
      return;
    }
    const done = (result: PopupResult) => {
      window.removeEventListener("message", onMessage);
      clearInterval(closedTimer);
      resolve(result);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== appOrigin || event.data?.type !== MESSAGE_TYPE) return;
      done(event.data.result as PopupResult);
    };
    window.addEventListener("message", onMessage);
    const closedTimer = setInterval(() => {
      if (popup.closed) done({ ok: false, error: "CancelledByUser", state });
    }, 500);
  });
}

/**
 * Connects Harvest for the signed-in person. Call from a click: the popup
 * must open while the click still counts (popup blockers).
 * inTeams comes from the host check the app already made (graphAuth).
 */
export async function connectHarvest(inTeams: boolean): Promise<HarvestSession> {
  if (config.harvest.clientId.includes("REPLACE_ME")) {
    throw new Error(
      "Harvest sign-in is not set up yet: the Harvest client ID is missing in src/config.ts. See docs/setup/harvest.md.",
    );
  }
  const state = makeState(inTeams ? "teams" : "browser", crypto.randomUUID());
  const result = inTeams ? await openTeamsPopup(state) : await openBrowserPopup(state);
  session = sessionFrom(result, state, Date.now());
  return session;
}

// ---- Popup side (harvest-auth.html) ---------------------------------------

/** Entry point of harvest-auth.html: start the flow, or hand the result back. */
export async function runHarvestAuthPage(): Promise<void> {
  const params = readParams(window.location.href);

  if (params.get("start") === "1") {
    window.location.replace(
      authorizeUrl(config.harvest.clientId, params.get("state") ?? "", harvestAuthUrl),
    );
    return;
  }

  const result = popupResult(params);
  // The token leaves the address bar before anything else runs.
  history.replaceState(null, "", window.location.pathname);

  if (modeFromState(result.state) === "teams") {
    await app.initialize();
    if (result.ok) authentication.notifySuccess(JSON.stringify(result));
    else authentication.notifyFailure(JSON.stringify(result));
    return;
  }

  window.opener?.postMessage({ type: MESSAGE_TYPE, result }, appOrigin);
  window.close();
}
