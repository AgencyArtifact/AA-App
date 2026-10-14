# Stage 0 test checklist (for Galileo), brief v2

Run the sections in order. Paste every copied diagnostic report and every flow log line into `docs/stages/stage-0-report.md`, section *Test matrix (brief v2)*, naming the client and the account.

**Stop rule.** If aa.test can read `TestFees` by **any** route, at either level, stop there and report it. That is a no-go on the approach.

**Search word:** `Zanthorpe`, the Project value of the one `TestFees` row (Title `Fee test`, Fee 1,000, both fictional). Galileo's organization-scope search found it on 2026-10-13 (positive control passed).

**Addresses** (tenant `agencyartifact.sharepoint.com`):
- Operations site: `https://agencyartifact.sharepoint.com/sites/AAOperations`
- Principals site: `https://agencyartifact.sharepoint.com/sites/AAPrincipals`
- App: `https://agencyartifact.github.io/AA-App/`

## A. Preconditions (once, before anything else)

- [ ] A1. Teams custom app setup confirmed (`docs/setup/m365-admin.md` part 3): org-wide custom apps on, policy `AA app testers` assigned to Galileo and aa.test, and both accounts see **Upload a custom app**.
- [ ] A2. Principals sharing check. As Galileo open `https://agencyartifact.sharepoint.com/sites/AAPrincipals/_layouts/15/user.aspx`. Expected: only the three AA Principals groups, no "Everyone", "Everyone except external users" or "All users" entry. **Check Permissions** for `Everyone except external users` and for aa.test: both *None*. (Done once at T1; redo on the test day.)
- [ ] A3. `TestFees` still has its row (`Fee test`), so a count of 0 cannot be mistaken for "no access".
- [ ] A4. aa.test is at **Contribute** on AA Operations (not Coordinator yet). Page `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/user.aspx`, row *AA Test*: Contribute.
- [ ] A5. Rows in `TestHours` (`https://agencyartifact.sharepoint.com/sites/AAOperations/Lists/TestHours`). All three must exist before section C:

| Title | Created by | Date and WorkDate | Needed for |
|---|---|---|---|
| `aa.test row` | **aa.test** (sign in as aa.test in a private window, **+ New**) | `2026-01-01` in both | Galileo's edit test. Without it Galileo's edit step shows **SKIPPED**. Dated in the past so it never silences the reminder flow |
| `Galileo row` | Galileo (exists) | any | aa.test's edit test, at both levels |
| `Galileo delete row` | Galileo (**+ New**) | any | The Graph Explorer delete test (section D6 and E5). Recreate it if you repeat E5 |

- [ ] A6. App published to the org catalog (`docs/setup/deploy.md` part 5) and **installed from a phone** as aa.test: Teams > **Apps** > **Built for your org** > **Agency Artifact** > **Add**. Note the phone and the date (go criterion 5).
- [ ] A7. India device ready (`m365-admin.md` part 6), signed in to Teams as aa.test, app added.
- [ ] A8. Reminder flows built (`docs/setup/reminder-flow.md`), both on.

## B. Browser smoke test (desktop browser, Galileo)

- [ ] B1. Open `https://agencyartifact.github.io/AA-App/#/diagnostic`. A Microsoft sign-in popup appears (allow popups if blocked, then **Run again**). Sign in as Galileo. The popup ends on a blank page and closes by itself.
- [ ] B2. Expected: sign-in PASS, Operations read PASS, write + delete PASS, edit of another user's row PASS (it edits `aa.test row` and restores it), Principals read PASS. **Copy report**.

## C. App matrix, aa.test as team (Contribute)

For each cell: open **Agency Artifact** in Teams, **Diagnostic** tab, wait for the report, **Copy report**, paste it into the report. If copy is blocked, the report text is selected below the buttons: copy by hand or screenshot. Note any sign-in or consent prompt (`Prompts: 0` means silent).

| # | Client | Account | Read | Write | Edit other's row | Principals | Prompts |
|---|---|---|---|---|---|---|---|
| C1 | Teams desktop | Galileo | PASS | PASS | PASS | PASS | 0 |
| C2 | Teams web | Galileo | PASS | PASS | PASS | PASS | 0 |
| C3 | Teams iOS | Galileo | PASS | PASS | PASS | PASS | 0 |
| C4 | Teams Android | Galileo | PASS | PASS | PASS | PASS | 0 |
| C5 | Teams desktop | aa.test | PASS | PASS | **DENIED** | **DENIED** | 0 |
| C6 | Teams web | aa.test | PASS | PASS | **DENIED** | **DENIED** | 0 |
| C7 | Teams iOS | aa.test | PASS | PASS | **DENIED** | **DENIED** | 0 |
| C8 | Teams Android | aa.test | PASS | PASS | **DENIED** | **DENIED** | 0 |

