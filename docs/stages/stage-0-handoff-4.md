# Handoff 4: stage 0, after the hours-access decision (2026-10-13, late night Los Angeles)

For a new Claude Code session at the repo root. Replaces "Where stage 0 is" and "Next" of `stage-0-handoff-3.md`; handoffs 1 to 3 stay as records.

## Read first, in this order

1. `CLAUDE.md` (**version 1.2**). Brief v2 expects 1.1: the mismatch is known and caused by Galileo's instruction in session (report, *Decision: hours are a record, not a lock*). Do not stop on it.
2. `docs/stages/stage-0-feasibility.md` (brief v2).
3. This file.
4. `docs/architecture/data.md` (**1.2**) and `overview.md`.
5. `docs/findings.md` (six entries; top two change how things are built).
6. `docs/stages/stage-0-report.md`: sections *Criterion 6* and *Decision: hours are a record, not a lock*, then *Open questions (brief v2)*.
7. `docs/stages/stage-0-test-checklist.md` (A2, B, E rewritten tonight).

## What this session decided

1. **Hours are a record, not a lock** (Galileo). The own-items lock on hours is dropped. Everyone on AA Operations can technically edit any hours row; the app offers team their own rows, coordinators and principals any row. Version history is the control. The financial boundary (AA Principals, members Galileo and Chris only) is unchanged and stays a SharePoint lock.
   Why: the own-items setting is checked against the app's scope, so no app permission separates coordinators from team (findings). The correction flow that worked around it was judged too heavy for ten people.
2. **New permission level `AA Team`** = Contribute without Delete Versions, for team and coordinators. Docs: Contribute includes Delete Versions, which would let anyone erase the record. Made by converting the unused `Coordinator` level (`sharepoint-sites.md` part 3).
3. **Correction flow dropped** before being built. `correction-flow.md` marked superseded; the passed probe stays as a record. `TestCorrections` and `AA Coordinators` will not be created.
4. Criterion 6 reworded in the report (deviation; planning to confirm, Q13).

Files changed: `CLAUDE.md`, `data.md`, `sharepoint-sites.md`, `correction-flow.md`, checklist, report, findings, handoff 3 (pointer), `src/diagnostic/runDiagnostic.ts` (comments only). Typecheck, 34 of 34 tests and build pass. Commit `7353cc4` plus this handoff: **local, not pushed**. Galileo has not approved pushes in this session; ask.

## Where stage 0 is

| Step | Status |
|---|---|
| T0 to T4 | As in handoff 3 (done). |
| T5 reminder flows | Doc written, not built. |
| Live app | Build stamp `2026-10-14T04:17:43Z` (commit `cda97b2`); no REST or manage-scope code (checked in the live bundle). Tonight's commit changes no behaviour. |
| Criterion 1 platform | Desktop and web verified; phones not run. |
| Criterion 3 boundary | App routes and Graph search DENIED for aa.test on Teams web. To do: one rerun after A2, site URL and Microsoft 365 search box as aa.test (D1, D2), phones. |
| Criterion 6 hours | New design, **tenant not changed yet**. Waiting for Galileo to run checklist A2, then E1 to E3. |
| Criteria 2, 4, 5 | Not run (phone timing, reminders, phone install). |

## Next, in this order

1. **Galileo applies A2** (convert `Coordinator` to `AA Team`; aa.test to AA Team; TestHours "Create and edit all items"), then runs the diagnostic as aa.test on Teams web and checks E1 to E3. Exact steps and URLs were sent in chat and are in the checklist. Expected: aa.test edit and delete of Galileo's rows PASS, every Principals line DENIED, no version delete option for aa.test, version history and recycle bin show AA TEST. Record in the report with UPNs replaced. This run also closes handoff 3's step 1.
2. **Phones** (criterion 5 install, C3, C4, C7, C8, three cold-start timings, Today timing): checklist F.
3. **D1, D2** as aa.test.
4. **Reminder flows** (checklist G, `reminder-flow.md`), including the India date-boundary case and control.
5. **Report**: go or no-go per criterion.

Galileo felt overwhelmed by detail tonight. A big-picture summary was given (stage 0 is a feasibility test, nearly done; later stages: team timecard, projects and deliverables, coordinator view, principal view with Chris's logic, weekly summary, later AI). Offered, not yet answered: sort remaining checks into "needed for go/no-go" and "can wait". Raise it again before handing him the phone and reminder work.

## Open questions for Galileo

- Q10 to Q12 as in handoff 3 (tabs, date-boundary write, flow exports).
- Q13. Criterion 6 reworded as "record, not lock": accepted? (planning)
- Q14. Deletes of hours in the hours stage: soft delete (recommended) or no Delete Items for AA Team. Today a delete's record lasts about 93 days (recycle bins, assumed).
- Where the app reads who is a coordinator (likely a SharePoint group): hours stage Blueprint.
- Push of `7353cc4` and this handoff.

## Working with Galileo (keep)

- Plain language and the big picture first; he loses scope in detail. Batch steps, give full URLs, say exactly what to send back.
- He asked for aa.test's credentials. The repo holds none (by design). Sign-in name is probably `aa.test@agencyartifact.com` (not verified; fallback `aa.test@agencyartifact.onmicrosoft.com`); exact name at `https://admin.microsoft.com/#/users`, row AA TEST, where he can also reset the password.
- Any test that widens permissions includes a run as aa.test before it counts. Remind him to restore test settings.
- Paste reports with UPNs replaced (`<galileo UPN>`, `<aa.test UPN>`): public repo.
- Do not use the Microsoft 365 claude.ai connector (CLAUDE.md: never read email; boundary tests run as aa.test).

## Practical

- Commands: `npm run dev`, `npm test` (34), `npm run build`, `npm run typecheck`, `npm run teams:package`.
- Push: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -u origin main`, only with Galileo's approval in session. Deploy takes about a minute; Pages caches HTML up to 10 minutes; check the build stamp; Teams desktop caches old builds, use Teams web with F5.
- PowerShell 5.1: write files without BOM (`[IO.File]::WriteAllText(..., (New-Object Text.UTF8Encoding $false))`) or with the Edit tool.
