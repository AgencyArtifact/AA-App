# Stage 0 test checklist (for Galileo)

Run in this order. Paste every copied diagnostic report into
`docs/stages/stage-0-report.md`, section *Test matrix*.

**Stop rule.** If aa.test can read `TestFees` by **any** route below, stop
there and report it: that is a no-go on the approach.

## A. Setup (once)

- [ ] A1. Preconditions from the brief are done (admin role, aa.test with
      Business Basic, both sites and lists, custom upload allowed).
- [ ] A2. Principals site permissions are exactly what we think. As Galileo,
      open `AA Principals` > **Settings** (gear) > **Site permissions** >
      **Advanced permissions settings**. Expected: only Galileo and Chris (in
      Owners / Members), and **no** "Everyone", "Everyone except external
      users" or "All users" entry anywhere. Also select **Check Permissions**,
      enter aa.test: expected *None*. Note the result.
- [ ] A3. `TestFees` has at least one row (any made-up project and fee) so a
      count of 0 cannot be confused with "no access".
- [ ] A4. `TestHours` columns are named exactly `Person`, `Date`, `Hours`
      (internal names; if a column was renamed after creation, tell me).
- [ ] A5. Entra registration done per `docs/setup/entra-app.md`; IDs in
      `src/config.ts`.
- [ ] A6. Site published per `docs/setup/deploy.md`.
      `https://agencyartifact.github.io/AA-App/#/diagnostic` (or the address
      in `config.appUrl`) opens in a browser.
- [ ] A7. `npm run teams:package` built the zip; app uploaded to the org
      catalog (deploy.md step 5).

## B. Browser smoke test (desktop browser, Galileo)

- [ ] B1. Open `<appUrl>#/diagnostic`. A Microsoft sign-in popup appears
      (allow popups if blocked, then **Run again**). Sign in as Galileo. The
      popup should end on a blank page (`auth.html`) and close by itself; it
      must never show the app inside the popup.
- [ ] B2. Expected: Sign-in PASS, Operations read PASS, Operations write +
      delete PASS, Principals read PASS. **Copy report**, paste in the report.

## C. Test matrix (Teams)

For each cell: open **Agency Artifact** in Teams, select the **Diagnostic**
tab, wait for the diagnostic to finish,
**Copy report**, paste into the report with the client and account named.
If copy is blocked, the report text is selected below the buttons: copy it by
hand, or take a screenshot.

Also note for each cell: **was there any sign-in or consent prompt?** (The
report shows `Prompts: N`; 0 means fully silent.)

| # | Client | Account | Expected |
|---|---|---|---|
| C1 | Teams desktop (Windows) | Galileo | all PASS, Prompts 0 |
| C2 | Teams web (browser) | Galileo | all PASS, Prompts 0 |
| C3 | Teams iOS | Galileo | all PASS, Prompts 0 |
| C4 | Teams Android | Galileo | all PASS, Prompts 0 |
| C5 | Teams desktop | aa.test | Ops read/write PASS, Principals **DENIED** |
| C6 | Teams web | aa.test | Ops read/write PASS, Principals **DENIED** |
| C7 | Teams iOS | aa.test | Ops read/write PASS, Principals **DENIED** |
| C8 | Teams Android | aa.test | Ops read/write PASS, Principals **DENIED** |

How to read the Principals result for aa.test:

- `DENIED (HTTP 403 accessDenied)`: the expected outcome.
- `ERROR (HTTP 404 itemNotFound)` on *site lookup failed*: SharePoint can hide
  a site's existence from users without access. If C1 to C4 show the same site
  as PASS for Galileo, a 404 for aa.test is also a denial. Record it exactly as
  shown; I will interpret it in the report.
- `PASS` with any item count: **stop**, no-go.

If the app shows `FATAL: Nested app authentication is not available on this
Teams client`, or any other FATAL on a Teams client: stop testing that
client, copy the report, note the Teams version (Settings > About), and report.
Do not try other sign-in workarounds.

Two accounts on one phone: sign out of Teams and sign in as the other account,
or use two devices. Note which you did.

## D. Graph Explorer (aa.test, any browser)

- [ ] D1. Open <https://developer.microsoft.com/graph/graph-explorer> in a
      private window. **Sign in** as aa.test.
