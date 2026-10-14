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
