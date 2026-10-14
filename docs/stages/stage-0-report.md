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
- Teams custom app setup (screenshots, 2026-10-13): Org-wide app settings, Custom apps: "Let users install and use available apps by default" On, "Let users interact with custom apps in preview" On. Setup policy `AA app testers`: Upload custom apps On, User pinning On. App setup policy `AA app testers`, direct assignment, on the user pages of both Galileo and aa.test. Not yet seen: **Upload a custom app** in Teams for either account (propagation), which closes checklist A1. Checks (screenshots, 2026-10-13): first, shortly after assignment, Upload an app offered only "Submit an app to your org". Later the same day, Galileo: "Upload a custom app", "Upload an app to your org's app catalog" and "Submit an app to your org" (propagated). aa.test: still only "Submit an app to your org" (not propagated yet).
- Org catalog (Galileo, 2026-10-13): `aa-app-0.0.1.zip` uploaded through Teams > Manage your apps > Upload an app > "Upload an app to your org's app catalog". Reported as working; publishing status in the admin center and phone install not yet seen (criterion 5 open). Org catalog publishing (A6) goes through the Teams admin center and does not wait for this.
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

### T3 extension: all Graph boundary checks in the diagnostic (2026-10-13)

Galileo's decision in session: extend the diagnostic so it runs every Graph check by itself, and drop Graph Explorer from the test matrix. **Deviation from brief v2**, which names Graph Explorer as one of four boundary routes and as the route for the delete test. Reason: Graph Explorer calls the same Graph API with the same delegated, per-user permission, so it adds no evidence about SharePoint's permissions; it cost Galileo a long manual session (consent, site ids, list ids).

