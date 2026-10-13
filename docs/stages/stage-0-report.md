# Stage 0 report: Microsoft 365 feasibility

Brief: `stage-0-feasibility.md` version 2. CLAUDE.md 1.1.

## Gate status (brief v2)

| Gate | Status | Date |
|---|---|---|
| T0 cleanup | Passed. Report approved, step 8 appended: `docs/stages/stage-0-T0-cleanup-report.md` | 2026-10-13 |
| Blueprint (T1) | **Awaiting Galileo's approval (HALT)** | 2026-10-13 |
| Link (T2 to T5, test matrix) | Not started | |
| Stylize | Not started | |
| Trigger | Not started | |

## T1: Blueprint

Delivered:
- `docs/setup/sharepoint-sites.md` (new): both sites, both lists, own-items setting, versioning, Coordinator level, Everyone-grant check, Search positive control. Every step marked "Docs" or "Not in docs" with its source.
- `docs/setup/entra-app.md` (revised): current Entra wording and roles, sources rechecked 2026-10-13, client support and popup-only notes.
- `docs/architecture/data.md` 1.0 to 1.1: changes listed at the end of that file. Summary below.
- `src/config.ts`: already holds client ID, tenant ID (placeholders), host name, site paths and list names from the v1 rounds. No change needed.

Where the documentation changed `data.md`:
1. Both sites are team sites with no Microsoft 365 group. Docs: on group-connected team sites the default groups' permissions cannot be modified and Members get Edit.
2. Team members get Contribute and never the default Members group, because Edit includes Manage Lists (docs), which would let them switch off the own-items rule.
3. Override List Behaviors and its own-items bypass are documented only for SharePoint Server. The SharePoint in Microsoft 365 page calls the permission "Override Check-Out". Criterion 6 is the real test.
4. Version history is switched on explicitly: docs state no default for lists.
5. Sites set to the Pacific time zone at creation, since the date-only assumption depends on it.

Not found in any current Microsoft documentation (so they rest on the tests, not on docs): the item-level permission setting and its wording, the "Check Permissions" route for Everyone groups, how date-only values are stored or written through Graph, the `PersonLookupId` field convention, which "Browse more sites" template is groupless.

Assumed (low-risk technical choices):
- Site addresses `AAPrincipals` and `AAOperations`, matching `src/config.ts`.
- TestHours keeps the default `Title` column; the app writes a label in it.
- `aa.test` granted Contribute directly rather than through a custom group (one test user).

Open questions for Galileo:
- Q8. Pacific time zone on both sites: confirm. The India date-boundary case is measured against it.
- Q9. `AA Operations` without a Microsoft 365 group for stage 0 (data.md open question stays open for the real rollout): confirm.

Parked:
- On `AA Principals`, restrict sharing to site owners only (site sharing settings), as extra hardening.

## Rounds 1 and 2 (brief v1), kept for reference

Status (2026-10-13): **code and instructions delivered; pushed to
`AgencyArtifact/AA-App` and deployed to GitHub Pages; tenant tests not yet
run.** No go/no-go yet.

## Step 1 answer: sign-in method

**`src/auth/graphAuth.ts` uses Nested App Authentication.** Inside Teams it
calls MSAL's `createNestablePublicClientApplication` (MSAL.js 5.25.0). Teams
`getAuthToken` is not used anywhere in the code (searched `src/`), and no step
needs a server to obtain a Graph token. In a plain browser (testing only) it
uses MSAL's standard public client with a popup, which also needs no server.
If a Teams client does not recommend NAA, the app stops with a FATAL message
and does not fall back to anything else.

What the Entra registration needs (values derived from `config.appUrl`,
printed by `npm run entra:values`):

| Item | Value with the current `appUrl` | Purpose |
|---|---|---|
| SPA redirect URI | `brk-multihub://agencyartifact.github.io` | Lets Teams (and other Microsoft 365 hosts) broker sign-in for the app: NAA. |
| SPA redirect URI | `https://agencyartifact.github.io/AA-App/auth.html` | Browser-only popup sign-in returns here (blank bridge page). |
| SPA redirect URI | `http://localhost:5173/AA-App/auth.html` | Same, for `npm run dev`. |
| Application ID URI | **none** | NAA needs no exposed API, custom scope or pre-authorised Teams clients. |

