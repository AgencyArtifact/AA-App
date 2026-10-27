# Stage 0: Microsoft 365 feasibility

Version 2, 2026-10-13. Replaces version 1. Expects CLAUDE.md version 1.1.
Place in `docs/stages/`. Read `CLAUDE.md` first.

## Decision this stage serves

A go or no-go, with evidence, on running the whole system on Microsoft 365 with SharePoint Lists as the data layer and delegated, per-user access. This stage is a test. Build only what the test needs.

In protocol terms, this whole stage is the project's Link gate: no logic is built on Microsoft 365 until these connections are proven. Blueprint is T1 (HALT), Stylize is the test matrix, Trigger is criterion 5.

## Go criteria

1. **Platform.** The app runs as a Teams personal app on desktop, web, iOS and Android, with single sign-on and no server.
2. **Phone speed.** On one phone, from tapping the app in Teams (cold start) to a confirmed write (diagnostic write PASS) takes under 30 seconds, on every one of three runs.
3. **Financial boundary.** `aa.test`, both as team and as coordinator, is denied on `AA Principals` by every route: the app, Graph Explorer, the site URL in a browser, and Microsoft Search. `AA Principals` has no grant to Everyone or Everyone except external users.
4. **Reminders.** A scheduled Teams reminder reaches the test user, then escalates to the coordinator, on Los Angeles time and on India time, including the date-boundary case.
5. **Distribution.** The app is published to the org app catalog and installed from a phone.
6. **Hours integrity.** `aa.test` as team is denied editing or deleting a `TestHours` row created by Galileo, both in the app and in Graph Explorer. `aa.test` as coordinator can do both. Version history shows `aa.test` as the editor.

Criteria 1 to 5 decide go or no-go on Microsoft 365. A failure of criterion 6 is not a no-go: see "If something fails".

## Changes from version 1

- T0 added: repo cleanup to CLAUDE.md 1.0, in its own brief (`stage-0-T0-cleanup.md`).
- Phone speed is now its own criterion, measured from cold start to a confirmed write, because the Today screen is not wired to SharePoint in this stage. The Today screen is still timed, but separately and with no threshold.
- The boundary criterion widened from two routes to four, plus a sharing check.
- The reminder criterion adds the India date-boundary case.
- Criterion 6 added, following the decision of 2026-10-13: coordinators can edit or delete anyone's hours; team members only their own.
- `TestHours` gets a text date column (`WorkDate`), the own-items setting and version history.

## Preconditions (Galileo, before coding starts)

- Admin role confirmed (Global Admin for the build).
- Test account `aa.test` (non-principal), Business Basic license.
- Site `AA Principals`: standalone, not connected to a Teams team. Members: Galileo, Chris. No other grants. List `TestFees`: Project (text), Fee (number), with at least one row whose Project value is a distinctive word you can search for.
- Site `AA Operations`: members Galileo, Chris, `aa.test`. `aa.test` starts at Contribute. List `TestHours`: Person (person), Date (date only), WorkDate (single line of text), Hours (number). List setting: create and edit access limited to items created by the user. Version history on.
- Custom permission level "Coordinator" on `AA Operations`: Contribute plus Override List Behaviors. Not yet assigned to anyone.
- Teams admin center: custom app upload allowed for Galileo and `aa.test`.
- Entra app registration: Claude Code writes the exact steps (T1); Galileo performs them and pastes the client ID and tenant ID into the config file.
- A device signed in as `aa.test` whose time zone can be set to India (Asia/Kolkata), for the date-boundary case.

## Tasks

**T0. Repo cleanup.**
Run `docs/stages/stage-0-T0-cleanup.md` in full, including its HALT. T1 starts only after the cleanup report is approved and its step 8 verification is appended. Its facts about the app (language, framework, build and deploy) replace the assumptions in this brief.

**T1. Blueprint: setup steps, config and SOP check (HALT).**
- Write `docs/setup/entra-app.md`: single-tenant app, SPA platform, redirect URIs required for nested app authentication in Teams plus the plain hosted URL for browser testing, delegated Graph permissions `User.Read` and `Sites.ReadWrite.All`, admin consent.
- Write `docs/setup/sharepoint-sites.md`: click steps for both sites, both lists, the own-items setting, version history, the Coordinator permission level, and how to check that `AA Principals` has no Everyone or Everyone-except-external-users grant.
- Verify every value against current Microsoft documentation and cite the page.
- Create `src/config.ts` holding client ID, tenant ID, site paths and list names.
- Where the documentation contradicts `docs/architecture/data.md`, update the SOP and list the change in the report.
- HALT for Galileo's approval before T2.