New steps in the report:
- Operations delete of another user's row. Each run keeps one row `stage0-delete-target` of its own (dated 2026-01-01, never today, so it cannot silence the reminder flow); the other account's run tries to delete it. SKIPPED until the other account has run once.
- Principals routes: site lookup by path (a principal's report shows the site id and the TestFees list id), list items by path, by site id, by list id, and a Microsoft Search query for the search word. Ids and counts only; the search keeps only hit totals and addresses. By-id routes for aa.test use `config.sharepoint.principals.siteId` and `testFeesListId`, empty until copied from Galileo's report (SKIPPED until then).
- Search outcome: PASS when any hit is inside `/sites/AAPrincipals`, DENIED when none is.

Code: `src/diagnostic/rows.ts` (new, pure selection rules) and `rows.test.ts` (8 tests), `src/graph/sharepoint.ts` (list rows with creators, count at any address, by-path and by-id addresses, list id, search), `src/diagnostic/runDiagnostic.ts`, `src/config.ts`. The edit test now prefers a row that is not a delete target.

Verified (Windows, 2026-10-13): typecheck passes, 34 of 34 tests, build succeeds.
Untested: every new step against the tenant. Assumed: search hits carry `resource.webUrl` for list items; the by-path list address works once the token has Sites permission (the Graph Explorer 404 on it was before consent).

Checklist rewritten to match: Graph Explorer steps removed; left for Galileo are the runs per client and account, the site URL and the Microsoft 365 search box as aa.test, the Coordinator switch, two screenshots (version history, recycle bin), timing, flows.

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

First run inside Teams (screenshot, 2026-10-13): app installed from the org catalog, opened on Home in Teams desktop. Then `#/log` in Teams web (account not visible in the screenshot): date 10/13/2026, 1:00 h, "Confirmed. Saved to TestHours.", Screen open → confirmed 10.8 s, Page load → confirmed 21.8 s, item 2. First real Graph write from Teams. Not a timing run (desktop browser, not a phone cold start).

### C1: Teams desktop, Galileo (2026-10-13 18:49 Los Angeles)

UPN replaced with `<galileo UPN>` (public repo).

```
Agency Artifact - stage 0 diagnostic
Time:        2026-10-14T01:49:00.288Z (local 2026-10-13 18:49:00, America/Los_Angeles)
App URL:     https://agencyartifact.github.io/AA-App/#/diagnostic
User:        Galileo Morandi <galileo UPN>
Host:        TeamsModern desktop (NAA recommended: true)
Time zone:   America/Los_Angeles (UTC-07:00)
Local today: 2026-10-13
Auth mode:   teams-naa
Prompts:     0
Write:       2.3 s from page load (run 1, first run)

Sign-in (Graph /me): PASS (HTTP 200)
Operations read (TestHours): PASS (HTTP 200)
  items: 2
Operations write + delete (TestHours): PASS (HTTP 204)
  created item 5 (HTTP 201). written Date and WorkDate "2026-10-13". Graph returns Date "2026-10-13T07:00:00Z", WorkDate "2026-10-13". deleted (HTTP 204). Person set
Operations edit of another user's row (TestHours): DENIED (HTTP 403 accessDenied)
  item 4 by AA TEST: edit refused, nothing changed
Principals read (TestFees): PASS (HTTP 200)
  items: 1
```

Reading:
- Verified: nested app authentication silent in Teams desktop; Operations read, write and delete; Person lookup; Principals read for a principal.
- Verified for a Pacific device: a `YYYY-MM-DD` written to the date-only column comes back as midnight Pacific in UTC (`T07:00:00Z` during daylight saving). Matches the data.md assumption on the LA side; India side still to test.
- **Unexpected: Galileo (Owner, Full Control) is DENIED editing aa.test's row through Graph (403 accessDenied).** Expected PASS. Suspected: through Graph, the item-level "edit only own items" setting applies even to users whose level includes Override List Behaviors. Not yet diagnosed. Per the brief ("If something fails"), criterion 6 is stopped and reported; not a no-go on Microsoft 365. Discriminating checks sent to Galileo: edit in the SharePoint interface, the same PATCH in Graph Explorer, and a rerun with the item-level setting briefly off.

### C6: Teams web, aa.test at Contribute (2026-10-13 18:52 Los Angeles)

UPN replaced with `<aa.test UPN>`.

```
Agency Artifact - stage 0 diagnostic
Time:        2026-10-14T01:52:43.243Z (local 2026-10-13 18:52:43, America/Los_Angeles)
App URL:     https://agencyartifact.github.io/AA-App/#/diagnostic
User:        AA TEST <aa.test UPN>
Host:        TeamsModern web (NAA recommended: true)
Time zone:   America/Los_Angeles (UTC-07:00)
Local today: 2026-10-13
Auth mode:   teams-naa
Prompts:     0
Write:       1.4 s from page load (run 1, first run)

Sign-in (Graph /me): PASS (HTTP 200)
Operations read (TestHours): PASS (HTTP 200)
  items: 7
Operations write + delete (TestHours): PASS (HTTP 204)
  created item 14 (HTTP 201). written Date and WorkDate "2026-10-13". Graph returns Date "2026-10-13T07:00:00Z", WorkDate "2026-10-13". deleted (HTTP 204). Person set
Operations edit of another user's row (TestHours): DENIED (HTTP 403 accessDenied)
  item 1 by Galileo Morandi: edit refused, nothing changed
Principals read (TestFees): DENIED (HTTP 403 accessDenied)
  site lookup failed
```

Diagnosis of the C1 owner 403, check 1 (Galileo, 2026-10-13 about 18:55): in the SharePoint list interface Galileo edited an aa.test-created row (Title to `aa.test row`, Date and WorkDate to 2026-01-01) and it **saved**. So the own-items bypass works for an Owner in the interface; the 403 is on the Graph route. Galileo also deleted five aa.test-created rows in the interface: allowed. List afterwards (screenshot): `Galileo delete row` (Galileo), `Hours test` (Galileo, today), `aa.test row` (aa.test, 2026-01-01). Checks 2 (same PATCH in Graph Explorer) and 3 (rerun with the item-level setting off) pending. Galileo's own row is titled `Hours test`, not `Galileo row`.

### C6 rerun with the extended diagnostic: Teams web, aa.test at Contribute (2026-10-13 19:12 Los Angeles)

```
Agency Artifact - stage 0 diagnostic
Time:        2026-10-14T02:12:15.249Z (local 2026-10-13 19:12:15, America/Los_Angeles)
App URL:     https://agencyartifact.github.io/AA-App/#/diagnostic
User:        AA TEST <aa.test UPN>
Host:        TeamsModern web (NAA recommended: true)
Time zone:   America/Los_Angeles (UTC-07:00)
Local today: 2026-10-13
Auth mode:   teams-naa
Prompts:     0
Write:       1.9 s from page load (run 1, first run)

Sign-in (Graph /me): PASS (HTTP 200)
Operations read (TestHours): PASS (HTTP 200)
  items: 4
Operations write + delete (TestHours): PASS (HTTP 204)
  created item 18 (HTTP 201). written Date and WorkDate "2026-10-13". Graph returns Date "2026-10-13T07:00:00Z", WorkDate "2026-10-13". deleted (HTTP 204). Person set
Operations edit of another user's row (TestHours): DENIED (HTTP 403 accessDenied)
  item 1 by Galileo Morandi: edit refused, nothing changed
Operations delete of another user's row (TestHours): DENIED (HTTP 403 accessDenied)
  item 17 by Galileo Morandi: delete refused, row kept. own "stage0-delete-target" for the other account: created item 19
Principals site lookup (by path): DENIED (HTTP 403 accessDenied)
  site lookup refused
Principals read (TestFees, by path): DENIED (HTTP 403 accessDenied)
  list read refused
Principals read (TestFees, by site id): SKIPPED (HTTP 0)
  site id unknown: copy it from a principal's report into config.ts
Principals read (TestFees, by list id): SKIPPED (HTTP 0)
  list id unknown: copy it from a principal's report into config.ts
Principals search ("Zanthorpe"): DENIED (HTTP 200)
  hits: 0, inside AA Principals: 0 (not visible)
```

Reading: all as expected for team. Criterion 6 team half holds through Graph for edit and delete. Criterion 3 on Teams web: site lookup, list by path and Microsoft Search (Graph search API) all refuse; by-id routes pending the ids from Galileo's report.

Reading of C6 (first run): every result as expected for team. Principals denied at the site lookup (403), app route of criterion 3 holds on Teams web. Edit of Galileo's row denied, as criterion 6 expects for team. TestHours held 7 items at this point (leftover log-screen rows; to be cleaned before the reminder tests).

## Criterion 6: result and decision needed (2026-10-13)

Verified, Teams desktop and web, with the extended diagnostic:
- aa.test at Contribute: edit and delete of Galileo's rows through Graph DENIED (403). Team half of criterion 6 holds.
- Galileo, Owner: edit and delete of aa.test's rows through Graph DENIED (403) with the own-items setting on; PASS (200, 204) with it off (run 2026-10-13 19:19 Los Angeles; setting restored to "Create items and edit items that were created by the user", Galileo's confirmation the same evening). In the SharePoint interface the Owner can edit and delete them with the setting on.
- So the Coordinator level (a subset of Owner) cannot correct hours through Graph with this design. Not yet run as Coordinator; expected the same. Per the brief this is stopped and reported, and it is **not a no-go** on Microsoft 365.

