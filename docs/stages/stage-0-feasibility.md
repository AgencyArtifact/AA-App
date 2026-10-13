# Stage 0: Microsoft 365 feasibility

Place in `docs/stages/`. Read `CLAUDE.md` first.

## Goal

A go or no-go, with evidence, on running the whole system on Microsoft 365 with SharePoint Lists as the data layer and delegated, per-user access. This stage is a test. Build only what the test needs.

## Go criteria (all four must pass)

1. The app runs as a Teams personal app on desktop, iOS and Android, with single sign-on and no server. Logging half an hour and confirming takes under 30 seconds on a phone.
2. The non-principal test account is denied on the `AA Principals` site, both in the app and directly in Graph Explorer.
3. A scheduled Teams reminder reaches the test user, then escalates to the coordinator, on LA time and on India time.
4. The app is published to the org app catalog and installed from a phone.

## Preconditions (Galileo, before coding starts)

- Admin role confirmed (Global Admin for the build).
- Test account `aa.test` (non-principal), Business Basic license.
- Site `AA Principals`: standalone, not connected to a Teams team. Members: Galileo, Chris. List `TestFees`: Project (text), Fee (number).
- Site `AA Operations`: members Galileo, Chris, aa.test. List `TestHours`: Person (person), Date (date), Hours (number).
- Teams admin center: custom app upload allowed for Galileo and aa.test.
- Entra app registration: Claude Code writes the exact steps (task T1); Galileo performs them and pastes the client ID and tenant ID into the config file.

## Tasks

**T1. App registration steps and config.**
Write `docs/setup/entra-app.md`: single-tenant app, SPA platform, redirect URIs required for nested app authentication in Teams plus the plain hosted URL for browser testing, delegated Graph permissions `User.Read` and `Sites.ReadWrite.All`, admin consent. Verify every value against current Microsoft documentation and cite the page. Create `src/config.ts` holding client ID, tenant ID, site paths and list names.

**T2. Authentication module.**
One file, `src/auth/graphAuth.ts`. Uses MSAL nested app authentication when running inside Teams, and standard MSAL when running in a plain browser (for development). Exposes one function that returns a Graph access token for the signed-in user. Silent first, interactive fallback. No secrets, no server.

**T3. Diagnostic screen.**
A screen reachable at a dedicated route in the existing prototype. It shows:
- signed-in user and the Teams host client (desktop, web, iOS, Android);
- read `TestHours` (Operations): PASS or DENIED or ERROR, HTTP status, Graph error code;
- write one row to `TestHours`, then delete it: same reporting;
- read `TestFees` (Principals): same reporting. Show the item **count only**, never field values;
- a timestamp and a "copy report" button producing plain text.

**T4. Teams app package.**
Manifest (current schema version) for a personal app with one static tab pointing at the hosted URL, valid domains set, icons in Agency Artifact branding. A script or npm command that builds the upload zip.

**T5. Reminder flow instructions.**
Write `docs/setup/reminder-flow.md`: exact click-by-click steps for Galileo to build the flow in Power Automate. Logic: on schedule, check `TestHours` for a row from aa.test dated today; if none, post through the Flow bot to aa.test; on a later run, if still none, post to the coordinator (Galileo stands in). One flow on Los Angeles time, one on India time. Compress the schedule for testing (minutes apart, not a day). Include how to export the flow so a copy can be kept in the repo.

## Test matrix (Galileo runs, Claude Code prepares the checklist)

For each account (Galileo, aa.test) on each client (Teams desktop, Teams web, iOS, Android): sign-in without a prompt, Operations read, Operations write, Principals read. Expected: Galileo passes all; aa.test passes Operations and is DENIED on Principals. Plus: aa.test denied on `TestFees` in Graph Explorer. Plus: time the Today screen log-and-confirm on one phone.

## If something fails

- Nested app authentication fails on any client: stop. Report the error, the client and the documentation consulted. Do not build a token-exchange server; that fallback is Galileo's decision.
- aa.test can read `TestFees` by any route: stop immediately. That is a no-go on the approach.

## Out of scope

Real project register, real data model, provisioning script, task assignment, any calculation, any finance, migrating hosting off GitHub Pages, wiring the Today screen to SharePoint (the diagnostic write covers it).

## Report to bring back

`docs/stages/stage-0-report.md` containing: the filled test matrix with the copied diagnostic reports; verified, assumed and untested items in separate sections; deviations from this brief and why; open questions; parked ideas (one line each).