**T2. Authentication module.**
One file, `src/auth/graphAuth.ts`. Uses MSAL nested app authentication when running inside Teams, and standard MSAL when running in a plain browser (for development). Exposes one function that returns a Graph access token for the signed-in user. Silent first, interactive fallback. No secrets, no server.

**T3. Diagnostic screen.**
A screen reachable at a dedicated route in the existing prototype. It shows:
- signed-in user and the Teams host client (desktop, web, iOS, Android);
- device time zone, and the local date the app uses as "today";
- read `TestHours` (Operations): PASS or DENIED or ERROR, HTTP status, Graph error code;
- write one row to `TestHours` (Date and WorkDate both set to the local date), show the raw Date and WorkDate values as Graph returns them, then delete the row: same reporting;
- edit a `TestHours` row created by another user, then restore it: same reporting;
- read `TestFees` (Principals): same reporting. Show the item **count only**, never field values;
- elapsed time from app start to the write result;
- a timestamp and a "copy report" button producing plain text.

**T4. Teams app package.**
Manifest (current schema version) for a personal app with one static tab pointing at the hosted URL, valid domains set, icons in Agency Artifact branding. A script or npm command that builds the upload zip.

**T5. Reminder flow instructions.**
Write `docs/setup/reminder-flow.md`: exact click-by-click steps for Galileo to build the flow in Power Automate.
- Logic: on schedule, check `TestHours` for a row from `aa.test` dated today; if none, post through the Flow bot to `aa.test`; on a later run, if still none, post to the coordinator (Galileo stands in).
- "Today" is computed in the flow's own time zone. The check runs against both Date and WorkDate and logs which one matched.
- One flow on Los Angeles time, one on India time. Compress the schedule for testing (minutes apart, not a day).
- Include how to export the flow so a copy can be kept in the repo.

## Test matrix (Galileo runs, Claude Code prepares the checklist)

For each account on each client (Teams desktop, Teams web, iOS, Android): sign-in without a prompt, Operations read, Operations write, edit of another user's row, Principals read.

Expected:
- Galileo passes all.
- `aa.test` as team: passes Operations read and write; DENIED editing another user's row; DENIED on Principals.
- `aa.test` as coordinator (assign the Coordinator level, rerun on at least one phone and on desktop): passes editing another user's row; still DENIED on Principals.

Plus, as `aa.test` at both levels:
- Graph Explorer read of `TestFees`: denied.
- `AA Principals` site URL in a browser: denied.
- Microsoft Search for the distinctive `TestFees` Project value: no results.
- Graph Explorer delete of a `TestHours` row Galileo created for the purpose: denied as team, allowed as coordinator. Version history or recycle bin shows `aa.test`.

Plus phone timing on one phone: three cold-start runs, cold start to diagnostic write PASS, each time recorded. Then the Today screen log-and-confirm, timed separately.

**Date-boundary case.** India and Los Angeles are on different dates from 11:30 to midnight Los Angeles time until November 1, 2026, and from 10:30 to midnight after it (Daylight Saving Time ends that day). Inside that window: `aa.test`, on a device set to India time, writes a row through the diagnostic screen. Then run the India flow: it must find the row and must not escalate. Record the raw Date and WorkDate values and which column the flow matched. Run one normal case outside the window as a control.

## If something fails

- Nested app authentication fails on any client: stop. Report the error, the client and the documentation consulted. Do not build a token-exchange server; that fallback is Galileo's decision.
- `aa.test` can read `TestFees` by any route: stop immediately. That is a no-go on the approach.
- The Coordinator level does not allow editing another user's row through Graph: stop and report. This is not a no-go on Microsoft 365. The fallback (coordinator corrections through a flow) is a design change and Galileo's decision.
- The Date column fails the boundary case but WorkDate passes: the stage is not failed. Write a finding and list the date convention as an open question for the data model.

## Out of scope

Real project register, real data model, provisioning script, task assignment, any calculation, any finance, migrating hosting off GitHub Pages, wiring the Today screen to SharePoint (the diagnostic write covers it).

## Report to bring back

`docs/stages/stage-0-report.md`, in the format set by CLAUDE.md, plus:
- the filled test matrix with the copied diagnostic reports;
- the date-boundary results and the control case;
- the three timing runs and the Today screen time;
- a reference to the approved T0 cleanup report.

Return it to planning together with `docs/findings.md` and `CLAUDE.md`.
