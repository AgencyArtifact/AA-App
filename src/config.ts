// Single configuration file. Values here are configuration, not secrets.
// The REPLACE_ME values are filled at setup (see docs/setup/entra-app.md and
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

  sharepoint: {
    // The Agency Artifact team site and the two lists. Identifiers only
    // (configuration, not data); the app writes only the hours list.
    siteId: "agencyartifact.sharepoint.com,6a50ff96-92db-4deb-af74-998806940b0f,05d023c3-b67d-48f8-80c6-ed197dd2d7f5",
    hoursListId: "871a053f-8b47-4eaa-8a4f-94be1a56301c",
    registerListId: "3c9990e7-c1df-4603-86db-aafa0c3251cb",
  },

  // Delegated Graph scopes requested at runtime. Must match the API
  // permissions granted in the app registration. Sites.Selected reaches only
  // the site granted to this client ID (AA-Ops docs/setup/entra.md, part C).
  graphScopes: ["User.Read", "Tasks.ReadWrite", "Sites.Selected"],
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
