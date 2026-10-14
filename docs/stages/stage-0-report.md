# Stage 0 report: Microsoft 365 feasibility

Brief: `stage-0-feasibility.md` version 2. CLAUDE.md 1.1.

## Gate status (brief v2)

| Gate | Status | Date |
|---|---|---|
| T0 cleanup | Passed. Report approved, step 8 appended: `docs/stages/stage-0-T0-cleanup-report.md` | 2026-10-13 |
| Blueprint (T1) | Passed. Approved by Galileo in session | 2026-10-13 |
| Link (T2 to T5, test matrix) | In progress. T2 checked; T3 revised and committed (`f69ec5d`); T4 reviewed; T5 and the v2 test checklist written. Nothing yet run against the tenant | 2026-10-13 |
| Stylize | Not started | |
| Trigger | Not started | |

## T1: Blueprint

Delivered:
- `docs/setup/sharepoint-sites.md` (new): both sites, both lists, own-items setting, versioning, Coordinator level, Everyone-grant check, Search positive control. Every step marked "Docs" or "Not in docs" with its source.
- `docs/setup/entra-app.md` (revised): current Entra wording and roles, sources rechecked 2026-10-13, client support and popup-only notes.
- `docs/architecture/data.md` 1.0 to 1.1: changes listed at the end of that file. Summary below.
- `src/config.ts`: fully filled during T1 (client ID, tenant ID, host name, site paths, list names, firm website). No placeholders left.

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

