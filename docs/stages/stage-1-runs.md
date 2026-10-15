# Stage 1 diagnostic runs

Raw results for the stage 1 report, newest last. UPNs replaced by role names. Money fields are reported as present or absent only; the diagnostic never prints values.

## Run A: Galileo as Administrator, Teams web (control run)

2026-10-14 22:32Z, build 2026-10-14T22:13:21Z. Expected: money values present, unassigned write accepted (Galileo is on ZT-02).

```
User:        Galileo Morandi <principal UPN>
Host:        TeamsModern web (NAA recommended: true)
Auth mode:   teams-naa
Prompts:     0
Write:       4.4 s from page load (run 2, not a cold start)

Sign-in (Graph /me): PASS (HTTP 200)
Harvest connect: PASS (HTTP 200)
  account 2260464; user galileo morandi, Harvest user ID 5759248; roles: administrator; money fields: cost_rate VALUE, default_hourly_rate VALUE (MONEY VALUES PRESENT: 2 keys)
Harvest my assignments: PASS (HTTP 200)
  count 3: ZT-02 Unassigned [ZT-02] (Concept, sd); ZT-01 Test Project [ZT-01] (Concept, sd); Example Project (Business Development, Design, Marketing, Programming, Project Management); money fields: budget VALUE, hourly_rate VALUE (MONEY VALUES PRESENT: 2 keys)
Harvest write + delete: PASS (HTTP 200)
  write HTTP 201, entry 3028669334; delete HTTP 200; write response money fields: billable_rate VALUE, budget VALUE, cost_rate VALUE, hourly_rate VALUE (MONEY VALUES PRESENT: 4 keys)
Harvest unassigned write: ERROR (HTTP 201)
  expected: refused; ACCEPTED, entry 3028669337 deleted: HTTP 200
Harvest other person's time: SKIPPED (HTTP 0)
  other user is this user
```

Reading: matches expectations for an Administrator. Earlier run at 22:01Z (Teams signed in as aa.test, Harvest connected as Galileo) shows the Harvest login is independent of the Teams login (`docs/findings.md`).

## Run B: aa.test in Teams, Harvest still signed in as Galileo (partly invalid)

2026-10-14 23:05Z, build 2026-10-14T22:40:09Z, Teams web, Graph user aa.test.

```
Sign-in (Graph /me): PASS (HTTP 200)
Planner my tasks: PASS (HTTP 200)
  count 0; "AA Stage1 Test Task" NOT FOUND
Planner complete: SKIPPED (HTTP 0)
  test task not listed
Planner reset: SKIPPED (HTTP 0)
  test task not listed
Harvest connect: PASS (HTTP 200)
  account 2260464; user galileo morandi, Harvest user ID 5759248; roles: administrator; ...
```

Reading:
- Planner (criterion 1): `GET /me/planner/tasks` as aa.test returns no tasks. Consistent with the docs (premium plans are not on the Planner API). **Invalid**: the plan did not exist yet (see the correction at the end).
- Harvest lines invalid for the Member test: the popup reused Galileo's Harvest session in the same browser (`docs/findings.md`). Same outcomes as run A. Rerun in a private window.

## Run C: aa.test, plain browser, Harvest still Galileo (invalid for criteria 3 and 4)

2026-10-14 23:10Z, build 2026-10-14T22:40:09Z. Host plain browser (app opened directly), Graph user aa.test via popup. Planner: same as run B (count 0, not found). Harvest: connected as Galileo, administrator; same outcomes as run A. Not a Member test.

## Run D: aa.test, Teams web, Harvest still Galileo (invalid for criterion 4)

2026-10-14 23:11Z, build 2026-10-14T22:40:09Z. Teams web, NAA, prompts 0, Graph user aa.test. Planner: same as run B. Harvest: connected as Galileo, administrator; same outcomes as run A. Not a Member test.

## Run E: aa.test as Member, Teams web (first valid Member run)

2026-10-14 23:14Z, build 2026-10-14T22:40:09Z. Harvest signed out of Galileo's session first, then signed in as aa.test in the popup.