`docs/setup/entra-app.md` covers all four (now including the explicit "no
Application ID URI" check). Sources checked:
[SSO authentication for nested apps](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/nested-authentication)
(updated 2026-09-30: SPA type, `brk-multihub://<domain>` origin only, comparison
table showing no API registration / custom scope / OBO for NAA);
[MSAL v4 → v5 migration](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v4-migration.md)
(redirect bridge page, exact redirect URI match).

## Step 2: public repo rule and data check

- Rule added to `CLAUDE.md` under *Public repository rule*, verbatim.
- Git history: **none.** The folder is not a git repository yet.
- Secrets: **none found.** Searched the working tree (excluding `node_modules`,
  `dist`) for GitHub tokens, client secrets, passwords, private keys, storage
  keys, SAS signatures, JWTs and e-mail addresses. Only hits: the Teams app id
  (configuration) and `aa.test@example.com` in a unit test.
- **Real data found. Not pushed.** `Excell/Systems/` holds three workbooks:
  - `AA_Projections_Business.xlsx`: columns for project number, client, signed
    revenue, total and remaining contract, quarterly billing, operating
    expenses. Financial, client and project data.
  - `AA_Master_Schedule.xlsx`: sheets *Dashboard, Assumptions, Projects,
    Timeline, Forecast, Economics*; phase fees and staff hours per week.
  - `AA_Project_Tracker.xlsx`: a 2026 master schedule of projects.

  **Resolved 2026-10-13:** `Excell/` is git-ignored (verified with
  `git check-ignore`; never staged). Fictional copies were made and committed
  in `test-data/excel/` (see `test-data/excel/README.md`). Galileo decided that
  the formulas of Chris's models are not sensitive, only names and figures;
  `CLAUDE.md`'s public repository rule was updated accordingly.
- Also seen, judged not to be real data under the rule (confirm, Q6): first
  names "Galileo" and "Chris" and their roles in `CLAUDE.md` and the docs;
  the brief copy in `Handoff/`.
- `.claude/settings.local.json` (machine-local tool permissions, no secrets)
  added to `.gitignore`.

## Step 3: push and deploy

**Done 2026-10-13.** Repository `https://github.com/AgencyArtifact/AA-App`
(public; GitHub user account `AgencyArtifact`, not an organization). The local
repo was built on top of the remote's initial README commit; pushed as
`AgencyArtifact` (the machine's older `Galileo1986` login is still stored but
inactive). `config.appUrl` changed to the repo's exact case, since Pages paths
are case-sensitive (`/aa-app/` returns 404).

- **Pages URL: `https://agencyartifact.github.io/AA-App/`**, source *GitHub Actions*.
- **First deploy: succeeded** (Actions run 38362378431: install, 22 tests, build, deploy).
- Live check in a browser: Home, `#/log`, `privacy.html`, `terms.html` render;
  all assets return 200; no page errors.
- Warnings from GitHub on that run, not failures: the Node 20 based actions
  are deprecated (forced onto Node 24), and `ubuntu-latest` moves to Ubuntu 26
  from 2026-10-19. Parked.

## Go criteria status

| # | Criterion | Status |
|---|---|---|
| 1 | Teams personal app on desktop, iOS, Android, SSO, no server; log half an hour + confirm < 30 s on a phone | NAA built. `#/log` test screen built; stopwatch test written (checklist G). Untested in Teams. |
| 2 | aa.test denied on `AA Principals`, in the app and in Graph Explorer | Diagnostic and checklist ready; untested. |
| 3 | Reminder reaches aa.test, escalates to coordinator, LA and India time | Flow steps ready; untested. |
| 4 | Published to org catalog and installed from a phone | Package script ready, manifest validated; blocked on deploy and Entra. |

## What changed in round 2

| Step | Change |
|---|---|
| 2 | `CLAUDE.md` public repository rule; `.gitignore` adds `.claude/settings.local.json`. |
| 4 | New `#/log` screen: `src/log/LogTestScreen.tsx`, pure helpers `src/log/logTest.ts` + tests. Home has a link to it. Checklist section G. |
| 5 | Popup redirect page renamed `auth-redirect.html` → `auth.html` (blank, loads only the MSAL bridge). Redirect URI now comes from config. |
| 6 | `public/privacy.html`, `public/terms.html`; manifest points at them. |
| 7 | `config.appUrl` is the single address; origin, host, base path, redirect URIs, tab URLs, privacy/terms URLs derived in `src/config.ts`. `vite.config.ts` and both scripts use the derived values. New `npm run entra:values`. *Switching the domain* section in `deploy.md`; `entra-app.md` uses the configured address. |
| 8 | Manifest name *Agency Artifact* (short and full); tabs **Home** (`#/`) and **Diagnostic**. App screens titled Agency Artifact. |
| n/a | SharePoint calls moved to `src/graph/sharepoint.ts` and date helpers to `src/dates.ts`, shared by the diagnostic and `#/log`. Same behaviour. |
| Icons | `outline.png` regenerated as a solid "A" (the logo glyph with its hairline gaps closed). `color.png` unchanged. |

## Test matrix

To be filled by Galileo from `docs/stages/stage-0-test-checklist.md`.

| # | Client | Account | Sign-in silent? | Ops read | Ops write | Principals read | Report pasted |
|---|---|---|---|---|---|---|---|
| C1 | Desktop | Galileo | | | | | |
| C2 | Web | Galileo | | | | | |
| C3 | iOS | Galileo | | | | | |
| C4 | Android | Galileo | | | | | |
| C5 | Desktop | aa.test | | | | | |
| C6 | Web | aa.test | | | | | |
| C7 | iOS | aa.test | | | | | |
| C8 | Android | aa.test | | | | | |

Graph Explorer (aa.test): D3 ___ D4 ___ D5 ___ D6 ___
Other routes (aa.test): E1 ___ E2 ___ E3 ___
Principals site permission check (A2): ___
Reminder LA: reminder ___ escalation ___ silent when row exists ___
Reminder India: reminder ___ escalation ___ silent when row exists ___
Phone timing: see the table in checklist section G.

### Diagnostic reports

(paste here)

## Verified (ran it, saw it)

Round 2:

- `npm run typecheck`, `npm run build`: succeed. `npm test`: 22 tests pass
  (outcome classification; report layout; half-hour stepper including clamping
  at 0 and 24 and snapping to the half-hour grid; hour and seconds formatting).
- `dist/auth.html` references only the bridge script and its MSAL chunk, not
  the app bundle.
- `npm run entra:values` prints the three redirect URIs, "no Application ID
  URI" and the manifest URLs, all derived from `config.appUrl`.
- `npm run teams:package` refuses to build with placeholders; with
  `--allow-placeholders` the manifest validates against the official v1.29
  schema (placeholders replaced by dummy values). It shows name *Agency
  Artifact*, tabs Home (`…/aa-app/#/`) and Diagnostic, privacy and terms
  URLs on `…/AA-App/`, `validDomains` `agencyartifact.github.io`.
- `outline.png`: 32×32 RGBA, every visible pixel pure white; checked
  visually at 8× zoom: a solid "A".
- **Browser sign-in success path, against a mocked identity provider and
  mocked Graph** (Edge via Playwright, phone viewport, dev server; the mocks
  intercepted `login.microsoftonline.com` and `graph.microsoft.com`):
  - the authorize request carried `redirect_uri=http://localhost:5173/aa-app/auth.html`, `response_mode=fragment`, scopes `User.Read Sites.ReadWrite.All openid profile offline_access`;
  - the popup's only page was `auth.html`; it closed itself;
  - the main window exchanged the code for tokens, then called Graph with the access token;
  - diagnostic: Sign-in PASS, Ops read PASS (2 items), Ops write + delete PASS (Person set), Principals DENIED (403 mocked);
  - `#/log`: one tap on +, Confirm → POST body `{"Title":"stage0-log","Date":"2026-10-12","Hours":0.5,"PersonLookupId":"7"}`, screen showed "Confirmed. Saved to TestHours." and both timings; **Delete this test row** sent the DELETE;
  - no page errors.

Still verified from round 1: zip structure opens; icons' sizes; no
`console.*`, `localStorage` or IndexedDB in `src/`; Principals read requests
item ids only.

## Assumed

- Real Microsoft Entra behaves like the mock for the browser popup:
  `response_mode=fragment`, the id token claims MSAL checks, `client_info`.
  The mock proves the app side of the flow, not Entra's.
- NAA inside Teams works on all four clients; `ssoSilent` with the Teams login
  hint is silent after admin consent.
- SharePoint details: list addressed by display name; Date-only column accepts
  `"YYYY-MM-DD"`; `PersonLookupId` from the hidden *User Information List*
  (`UserName` = UPN); a default `Title` column exists.
- GitHub Pages serves `public/privacy.html` and `terms.html` at
  `<appUrl>privacy.html` and `<appUrl>terms.html` (Vite copies `public/` to
  the site root under the base path; seen in `dist/`, not yet on Pages).
- For a custom subdomain, GitHub Pages serves from `/`, so `appUrl` of the
  form `https://app.<domain>/` gives base path `/` with no other change.
- GitHub org-level domain verification is under organization **Settings** >
  **Pages** (named in *Switching the domain*; not checked on GitHub).
- Manifest schema 1.29 (newest listed GA); GitHub Actions versions in the
  deploy workflow are current enough to run.
- The 30-second criterion is timed from tapping the **Teams** icon on the
  phone's home screen, with Teams running in the background (Q3).

## Untested

- Anything in the tenant: Entra registration, consent, NAA in the four Teams
  clients, all real Graph and SharePoint calls, the permission boundary,
  catalog publishing, phone install, the reminder flows, the phone timing.
- Real Entra sign-in in a browser (mocked only, see Verified).
- GitHub push, the Actions deploy workflow, Pages hosting, custom domain.
- The Teams package with real values.
- Clipboard copy inside Teams webviews.
- The date picker's look and behaviour inside Teams iOS and Android webviews.

## Deviations from the round 2 message

1. **Step 3 not done**: blocked by the step 2 finding (your rule) and by the
   organization not being visible to this machine's GitHub account.
2. **Steps 4 to 8 done after step 2 found data.** Step 2 says do not push and
   wait; it does not say stop. All later work is local only. Nothing was
   committed or pushed.
3. **Step 5**: the popup already returned to a separate page in round 1
   (`auth-redirect.html`, which loaded only the MSAL bridge, never the
   hash-routed app). I renamed it to `auth.html` as you suggested and moved
   its address into config. The old file was deleted (it was created by me
   in round 1 and is fully replaced).
4. **Step 4**: `#/log` has no tab of its own (you asked for two tabs). In
   Teams it is one tap from Home, and that tap is inside the stopwatch time
   (Q4).
5. **Step 6, privacy page**: besides your points I added one sentence from
   `CLAUDE.md`: financial information is in a separate Microsoft 365 area
   only principals can open, enforced by permissions. Remove it if you prefer
   only the listed points.
6. **Icons**: the solid outline "A" is the logo's own glyph with the gaps
   closed, not a typed letter, so the shape matches the logo.
7. `config.teamsApp.version` stays `0.0.1`: nothing has been uploaded yet.

## Open questions

- Q1. Resolved 2026-10-13: `Excell/` git-ignored; fictional copies in `test-data/excel/`.
- Q2. Resolved 2026-10-13: `AgencyArtifact/AA-App`, pushed as `AgencyArtifact`.
- Q3. Stopwatch start: the Teams icon on the phone's home screen (as written), or the Agency Artifact icon inside Teams? And is Teams in the background the pass condition, with a cold start only informative?
- Q4. During stage 0, should the Home tab open directly on the log test to remove one tap from the timing?
- Q5. Firm website URL for the manifest (`teamsApp.developerWebsiteUrl`, still `REPLACE_ME`).
- Q6. Do first names and roles of the principals in `CLAUDE.md` and docs count as "staff data" under the public repo rule? I assumed not.
- Q7. Keep `Handoff/stage-0-feasibility.md` (duplicate of `docs/stages/stage-0-feasibility.md`) in the repo, or remove it? (It was included in the first commit.)

## Parked

- Update the deploy workflow's actions to Node 24 based versions; `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19.

- Token prefetching via `webApplicationInfo.nestedAppAuthInfo` to speed first load (desktop and web only).
- Evaluate delegated `Sites.Selected` to narrow Graph access to the two AA sites.
- A host that can send `Cache-Control: no-store` for `auth.html` (MSAL v5 recommendation; browser use only).
- Keep the icon generator script in the repo once the clean logo file arrives.
