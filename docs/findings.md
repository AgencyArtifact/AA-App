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