```
User:        AA TEST <team UPN>
Host:        TeamsModern web (NAA recommended: true)
Auth mode:   teams-naa
Prompts:     0
Write:       22.1 s from page load (run 2, not a cold start; includes the Harvest sign-in)

Sign-in (Graph /me): PASS (HTTP 200)
Planner my tasks: PASS (HTTP 200)
  count 0; "AA Stage1 Test Task" NOT FOUND
Planner complete: SKIPPED (HTTP 0)
  test task not listed
Planner reset: SKIPPED (HTTP 0)
  test task not listed
Harvest connect: PASS (HTTP 200)
  account 2260464; user AA Test, Harvest user ID 5759361; roles: member; money fields: none
Harvest my assignments: PASS (HTTP 200)
  count 1: ZT-01 Test Project [ZT-01] (Concept, sd); money fields: budget null, hourly_rate null
Harvest write + delete: PASS (HTTP 200)
  write HTTP 201, entry 3028688422; delete HTTP 200; write response money fields: billable_rate null, budget null, cost_rate null, hourly_rate null
Harvest unassigned write: DENIED (HTTP 422)
  Harvest: User isn't assigned to the project · expected: refused
Harvest other person's time: PASS (HTTP 200)
  expected: refused or only own entries; returned 0 entries, 0 by other people; money fields: none
```

Reading:
- Criterion 3, Teams web: PASS (Harvest connected from inside Teams, popup closed, token returned).
- Criterion 4, Member, Teams web: no money value in any response. Money keys are present with null values (`budget`, `hourly_rate`, `billable_rate`, `cost_rate`); Harvest keeps the keys and empties them. Other person's time: 200 with no entries by anyone else (Harvest filters, does not refuse). **Depends on** Galileo having at least one entry on ZT-01 at the time: to confirm.
- Criterion 5: write + delete PASS; unassigned project refused with HTTP 422 "User isn't assigned to the project".
- Planner: same as run B.

## Run F: aa.test as Member, Teams web, with Galileo's entry on ZT-01

2026-10-14 23:21Z, build 2026-10-14T22:40:09Z. Before the run Galileo logged 1:00 on ZT-01 / Concept for today and left it. Separate windows: normal for Galileo, InPrivate for aa.test.

```
Harvest connect: PASS (HTTP 200)
  account 2260464; user AA Test, Harvest user ID 5759361; roles: member; money fields: none
Harvest my assignments: PASS (HTTP 200)
  count 1: ZT-01 Test Project [ZT-01] (Concept, sd); money fields: budget null, hourly_rate null
Harvest write + delete: PASS (HTTP 200)
  write HTTP 201, entry 3028690980; delete HTTP 200; write response money fields: billable_rate null, budget null, cost_rate null, hourly_rate null
Harvest unassigned write: DENIED (HTTP 422)
  Harvest: User isn't assigned to the project · expected: refused
Harvest other person's time: PASS (HTTP 200)
  expected: refused or only own entries; returned 0 entries, 0 by other people; money fields: none
```
(Graph and Planner lines as run E. Write 8.2 s from page load, run 2, not a cold start.)

Reading: criterion 4 for Member on Teams web holds. `GET /time_entries?user_id=<Galileo>` as aa.test returns 200 with no entries while Galileo has one on a project both are assigned to: Harvest filters to the Member's own time, it does not refuse. Pass under the proposed rule (only own entries, or 403), which Galileo has not formally confirmed.

## Run G: aa.test as Project Manager (new framework), managing ZT-01, Teams web

2026-10-14 23:25Z, build 2026-10-14T22:40:09Z. Harvest: aa.test role set to Project Manager; "Manages this project" ticked for aa.test on ZT-01. Galileo's 1:00 entry on ZT-01 still present.