Deviations from the brief:
- `aa.test` has Microsoft 365 Business Standard, not Business Basic: the tenant has no Business Basic licenses (Galileo's screen, 2026-10-13: Business Standard 3 of 12 available, Power Automate Free). Standard includes everything Basic does; Teams, SharePoint and sign-in are the same, so the test is unaffected. One paid seat in use; release it after stage 0.

Setup evidence (Galileo's screenshots, 2026-10-13):
- Sites created as "Other options" > Team site; on-screen text: no Microsoft 365 group. `AA Operations` at `https://agencyartifact.sharepoint.com/sites/AAOperations`. Q9 answered by this choice.
- `AA Principals` P1 (`_layouts/15/user.aspx`): three rows only, AA Principals Members (Edit), Owners (Full Control), Visitors (Read). Check Permissions for `Everyone except external users`: None. `Everyone` cannot be entered in the people picker.
- `AA Principals` site collection administrators: Galileo Morandi only.
- `AA Principals` Owners: Galileo Morandi and two accounts both named Christopher Torres. Galileo's decision: keep both. Not checked: whether either is a guest (external) account. If one is, it has full access to `AA Principals`; check before real financial data enters.
- `AA Principals` Members and Visitors: empty (Galileo, 2026-10-13). Part 2a complete.
- `AA Operations` (Galileo's confirmation, 2026-10-13, no screenshot): P1 shows the three AA Operations groups plus `AA Test` at Contribute; Check Permissions for aa.test: Contribute only; Owners Galileo and Chris; aa.test in no site group. Part 2b complete.
- `TestHours` created on `AA Operations` with columns Title, Person, Date, WorkDate, Hours (screenshot; column types not visible). Versioning settings (screenshot): create a version on each edit Yes, keep 50 versions, content approval No. Galileo: these were already set when the page was first opened, so version history is on by default for a new blank list in this tenant (50 versions).
- `TestFees` on `AA Principals` (screenshot): columns Title, Project, Fee; one row `Fee test`, `Zanthorpe`, 1,000. Search word recorded in the test checklist.
- `TestHours`: `Galileo row` created by Galileo (Galileo's confirmation, 2026-10-13).
- `TestHours` item-level permissions (screenshot): Read all items; Create items and edit items that were created by the user. On-screen note: "Users with the Cancel Checkout permission can read and edit all items."
- Coordinator permission level created on `AA Operations` (Galileo's confirmation, 2026-10-13; the exact label of the ticked permission was not reported). Not assigned to anyone.
- Entra API permissions (screenshot): `Sites.ReadWrite.All` and `User.Read`, Delegated, "Granted for Agency Artifact"; portal shows "Admin consent required: No" for both.
- Regional settings time zone: Pacific on both sites (Galileo's confirmation, 2026-10-13).
- Microsoft Search positive control passed (screenshot, 2026-10-13): Galileo, organization scope, `Zanthorpe` finds `Fee test` in AA Principals > TestFees, "modified 26 minutes ago". The result snippet shows field values, so aa.test's search must return nothing at all. A first search from the start page was scoped to the root Communication site and found nothing; setup doc corrected.

Decisions at T1 approval (Galileo, 2026-10-13):
- Coordinator permission level: Galileo believes it is set correctly. Recorded as assumed, not verified: the ticked permission was never seen on screen. Criterion 6 tests it. If a coordinator is denied editing another user's row, check that permission first, before treating it as a Microsoft 365 limit.
- Both Christopher Torres accounts stay as Owners of AA Principals, no further check. Untested: whether either is a guest account. Criterion 3 is judged with this unchecked.

Open questions for Galileo:
- Q8. Closed (Galileo, 2026-10-13, reconfirmed at T1 approval): two time zones, India and US. Carried by people and devices: each entry stores the device's local date in `WorkDate`, and one reminder flow runs per zone. Both sites keep Pacific as the storage reference.
- Q9. Closed for stage 0 (Galileo, 2026-10-13): stage 0 sites have no Microsoft 365 group. Whether the real `AA Operations` connects to a Teams team stays open in data.md.
- Galileo is getting the Microsoft 365 admin credentials and asked to be guided through the admin process: `docs/setup/m365-admin.md` (new) orders every admin step (role check, `aa.test`, Teams custom app upload, Entra, SharePoint, India device) and links the other two setup files.

Parked:
- On `AA Principals`, restrict sharing to site owners only (site sharing settings), as extra hardening.

## T2: authentication module

`src/auth/graphAuth.ts` checked against brief v2: one exported function (`getGraphToken`) returns a delegated Graph token; NAA inside Teams, standard MSAL popup in a plain browser; silent first, interactive fallback; no secrets, no server; stops with an error if a Teams client does not recommend NAA. No change.

## T3: diagnostic screen (revised for brief v2)

Changed files: `src/graph/graph.ts` (PATCH allowed), `src/graph/sharepoint.ts`, `src/dates.ts`, `src/diagnostic/runDiagnostic.ts`, `src/diagnostic/report.ts`, `src/diagnostic/report.test.ts`, `src/diagnostic/DiagnosticScreen.tsx`, `src/log/LogTestScreen.tsx` (writes WorkDate too). Matches `data.md` 1.1; no SOP change needed.

The report now shows: Teams host client; device time zone with UTC offset; the local date used as "today"; the write with Date and WorkDate both set to that date, and both values as Graph returns them (raw); an edit of a row created by another user, then its restore; TestFees item count only; seconds from page load to the write result, with the run number.

Verified (2026-10-13, on Galileo's machine, clean install in a scratch copy): `tsc --noEmit` passes; `vitest run` 26 of 26 pass; `npm run build` succeeds.

Assumed (low-risk technical choices):
- The edit test changes the other user's `Title` by appending ` [diag edit]`, then restores it. Version history keeps both changes, which is the evidence criterion 6 asks for. A leftover mark from a failed restore is removed on the next run.
- "Another user's row" is the first row whose creator differs from the signed-in user, compared by Entra object id (`createdBy.user.id`), falling back to email against UPN. Not in docs that the two ids are the same; if the comparison fails the row is still found by email.
- New outcome SKIPPED when no row by another user exists. It is neither a pass nor a denial.
- Timer: `performance.now()` counts from page load inside the Teams webview. Time spent by Teams before loading the page is not included, so criterion 2 is still timed by hand (stopwatch) from tapping the app; the on-screen figure is a cross-check. Reruns are labelled "not a cold start".

Untested: everything above against the tenant (test matrix not run).

Needed for the test matrix (now checklist A5): a row created by `aa.test` must exist in TestHours, otherwise Galileo's edit test shows SKIPPED; a row created by Galileo (`Galileo row`) must exist for `aa.test`'s.

Rechecked on Windows (2026-10-13, this repo): `npm run typecheck` passes, `npm test` 26 of 26, `npm run build` succeeds. Committed locally as `f69ec5d`, not pushed.

Scope note: the app tests **editing** another user's row (as T3 asks). The **delete** half of criterion 6 is tested in Graph Explorer only (checklist D6, E5), as the test matrix asks.

## T4: Teams app package

Reviewed against brief v2. No code change.

Verified (2026-10-13):
- Schema 1.29 is still the newest version listed as generally available ([manifest schema page](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema), updated 2026-10-01; 1.30 is described there but not in the generally available list).
- `npm run teams:package` builds `dist-teams/aa-app-0.0.1.zip` with `manifest.json`, `color.png`, `outline.png` at the root. The built `manifest.json` (real values) validates against the official v1.29 JSON schema (ajv 8.17.1, in a scratch folder, no repo dependency added).
- Icons: `color.png` 192x192, `outline.png` 32x32 with alpha.
- Personal scope, `validDomains` `agencyartifact.github.io`, tab URLs on `https://agencyartifact.github.io/AA-App/`, `webApplicationInfo.id` the Entra client ID.

Doc fixes in `docs/setup/deploy.md`: catalog step relabelled go criterion 5 (was 4 under brief v1); schema check date and validation recorded; developer website no longer described as `REPLACE_ME`.

Deviation: brief v2 asks for **one** static tab; the manifest has two (Home, Diagnostic), as asked in the v1 round 2 message. Not changed silently: see Q10.

Untested: upload to the org catalog, install from a phone.

## T5: reminder flows

`docs/setup/reminder-flow.md` rewritten for brief v2:
- Two flows, `AA Stage0 Reminder LA` (Pacific) and `AA Stage0 Reminder India` (India Standard Time); "today" computed in each flow's own zone.
- Rows are taken by creator (aa.test), then checked twice: `WorkDate` equals today, and the raw `Date` value starts with today. A `MatchLog` step records both counts and the raw values in the run history. A row matched by either column counts as logged.
- Compressed schedule: reminder and escalation minutes apart, split by a minute threshold on the flow's own clock, with the LA to India clock conversion before and after November 1, 2026.
- Tests: reminder then escalation; silent when a row exists; date-boundary case (India flow, inside the window); control (outside the window).
- Export steps, with where to keep the zip (see Q12).

Assumed (low-risk technical choices):
- "A row from aa.test" means created by aa.test (`Author`), not the `Person` column, because the app leaves `Person` empty when its lookup fails.
- The Date check compares the first characters of the raw connector value, with no time zone conversion. Not in docs how the connector returns a date-only value; the raw value is logged so the report can interpret it.
- Get items without an OData filter (Top Count 100), filtered inside the flow, so both checks see the same rows. Fine for a test list, not for real lists.
- Manual test runs are not used: the stage comes from the clock minute.

Deviation: the brief says the boundary row is written "through the diagnostic screen", but the diagnostic deletes its row right after writing it (T3), so no flow could find it. The procedure uses the diagnostic for the raw values, then the `#/log` screen (same columns, same device-local date) for the row the flow must find. See Q11.

Untested: the whole flow in Power Automate (not built yet). The Filter array operator `starts with` and the `Author`/`Email` shape are from experience with the connector, not checked on screen.

## Test checklist (brief v2)

`docs/stages/stage-0-test-checklist.md` rewritten: preconditions (Teams setup, sharing check, three `TestHours` rows: `aa.test row` dated 2026-01-01 by aa.test, `Galileo row`, `Galileo delete row`), browser smoke test, app matrix at team level (8 cells, with the edit column), four boundary routes plus Graph Explorer edit and delete at team level, Coordinator assignment and reruns (desktop and one phone), routes and delete at coordinator level, version history and recycle bin evidence, three cold-start timings by stopwatch (with a lap at the app tap), Today screen timing via `#/log`, reminder tests, date-boundary case and control.

Choices made in the checklist (low-risk):
- `aa.test row` is dated in the past so it never silences the reminder flow.
- The Graph Explorer delete uses a separate `Galileo delete row`, so `Galileo row` survives for the app's edit tests at both levels.
- Cold start means Teams force-closed and the stopwatch starts on the Teams icon (the strictest reading of "tapping the app in Teams (cold start)"). The lap at the Agency Artifact tap also gives the other reading. This replaces Q3.
- `#/log` stays: it is the stand-in for the Today screen timing and writes the boundary row.

## Test matrix (brief v2)

To be filled from `docs/stages/stage-0-test-checklist.md`. Paste diagnostic reports and MatchLog lines here, naming client and account.

## Open questions (brief v2)

- Q10. One static tab (brief v2) or two (Home and Diagnostic, as now)? With one, it should point at `#/diagnostic` for stage 0, so a cold start runs the diagnostic directly (Home has links to the log screen). Recommendation: keep two until stage 0 closes; the checklist works with both.
- Q11. Date-boundary write: accept the diagnostic for raw values plus `#/log` for the row the flow reads (as written), or should the diagnostic gain an option to keep its row?
- Q12. Flow exports contain the aa.test and Galileo sign-in addresses. While the repo is public, keep them in the git-ignored `Excell/flows/` and move them to `flows/` when the repo goes private? (Written that way in `reminder-flow.md`.)

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
- Q5. Resolved 2026-10-13: `https://www.agencyartifact.com/`.
- Q6. Do first names and roles of the principals in `CLAUDE.md` and docs count as "staff data" under the public repo rule? I assumed not.
- Q7. Keep `Handoff/stage-0-feasibility.md` (duplicate of `docs/stages/stage-0-feasibility.md`) in the repo, or remove it? (It was included in the first commit.)

## Parked

- Update the deploy workflow's actions to Node 24 based versions; `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19.

- Token prefetching via `webApplicationInfo.nestedAppAuthInfo` to speed first load (desktop and web only).
- Evaluate delegated `Sites.Selected` to narrow Graph access to the two AA sites.
- A host that can send `Cache-Control: no-store` for `auth.html` (MSAL v5 recommendation; browser use only).
- Keep the icon generator script in the repo once the clean logo file arrives.
