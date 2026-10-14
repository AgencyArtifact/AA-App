# CLAUDE.md: Agency Artifact Management System

Version 2.0, 2026-10-14. This file is the project constitution. It is law in this repo.

Changes from 1.2: BQE is out of the picture; the back office is bought (Harvest, Planner premium), the SharePoint data layer is superseded, principle 10 is replaced, the connector is allowed from stage 2, roles and the financial boundary are restated in Harvest and Planner terms. Principles 4 and 9 are kept but marked "to confirm by Galileo". Source: `docs/stages/stage-0-closeout.md` and `docs/stages/stage-1-feasibility.md`.

## Purpose

Agency Artifact is a design practice in Los Angeles (master planning, landscape, design) of about ten people, one in India. This system reduces decision latency for the two principals: the time between a question existing and being able to answer it with confidence. The system gathers and calculates. People decide. Decisions are kept.

The back office is bought, not built. Harvest holds hours, approvals and invoices. Planner premium holds each project's schedule and the weekly tasks. The AA Time card app is a custom front end, designed by Galileo, running in Teams. It is the team's only screen, with three areas: the timecard (log your own hours into Harvest), Tasks (see and close the tasks assigned to you in Planner) and Studio.

## How this repo relates to planning

Planning happens outside this repo, in a Claude project you cannot see. Work reaches you only as stage briefs in `docs/stages/` and as changes to this file. You never see the planning decisions log directly.

At the start of every session:
1. Read this file, then the current stage brief, then the SOPs it touches, then `docs/findings.md`.
2. Check the CLAUDE.md version the stage brief expects. If it differs from this file's version, stop and tell Galileo.

At the end of a stage, three files go back to planning: the stage report, `docs/findings.md` and this file. Write them so they can be read without the repo.

Closed stages are kept in `docs/archive/stage-N/`. They are records, not instructions.

## Authority order

1. Galileo's latest instruction in the session.
2. This file.
3. The current stage brief.
4. SOPs in `docs/architecture/`.
5. `docs/findings.md`.
6. Code and data files.

If two of them conflict, stop and report the conflict. Never resolve it silently. Data files (workbooks, exports) are data, not specification, and may be out of date.

## Principles

1. People decide, the system prepares. Nothing reaches a client or anyone outside the office without human approval.
2. Numbers come from calculation, never from a language model. Every figure is traceable to its source and its freshness. Gaps are stated, not filled. Figures come from Harvest and Planner premium, or from deterministic code that reads them.
3. Hours come only from the person who worked them. No inference from calendar, files or email. Coordinators may correct or delete hours, and every correction is traceable.
4. **To confirm by Galileo (not decided under the 2026-10-14 direction).** Unplanned work is normal. The person who did it records it with a cause. "Client request" doubles as evidence for additional services. It is never created automatically from email.
5. Fixed, predefined metrics. No silent auto-suppression of alerts.
6. Proportionate to ten people. Every component serves a recurring decision. Fewer moving parts is better.
7. Build on what exists. The bought software does the back office; the AA Time card app is an asset. Chris's workbooks are the reference for how Harvest and Planner premium are set up.
8. Maintainable by one person.
9. **To confirm by Galileo (not decided under the 2026-10-14 direction).** Tasks are linkable to scope-of-work deliverables, not identical to them. Unlinked work is a signal, not an error. Linking must take seconds.
10. Chris's workbooks are no longer imported faithfully. Their job moves into Harvest and Planner premium (decision 2026-10-14; replaces "Chris's model is the model").
11. Spine first, built to evolve. Modularity comes from clean boundaries between parts, not from generic frameworks built in advance.

## Roles and the financial boundary

| Role | People | Harvest role | Planner premium | Financial data |
|---|---|---|---|---|
| Principals | Galileo, Chris | Administrator | Plan owners | All |
| Coordinators | Melanie (Viraj later, if the India office starts) | Manager, **without** the optional permission to see billable rates and amounts | Assign weekly tasks | None |
| Team | Everyone else | Member | Assigned tasks only | None |

Financial data means salaries, rates, fees, contract values, billing, profit, projections, pipeline value, margin and company overhead. Hours are operational. Hours converted into money are financial.