```
Harvest connect: PASS (HTTP 200)
  account 2260464; user AA Test, Harvest user ID 5759361; roles: project_manager; money fields: none
Harvest my assignments: PASS (HTTP 200)
  count 1: ZT-01 Test Project [ZT-01] (Concept, sd); money fields: budget null, hourly_rate null
Harvest write + delete: PASS (HTTP 200)
  write HTTP 201, entry 3028692129; delete HTTP 200; write response money fields: billable_rate null, budget null, cost_rate null, hourly_rate null
Harvest unassigned write: DENIED (HTTP 422)
  Harvest: User isn't assigned to the project · expected: refused
Harvest other person's time: ERROR (HTTP 200)
  expected: refused or only own entries; returned 1 entries, 1 by other people (OTHER PEOPLE'S TIME VISIBLE); money fields: billable_rate null, budget null, cost_rate null, hourly_rate null
```
(Graph and Planner lines as run E. Run 3 in the same page; write timing not meaningful.)

Reading: criterion 4 for the coordinator role holds. No money value in any response; cost rates, billable rates and budgets are present as empty keys only, including on Galileo's entry. A Project Manager who manages ZT-01 sees Galileo's hours there: expected for the role (hours are operational); the ERROR label is the Member expectation of the line, not a failure here.

## Correction: Planner lines in runs B to G

2026-10-14 23:30Z. Galileo had not yet set up Planner premium (`docs/setup/planner-premium.md` not run): no premium plan and no test task existed. "NOT FOUND" in runs B to G only shows there was nothing to find. They are **not evidence for criterion 1**. Rerun after the setup.

## Run H: aa.test, Teams web, after the Planner premium setup (first valid Planner run)

2026-10-15 00:15Z, build 2026-10-14T22:40:09Z. Premium plan `ZT-01 Test Project` created by Galileo (Planner Plan 1 licence, Galileo only): phase `SD`, subtask `AA Stage1 Test Task` assigned to aa.test, 0%.

```
Planner my tasks: PASS (HTTP 200)
  count 1; "AA Stage1 Test Task" found; plan "ZT-01 Test Project"; bucket "Bucket 1"; parent absent; 0% complete
Planner complete: ERROR (HTTP 409)
  PATCH percentComplete 100; read again: 0%
Planner reset: SKIPPED (HTTP 0)
  complete was refused; not resetting
```
(Harvest lines: aa.test still Project Manager from run G; same as run G.)

Reading (criterion 1, partial): `GET /me/planner/tasks` as aa.test **does list** the premium task, with plan and bucket readable; no parent field, so the phase is not visible through this endpoint. `PATCH percentComplete 100` returned **409** with no error code captured; the task stayed at 0%. Diagnostic changed to capture Graph's message and retry once with a fresh etag; rerun needed before concluding.

## Run I: aa.test, Teams web, Planner complete and reset accepted

2026-10-15 00:18Z, build 2026-10-14T22:40:09Z (deploy of 00:17Z not yet served).

```
Planner my tasks: PASS (HTTP 200)
  count 1; "AA Stage1 Test Task" found; plan "ZT-01 Test Project"; bucket "Bucket 1"; parent absent; 0% complete
Planner complete: PASS (HTTP 204)
  PATCH percentComplete 100; read again: 100%
Planner reset: PASS (HTTP 204)
  PATCH percentComplete 0; read again: 0%
Harvest connect: PASS (HTTP 200)
  account 2260464; user AA Test, Harvest user ID 5759361; roles: project_manager; money fields: none
Harvest other person's time: PASS (HTTP 200)
  returned 0 entries, 0 by other people; money fields: none
```
(Other Harvest lines as run E.)

Reading:
- Criterion 1, Teams web: Graph lists the premium task (plan, bucket) and accepts `percentComplete` 100 then 0 (204), confirmed by reading again. The 409 of run H three minutes earlier did not repeat (`docs/findings.md`). Open: the phase (parent `SD`) is not exposed; Planner's own display of the completion not yet checked by eye.
- Harvest: aa.test still Project Manager but no longer managing ZT-01: Galileo's entry not returned. A Project Manager sees other people's time only on projects they manage.
