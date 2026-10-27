# Stage 1: Harvest and Planner premium feasibility

Version 1, 2026-10-14. Place in `docs/stages/`. Read `CLAUDE.md` (expects 1.2; T0 produces 2.0), then `stage-0-closeout.md`, then this brief.

## Goal

A go or no-go, with evidence, on the working direction of 2026-10-14:

- **Harvest** holds hours, approvals and invoices.
- **Planner premium** (what Microsoft Project became in 2025) holds each project's schedule and the weekly tasks.
- **The AA Time card app** in Teams is the team's only screen. It has two jobs: log your own hours, and see and close the tasks assigned to you.

This stage is a test. It builds no server, ports no screens and uses no real data. Build only what the test needs.

## Decisions this brief carries (planning, 2026-10-14)

1. The back office is bought: Harvest and Planner premium. The SharePoint data layer is superseded (`stage-0-closeout.md`).
2. Chris's workbooks are no longer imported faithfully. Their job moves into Harvest and Planner premium. This replaces principle 10.
3. A small server, the connector, is accepted from stage 2 to hold Harvest logins and run reminders. Stage 1 builds none: Harvest is tested through its browser sign-in flow, with the token kept in memory only.
4. The financial boundary is enforced by Harvest roles: Administrator for principals, Manager for the coordinator, Member for the team. Planner holds no financial data.

## Go criteria

1. **Planner premium through Graph.** As aa.test, `GET /me/planner/tasks` lists the test task from the premium plan, and `PATCH /planner/tasks/{id}` with `percentComplete` 100 marks it complete; Planner then shows it completed. Record whether the listed task says which phase (parent task) it sits under.
2. **No paid Planner licence for the team.** aa.test, with only its Microsoft 365 business licence, opens the premium plan in Planner inside Teams and marks its task done.
3. **Harvest sign-in inside Teams.** aa.test connects Harvest from the app without leaving Teams, on Teams desktop, web, iOS and Android.
4. **Harvest boundary.** As Member, no response to aa.test contains a money value (rates, budgets, costs, amounts), and another person's time is refused. As Manager without the optional permission to see billable rates and amounts, cost rates are absent. The report states field presence only, never values.
5. **Harvest hours.** As Member, aa.test writes a 0.5 h entry on its assigned test project and phase, then deletes it. An entry on a project it is not assigned to is refused; record Harvest's exact status and message.
6. **Phones.** On one phone, cold start to `Harvest write + delete: PASS` takes under 30 seconds, on each of three runs. The app is published to the org catalog and installed from a phone.

### How failures route

- **1 fails:** not a no-go. Stop and report. Planning decides between Microsoft's Project scheduling API (more work in the connector) and basic Planner for tasks.
- **2 fails:** not a no-go. Planning decides on licences.
- **3 fails on any client:** stop. Report the error, the client and the documentation consulted. Do not build a server or a token workaround; that is Galileo's decision.
- **4 fails** (a Member sees any money value by any route): stop immediately. That is a no-go on Harvest as configured.
- **5 or 6 fails:** report. Planning decides.

## Preconditions (Galileo, before coding starts)

All names and figures fictional: the repo is public.

- **Harvest trial.** Choose Enterprise if the trial offers a plan choice. Client `Zanthorpe Test`. Projects `ZT-01 Test Project` (aa.test and Galileo assigned) and `ZT-02 Unassigned` (aa.test not assigned). Phase tasks `Concept` and `SD` on both. A fictional hourly rate and a fee budget per task, so there is money data to hide. Invite aa.test as Member.
- **Harvest OAuth2 application.** Claude Code writes the steps (T1); Galileo creates it in Harvest ID and pastes the client ID into `src/config.ts`. No client secret in this stage.
- **Planner premium.** A Planner Plan 1 trial or licence for Galileo only. Premium plan `ZT-01 Test Project`; parent task `SD`; under it, task `AA Stage1 Test Task`, assigned to aa.test, due this week. aa.test keeps only its Business Basic licence.
- **Entra.** Add delegated Graph `Tasks.ReadWrite` and grant admin consent (steps from T1). Remove `Sites.ReadWrite.All` only after T0 removes the code that uses it.

