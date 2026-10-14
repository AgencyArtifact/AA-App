# Handoff 3: stage 0, Link gate in progress (2026-10-13, late evening Los Angeles)

**Update, same night:** Galileo dropped the own-items lock on hours (CLAUDE.md 1.2, `data.md` 1.2, report section *Decision: hours are a record, not a lock*). Steps 2 and 3 of "Next" below are replaced by checklist A2 and E1 to E3; the correction flow is not built. Step 1 is run after A2, so one aa.test run covers both.

For a new Claude Code session at the repo root. Replaces the "Where stage 0 is" table of `stage-0-handoff-2.md`; that file and `stage-0-handoff.md` stay as records.

## Read first, in this order

1. `CLAUDE.md` (version 1.1).
2. `docs/stages/stage-0-feasibility.md` (brief v2, expects CLAUDE.md 1.1: matches).
3. This file.
4. `docs/architecture/data.md` (now includes Access routes, the verified own-items rule and *TestCorrections*) and `docs/architecture/overview.md`.
5. `docs/findings.md` (five entries; the top two change how things are built).
6. `docs/stages/stage-0-report.md`, top section (brief v2). Long; the sections *T3 extension*, *Criterion 6: result and decision needed* and *Test matrix (brief v2)* hold tonight's evidence.
7. `docs/stages/stage-0-test-checklist.md` and `docs/setup/correction-flow.md` (next work).

## Where stage 0 is

