// Authentication: returns a delegated Microsoft Graph access token for the
// signed-in user. No secrets, no server.
//
// Inside Teams: MSAL nested app authentication (NAA). Teams brokers the token.
// Plain browser (development only): standard MSAL with a popup.
//
// Reference: https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/nested-authentication
// MSAL v5 notes: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md

import { app, nestedAppAuth } from "@microsoft/teams-js";
import {
  createNestablePublicClientApplication,
  createStandardPublicClientApplication,
  InteractionRequiredAuthError,
  type AccountInfo,
  type AuthenticationResult,
  type IPublicClientApplication,
} from "@azure/msal-browser";
import { authRedirectUrl, config, devAuthRedirectUrl, sharePointScopes } from "../config";

export type AuthMode = "teams-naa" | "browser";

export interface HostInfo {
  inTeams: boolean;
  // Teams host client type ("desktop", "web", "ios", "android", ...) or "browser".
  clientType: string;
  // Host's own name for itself, e.g. "Teams". Empty outside Teams.
  hostName: string;
  // Whether the Teams host recommends NAA. null outside Teams.
  naaRecommended: boolean | null;
}

export interface AuthStats {
  mode: AuthMode | null;
  // Number of times an interactive prompt was needed in this session.
  interactivePrompts: number;
  // Error code of the last silent attempt that failed, if any.
  lastSilentError: string | null;
}

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "errorCode" in error) {
    return String((error as { errorCode: unknown }).errorCode);
  }
  return error instanceof Error ? error.name : "unknown";
}

// Outside Teams, app.initialize() never hears back from a host; give up after this.
const TEAMS_INIT_TIMEOUT_MS = 4000;

interface AuthState {
  pca: IPublicClientApplication;
  host: HostInfo;
  context: app.Context | null;
}

let statePromise: Promise<AuthState> | null = null;
const stats: AuthStats = { mode: null, interactivePrompts: 0, lastSilentError: null };

async function initTeams(): Promise<app.Context | null> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), TEAMS_INIT_TIMEOUT_MS),
  );
  const init = app
    .initialize()
    .then(() => app.getContext())
    .catch(() => null);
  return Promise.race([init, timeout]);
}

async function init(): Promise<AuthState> {
  // Fail fast instead of opening a sign-in that can only time out.
  if (config.entra.clientId.includes("REPLACE_ME") || config.entra.tenantId.includes("REPLACE_ME")) {
    throw new Error(
      "Sign-in is not set up yet: the Entra app registration is missing (client and tenant ID in src/config.ts). See docs/setup/entra-app.md.",
    );
  }
  const authority = `https://login.microsoftonline.com/${config.entra.tenantId}`;

  // TeamsJS must be initialised before MSAL (Microsoft guidance).
  const context = await initTeams();

  if (context) {
    const naaRecommended = nestedAppAuth.isNAAChannelRecommended();
    const host: HostInfo = {
      inTeams: true,
      clientType: String(context.app.host.clientType),
      hostName: String(context.app.host.name),
      naaRecommended,
    };
    if (!naaRecommended) {
      // Stage 0 rule: no fallback to a token-exchange server. Report and stop.
      throw new Error(
        `Nested app authentication is not available on this Teams client (${host.clientType}).`,
      );
    }
    stats.mode = "teams-naa";
    const pca = await createNestablePublicClientApplication({
      auth: { clientId: config.entra.clientId, authority },
    });
    return { pca, host, context };
  }

  stats.mode = "browser";
  // The popup returns to a blank bridge page (auth.html), never to the app.
  // Both URIs derive from config.appUrl and must be registered in Entra.
  const redirectUri = import.meta.env.DEV ? devAuthRedirectUrl : authRedirectUrl;
  const pca = await createStandardPublicClientApplication({
    auth: { clientId: config.entra.clientId, authority, redirectUri },
    cache: { cacheLocation: "sessionStorage" },
  });
  return {
    pca,
    host: { inTeams: false, clientType: "browser", hostName: "", naaRecommended: null },
    context: null,
  };
}

function getState(): Promise<AuthState> {
  if (!statePromise) {
    statePromise = init();
    // Allow a retry after a failed initialisation.
    statePromise.catch(() => {
      statePromise = null;
    });
  }
  return statePromise;
}

function findAccount(state: AuthState): AccountInfo | null {
  const { pca, context } = state;
  const active = pca.getActiveAccount();
  if (active) return active;
  if (context?.user?.id && context.user.tenant?.id) {
    const match = pca.getAccount({
      homeAccountId: `${context.user.id}.${context.user.tenant.id}`,
    });
    if (match) return match;
  }
  if (context?.user?.loginHint) {
    const match = pca.getAccount({ loginHint: context.user.loginHint });
    if (match) return match;
  }
  return pca.getAllAccounts()[0] ?? null;
}

async function acquire(state: AuthState, scopes: string[]): Promise<AuthenticationResult> {
  const { pca, context } = state;
  const loginHint = context?.user?.loginHint;
  const account = findAccount(state);

  try {
    if (account) return await pca.acquireTokenSilent({ scopes, account });
    if (state.host.inTeams) return await pca.ssoSilent({ scopes, loginHint });
    // Plain browser with no cached account: go straight to the popup, so it
    // opens while the user's click still counts (popup blockers).
    throw Object.assign(new Error("No cached account."), { errorCode: "no_cached_account" });
  } catch (error) {
    // Silent failed: fall back to an interactive prompt. In Teams this is the
    // host's consent / sign-in dialog; in a browser it is a popup.
    // Any silent failure goes interactive (ssoSilent can fail with codes other
    // than InteractionRequiredAuthError when no account is cached). The silent
    // error code is kept so the diagnostic report shows why a prompt appeared.
    stats.lastSilentError =
      error instanceof InteractionRequiredAuthError
        ? `interaction_required: ${error.errorCode}`
        : errorCode(error);
    stats.interactivePrompts += 1;
    return await pca.acquireTokenPopup({ scopes, loginHint });
  }
}

// Concurrent callers for the same scopes share one acquisition, and
// acquisitions for different resources run one after another, so two
// prompts never overlap.
const inFlight = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();

/** Delegated token for an explicit scope set (stage 0 permission tests). */
export function getToken(scopes: readonly string[]): Promise<string> {
  const key = scopes.join(" ");
  const existing = inFlight.get(key);
  if (existing) return existing;
  const run = async () => {
    const state = await getState();
    const result = await acquire(state, [...scopes]);
    if (result.account) state.pca.setActiveAccount(result.account);
    return result.accessToken;
  };
  const p = queue.catch(() => undefined).then(run);
  queue = p;
  inFlight.set(key, p);
  p.finally(() => inFlight.delete(key)).catch(() => undefined);
  return p;
}

/** Returns a delegated Graph access token for the signed-in user. */
export function getGraphToken(): Promise<string> {
  return getToken(config.graphScopes);
}

/**
 * Returns a delegated SharePoint REST token (audience: the tenant's
 * SharePoint host) for the signed-in user. Stage 0: coordinator-correction test.
 */
export function getSharePointToken(): Promise<string> {
  return getToken(sharePointScopes);
}

/** Host information, for diagnostics. Initialises auth if needed. */
export async function getHostInfo(): Promise<HostInfo> {
  return (await getState()).host;
}

/** Counters for diagnostics. */
export function getAuthStats(): AuthStats {
  return { ...stats };
}