## Tasks

**T0. Constitution and cleanup (Blueprint, HALT).** Draft `CLAUDE.md` 2.0 from `stage-0-closeout.md` and this brief:
- Architecture: Harvest, Planner premium, the connector (stage 2), the app. Roles and the boundary in Harvest and Planner terms.
- The server rule: the connector is allowed from stage 2; nothing in stage 1.
- Principle 10 replaced by decision 2. Principles 4 (unplanned work with a cause) and 9 (tasks linkable to deliverables) are not decided under the new direction: keep them, marked "to confirm by Galileo". Do not delete anything silently.
- Rewrite `docs/architecture/overview.md`; mark `data.md` superseded.
- Propose what to remove: SharePoint checks in the diagnostic, `src/graph/sharepoint.ts`, `config.sharepoint`, `#/log`. Propose where the two planning pages in `docs/architecture/` belong.

Galileo approves before any code changes.

**T1. Setup steps.** Write `docs/setup/harvest.md` (trial, test data, OAuth2 application, roles) and `docs/setup/planner-premium.md` (trial, test plan, assignment). Update `docs/setup/entra-app.md` for `Tasks.ReadWrite`. Verify every value against current Harvest and Microsoft documentation and cite the page, as in stage 0 T1.

**T2. Harvest sign-in module.** One file, `src/auth/harvestAuth.ts`. Harvest's client-side flow, opened through the Teams authentication popup inside Teams and a normal popup in a browser, with a callback page like `auth.html`. Token in memory only: never in local storage, never logged. Add the Harvest sign-in domain to the manifest's `validDomains` if the Teams documentation requires it.

**T3. Diagnostic.** Remove the SharePoint sections. Keep the build stamp, host, time zone and copy-report button. Add:
- Harvest connect: account ID, user, role.
- Harvest my assignments: count; for each money field, present or absent.
- Harvest write + delete: 0.5 h on `ZT-01` / `SD`: status, entry ID, money fields present or absent in the response.
- Harvest unassigned write: to `ZT-02`: status and Harvest's message.
- Harvest other person's time: status.
- Planner my tasks: count; for the test task: found or not, plan, bucket, parent present or not, percent complete.
- Planner complete: PATCH to 100 with If-Match: status; read again.
- Planner reset to 0, so the run can repeat. If Planner refuses, report it and stop resetting.

**T4. Teams package.** Bump the version. Update `validDomains` if T2 needs it. Resolve Q10 (recommendation: one tab pointing at the diagnostic for this stage).

**T5. Test checklist.** `docs/stages/stage-1-test-checklist.md`, built from the matrix below.

## Test matrix (Galileo runs, Claude Code prepares)

- aa.test as Member on Teams desktop, web, iOS and Android: every Harvest and Planner line of the diagnostic.
- aa.test as Manager, without the rates permission, on Teams web: assignments and other person's time.
- Galileo as Administrator on Teams web: control run (money fields present is expected here).
- aa.test in Planner inside Teams on a phone: open the premium plan, mark the task done.
- Three cold-start timings on one phone, to `Harvest write + delete: PASS`.
- Upload to the org catalog; install from a phone.

## In parallel, outside the repo

Galileo and Chris run the business half of the Harvest trial from the planning page "AA Time Card on Harvest": fee burn per phase, invoicing part of a phase fee, Melanie's weekly assignment time, QuickBooks client matching, whether Harvest's activity log records deleted entries. Those answers go to planning, not into the stage 1 report.

## Out of scope

The connector or any server. Reminders (stage 2). Porting the Today, Tasks and Studio screens. Real projects, clients, rates or people. Harvest SAML sign-in. QuickBooks connection. The Excel export. The Claude endpoint. Planner portfolios. Harvest Forecast.

## Report to bring back

`docs/stages/stage-1-report.md`, as `CLAUDE.md` describes: the filled test matrix with copied diagnostic reports (UPNs replaced, no money values), verified, assumed and untested items in separate sections, deviations from this brief and why, open questions, parked ideas. Plus `docs/findings.md` and `CLAUDE.md` 2.0.
