# Stage 0 test checklist (for Galileo), brief v2

Run the sections in order. Paste every copied diagnostic report and every flow log line into `docs/stages/stage-0-report.md`, section *Test matrix (brief v2)*, naming the client and the account.

**Stop rule.** If aa.test can read `TestFees` by **any** route, stop there and report it. That is a no-go on the approach.

**Search word:** `Zanthorpe`, the Project value of the one `TestFees` row (Title `Fee test`, Fee 1,000, both fictional). Galileo's organization-scope search found it on 2026-10-13 (positive control passed).

**Addresses** (tenant `agencyartifact.sharepoint.com`):
- Operations site: `https://agencyartifact.sharepoint.com/sites/AAOperations`
- Principals site: `https://agencyartifact.sharepoint.com/sites/AAPrincipals`
- App: `https://agencyartifact.github.io/AA-App/`

## A. Preconditions (once)

- [x] A1. Teams custom app setup (`docs/setup/m365-admin.md` part 3). Admin side seen 2026-10-13. Still to see: **Upload a custom app** for aa.test (propagation; does not block the tests).
- [ ] A2. Hours access changed to "record, not lock" (`data.md` 1.2), three settings, as Galileo:
  1. `Coordinator` level converted to **AA Team** (`docs/setup/sharepoint-sites.md` part 3): `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/role.aspx`.
  2. aa.test moved from Contribute to **AA Team**: `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/user.aspx`, row *AA Test*.
  3. TestHours **Create and Edit access** set to *Create and edit all items*: `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/advsetng.aspx?List=%7B3d4f19f9-ac90-49fb-a089-918818410229%7D`. Read access stays *Read all items*.
- [x] A3. Rows: the diagnostic manages its own test rows. Only `aa.test row` (by aa.test, 2026-01-01) and `Hours test` (by Galileo) need to exist, and both do (2026-10-13).
- [x] A4. App in the org catalog (2026-10-13).
- [ ] A5. India device ready (`m365-admin.md` part 6), signed in to Teams as aa.test, app added.

## B. What the diagnostic tests by itself

One open of the **Diagnostic** tab runs every Graph check as the signed-in account. Graph Explorer is not needed (Galileo's decision, 2026-10-13: same Graph API, same per-user permission).

Expected after A2 (since 2026-10-13 team and coordinators share the AA Team level, so there is one aa.test column):

| Step in the report | Galileo | aa.test (AA Team) |
|---|---|---|
| Operations read | PASS | PASS |
| Operations write + delete | PASS | PASS |
| Operations edit of another user's row | PASS | PASS (recorded in version history) |
| Operations delete of another user's row | PASS | PASS (recorded in the recycle bin) |
| Principals site lookup (by path) | PASS | **DENIED** |
| Principals read (TestFees, by path) | PASS | **DENIED** |
| Principals read (TestFees, by site id) | PASS | **DENIED** |
| Principals read (TestFees, by list id) | PASS | **DENIED** |
| Principals search ("Zanthorpe") | PASS (visible) | **DENIED** (not visible) |

How to read it:
- Any Principals step `PASS` for aa.test: **stop**, no-go. A 404 for aa.test counts as denied when Galileo's same step is PASS.
- `SKIPPED` on the delete step: the other account has not run the diagnostic yet. Each run leaves one row `stage0-delete-target` (dated 2026-01-01) for the other account to try to delete. Run once as the other account, then again.
- `SKIPPED` on "by site id" or "by list id" for aa.test: Claude Code has not yet copied the ids from Galileo's report into `config.ts`.
- Any `FATAL`: stop testing that client, copy the report, note the Teams version (Settings > About).

## C. Runs (copy each report, paste all of them in one message)

Order matters only the first time (for the delete targets): Galileo once, then aa.test, then the rest.

| # | Client | Account |
|---|---|---|
| C1 | Teams desktop | Galileo |
| C2 | Teams web | Galileo |
| C3 | Teams iOS | Galileo |
| C4 | Teams Android | Galileo |
| C5 | Teams desktop | aa.test |
| C6 | Teams web | aa.test |
| C7 | Teams iOS | aa.test |
| C8 | Teams Android | aa.test |

Two accounts on one phone: sign out of Teams and sign in as the other, or use two devices.

## D. The two routes the app cannot test (aa.test, private browser window, at AA Team)

- [ ] D1. Open `https://agencyartifact.sharepoint.com/sites/AAPrincipals`. Expected: access denied or request access.
- [ ] D2. At <https://m365.cloud.microsoft>, search `Zanthorpe`, choose **All** / organization scope. Expected: nothing.

Send back: "denied, nothing" or what you saw instead.

## E. Hours record (criterion 6 as changed on 2026-10-13)

Replaces the coordinator switch: there is no Coordinator level any more. After A2 and one aa.test diagnostic run:

- [ ] E1. As Galileo, `https://agencyartifact.sharepoint.com/sites/AAOperations/Lists/TestHours/AllItems.aspx` > row `Hours test` > **...** > **Version history**: the ` [diag edit]` version and its restore show **Modified by AA TEST**.
- [ ] E2. As Galileo, `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/RecycleBin.aspx`: a `stage0-delete-target` row shows **Deleted by AA TEST**.
- [ ] E3. As **aa.test** (private window), same list, row `Hours test` > **...** > **Version history**. Expected: versions visible, and **no** *Delete* option on a version and no *Delete All Versions* link. If aa.test can delete a version, stop and report: the record can be erased.

Send back: "E1 yes, E2 yes, E3 no delete" or what you saw instead.

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

Follow *Tests* in `docs/setup/reminder-flow.md`. aa.test at AA Team. Record:

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

- [ ] aa.test stays at AA Team (no switch back since 2026-10-13).
- [ ] Probe flow `AA Stage0 Correction Probe` turned off or deleted (correction flow dropped).
- [ ] India device time zone set back to automatic.
- [ ] Flows turned off. Exports saved (`reminder-flow.md`, last section).
- [ ] Graph Explorer organisation grant removed, if you made one (D1).
