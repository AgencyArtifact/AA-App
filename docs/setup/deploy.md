# Hosting and Teams package (stage 0, task T4)

The app is a static site on GitHub Pages: repository `AgencyArtifact/AA-App`
(public while it holds no real data; see the public repository rule in
`CLAUDE.md`). There is no server.

## 1. The one address

`config.appUrl` in `src/config.ts` is the only place the app's address is
written. Currently:

```ts
appUrl: "https://agencyartifact.github.io/AA-App/",
```

Derived from it, with nothing else to edit: the build's base path, the Entra
redirect URIs (`npm run entra:values`), the Teams manifest tab URLs and
`validDomains`, and the privacy and terms URLs.

The github.io address is for test deploys only. The final address will be a
custom subdomain of the firm's domain: see *Switching the domain* below.

## 2. Publish to GitHub Pages

The real workbooks in `Excell/` are git-ignored and must never be committed.
Fictional copies are in `test-data/excel/`. Before any commit, `git status`
must show no `Excell/` path.

Done once in stage 0 (2026-10-13): local repo linked to
`https://github.com/AgencyArtifact/AA-App`, first push to `main`, Pages source
set to **GitHub Actions** (repository **Settings** > **Pages** > **Build and
deployment** > **Source**).

Every push to `main` runs `.github/workflows/deploy-pages.yml`: install, test,
build, publish. When the run in the **Actions** tab is green, these open in a
browser:

- `https://agencyartifact.github.io/AA-App/` (Home)
- `https://agencyartifact.github.io/AA-App/#/diagnostic`
- `https://agencyartifact.github.io/AA-App/#/log`
- `https://agencyartifact.github.io/AA-App/privacy.html` and `terms.html`

Local alternative: `npm install`, `npm run dev`, then
`http://localhost:5173/AA-App/`.

## 3. Build the Teams package

After `src/config.ts` has real values (no `REPLACE_ME` left, including the
firm website in `teamsApp.developerWebsiteUrl`):

```powershell
npm run teams:package
```

Output: `dist-teams/aa-app-<version>.zip` with `manifest.json`, `color.png`,
`outline.png`, and a copy of `manifest.json` next to it for review. The script
refuses to build while placeholders remain.

Before every new upload, bump `config.teamsApp.version` (`0.0.1` → `0.0.2` …).

## 4. Sideload for a first check (optional, desktop)

Teams desktop > **Apps** > **Manage your apps** > **Upload an app** >
**Upload a custom app** > choose the zip. The app opens on **Home**; the
**Diagnostic** tab is next to it.

## 5. Publish to the org app catalog (go criterion 4)

1. <https://admin.teams.microsoft.com> > **Teams apps** > **Manage apps**.
2. **Upload new app** > **Upload** > choose the zip.
3. Find **Agency Artifact**. **Publishing status** *Published*, **Status**
   *Allowed*. If app permission policies or app-centric management are in
   use, make sure Galileo and aa.test may use it.
4. If the app's **Permissions** tab shows an *Org-wide admin consent*
   section, review it; the Entra consent should already cover it.
5. Confirm the **Workflows** app is *Allowed* (for the reminder flow).
6. Propagation can take a few hours. On the phone (as aa.test): Teams >
   **Apps** > **Built for your org** (or search "Agency Artifact") > **Add**.

## Switching the domain

When the custom subdomain is confirmed (example: `app.<firm domain>`):

**In the repo (one edit):**

1. In `src/config.ts` set `appUrl` to the new address with a trailing slash,
   e.g. `"https://app.<firm domain>/"`. A subdomain serves from the root, so
   the base path becomes `/` automatically.
2. Bump `config.teamsApp.version`.
3. Commit and push. Run `npm run entra:values` and keep the output open.

**At the DNS provider and on GitHub:**

4. DNS: add a `CNAME` record for the subdomain pointing to
   `agencyartifact.github.io`.
5. GitHub: organization **Settings** > **Pages** > **Add a domain**, verify the
   firm domain (TXT record). This stops anyone else claiming the subdomain on
   GitHub Pages.
6. Repository **Settings** > **Pages** > **Custom domain**: enter the
   subdomain, **Save**, wait for the DNS check, then tick **Enforce HTTPS**.
7. Open the new address and check Home, `#/diagnostic`, `privacy.html`.

**In Entra (app registration *Agency Artifact* > Authentication):**

8. Under **Single-page application**, add the three redirect URIs printed by
   `npm run entra:values` (new `brk-multihub://` URI and the two
   `auth.html` URIs; the localhost one changes because the base path
   changes).
9. After step 12 works on all clients, remove the three old
   `agencyartifact.github.io` / `localhost:5173/AA-App/` URIs. **Save**.
10. Nothing else changes: same client ID, tenant ID, permissions and consent.
    Still no Application ID URI.

**In the Teams catalog:**

11. `npm run teams:package`, then Teams admin center > **Teams apps** >
    **Manage apps** > **Agency Artifact** > **Upload file** (update) > choose
    the new zip. The app id stays the same, so it is an update, not a new app.
12. Wait for propagation, reopen the app on desktop and on a phone, run the
    diagnostic once per client.

## Manifest notes

- Schema `1.29`, the newest version listed as generally available on the
  [app manifest schema page](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
  on 2026-10-12.
- Name: *Agency Artifact* (short and full). Two static personal tabs: **Home**
  (`#/`) and **Diagnostic** (`#/diagnostic`, kept until stage 0 closes).
  [staticTabs reference](https://learn.microsoft.com/en-us/microsoft-365/extensibility/schema/root-static-tabs).
- `validDomains`: the host of `appUrl`.
- `webApplicationInfo.id`: the Entra client ID (recommended for NAA).
- `developer.privacyUrl` and `termsOfUseUrl`: `privacy.html` and
  `terms.html` in this repo (`public/`). `developer.websiteUrl`: the firm's
  website, `REPLACE_ME` until Galileo fills it in.
- Icons ([reference](https://learn.microsoft.com/en-us/microsoft-365/extensibility/schema/root-icons)):
  `color.png` 192×192, the "A" of the website logo as is; `outline.png`
  32×32, white on transparent, the same "A" with the logo's vertical hairline
  gaps closed so it reads as a solid letter at that size.