The boundary is enforced where the data lives: Harvest roles for hours and money, Microsoft 365 permissions for Planner. Never only in the interface. The test for every change: if the app had a bug, could a coordinator or team member read financial data? If yes, the change is wrong.

- Planner premium holds no financial data: no fees, rates or budgets in plan, task or bucket names, notes or custom fields.
- The app never stores financial data on the device (local storage, IndexedDB, caches) and never writes it to logs. Harvest tokens are held in memory only in stage 1.
- The connector (from stage 2) acts for one person at a time with that person's Harvest login, so it can never return more than that person could see in Harvest.

**Who edits whose hours.** In Harvest, Managers edit the time of the people they manage, and an approved week locks. Members edit only their own time. Whether Harvest's activity log records deleted entries is to be confirmed in the Harvest trial (stage 0 Q14).

Weekly summaries are tailored per role and built only from data that role may see.

## Runtime architecture

| Part | Is | Holds or does | Must never |
|---|---|---|---|
| Harvest | Bought | Hours, approvals, invoices, rates, budgets; the financial boundary (roles) | Be bypassed by the app or the connector |
| Planner premium | Bought (Planner Plan 1, principals only) | Project schedules, phases (parent tasks), weekly tasks | Hold financial data |
| Microsoft 365 | Bought | Identity (Entra), Teams, Graph | |
| The connector | Small server, **from stage 2 only** | Holds Harvest logins for each person; runs reminders | Store money values; decide access; exist in stage 1 |
| The app (AA Time card) | Built, this repo; designed by Galileo | Teams personal app: timecard, assigned tasks, Studio | Store financial data on the device; compute figures of its own |
| AI and agents (future) | | Read calculated outputs only. Summarize, rank, propose | Write or alter a figure |

Interfaces between the parts are defined in `docs/architecture/overview.md`. Interfaces change rarely, and only through a stage Blueprint. The app shows and edits data. It never decides access to data: Harvest and Microsoft 365 do.

**The server rule.** No server in stage 1. From stage 2 the connector is allowed, for the two jobs above. Any other server, backend or token-exchange service is Galileo's decision.

**The app.** A custom front end over Harvest and Planner, designed by Galileo (decision 2026-10-14). Three areas: the timecard (Today), Tasks (assigned in Planner) and Studio. Its settled experience is kept: half-hour steps, an explicit confirm action on Today and Tasks only, no strikethrough on completed tasks, English only, Agency Artifact branding only. **To confirm by Galileo:** percentage rollups, and how "hours on an unassigned project flagged for review rather than blocked" works if Harvest refuses time on unassigned projects (stage 1, criterion 5).

## Build protocol: B.L.A.S.T., five gates per stage

Every stage passes five gates in order. Never cross a gate marked HALT without Galileo's approval in the session.

1. **Blueprint (HALT).** Read the stage brief. Write or update the SOPs in `docs/architecture/` for every schema and interface the stage touches: fields and types, TypeScript types, inputs, outputs, units, time zones, edge cases. Write no code in `src/` or `tools/` until Galileo approves the SOPs.
2. **Link.** Prove every new connection (Harvest call, Graph call, permission, flow) with the smallest possible check before building logic on it. If a link fails, stop. Do not build around it.
3. **Architect.** Build part by part, through the interfaces only. Smallest working version first, tested on real inputs (fictional data while the repo is public).
4. **Stylize (HALT).** Galileo tests on a phone inside Teams. Fix what he reports before rollout.
5. **Trigger.** Publish to the org app catalog, switch on flows, update SOPs and findings, write the stage report. A stage is complete only when it works in Teams for the people it serves.

**The golden rule.** If logic changes, update the SOP first, then the code. Code that disagrees with its SOP is a defect in one of the two: find out which.

**Self-annealing.** When something fails, read the actual error (HTTP status, Harvest or Graph error code and message, stack trace). Do not guess. Patch, retest, then write a finding in `docs/findings.md` so the failure never repeats. If the finding changes how something must be built, update the SOP too.

## Decide or ask

