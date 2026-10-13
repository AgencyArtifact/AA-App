// Prints the exact values to enter in the Entra app registration, derived
// from config.appUrl in src/config.ts. Usage: npm run entra:values

import {
  appHost,
  authRedirectUrl,
  config,
  devAuthRedirectUrl,
  naaRedirectUri,
  privacyUrl,
  tabUrls,
  termsUrl,
} from "../src/config.ts";

console.log(`App address (config.appUrl): ${config.appUrl}

Entra > App registrations > Agency Artifact
  Platform: Single-page application (SPA). Redirect URIs, exactly:
    ${naaRedirectUri}
    ${authRedirectUrl}
    ${devAuthRedirectUrl}
  Application ID URI: none (leave "Expose an API" empty)
  Delegated Microsoft Graph permissions: ${config.graphScopes.join(", ")}

Teams manifest (built by npm run teams:package)
  validDomains:   ${appHost}
  Home tab:       ${tabUrls.home}
  Diagnostic tab: ${tabUrls.diagnostic}
  Privacy:        ${privacyUrl}
  Terms:          ${termsUrl}`);
