# Findings

Cumulative across stages. Every failure or discovery that cost time gets one entry, so it never repeats. Newest first.

## Entry format

### YYYY-MM-DD: short title
- Stage and gate:
- Symptom: the exact error (HTTP status, Graph error code, message).
- Cause: what was actually wrong. Mark it "verified" or "suspected".
- Fix:
- Rule from now on: if it changes how something must be built, name the SOP and update it.

## Entries

### 2026-10-14: in a plain browser, one click opens only one sign-in popup
- Stage and gate: stage 1, T3 (first Harvest run, Administrator).
- Symptom: diagnostic opened directly in a browser (not Teams), **Connect Harvest and run**: `FATAL: popup_window_error` (MSAL), prompts 2, no Harvest lines.
- Cause (suspected, from the order of calls): the click opened the Harvest popup first; the Microsoft sign-in popup that followed had no click left and the browser blocked it. The Graph failure then stopped the run before the Harvest lines. In Teams, Graph sign-in is silent (nested app authentication), so only one popup is needed.
- Fix: Graph and Harvest lines are independent; a Graph failure no longer hides the Harvest lines.
- Rule from now on: run the stage 1 diagnostic inside Teams. In a plain browser, expect the Microsoft sign-in to need its own click (Run again).

### 2026-10-14: Teams sign-in popups for a third-party provider need no provider domain in the manifest (docs)
- Stage and gate: stage 1, T2 (Harvest sign-in).
- Symptom: none; question from the brief (does `id.getharvest.com` go in `validDomains`?).
- Cause (docs, [Configure OAuth authentication for tab](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/auth-tab-aad), updated 2026-08-03): the flow "must start on a page that's on your domain", listed in `validDomains` (else an empty popup); the identity provider's domain need not be listed. Microsoft's sample passes the token through `localStorage`, which our money and secrets rule forbids.
- Fix: `harvest-auth.html` on the app's domain starts the flow and receives the callback; the token returns through `notifySuccess`/`postMessage`, never storage. Manifest unchanged.
- Rule from now on: a third-party sign-in in Teams starts on our own page. Do not copy the sample's storage hand-off. `overview.md` I2.

### 2026-10-14: Planner premium plans are outside the Graph Planner API (docs)
- Stage and gate: stage 1, T1 (setup research).
- Symptom: none yet; found before testing. Learn: "Premium plans and tasks aren't available on the Planner API in Microsoft Graph." The Update plannerTask page also says Project tasks replicated to Planner accept only `percentComplete` updates.
- Cause (docs): premium plans live in Dataverse (Project for the web), not in the basic Planner store.
- Fix: none. Criterion 1 is run as briefed; it measures whether the replicated copy of aa.test's task is visible and completable. Planner premium setup page warns about it.
- Rule from now on: never assume a Graph Planner call reaches a premium plan; prove it per call (read, update) at Link.

### 2026-10-14: Harvest is rolling out a new permissions framework
- Stage and gate: stage 1, T1.
- Symptom: none; the Harvest help article "Permissions" (updated 2026-10-14) lists six roles (Member, Project Manager, People Admin, Accounting, Executive Manager, Administrator), while the brief uses the old three (Member, Manager, Administrator).
- Cause (docs): new framework, released per account.
- Fix: `docs/setup/harvest.md` maps the test roles for both frameworks (coordinator test = Project Manager in the new one).
- Rule from now on: record which framework the account has before reading any role result.

### 2026-10-14: Harvest API accepts cross-origin calls from the app (verified)
- Stage and gate: stage 1, T1.
- Symptom: none. Preflight `OPTIONS https://api.harvestapp.com/v2/users/me` with `Origin: https://agencyartifact.github.io` returned 200, `access-control-allow-origin: *`, allowed headers `authorization, harvest-account-id, content-type`.
- Cause: n/a.
- Fix: none needed. The browser sets `User-Agent` itself; Harvest's allowed headers do not include it, so the app must not try to set it.
- Rule from now on: if Harvest calls fail with no status, re-run this preflight before suspecting the token.

