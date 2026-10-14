# Handoff 2: stage 0, end of T1 (2026-10-13)

For a new Claude Code session at the repo root. Replaces nothing: `stage-0-handoff.md` is the record of the v1 rounds.

## Read first, in this order

1. `CLAUDE.md` (version 1.1).
2. `docs/stages/stage-0-feasibility.md` (brief v2, expects CLAUDE.md 1.1).
3. This file.
4. `docs/architecture/data.md` (1.1) and `docs/architecture/overview.md`.
5. `docs/findings.md`.
6. `docs/stages/stage-0-report.md` (top section is brief v2; below it, rounds 1 and 2 for reference).

## Where stage 0 is

| Step | Status |
|---|---|
| T0 cleanup | Done and approved. `docs/stages/stage-0-T0-cleanup-report.md`. Tag `pre-constitution-1.0`. |
| T1 Blueprint | Delivered. **Not yet approved by Galileo (HALT).** First action of the new session: ask for approval. |
| Tenant preconditions | Done by Galileo, except his own Microsoft Search for `Zanthorpe` (see Pending). |
| T2 to T5, test matrix | Not started. |

Everything is committed and pushed to `main` (`248d463` or later). The Pages deploy is green and serves the real Entra IDs.

## T1 deliverables

- `docs/setup/m365-admin.md`: admin guide in order (role, aa.test, Teams custom app upload, Entra, SharePoint, India device).
- `docs/setup/entra-app.md`: app registration, sources rechecked 2026-10-13.
- `docs/setup/sharepoint-sites.md`: sites, members (page by page, with direct `_layouts` addresses), Coordinator level, both lists, sources.
- `docs/architecture/data.md` 1.1: groupless sites, team never at Edit, test list schemas, documentation status of each assumption.
- `src/config.ts`: filled (see below). Only `teamsApp.developerWebsiteUrl` is still `REPLACE_ME_FIRM_WEBSITE`, which blocks `npm run teams:package` (T4).

## Tenant facts (set up by Galileo, 2026-10-13)

| Item | Value |
|---|---|
| Tenant ID | `6a257495-c628-470a-855d-94ccaedc4d7a` (confirmed against the public OpenID endpoint) |
| Entra client ID | `503412e0-1cec-47b4-8a28-888cda0c8493` |
| Entra redirect URIs (SPA) | `brk-multihub://agencyartifact.github.io`, `https://agencyartifact.github.io/AA-App/auth.html`, `http://localhost:5173/AA-App/auth.html` (screenshot) |
| Admin consent | Asked for; Galileo did not explicitly confirm "Granted for tenant". Confirm before T2 testing |
| SharePoint host | `agencyartifact.sharepoint.com` |
| Sites | `/sites/AAPrincipals`, `/sites/AAOperations`. Both "Other options" > Team site, no Microsoft 365 group. Time zone Pacific on both |
| AA Principals | Owners: Galileo and two accounts both named Christopher Torres (Galileo's decision to keep both; not checked whether either is a guest). Members, Visitors empty. Site collection admin: Galileo only. Check Permissions for Everyone except external users: None. `Everyone` cannot be entered in the people picker |
| AA Operations | Owners Galileo and Chris. `aa.test` granted Contribute directly, in no group |
| Coordinator level | Created on AA Operations (Contribute plus Override List Behaviors). Not assigned. Exact label of the ticked permission not reported |
| TestHours | Columns Title, Person, Date (date only), WorkDate (text), Hours. Read all items; create and edit own items only. Versioning on by default, 50 versions. One row `Galileo row` by Galileo |
| TestFees | Columns Title, Project, Fee. One row `Fee test`, Project `Zanthorpe`, Fee 1,000 (fictional) |
| aa.test | Microsoft 365 Business Standard (tenant has no Business Basic; deviation recorded). Release the seat after stage 0 |
| Teams | Setup policy `AA app testers` was being created (Galileo asked about user pinning: keep on). Not confirmed: org-wide custom apps on, policy saved and assigned to Galileo and aa.test, propagation |

Evidence for each line: `docs/stages/stage-0-report.md`, "Setup evidence".

## Decisions by Galileo this session

- All T0 actions approved (A0 to A10, E0 to E7).
- Two time zones (India, US) are required. Carried by people and devices (device-local `WorkDate`, one reminder flow per zone); sites stay on Pacific as the storage reference.
- Stage 0 sites have no Microsoft 365 group. Whether the real `AA Operations` connects to a Teams team stays an open question in data.md.
- Keep both Christopher Torres accounts as Owners of AA Principals.
- aa.test on Business Standard.

## Pending (before or during T2)

1. Galileo approves T1 (HALT).
2. Galileo searches `Zanthorpe` as himself and must find the row (positive control for criterion 3).
3. Galileo confirms admin consent shows "Granted for <tenant>" for `User.Read` and `Sites.ReadWrite.All`.
4. Firm website URL for the manifest (open question Q5 of the report), needed in T4.
5. Galileo confirms the Teams custom app setup (m365-admin.md part 3) and, hours later, that both accounts see **Upload a custom app**.
6. Optional: the exact label of the permission ticked in the Coordinator level.

## Next: T2 to T5 against brief v2

Much exists from the v1 rounds; these are revisions. Known gaps:
- T2 `src/auth/graphAuth.ts`: exists (NAA in Teams, popup in browser, silent first). Check against brief v2; likely no change.
- T3 `src/diagnostic/runDiagnostic.ts` lacks: Teams host client; device time zone and the local "today"; write with both Date and WorkDate and show raw values from Graph; edit a row created by another user, then restore; timer from app start to write result. `src/graph/sharepoint.ts` `createTestHoursItem` does not write `WorkDate`. Read of TestFees must stay count only.
- T4: manifest 1.29 in `tools/build-teams-package.mjs` (1.30 exists but is not listed as generally available). Needs the firm website URL.
- T5 `docs/setup/reminder-flow.md`: filters on `Date` only; brief v2 needs Date and WorkDate, log which matched, one flow on LA time and one on India time, the date-boundary case.
- Test checklist `docs/stages/stage-0-test-checklist.md`: still v1; rewrite for the v2 matrix (four boundary routes, criterion 6, cold-start timing, date-boundary case). Search word `Zanthorpe` is already at the top. Remind Galileo to recreate `Galileo row` before the Graph Explorer delete test.
- `src/log/` (`#/log`): decide whether it stays for the separate Today-screen timing.

Golden rule: if T3 changes what is written to TestHours, `data.md` already describes it (WorkDate); keep code and SOP in step.

## Practical

- Commands: `npm run dev` (http://localhost:5173/AA-App/), `npm test`, `npm run build`, `npm run teams:package`, `npm run entra:values`.
- Push as AgencyArtifact (plain `git push` gives 403, see findings): `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -u origin main`. Ask Galileo before pushing.
- Windows machine, Git Bash and PowerShell. Repo is public: never commit `Excell/`.
- Working with Galileo on tenant steps: he follows the setup docs on screen and sends screenshots. Give one page at a time, name the page and its direct address, say what he should see, and put every clarification back into the setup doc.