- [ ] D2. If Graph Explorer asks for consent to `Sites.Read.All` and aa.test
      cannot grant it, sign in as Galileo once, consent for the organisation
      only for Graph Explorer, then sign back in as aa.test. Note what you did.
      This is a tenant-wide grant to Graph Explorer (still delegated, so still
      limited to each user's own SharePoint access). Remove it after the test:
      Entra admin center > **Enterprise apps** > *Graph Explorer* >
      **Permissions**, or delete the enterprise app.
- [ ] D3. Run `GET https://graph.microsoft.com/v1.0/sites/<tenant>.sharepoint.com:/sites/AAPrincipals`
      Expected: 403 or 404. Copy status and the `error.code`.
- [ ] D4. Run `GET https://graph.microsoft.com/v1.0/sites/<tenant>.sharepoint.com:/sites/AAPrincipals:/lists/TestFees/items`
      Expected: 403 or 404.
- [ ] D5. Search route: `POST https://graph.microsoft.com/v1.0/search/query` with body

      ```json
      { "requests": [ { "entityTypes": ["listItem"], "query": { "queryString": "TestFees" } } ] }
      ```

      Expected: no hits from `AA Principals`. Repeat with a project name you
      typed into `TestFees`.
- [ ] D6. Sanity check the other way: as aa.test,
      `GET https://graph.microsoft.com/v1.0/sites/<tenant>.sharepoint.com:/sites/AAOperations` returns 200.

## E. Other routes (aa.test, browser)

- [ ] E1. Open `https://<tenant>.sharepoint.com/sites/AAPrincipals` directly.
      Expected: access denied / request access page.
- [ ] E2. Open `https://<tenant>.sharepoint.com/sites/AAPrincipals/Lists/TestFees`.
      Expected: denied.
- [ ] E3. Search for a project name from `TestFees` in the Microsoft 365 app
      (<https://m365.cloud.microsoft>) and in Teams search. Expected: nothing
      from `AA Principals`.

## F. Reminder flow

Follow the *Test procedure* in `docs/setup/reminder-flow.md`. For each of LA
and India record: time the reminder reached aa.test's phone, time the
escalation reached Galileo, run history status, and whether Test 2 sent
nothing.

## G. Phone timing: log half an hour in under 30 seconds (go criterion 1)

Uses the test screen `#/log` (date, one half-hour stepper, Confirm; writes
one row to `TestHours`). It is a test screen, not the timecard.

The screen shows **Screen open → confirmed**: the time from the log screen
appearing to the confirmed write. It **cannot** see Teams starting, so the
criterion is measured with a **stopwatch** (a second phone or a watch).

Do this on an iPhone and on an Android phone, signed in as aa.test.

Setup, once per phone:

- [ ] G1. The Agency Artifact app is installed (section C done).
- [ ] G2. Note whether the app is **pinned** in the Teams bottom bar or reached
      through **More** / **Apps**. Either is fine; record which.
- [ ] G3. Go to the phone's home screen. Leave Teams running in the
      background (do not force-close it). Record "Teams in background: yes".

Each attempt:

1. Start the stopwatch **as you tap the Teams icon** on the phone's home screen.
2. Open **Agency Artifact** (it opens on **Home**).
3. Tap **Log half an hour (phone test)**.
4. Leave the date on today. Tap **+** once (shows `0:30`).
5. Tap **Confirm**.
6. Stop the stopwatch **when "Confirmed. Saved to TestHours." appears**.
7. Record: stopwatch time, and the on-screen *Screen open → confirmed* time.
8. Tap **Delete this test row** (important: a leftover row for today stops
   the reminder flow from firing in section F).

Three attempts per phone. Pass: every stopwatch time under 30 seconds.

Optional extra: one attempt with Teams force-closed first (cold start).
Record it separately; it is informative, not the pass criterion, unless you
decide otherwise.

| Phone | Pinned? | Attempt | Stopwatch | Screen open → confirmed | Notes |
|---|---|---|---|---|---|
| iOS | | 1 | | | |
| iOS | | 2 | | | |
| iOS | | 3 | | | |
| Android | | 1 | | | |
| Android | | 2 | | | |
| Android | | 3 | | | |