### 2026-10-13: Contribute can delete version history
- Stage and gate: stage 0, Link (hours access redesign).
- Symptom: none observed; found while moving hours from a lock to a record. Docs ([Understanding permission levels](https://learn.microsoft.com/en-us/sharepoint/understanding-permission-levels)): Contribute includes Delete Versions.
- Cause (docs): the default Contribute level lets a user erase past versions of items they can edit.
- Fix: custom level `AA Team` = Contribute without Delete Versions, for team and coordinators.
- Rule from now on: wherever version history is the control, nobody below principal holds Delete Versions or Manage Lists. `data.md` 1.2.

### 2026-10-13: the own-items setting is checked against the app's scope, not the user's level
- Stage and gate: stage 0, Link (criterion 6, coordinator corrections).
- Symptom: with the own-items setting on, editing and deleting another user's TestHours row: `Sites.ReadWrite.All` (Graph) and `AllSites.Write` (REST): 403 for Owner and team alike. `Sites.Manage.All` (Graph) and `AllSites.Manage` (REST): 200/204 for Owner **and for aa.test at Contribute** (diagnostic, Teams web, build 2026-10-14T03:43:21Z, 20:56 and 20:57 Los Angeles).
- Cause (verified by the symptom pattern; mechanism not in docs): SharePoint applies the item-level rule using the rights of the app's delegated scope. A write-level scope lacks the bypass for everyone; a manage-level scope carries it for everyone. The user's own level (Contribute, Coordinator, Owner) makes no difference to the bypass through an app. The earlier hypothesis ("intersection of user and scope") was wrong; the team safety run disproved it.
- Fix: manage-level and SharePoint permissions revoked and removed from the Entra app; app back to Graph with `Sites.ReadWrite.All`; REST and manage-scope test code removed.
- Rule from now on: never grant the app a manage-level or full-control scope while an item-level setting protects data. `data.md` and `entra-app.md` (step 4b) updated. Any test that widens permissions includes a run as a team account before the result counts.

### 2026-10-13: first SharePoint REST call from Teams failed with "Failed to fetch"
- Stage and gate: stage 0, Link.
- Symptom: the first REST call of a run returned no response (`TypeError: Failed to fetch`); the immediate retry returned 200. Seen on Teams web and desktop.
- Cause (suspected): transient first-connection failure, not CORS (SharePoint sends `Access-Control-Allow-Origin: *` even on 401; the preflight from the app's origin returns 200).
- Fix: none kept (REST route removed). If REST is used again, retry once on a network error.
- Rule from now on: a browser-level fetch error carries no status; record the message and retry before concluding.

### 2026-10-13: Teams desktop keeps serving an old build
- Stage and gate: stage 0, Link.
- Symptom: after a deploy, Teams desktop ran the previous build even after quit and restart; Teams web with F5 loaded the new one.
- Cause (suspected): Teams desktop webview cache, on top of GitHub Pages' 10-minute cache.
- Fix: the diagnostic shows a build stamp next to the App URL.
- Rule from now on: after a deploy, check the build stamp before reading a report; test new builds on Teams web first.

### 2026-10-13: through Graph, the own-items list setting blocks Owners too
- Stage and gate: stage 0, Link (test matrix, criterion 6).
- Symptom: Galileo (Owner, Full Control on AA Operations) editing or deleting a TestHours row created by aa.test through Graph: `403 accessDenied` (PATCH `/items/{id}/fields` and DELETE `/items/{id}`), in Teams desktop, several runs.
- Cause (verified): the list setting "Create and Edit access: Create items and edit items that were created by the user". Three checks, 2026-10-13: (1) in the SharePoint list interface Galileo edited and deleted aa.test's rows: allowed; (2) with the setting switched to "Create and edit all items", the same Graph calls returned 200 and 204; (3) switched back afterwards. So the bypass for users with Override List Behaviors (Cancel Checkout) works in the interface, not through Graph.
- Fix: none yet. The design consequence (coordinators correcting hours) is Galileo's decision, see stage 0 report.
- Rule from now on: do not rely on the own-items setting plus Override List Behaviors for any write that goes through Graph. `docs/architecture/data.md` updated.

### 2026-10-13: git push refused with 403 although gh is logged in as AgencyArtifact
- Stage and gate: stage 0, T0 step 7 (push after cleanup).
- Symptom: `git push` returned `remote: Permission to AgencyArtifact/AA-App.git denied to Galileo1986.` and HTTP 403.
- Cause (verified): Git's credential helper on this machine is Git Credential Manager (`credential.helper=manager`), which holds the `Galileo1986` login. The GitHub CLI holds both accounts and `AgencyArtifact` is its active one, but plain `git push` does not ask the CLI.
- Fix: push through the CLI's credentials for that command only: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -u origin main`. No config changed.
- Rule from now on: push to `AgencyArtifact/AA-App` with the command above (or give `Galileo1986` write access to the repo, Galileo's choice). Recorded in `docs/setup/deploy.md`.
