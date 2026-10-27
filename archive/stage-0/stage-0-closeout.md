# Stage 0 close-out

2026-10-14. Written in planning. Closes `stage-0-feasibility.md` (brief v2). The stage 0 report (`stage-0-report.md`) and handoffs 1 to 4 stay as records.

## Verdict

Stage 0 tested two things. One holds, one was overtaken by a decision.

- **Microsoft Teams as the home of the app: go on desktop and web, phones still to run.** Sign-in without a prompt works through nested app authentication on Teams desktop and Teams web, for a principal and for the test account (diagnostic runs C1 and C6, 2026-10-13). The phone runs move to stage 1.
- **SharePoint Lists as the data layer: superseded, not failed.** On 2026-10-14 Galileo moved the back office to bought software: Harvest for hours, approvals and invoicing, and Planner premium for project schedules and tasks. The SharePoint boundary and hours tests no longer decide anything.

## Go criteria at close

| # | Criterion (brief v2) | Result | Status at close |
|---|---|---|---|
| 1 | Teams personal app on desktop, web, iOS, Android, single sign-on, no server | Desktop and web verified (C1 Galileo, Teams desktop; C6 aa.test, Teams web; 0 prompts). Phones not run. | Phones carried to stage 1. "No server" changes: see Decisions. |
| 2 | Phone speed, cold start to confirmed write under 30 s | Not run. Teams web showed `Write: 1.9 s from page load` (C6 rerun), not a phone and not a cold start. | Carried to stage 1, measured against a Harvest write. |
| 3 | `AA Principals` denied to aa.test by every route | App routes and Microsoft Search denied on Teams web (C6 rerun). Site URL, Microsoft 365 search box and phones not run. | Retired. The financial boundary now lives in Harvest roles; stage 1 tests it there. |
| 4 | Reminder reaches aa.test, escalates to coordinator, LA and India time, date-boundary case | Flow designed (`docs/setup/reminder-flow.md`), not built. | Carried to stage 2. Same logic; the flow asks the connector instead of reading `TestHours`. |
| 5 | Published to the org catalog, installed from a phone | Package builds and validates against manifest schema 1.29. Not uploaded. | Carried to stage 1. |
| 6 | Hours integrity on `TestHours` | Decision taken ("record, not lock", 2026-10-13); tenant not changed. | Retired. In Harvest, Managers edit the time of people they manage and an approved week locks. |

## What stage 0 delivered that stays

- The React, TypeScript and Vite app shell, hosted on GitHub Pages (`AgencyArtifact/AA-App`), with the deploy workflow and build stamp.
- The Entra app registration and `src/auth/graphAuth.ts` (nested app authentication, silent first, popup fallback). Reused as is; the Graph permissions change in stage 1.
- The Teams package builder (`tools/build-teams-package.mjs`), icons and validated manifest.
- The diagnostic screen pattern and the test checklist across four clients. Stage 1 extends the diagnostic for Harvest and Planner.
- The reminder flow design: two time zones, escalation, date-boundary case.
- Findings that stay true: Teams desktop serves old builds (check the build stamp, test on Teams web first); retry once on a browser-level fetch error; the git push command for `AgencyArtifact/AA-App`.

## What retires

| Item | Where | What to do |
|---|---|---|
| SharePoint data layer, four-layer constitution | `CLAUDE.md` 1.2, `docs/architecture/overview.md`, `data.md` | Rewritten in stage 1 T0 (CLAUDE.md 2.0). `data.md` marked superseded, kept as a record. |
| Boundary and hours checks in the diagnostic | `src/diagnostic/`, `src/graph/sharepoint.ts`, `config.sharepoint` | Removed in stage 1 T0. |
| `#/log` test screen writing to `TestHours` | `src/log/` | Removed in stage 1 T0, or pointed at Harvest (Claude Code proposes at Blueprint). |
| Correction flow | `docs/setup/correction-flow.md` | Already superseded. Keep as a record. |
| `Sites.ReadWrite.All` on the Entra app | Entra admin center | Galileo removes it in stage 1 (least privilege), after T0 removes the code that uses it. |
| Sites `AA Operations`, `AA Principals`; lists `TestHours`, `TestFees`; permission level `AA Team` | SharePoint | Keep until stage 1 closes, then delete. Galileo's decision. |
| Test account `aa.test` | Entra | Keep. Stage 1 uses it in Harvest and Planner. |

## Open questions from stage 0

| Question | Disposition |
|---|---|
| Q3 stopwatch start, Q4 Home tab opens the test | Carried to stage 1 (phone timing). |
| Q6 principals' names in a public repo | Still open. |
| Q7 duplicate `Handoff/stage-0-feasibility.md` | Still open. |
| Q10 one static tab or two | Carried to stage 1. |
| Q11 date-boundary write, Q12 flow exports | Carried to stage 2 (reminders). |
| Q13 criterion 6 reworded | Closed: criterion retired. |
| Q14 soft delete of hours | Closed: Harvest owns hours. Whether its activity log (Enterprise plan) records deleted entries is to confirm in the Harvest trial. |
| Where the app reads who is a coordinator | Closed: the person's Harvest role (Manager). |

## Repo state at close

- Local `main` is two commits ahead of `origin/main` (`7353cc4`, `d75c3e8`). Push needs Galileo's approval in session.
- Untracked: `Research/`, `docs/architecture/AA Time Card on BQE.html`, `docs/architecture/AA Time Card on Harvest.html` (planning pages, 2026-10-14). Commit the two pages, or move them to `docs/planning/`: Claude Code proposes in stage 1 T0.

## Parked items carried over

- Update the deploy workflow's actions to Node 24 versions; `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19.
- Token prefetching via `webApplicationInfo.nestedAppAuthInfo` (desktop and web only).
- A host that can send `Cache-Control: no-store` for `auth.html`.
- Keep the icon generator script once the clean logo file arrives.
- Dropped: delegated `Sites.Selected` (no SharePoint data layer).
