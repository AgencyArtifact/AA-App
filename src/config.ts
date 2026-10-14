// Single configuration file. Values here are configuration, not secrets.
// Galileo fills the REPLACE_ME values (see docs/setup/entra-app.md and
// docs/setup/deploy.md).
//
// This file is also read by the Node scripts in tools/ (Node type
// stripping), so keep it to plain declarations: no enums, no namespaces,
// no imports.

export const config = {
  // THE address of the app, with trailing slash. Every other address
  // (Entra redirect URIs, Teams manifest URLs and domains, privacy and terms
  // pages, the build's base path) is derived from it below.
  // Switching domain = edit this line, then follow "Switching the domain"
  // in docs/setup/deploy.md.
  appUrl: "https://agencyartifact.github.io/AA-App/",

  entra: {
    // Application (client) ID of the "Agency Artifact" registration.
    clientId: "503412e0-1cec-47b4-8a28-888cda0c8493",
    // Directory (tenant) ID of the Agency Artifact tenant.
    tenantId: "6a257495-c628-470a-855d-94ccaedc4d7a",
  },

  teamsApp: {
    // Teams app ID (manifest "id"). Not an Entra value. Generated once; keep stable.
    id: "355c44aa-e3e3-4cea-a336-ecf8e6fe74fe",
    // Bump on every package uploaded to the org catalog (semver).
    version: "0.0.1",
    // The firm's public website (manifest developer.websiteUrl).
    developerWebsiteUrl: "https://www.agencyartifact.com/",
  },

  harvest: {
    // Client ID of the Harvest OAuth2 application (Harvest ID > Developers).
    // Configuration, not a secret. No client secret in stage 1.
    // See docs/setup/harvest.md.
    clientId: "7ky2cvu3dJ9d5EiFTuz5aIsF",
    // Stage 1 diagnostic test IDs (fictional test account). A Member cannot
    // look these up, so Galileo's Administrator run of the diagnostic prints
    // them; paste them here. Empty = the step is skipped.
    test: {
      // Project ID of "ZT-02 Unassigned" (aa.test not assigned).
      unassignedProjectId: "49428945",
      // Galileo's Harvest user ID, for "Harvest other person's time".
      otherUserId: "5759248",
    },
  },

  // Delegated Graph scopes requested at runtime. Must match the API
  // permissions granted in the app registration.
  graphScopes: ["User.Read"],
} as const;

// ---- Derived addresses. Do not edit; edit config.appUrl. ----------------

if (!config.appUrl.endsWith("/")) {
  throw new Error("config.appUrl must end with '/'.");
}
const parsedAppUrl = new URL(config.appUrl);

/** Origin, e.g. "https://agencyartifact.github.io". */
export const appOrigin = parsedAppUrl.origin;
/** Host only, e.g. "agencyartifact.github.io". */
export const appHost = parsedAppUrl.host;
/** Path the app is served under, e.g. "/AA-App/" (or "/" on a custom subdomain). */
export const appBasePath = parsedAppUrl.pathname;

/** Entra SPA redirect URI for nested app authentication inside Teams. */
export const naaRedirectUri = `brk-multihub://${appHost}`;
/** Entra SPA redirect URI for browser popup sign-in (blank bridge page). */
export const authRedirectUrl = `${config.appUrl}auth.html`;
/** Same, for local development with `npm run dev`. */
export const devAuthRedirectUrl = `http://localhost:5173${appBasePath}auth.html`;
// No Application ID URI: nested app authentication needs no exposed API.

/** Harvest OAuth2 Redirect URL, and start page of the Harvest sign-in popup.
 *  Must equal the Redirect URL registered in Harvest (docs/setup/harvest.md). */
export const harvestAuthUrl = `${config.appUrl}harvest-auth.html`;

export const privacyUrl = `${config.appUrl}privacy.html`;
export const termsUrl = `${config.appUrl}terms.html`;

export const tabUrls = {
  home: `${config.appUrl}#/`,
  diagnostic: `${config.appUrl}#/diagnostic`,
} as const;