The values in the table are the expected results.

How to read the results:
- Principals `DENIED (HTTP 403 accessDenied)`: expected. `ERROR (HTTP 404 itemNotFound)` with *site lookup failed* is also a denial if Galileo's cells show the site as PASS (SharePoint can hide a site from users without access); record it exactly. Principals `PASS` with any count: **stop**, no-go.
- Edit of another user's row for aa.test as team: `DENIED` (403) is the expected result, with "edit refused, nothing changed". `PASS` at Contribute means the own-items rule does not hold through Graph: record it and tell Claude Code (criterion 6, not a no-go).
- `SKIPPED`: the required row from A5 is missing.
- Any `FATAL` on a Teams client (for example "Nested app authentication is not available"): stop testing that client, copy the report, note the Teams version (Settings > About). No workarounds.

Two accounts on one phone: sign out of Teams and sign in as the other, or use two devices. Note which.

## D. Boundary routes, aa.test as team

Routes for criterion 3: the app (C5 to C8), Graph Explorer, the site URL, Microsoft Search. Plus the delete test for criterion 6.

- [ ] D1. Graph Explorer: open <https://developer.microsoft.com/graph/graph-explorer> in a private window, **Sign in** as aa.test. If it asks for consent to a permission aa.test cannot grant, sign in as Galileo once, consent for the organisation for Graph Explorer only, sign back in as aa.test, and note it. Remove that grant after stage 0: Entra admin center > **Enterprise apps** > *Graph Explorer* > **Permissions**. For D5 and D6 aa.test needs `Sites.ReadWrite.All` in Graph Explorer (**Modify permissions** tab).
- [ ] D2. `GET https://graph.microsoft.com/v1.0/sites/agencyartifact.sharepoint.com:/sites/AAPrincipals`. Expected 403 or 404. Copy the status and `error.code`.
- [ ] D3. `GET https://graph.microsoft.com/v1.0/sites/agencyartifact.sharepoint.com:/sites/AAPrincipals:/lists/TestFees/items`. Expected 403 or 404.
- [ ] D4. Site URL: in the same private window open `https://agencyartifact.sharepoint.com/sites/AAPrincipals`, then `.../sites/AAPrincipals/Lists/TestFees`. Expected: access denied or a request-access page, both times.
- [ ] D5. Microsoft Search, **organization scope** (as in the positive control: `https://agencyartifact.sharepoint.com/_layouts/15/search.aspx` or the search box at <https://m365.cloud.microsoft>, then choose *Organization* / *All*), search `Zanthorpe`. Expected: **no results at all**. Also in Graph Explorer: `POST https://graph.microsoft.com/v1.0/search/query` with body `{ "requests": [ { "entityTypes": ["listItem"], "query": { "queryString": "Zanthorpe" } } ] }`. Expected: zero hits.
- [ ] D6. Delete of Galileo's row, as team. First `GET https://graph.microsoft.com/v1.0/sites/agencyartifact.sharepoint.com:/sites/AAOperations:/lists/TestHours/items?$expand=fields($select=Title)` and note the `id` of `Galileo delete row`. Then `DELETE https://graph.microsoft.com/v1.0/sites/agencyartifact.sharepoint.com:/sites/AAOperations:/lists/TestHours/items/<id>`. Expected: **403**, row still in the list.
- [ ] D7. Same Graph Explorer edit as team, for completeness: `PATCH .../lists/TestHours/items/<id of Galileo row>/fields` with body `{ "Title": "Galileo row [ge edit]" }`. Expected: 403. (If it passes, set the Title back and tell Claude Code.)

## E. aa.test as coordinator

- [ ] E1. Assign the level. As Galileo, page `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/user.aspx`. Tick the row *AA Test* > **Edit User Permissions** > untick **Contribute**, tick **Coordinator** > **OK**. Check: **Check Permissions** for aa.test shows *Coordinator* only. Also note the exact label of the extra permission inside the Coordinator level (page **Permission Levels** > *Coordinator*), which was never seen on screen.
- [ ] E2. App, rerun on **Teams desktop** and on **at least one phone** (record which). Close and reopen the app first so it runs fresh.

| # | Client | Account | Read | Write | Edit other's row | Principals |
|---|---|---|---|---|---|---|
| E2a | Teams desktop | aa.test (Coordinator) | PASS | PASS | **PASS** | **DENIED** |
| E2b | Phone: ____ | aa.test (Coordinator) | PASS | PASS | **PASS** | **DENIED** |

If edit of another user's row is still DENIED: first check E1 (the level and its permission), then report. That is not a no-go; the fallback is Galileo's decision.

- [ ] E3. Repeat D2, D3, D4 and D5 as coordinator. Expected: all still denied, no search results.
- [ ] E4. Repeat D7 as coordinator. Expected: 200. Set the Title back to `Galileo row` with a second PATCH.
- [ ] E5. Repeat D6 as coordinator. Expected: **204**, `Galileo delete row` gone.
- [ ] E6. Evidence. As Galileo:
  - `TestHours` > `Galileo row` > **...** > **Version history**: versions with ` [diag edit]` and ` [ge edit]` and their restores, **Modified by aa.test**. Screenshot.
  - `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/RecycleBin.aspx`: `Galileo delete row`, **Deleted by aa.test**. Screenshot.
- [ ] E7. Put aa.test back to **Contribute** (E1 steps in reverse), unless you are about to rerun section E.

## F. Phone timing (go criterion 2), one phone, aa.test

Pick one phone (record which). Stopwatch on a second device or a watch.

**Cold start**, three runs. Each run:
1. Force-close Teams (iOS: swipe it away in the app switcher; Android: **Recent apps** > swipe away).
2. Start the stopwatch **as you tap the Teams icon** on the home screen.
3. Take a lap **as you tap Agency Artifact** inside Teams.
4. Open the **Diagnostic** tab if Teams did not open on it.
5. Stop **when the report appears** with `Operations write + delete (TestHours): PASS`. (The report appears only when the whole run ends, so this time is slightly longer than the write itself. That is on the safe side.)
6. **Copy report**: its `Write:` line is the on-screen cross-check (seconds from page load). It must say `run 1, first run`. A rerun inside the same session is not a cold start.

Pass: every one of the three stopwatch times under 30 seconds. The lap shows how much of it is Teams itself.

| Run | Stopwatch total | Lap at Agency Artifact | On-screen `Write:` | Notes |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Today screen, timed separately, no threshold.** Uses the stand-in log screen `#/log` (one half-hour, Confirm), since the real Today screen is not wired to SharePoint in this stage. Teams open, app open on Home.
1. Start the stopwatch as you tap **Log half an hour (phone test)**.
2. Leave the date, tap **+** once (`0:30`), **Confirm**.
3. Stop when **"Confirmed. Saved to TestHours."** appears. Record the stopwatch time and the on-screen *Screen open → confirmed* time.
4. **Delete this test row** (a leftover row silences the reminder flow).

| Stopwatch | Screen open → confirmed | Notes |
|---|---|---|
| | | |

## G. Reminder flows (go criterion 4)

Follow *Tests* in `docs/setup/reminder-flow.md`. aa.test at Contribute. Record:

| Test | Flow | Reminder arrived (time, on phone) | Escalation arrived (time) | Runs succeeded | MatchLog lines |
|---|---|---|---|---|---|
| 1 no row | LA | | | | |
| 1 no row | India | | | | |
| 2 row exists | LA | none expected | none expected | | |
| 2 row exists | India | none expected | none expected | | |

**Date-boundary case** (Test 3, inside the window: 11:30 AM to midnight Los Angeles time until November 1, 2026; 10:30 AM to midnight after it) and **control** (Test 4, outside the window):

| Case | LA time | India time | Device `Local today` | Raw Date (diagnostic) | Raw WorkDate (diagnostic) | MatchLog: WorkDate / Date matched | Messages sent |
|---|---|---|---|---|---|---|---|
| Boundary | | | | | | | none expected |
| Control | | | | | | | none expected |

Paste the two diagnostic reports from the India device as well.

## H. After the tests

- [ ] aa.test back at Contribute (E7).
- [ ] India device time zone set back to automatic.
- [ ] Flows turned off. Exports saved (`reminder-flow.md`, last section).
- [ ] Graph Explorer organisation grant removed, if you made one (D1).