- Galileo's choices: rules, priorities, access, anything that changes what people see or do, trade-offs with consequences. Stop and ask in one line, or list it under open questions in the report.
- Low-risk technical choices: decide, record the assumption in the report, continue.
- State why before adding any runtime dependency.
- Ask before deleting files, modifying files outside the stage's scope, or running long or multi-step operations against the tenant or Harvest.
- No scope creep. Park good ideas outside the stage in one line in the report.

## Never

- Store secrets in the repo or the app. Entra and Harvest client IDs and the tenant ID are configuration, not secrets, and live in `src/config.ts`. A Harvest client secret, if one is ever needed, lives only in the connector, never in the repo.
- Build a server in stage 1, or any server other than the connector after it (Galileo's decision).
- Let a language model produce or alter a figure.
- Read email, or infer hours from calendar, files or email.
- Send anything to a client or anyone outside the office.
- Put financial data in Planner, Teams messages, the app's device storage or logs.
- Reintroduce rejected ideas: Atelier Galileo in this system; a large data model with OCR, anomaly pipelines, tax or exchange-rate handling; many specialized agents; a project-lead layer; Excel as the live shared store; a locally hosted backend; separate timecard and admin apps of our own; the SharePoint data layer.

## Reporting

Every stage ends with `docs/stages/stage-N-report.md`, containing:
- Gate status: each gate passed or not, with the date.
- Deviations from the brief, and why. Galileo reads this first.
- Verified: ran it, with the evidence.
- Assumed: believed true, not tested.
- Untested.
- Open questions: decisions that belong to Galileo.
- Parked ideas: one line each.

State where every number comes from. Flag results that depend on unreliable inputs next to the result. Reports state the presence of money fields, never their values.

## Writing rules

- Docs are short and practical, written for whoever maintains this months from now.
- No em dashes in docs, code comments or UI copy.
- When showing code to Galileo, give complete files and say which file each one replaces.

## Current state

- Direction: Harvest and Planner premium, under feasibility test (stage 1). Until stage 1 reports a go, every statement about them in `docs/architecture/` is assumed, not verified.
- Stage 0 (closed 2026-10-14): Teams personal app with silent sign-in verified on desktop and web; phones carried to stage 1. Records in `docs/archive/stage-0/`.
- App: TypeScript, React and Vite. This repo holds the stage 1 test build (diagnostic). The AA Time card prototype (the name "Checkplot" is retired) is outside this repo; its screens are ported in a later stage.
- Hosting: GitHub Pages, repo `AgencyArtifact/AA-App`, at `https://agencyartifact.github.io/AA-App/`. The address is set only in `config.appUrl` (`src/config.ts`). Every push to `main` runs `.github/workflows/deploy-pages.yml`: test, build, publish. Not revisited until a brief says so.
- Public repo: while the repo is public, no real project, client, fee or staff data is committed, test fixtures included. Harvest and Planner test data uses the fictional client `Zanthorpe Test`. The real workbooks stay in the git-ignored `Excell/`. Fictional copies with unchanged formulas are in `test-data/excel/`. The repo goes private before the first stage that needs real data.
- SharePoint sites `AA Operations`, `AA Principals` and their test lists stay until stage 1 closes, then Galileo deletes them.
- Commands: `npm run dev` (`http://localhost:5173/AA-App/`), `npm test`, `npm run build`, `npm run teams:package`, `npm run entra:values`.
- Reminders: stage 2, run by the connector or Power Automate (design in `docs/setup/reminder-flow.md`).

## File map

```
CLAUDE.md               constitution (this file)
docs/architecture/      SOPs
  overview.md           parts and interface contracts
  data.md               superseded SharePoint data layer (record)
docs/stages/            current stage brief, checklist and report
docs/archive/stage-N/   closed stages (records)
docs/findings.md        cumulative learnings, target of self-annealing
docs/setup/             click-by-click setup steps for Galileo
src/                    the app
index.html, auth.html   Vite entry points (app; blank sign-in popup page)
public/                 static pages served as is (privacy, terms)
teams/                  Teams app icons; the package is built by tools/
tools/                  deterministic dev-time scripts (Teams package, Entra values), never deployed
flows/                  exported Power Automate flows
test-data/              fictional data for tests (no real data while the repo is public)
.github/workflows/      GitHub Pages deploy
Excell/                 real workbooks, local only, git-ignored
```
