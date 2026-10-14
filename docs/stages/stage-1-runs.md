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
- Planner (criterion 1): `GET /me/planner/tasks` as aa.test returns no tasks. Consistent with the docs (premium plans are not on the Planner API). **Provisional** until Galileo confirms the test task exists in the premium plan and is assigned to aa.test (`docs/setup/planner-premium.md`).
- Harvest lines invalid for the Member test: the popup reused Galileo's Harvest session in the same browser (`docs/findings.md`). Same outcomes as run A. Rerun in a private window.
