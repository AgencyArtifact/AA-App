# CLAUDE.md: Agency Artifact Management System

Version 1.1, 2026-10-13. This file is the project constitution. It is law in this repo.

## Purpose

Agency Artifact is a design practice in Los Angeles (master planning, landscape, design) of about ten people, one in India. This system reduces decision latency for the two principals: the time between a question existing and being able to answer it with confidence. The system gathers and calculates. People decide. Decisions are kept.

The contract's scope of work is the backbone. Weekly tasks link to its deliverables, so what is agreed with the client and what is assigned to the team stay in correspondence.

## How this repo relates to planning

Planning happens outside this repo, in a Claude project you cannot see. Work reaches you only as stage briefs in `docs/stages/` and as changes to this file. You never see the planning decisions log directly.

At the start of every session:
1. Read this file, then the current stage brief, then the SOPs it touches, then `docs/findings.md`.
2. Check the CLAUDE.md version the stage brief expects. If it differs from this file's version, stop and tell Galileo.

At the end of a stage, three files go back to planning: the stage report, `docs/findings.md` and this file. Write them so they can be read without the repo.

## Authority order

1. Galileo's latest instruction in the session.
2. This file.
3. The current stage brief.
4. SOPs in `docs/architecture/`.
5. `docs/findings.md`.
6. Code and data files.

If two of them conflict, stop and report the conflict. Never resolve it silently. Data files (workbooks, exports) are data, not specification, and may be out of date.

## Principles (settled)

1. People decide, the system prepares. Nothing reaches a client or anyone outside the office without human approval.
2. Numbers come from calculation, never from a language model. Every figure is traceable to its source and its freshness. Gaps are stated, not filled.
3. Hours come only from the person who worked them. No inference from calendar, files or email. Coordinators may correct or delete hours, and every correction is traceable.
4. Unplanned work is normal. The person who did it records it with a cause. "Client request" doubles as evidence for additional services. It is never created automatically from email.
5. Fixed, predefined metrics. No silent auto-suppression of alerts.
6. Proportionate to ten people. Every component serves a recurring decision. Fewer moving parts is better.
7. Build on what exists. The workbooks and the AA Time card app are assets.
8. Maintainable by one person.
9. Tasks are linkable to scope-of-work deliverables, not identical to them. Unlinked work is a signal, not an error. Linking must take seconds.
10. Chris's model is the model. The logic of the master schedule and the projections workbook is imported faithfully: it may be optimized, never reinterpreted. Data errors are separate from logic.
11. Spine first, built to evolve. Modularity comes from clean boundaries between layers, not from generic frameworks built in advance.

## Roles and the financial boundary

- **Principals** (Galileo, Chris): everything, including all financial data.
- **Coordinators** (Melanie; Viraj later if the India office starts): assign weekly tasks, receive timecard escalations, see operational data of all projects, edit or delete anyone's hours. No financial data.
- **Team**: enter their own hours, task completions and unplanned work, and edit only their own entries. See the tasks, deliverables and deadlines of their projects. No financial data.

Financial data means salaries, rates, fees, contract values, billing, profit, projections, pipeline value, margin and company overhead. Hours are operational. Hours converted into money are financial.

The boundary is enforced where the data lives (SharePoint permissions), never only in the interface. The test for every change: if the app had a bug, could a coordinator read financial data? If yes, the change is wrong.

The app never stores financial data on the device (local storage, IndexedDB, caches) and never writes it to logs.

Weekly summaries are tailored per role and built only from data that role may see.

## Runtime architecture: four layers

1. **Data.** SharePoint Lists on two sites, `AA Operations` and `AA Principals`, accessed through Microsoft Graph with delegated, per-user permissions. The boundary is enforced here. See `docs/architecture/data.md`.
2. **Calculation.** Chris's logic, real margin, planned versus actual. Deterministic. No language model operates in this layer.
3. **Views.** One app with views by role (team, coordinator, principal), running as a Teams personal app. Screens, charts, the weekly brief, Excel exports.
4. **AI and agents (future).** Read only calculated outputs. Summarize, rank, propose. Never write figures.

Each layer talks only to the one below it, through a defined interface (`docs/architecture/overview.md`). Interfaces change rarely, and only through a stage Blueprint. The app shows and edits data. It never decides access.

The timecard is the team view of the single app. Its settled experience is kept: three areas (Today, Tasks, Studio), half-hour steps, an explicit confirm action on Today and Tasks only, no strikethrough on completed tasks, percentage rollups as means, hours on an unassigned project flagged for review rather than blocked, English only, Agency Artifact branding only. Denser coordinator and principal screens must not degrade it.

Real margin (on true cost) sits alongside Chris's billing-rate cost, for principals only, with a visible flag explaining the difference. Both are kept.

## Build protocol: B.L.A.S.T., five gates per stage

Every stage passes five gates in order. Never cross a gate marked HALT without Galileo's approval in the session.