Options (Galileo's decision; recommendation first):
1. **Test SharePoint's own REST API for coordinator writes** (recommended to test first). The SharePoint interface, which honours the bypass, uses this API. Needs one more delegated permission on the Entra app (SharePoint `AllSites.Write`) and admin consent; still no server or secret. The app would use it only for coordinator corrections. Cost: about one hour plus a 10-minute test. Unknown until tested whether nested app authentication in Teams issues SharePoint tokens as it does Graph tokens.
2. **Coordinator corrections through a Power Automate flow** (the brief's fallback). A coordinator asks for a correction, a flow running with an owner's connection applies it. Traceable in the flow's history and version history, but version history shows the flow's account, not the coordinator, which weakens "Version history shows aa.test as the editor".
3. **Per-row permissions** (each row gets its own unique permissions on creation). Works through Graph, but thousands of unique permissions per year and a fragile setup; not proportionate.
4. Rejected: switching the setting off and letting the app decide who may edit. CLAUDE.md: the app never decides access.

Decision (Galileo, 2026-10-13): **option 1**, test SharePoint REST for coordinator corrections.

Built (SOP first: `data.md` Access routes, `entra-app.md` step 4b):
- `src/auth/graphAuth.ts`: tokens for any scope set; `getSharePointToken()` beside `getGraphToken()`. Same NAA in Teams and popup in a browser.
- `src/graph/spRest.ts` (new, no new dependency): SharePoint REST caller with the same result shape as Graph; count by Id, MERGE of Title, recycle of an item.
- Diagnostic: new steps "REST token + read (TestHours)", "REST edit of another user's row", "REST delete of another user's row" (recycle, as the interface does), and boundary route "Principals read (TestFees, SharePoint REST)".
- Verified: typecheck, 34 of 34 tests, build, Teams package. **CORS verified** (2026-10-13, preflight from origin `https://agencyartifact.github.io` to `.../sites/AAOperations/_api/...`): HTTP 200, `Access-Control-Allow-Origin: *`, methods include POST and MERGE, headers `authorization,content-type,x-http-method,if-match` allowed.
- Untested: the SharePoint token through nested app authentication in Teams; whether REST honours the Owner/Coordinator bypass; that team stays refused through REST. Needs Entra step 4b (permission `AllSites.Write` and admin consent) first.

Result of the REST test (2026-10-13 20:34 and 20:37 Los Angeles, Teams web, new build):
- Teams sign-in issues SharePoint tokens through nested app authentication, silently (`Prompts: 0`). CORS works. Verified.
- aa.test: REST edit and delete of Galileo's rows DENIED (403 `-2147024891, System.UnauthorizedAccessException`); Principals by REST DENIED; all six Principals routes DENIED (site by path, list by path, by site id, by list id, REST, search 0 hits). Criterion 3, app and search routes, complete on Teams web.
- Galileo: REST edit and delete of aa.test's rows **DENIED** (same 403). Option 1 as built does not let Owners or coordinators correct hours.
- First REST call failed once with "Failed to fetch", retry returned 200 (Teams web). On Teams desktop an older cached build failed both REST calls the same way. Suspected: transient first-connection failure, not CORS (SharePoint sends `Access-Control-Allow-Origin: *` even on 401). The retry is kept.
- Teams desktop kept serving an old build after quit and restart; Teams web with F5 loaded the new one. Every report now shows a build stamp next to the App URL.

Next test (Galileo approved, 2026-10-13): manage scopes `Sites.Manage.All` and `AllSites.Manage`, requested only by new diagnostic steps "Manage-scope edit/delete of another user's row". Entra step 4c.

Manage-scope test, first run (Galileo, Teams web, build 2026-10-14T03:43:21Z, 20:54 Los Angeles), with the own-items setting on:
- Edit of aa.test's row: Graph with `Sites.ReadWrite.All` DENIED (403); REST with `AllSites.Write` DENIED (403); **Graph with `Sites.Manage.All` PASS (200, restored 200)**; **REST with `AllSites.Manage` PASS (204, restored 204)**. `Prompts: 0`.
- Delete not tested in that run (no aa.test delete target at that moment).

Manage-scope test, safety run (aa.test at Contribute, Teams web, same build, 20:56) and Galileo rerun (20:57):
- **aa.test: Graph `Sites.Manage.All` edit of Galileo's row PASS (200, restored), delete PASS (204, test row item 17); REST `AllSites.Manage` edit PASS (204, restored).** The own-items rule no longer protected Galileo's rows from a team member.
- Galileo: Graph manage edit PASS, delete PASS (item 46, aa.test's test row).
- Principals: all six routes still DENIED for aa.test, PASS for Galileo. Nothing outside the test rows changed; every edit restored.
- Conclusion (verified): the rule follows the app's scope, not the user's level. No app permission separates coordinators from team. Hypothesis "intersection" disproved by the team run.
- Action: Galileo revoked and removed `Sites.Manage.All`, `AllSites.Manage` and `AllSites.Write` in Entra (2026-10-13 about 21:00). Screenshot of API permissions afterwards: Microsoft Graph (2), `Sites.ReadWrite.All` and `User.Read`, Delegated, both "Granted for Agency Artifact"; no "Other permissions granted" section. Code back to Graph only (REST and manage steps removed; build stamp kept). Findings, `data.md` and `entra-app.md` updated.

Criterion 6 status: team half verified (refused by every route). Coordinator half: not possible through the app with any single permission set. Decision needed on the mechanism (see options below, updated).

**Decision (Galileo, 2026-10-13): option 1, coordinator corrections through a Power Automate flow.** Link probe first (`docs/setup/correction-flow.md`): an instant flow, as Galileo, edits and restores aa.test's row with the own-items setting on. Unknown until run: whether the SharePoint connector, itself an app, gets past the rule. **Probe passed** (21:11 Los Angeles, screenshot): both Update item actions green, aa.test's row edited and restored by the flow on Galileo's connection, own-items setting on. Full design after the probe. Deviation from the brief to note: criterion 6 asks that version history show the coordinator as editor; with a flow it shows the flow's connection account, and the coordinator is recorded on the correction request instead.

Options considered:
1. **Power Automate flow applies coordinator corrections** (the brief's fallback). Works with today's permissions. Version history shows the flow's account; the coordinator's name is recorded in the request and the flow run.
2. **Per-row permissions**: each new row gets unique permissions (creator: Contribute; coordinators and principals: edit), and the own-items setting goes off. SharePoint then checks the user, so team stays refused and coordinators pass, through Graph with today's scope. Costs one permission change per row (by a flow on creation) and many unique permissions over time; proportionate only while volume is small. Untested.
3. **Separate coordinator app registration** with a manage scope, restricted in Entra to assigned users (coordinators only). Team members could not get its token. Second registration to maintain, and its scope would let coordinators past the rule on every list. Untested.

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
