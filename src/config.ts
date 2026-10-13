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
    clientId: "REPLACE_ME_CLIENT_ID",
    // Directory (tenant) ID of the Agency Artifact tenant.
    tenantId: "REPLACE_ME_TENANT_ID",
  },

  sharepoint: {
    // Example: "agencyartifact.sharepoint.com"
    hostname: "REPLACE_ME.sharepoint.com",
    operations: {
      sitePath: "/sites/AAOperations",
      lists: {
        testHours: "TestHours",
      },
    },
    principals: {
      sitePath: "/sites/AAPrincipals",
      lists: {
        testFees: "TestFees",
      },
    },
  },

  teamsApp: {
    // Teams app ID (manifest "id"). Not an Entra value. Generated once; keep stable.
    id: "355c44aa-e3e3-4cea-a336-ecf8e6fe74fe",
    // Bump on every package uploaded to the org catalog (semver).
    version: "0.0.1",
    // The firm's public website (manifest developer.websiteUrl).
    developerWebsiteUrl: "REPLACE_ME_FIRM_WEBSITE",
  },

  // Delegated Graph scopes requested at runtime. Must match the API
  // permissions granted in the app registration.
  graphScopes: ["User.Read", "Sites.ReadWrite.All"],
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

export const privacyUrl = `${config.appUrl}privacy.html`;
export const termsUrl = `${config.appUrl}terms.html`;

export const tabUrls = {
  home: `${config.appUrl}#/`,
  diagnostic: `${config.appUrl}#/diagnostic`,
} as const;