| Step | Status |
|---|---|
| T0, T1 | Approved. |
| T2 auth | Checked, no change. Graph only (`User.Read`, `Sites.ReadWrite.All`). |
| T3 diagnostic | Done and extended (Galileo's decision): runs every Graph check itself, including delete of another user's row (via `stage0-delete-target` rows dated 2026-01-01), TestFees by path / site id / list id, Microsoft Search. Build stamp in the App URL line. Graph Explorer dropped from the matrix (deviation, approved). |
| T4 package | Reviewed. Manifest 1.29 valid. App in the org catalog, installed on Galileo's Teams desktop. Two tabs (brief says one: Q10 open). |
| T5 reminder flows | Doc written (`docs/setup/reminder-flow.md`), not built yet. |
| Teams setup (A1) | Admin side seen on screen. aa.test's "Upload a custom app" tile not yet propagated at 20:00; not blocking. |
| Test matrix | C1 (desktop, Galileo) and C6 (web, aa.test) run many times. Phones (C3, C4, C7, C8), Galileo web, aa.test desktop not run. |
| Criterion 3 boundary | App routes (6) and Microsoft Search (Graph search API) **DENIED for aa.test** on Teams web; positive control PASS for Galileo. Still to do: site URL in a browser and the Microsoft 365 search box as aa.test (checklist D1, D2), phones. |
| Criterion 6 hours | Team half **verified**: aa.test refused editing and deleting Galileo's rows by every route. Coordinator half: **impossible through the app** (see findings); Galileo chose corrections by **Power Automate flow**. Probe passed (flow on Galileo's connection edits aa.test's row). Full flow designed, **not built**. |
| Criteria 2, 4, 5 | Not run (phone timing, reminders, phone install). |

Last commit pushed: `07d6911` or later on `main`. Pages deploy green. Working tree clean.

## What changed tonight (read the findings for detail)

- Through Graph, the list setting "edit only own items" blocks **Owners too**. In the SharePoint web interface Owners get past it.
- The rule is checked against the **app's scope**, not the user's level: write scopes block everyone, manage scopes (`Sites.Manage.All`, `AllSites.Manage`) let **everyone** past, team included. Those were granted for one test, **revoked and removed** in Entra (screenshot: only `User.Read`, `Sites.ReadWrite.All` remain). Never grant manage-level scopes (rule in `entra-app.md` step 4b).
- SharePoint REST route tested and removed (same behaviour as Graph). CORS from the app's origin works; NAA issues SharePoint tokens. Not needed now.
- Teams desktop caches old builds; test new builds on Teams web with F5 and check the build stamp.
- Graph date-only column: writing `2026-10-13` from a Pacific device returns `2026-10-13T07:00:00Z` (midnight Pacific in UTC). India side still to test.

## Tenant facts added since handoff 2

| Item | Value |
|---|---|
| TestHours list id | `3d4f19f9-ac90-49fb-a089-918818410229` (direct links in `docs/setup/sharepoint-sites.md`) |
| AA Operations site id | `agencyartifact.sharepoint.com,b67276a0-e733-4f01-a6ac-6031d913cf1e,f5c3c54c-fc59-4dee-9550-187326553846` |
| AA Principals site id, TestFees list id | in `src/config.ts` (`principals.siteId`, `testFeesListId`) |
| TestHours rows that matter | 1 `Hours test` (Galileo, 1.0 h, today), 4 `aa.test row` (aa.test, 2026-01-01), plus `stage0-delete-target` rows the diagnostic manages |
| TestHours setting | Read all; create and edit own items only (restored after a 2-minute test, confirmed by Galileo) |
| Teams policy | `AA app testers` assigned directly to Galileo and aa.test |
| Probe flow | `AA Stage0 Correction Probe`, environment `Default-6a257495-c628-470a-855d-94ccaedc4d7a` |

## Next, in this order

1. **Check run as aa.test** after the revoke (Teams web, private window, F5, build stamp 03:5x or later): edit and delete of Galileo's rows DENIED, all Principals DENIED, no REST or Manage-scope lines. Record in the report.
2. **Correction flow**, `docs/setup/correction-flow.md` parts A to F (group, list, ID column, flow, four tests, export). Galileo sends back Status and Outcome of t1 to t4 and the TestCorrections List settings address (add direct links). Then record, update `data.md` from "assumed" to "verified" for delete by flow.
3. **Rewrite checklist section E**: it still describes switching aa.test to the Coordinator level and expecting the app's edit to pass. That is now wrong. Replace with the correction-flow tests; decide with Galileo whether the Coordinator permission level is kept at all (it only matters in the SharePoint web interface now).
4. **Phones**: install from the catalog as aa.test (criterion 5), runs C3, C4, C7, C8, three cold-start timings with stopwatch and the Today screen timing (checklist F).
5. **Checklist D1, D2** as aa.test (site URL, Microsoft 365 search box).
6. **Reminder flows** (checklist G, `reminder-flow.md`), including the date-boundary case on the India device and the control.
7. Report: go or no-go per criterion, deviations, stage report format of CLAUDE.md.

## Open questions for Galileo

- Q10. One static tab (brief) or two (Home, Diagnostic, as now)? Recommendation: two until stage 0 closes.
- Q11. Date-boundary write: diagnostic for raw values plus `#/log` for the row the flow reads (as written in `reminder-flow.md`)?
- Q12. Flow exports contain sign-in addresses: keep them in git-ignored `Excell/flows/` while the repo is public?
- New: keep or drop the Coordinator permission level on AA Operations, now that coordinators correct through the flow.
- New: criterion 6 deviation accepted? Version history shows the flow's connection (Galileo), the coordinator is on the request row. A dedicated service account for the flow connection could replace Galileo later; parked.

## Working with Galileo (keep this)

- Always give the **full URL** of every page, never a menu path alone. Known links: `docs/setup/sharepoint-sites.md` *Direct links*; Entra API permissions `https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/503412e0-1cec-47b4-8a28-888cda0c8493`; Power Automate create `https://make.powerautomate.com/environments/Default-6a257495-c628-470a-855d-94ccaedc4d7a/create`.
- **Batch** the steps and say exactly what to send back. No screenshot after every page; copied diagnostic reports are the evidence. He was losing a lot of time on manual checks; automate in the diagnostic whatever Graph can test.
- Any test that widens permissions includes a run as a team account before its result counts (tonight's lesson).
- Remind him to restore any setting changed for a test, and explain why: list settings apply to everyone.
- Paste reports into the report with UPNs replaced (`<galileo UPN>`, `<aa.test UPN>`): the repo is public.

## Practical

- Commands: `npm run dev`, `npm test` (34 tests), `npm run build`, `npm run typecheck`, `npm run teams:package`, `npm run entra:values`.
- Push: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -u origin main`. Galileo approved pushes during this session; ask again in a new one.
- After a push, the deploy takes about a minute; GitHub Pages caches HTML up to 10 minutes.
- PowerShell 5.1: `Set-Content -Encoding utf8` writes a BOM; write files with `[IO.File]::WriteAllText(..., (New-Object Text.UTF8Encoding $false))` or the Edit tool.
- The Microsoft 365 claude.ai connector is connected in this account. Do not use it (CLAUDE.md: never read email; boundary tests must run as aa.test). Ironclad was offered for removal; not needed.