1. **Blueprint (HALT).** Read the stage brief. Write or update the SOPs in `docs/architecture/` for every schema and interface the stage touches: list columns and types, TypeScript types, inputs, outputs, units, time zones, edge cases. Write no code in `src/` or `tools/` until Galileo approves the SOPs.
2. **Link.** Prove every new connection (site, list, permission, Graph call, flow) with the smallest possible check before building logic on it. If a link fails, stop. Do not build around it.
3. **Architect.** Build layer by layer, through the interfaces only. Smallest working version first, tested on real inputs. Calculations are tested against known values from Chris's workbooks.
4. **Stylize (HALT).** Galileo tests on a phone inside Teams. Fix what he reports before rollout.
5. **Trigger.** Publish to the org app catalog, switch on flows, update SOPs and findings, write the stage report. A stage is complete only when it works in Teams for the people it serves.

**The golden rule.** If logic changes, update the SOP first, then the code. Code that disagrees with its SOP is a defect in one of the two: find out which.

**Self-annealing.** When something fails, read the actual error (HTTP status, Graph error code, stack trace). Do not guess. Patch, retest, then write a finding in `docs/findings.md` so the failure never repeats. If the finding changes how something must be built, update the SOP too.

## Decide or ask

- Galileo's choices: rules, priorities, access, anything that changes what people see or do, trade-offs with consequences. Stop and ask in one line, or list it under open questions in the report.
- Low-risk technical choices: decide, record the assumption in the report, continue.
- State why before adding any runtime dependency.
- Ask before deleting files, modifying files outside the stage's scope, or running long or multi-step operations against the tenant.
- No scope creep. Park good ideas outside the stage in one line in the report.

## Never

- Store secrets in the repo or the app. There are none: auth is delegated and the app is a single-page app. The Entra client ID and tenant ID are configuration, not secrets, and live in `src/config.ts`.
- Build a server, backend or token-exchange service. That fallback is Galileo's decision.
- Let a language model produce or alter a figure.
- Reinterpret Chris's logic.
- Read email, or infer hours from calendar, files or email.
- Send anything to a client or anyone outside the office.
- Put financial data, or anything calculated from it, on `AA Operations`.
- Reintroduce rejected ideas: Atelier Galileo in this system; a large data model with OCR, anomaly pipelines, tax or exchange-rate handling; many specialized agents; a project-lead layer; Excel as the live shared store; a locally hosted backend; separate timecard and admin apps.
- Claim something works without running it.

## Reporting

Every stage ends with `docs/stages/stage-N-report.md`, containing:
- Gate status: each gate passed or not, with the date.
- Deviations from the brief, and why. Galileo reads this first.
- Verified: ran it, with the evidence.
- Assumed: believed true, not tested.
- Untested.
- Open questions: decisions that belong to Galileo.
- Parked ideas: one line each.

State where every number comes from. Flag results that depend on unreliable inputs next to the result.

## Writing rules

- Docs are short and practical, written for whoever maintains this months from now.
- No em dashes in docs, code comments or UI copy.
- When showing code to Galileo, give complete files and say which file each one replaces.

## Current state

- Platform: Microsoft 365 is under feasibility test (stage 0). Until stage 0 reports a go, everything in `docs/architecture/data.md` is assumed, not verified.
- App: TypeScript, React and Vite. This repo holds the stage 0 test build (Home, `#/diagnostic`, `#/log`). The AA Time card prototype (the name "Checkplot" is retired) is outside this repo; its screens are ported in here in a later stage and become the team view.
- Hosting: GitHub Pages, repo `AgencyArtifact/AA-App`, at `https://agencyartifact.github.io/AA-App/`. The address is set only in `config.appUrl` (`src/config.ts`). Every push to `main` runs `.github/workflows/deploy-pages.yml`: test, build, publish. Not revisited until a brief says so.
- Public repo: while the repo is public, no real project, client, fee or staff data is committed, test fixtures included. The real workbooks stay in the git-ignored `Excell/`. Fictional copies with unchanged formulas are in `test-data/excel/` (formulas are not sensitive, decision 2026-10-13). The repo goes private before the first stage that needs real data.
- Commands: `npm run dev` (`http://localhost:5173/AA-App/`), `npm test`, `npm run build`, `npm run teams:package`, `npm run entra:values`.
- Reminders: Power Automate flows posting through the Teams Flow bot.

## File map

```
CLAUDE.md               constitution (this file)
docs/architecture/      SOPs; layer SOPs are created when a stage first needs them
  overview.md           layers and interface contracts
  data.md               sites, lists, permissions, boundary enforcement
docs/stages/            stage briefs and stage reports
docs/findings.md        cumulative learnings, target of self-annealing
docs/setup/             click-by-click setup steps for Galileo
src/                    the app
index.html, auth.html   Vite entry points (app; blank sign-in popup page)
public/                 static pages served as is (privacy, terms)
teams/                  Teams app icons; the package is built by tools/
tools/                  deterministic dev-time scripts (imports, provisioning, calculation tests, Teams package), never deployed
flows/                  exported Power Automate flows
test-data/              fictional data for tests (no real data while the repo is public)
.github/workflows/      GitHub Pages deploy
Excell/                 real workbooks, local only, git-ignored
```
