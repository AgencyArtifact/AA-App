# CLAUDE.md: AA app

Read this at the start of every session. It holds what is settled. The current stage brief in `docs/stages/` says what to build now.

## What this is

One app for Agency Artifact (about 10 people, Los Angeles and India), running inside Microsoft Teams, with views by role:

- **Team:** the timecard (Today, Tasks, Studio), plus the tasks, deliverables and deadlines of their own projects.
- **Coordinator:** team view, plus weekly task assignment and the operational status of all projects. No financial data.
- **Principal:** everything, including capacity, financial projections, billing and margin.

Purpose: reduce the time between a management question existing and the principals answering it with confidence. The system gathers and calculates. People decide.

## Authority

1. The current stage brief in `docs/stages/`.
2. This file.

Product decisions are not yours to make. If something is unspecified, ambiguous or contradictory, stop and write the question in the stage report. Do not fill gaps with plausible inventions. Low-risk technical choices are yours: decide, mark them as assumptions in the report, continue.

## Architecture (settled)

Four layers. Each talks only to the one below it.

1. **Data:** Microsoft Lists on two SharePoint sites.
   - `AA Operations`: everyone, per-list permissions. Operational data only.
   - `AA Principals`: the two principals only. Every financial field lives here.
   - An entity that carries money is split: operational record on Operations, financial twin on Principals, same ID.
2. **Calculation:** pure TypeScript functions. No I/O, no network, no language model. Operations and finance are separate modules.
3. **Views:** this React app, hosted as a static site, loaded as a Teams personal app.
4. **AI and agents:** future. They read calculated outputs only and never produce figures.

Lists are created by a provisioning script in the repo, not by hand (from stage 2 on).

## The financial boundary (hard rule)

The boundary is enforced by SharePoint permissions, not by this app. To keep it that way:

- Graph is called only with the signed-in user's **delegated** token. Never use application permissions, client secrets or a service identity in this app.
- No custom backend server. If one seems necessary, stop and report; do not build it.
- Never copy a financial field into an Operations list.
- Never persist financial data on the client (no localStorage, IndexedDB or cache) and never log it.
- Hiding a screen is not security. Assume any view can be opened by anyone.

Financial means: salaries, rates, fees, contract values, billing, profit, projections, pipeline value, margin, overhead. Hours are operational. Hours converted into money are financial.

## Public repository rule

While the repo is public, no real project, client, fee or staff data (including test fixtures and sample files) may be committed. Public git history is permanent. The repo goes private before the first stage that needs real data.

The formulas and structure of Chris's models are not sensitive and may be committed (decision by Galileo, 2026-10-13). Fictional copies of the workbooks live in `test-data/excel/`: names, project numbers, clients, rates, salaries and fees are fictional; formulas are unchanged. The real workbooks never enter the repo (`Excell/` is git-ignored).

## Numbers

Every figure comes from calculation over stored data and is traceable to its source and freshness. Missing data is shown as missing, never estimated or filled. Calculation code is tested against fixed inputs with known outputs.

## Timecard experience (locked, do not change)

- Three areas: Today, Tasks, Studio.
- Half-hour steps.
- Explicit Confirm action, on Today and Tasks only.
- No strikethrough on completed tasks.
- Percentage rollups are means.
- Hours on an unassigned project are flagged for review, not blocked.
- English only. Agency Artifact branding only.
- It must work well on a phone. Denser coordinator and principal screens must not degrade it.

## Never build

- Reading email, calendar or file activity to infer hours, tasks or requests.
- Sending anything to clients or outside the office automatically.
- Excel as the live data store (Excel as an export or view is fine).
- Anything for Atelier Galileo.

## How to work

- Smallest working version first. Fewer dependencies: state why before adding any runtime dependency.
- Never claim something works without running it. Every report separates **verified** (ran it, saw it), **assumed** and **untested**.
- Tests in Teams on real devices and actions in admin centers are done by Galileo. Write precise steps for him; do not assume their outcome.
- Deliver complete files, not snippets. Ask before deleting or restructuring files.
- No secrets in the repo. The Entra client ID and tenant ID are configuration, not secrets, and live in one config file.
- Out-of-scope ideas: one line in the report under "Parked", then continue.
