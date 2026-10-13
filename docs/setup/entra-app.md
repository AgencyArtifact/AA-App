# Entra app registration (stage 0, task T1)

Performed by Galileo in the Microsoft Entra admin center, **after the domain is
confirmed**. About 10 minutes. Result: a client ID and a tenant ID, pasted
into `src/config.ts`.

What this registration is: a **single-tenant single-page application** that
signs users in and calls Microsoft Graph **as the signed-in user** (delegated).
It has no client secret, no certificate, no application permissions and no
Application ID URI. Do not add any.

## The values come from config

Every address below is derived from one value, `config.appUrl` in
`src/config.ts`. To print the exact values for the address currently
configured, run:

```powershell
npm run entra:values
```

With the current `appUrl` (`https://agencyartifact.github.io/AA-App/`) the
values are:

| What | Value | What it is for |
|---|---|---|
| SPA redirect URI | `brk-multihub://agencyartifact.github.io` | Inside Teams. Lets Teams broker the sign-in for the app (nested app authentication). Domain only, no path. |
| SPA redirect URI | `https://agencyartifact.github.io/AA-App/auth.html` | Plain browser only (testing outside Teams). The sign-in popup returns to this blank page, which hands the result back to the app and closes. |
| SPA redirect URI | `http://localhost:5173/AA-App/auth.html` | Same, for local development with `npm run dev`. |
| Application ID URI | **none** | Not needed: the app does not expose an API of its own. |
| Delegated Graph permissions | `User.Read`, `Sites.ReadWrite.All` | Read the signed-in user's name; read and write list items in the sites that user can already open. |

If `appUrl` changes (custom subdomain), the three redirect URIs change. Follow
*Switching the domain* in `docs/setup/deploy.md`.

## Steps

### 1. Register the app

1. Open <https://entra.microsoft.com> and sign in with your Global Admin account.
2. Go to **Entra ID** > **App registrations** > **New registration**.
3. **Name:** `Agency Artifact`
4. **Supported account types:** *Accounts in this organizational directory only (single tenant)*.
5. **Redirect URI:** platform **Single-page application (SPA)**, value: the
   `brk-multihub://` URI from `npm run entra:values`.
6. Select **Register**.

### 2. Copy the IDs into the config file

On the app's **Overview** page copy:

- **Application (client) ID** → `config.entra.clientId` in `src/config.ts`
- **Directory (tenant) ID** → `config.entra.tenantId` in `src/config.ts`

### 3. Add the browser redirect URIs

1. In the app, open **Authentication**.
2. Under the **Single-page application** platform, select **Add URI** and add
   the two `auth.html` URIs from `npm run entra:values`.
3. Leave **Implicit grant and hybrid flows** (Access tokens, ID tokens) **unchecked**.
4. Select **Save**.

You should now have exactly three SPA redirect URIs and no Web or Mobile platform.

### 4. Add delegated Graph permissions

1. Open **API permissions**.
2. `User.Read` (Microsoft Graph, Delegated) is already listed. Keep it.
3. Select **Add a permission** > **Microsoft Graph** > **Delegated permissions**.
4. Search `Sites.ReadWrite.All`, tick it, select **Add permissions**.
5. Select **Grant admin consent for <your tenant name>** and confirm **Yes**.
6. Both rows must show a green tick and *Granted for <tenant>* in the Status column.

Do **not** add anything under *Application permissions*, do not set an
Application ID URI under **Expose an API**, and do not create anything under
**Certificates & secrets**.

### 5. Check

- [ ] Supported account types: single tenant.
- [ ] Exactly the three SPA redirect URIs printed by `npm run entra:values`.
- [ ] **Expose an API**: no Application ID URI, no scopes.
- [ ] Two delegated permissions, both granted: `User.Read`, `Sites.ReadWrite.All`.
- [ ] No certificates or secrets.
- [ ] Client ID and tenant ID pasted into `src/config.ts`.

## Sources (checked 2026-10-12)

| Setting | Why | Source |
|---|---|---|
| SPA platform | Nested app authentication is supported only for single-page apps; the redirect must be of type *Single-page application*. | [SSO authentication for nested apps](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/nested-authentication) (page updated 2026-09-30) |
| `brk-multihub://<domain>` | "The redirect URI indicates to the Microsoft identity platform that your app can be brokered by supported hosts"; origin only, no sub-path. | same page, *Add trusted brokers* |
| No Application ID URI, no server | The page's comparison table marks *Register API in Microsoft Entra ID*, *Define a custom scope*, *Authorize Teams client apps* and *Conduct an OBO exchange on the server* as required for traditional Teams SSO but **not** for NAA. | same page, comparison table |
| `auth.html` redirect | MSAL.js v5 requires a redirect bridge page that calls `broadcastResponseToMainFrame()`, served from the same origin, and matching the registered redirect URI exactly. | [MSAL v4 → v5 migration](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md) |
| Single tenant | Only Agency Artifact accounts sign in. | [Configure single-page app](https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-app-configuration) |
| `Sites.ReadWrite.All` delegated | Least-privileged delegated permission for creating list items. | [Create listItem](https://learn.microsoft.com/en-us/graph/api/listitem-create?view=graph-rest-1.0), permissions table |
| Admin consent | The button is *Grant admin consent for {tenant}*. | [API permissions and admin consent](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-access-web-apis) |
| `webApplicationInfo.id` in the manifest | Recommended for NAA so admins can approve the app's permissions in the Teams admin center. Uses the client ID only; `resource` is optional and not set. | NAA page, note under the comparison table |

## Note on `Sites.ReadWrite.All`

The name sounds broad. As a **delegated** permission it does not give the app
access to every site: Graph acts as the signed-in user, and SharePoint applies
that user's own permissions. aa.test gets nothing on `AA Principals` because
aa.test is not a member of it. That is exactly what go criterion 2 tests.
A narrower model (`Sites.Selected`) is parked in the stage report.
