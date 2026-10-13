# Handoff: Agency Artifact app, stage 0 (as of 2026-10-13)

A summary of everything done so far, so work can continue in another session
or tool. Read `CLAUDE.md` first (settled rules), then this file, then
`docs/stages/stage-0-report.md` (full detail) and
`docs/stages/stage-0-test-checklist.md` (tests still to run).

---

## 1. What the project is

One app for Agency Artifact (about 10 people, Los Angeles and India), running
inside Microsoft Teams, with views by role (team, coordinator, principal).
Data lives in Microsoft Lists on two SharePoint sites:

- `AA Operations` (everyone, operational data);
- `AA Principals` (the two principals only, all financial data).

The financial boundary is enforced by SharePoint permissions. The app calls
Microsoft Graph only with the signed-in user's delegated token. There is no
server and there are no secrets.

**Stage 0 = feasibility test.** It ends in a go/no-go on four criteria (brief:
`docs/stages/stage-0-feasibility.md`):

1. Teams personal app on desktop, iOS and Android, single sign-on, no server.
   Logging half an hour and confirming takes under 30 s on a phone.
2. The non-principal test account `aa.test` is denied on `AA Principals`, in the
   app and in Graph Explorer.
3. A scheduled Teams reminder reaches aa.test, then escalates to the
   coordinator, on LA time and on India time.
4. The app is published to the org app catalog and installed from a phone.

**Current status:** all code and instructions are delivered, pushed and live.
**No tenant test has run yet**, because the Entra app registration is not done.
There is no go/no-go yet.

---

## 2. Where things are

| What | Where |
|---|---|
| Local project | `C:\Projects_Cowork\AA_Admin System` (git repo, branch `main`) |
| GitHub repo | https://github.com/AgencyArtifact/AA-App (public, owned by the GitHub **user** account `AgencyArtifact`, not an organization) |
| Live site (GitHub Pages) | **https://agencyartifact.github.io/AA-App/** (case-sensitive: `/aa-app/` gives a 404) |
| Diagnostic screen | `…/AA-App/#/diagnostic` |
| Phone test screen | `…/AA-App/#/log` |
| Privacy / terms | `…/AA-App/privacy.html`, `…/AA-App/terms.html` |
| Deploy | `.github/workflows/deploy-pages.yml`: every push to `main` runs install, test, build and Pages deploy. All runs so far succeeded. |

Commits on `main`:

```
04799bd Show 'sign-in not set up' immediately while Entra IDs are placeholders
911dd33 Stage 0 report: push, Pages deploy and test workbooks recorded
0a3cb27 Stage 0: feasibility diagnostic, phone test screen, fictional test workbooks
447db4d Initial commit (README created on GitHub)
```

---

## 3. What was built

**App** (React 19 + Vite 8 + TypeScript, static site). Runtime dependencies:
`@azure/msal-browser` 5.25.0, `@microsoft/teams-js` 2.58.0, `react`,
`react-dom`.

| File | Purpose |
|---|---|
| `src/config.ts` | The only configuration file. `config.appUrl` is **the single address**; every other address is derived from it (build base path, Entra redirect URIs, manifest URLs and `validDomains`, privacy and terms URLs). Also holds the Entra IDs, SharePoint hostname, site paths and list names, Teams app id and version. Read by the Node scripts too, so it must stay plain `export const` (no enums, no imports). |
| `src/auth/graphAuth.ts` | Sign-in. Inside Teams: **Nested App Authentication** (`createNestablePublicClientApplication`). No `getAuthToken`, no server. In a plain browser (testing only): MSAL popup that returns to the blank page `auth.html`. Silent first, then interactive. Stops with a clear message while the Entra IDs are placeholders. |
| `auth.html` + `src/auth/redirectBridge.ts` | Blank popup-return page (MSAL v5 redirect bridge). Never loads the app. |
| `src/graph/graph.ts`, `src/graph/sharepoint.ts` | Minimal Graph caller and SharePoint list helpers (site lookup, count by id only, create/delete `TestHours` rows, Person lookup). Nothing is logged. |
| `src/diagnostic/` | `#/diagnostic`: user, Teams client type, Operations read, Operations write + delete, Principals read (**item count only, never field values**). PASS / DENIED / ERROR with HTTP status and Graph code, timestamp, "Copy report". |
| `src/log/` | `#/log`: date (today by default), one half-hour stepper, explicit Confirm, writes one row to `TestHours`, shows "Screen open → confirmed" time, button to delete the test row. A test screen, **not** the timecard. |
| `src/App.tsx` | Hash routes: Home (`#/`, links to the log test), `#/log`, `#/diagnostic`. |
| `public/privacy.html`, `public/terms.html` | Plain-language pages; the manifest points at them. |
| `scripts/build-teams-package.mjs` | `npm run teams:package` builds `dist-teams/aa-app-<version>.zip`. Manifest schema 1.29; app name "Agency Artifact"; tabs **Home** and **Diagnostic**. Refuses to build while any `REPLACE_ME` remains. |
| `scripts/print-entra-values.mjs` | `npm run entra:values` prints the exact Entra and manifest values for the current `appUrl`. |
| `teams/icons/` | `color.png` 192×192 (the "A" of the AA logo); `outline.png` 32×32, a solid white "A" (gaps closed). |
| Tests | `npm test`: 22 tests (outcome classification, report text, half-hour stepper, formatting). |

**Docs**

| File | Content |
|---|---|
| `docs/setup/entra-app.md` | Click-by-click Entra registration, with cited Microsoft docs. |
| `docs/setup/deploy.md` | Hosting, Teams package, catalog upload, and **"Switching the domain"** (what to redo when the custom subdomain is ready). |
| `docs/setup/reminder-flow.md` | Power Automate reminder and escalation flows (LA and India), test procedure, export. |
| `docs/stages/stage-0-test-checklist.md` | Every test Galileo runs: setup checks, test matrix (2 accounts × 4 clients), Graph Explorer, other denial routes, reminder flows, **phone stopwatch test (section G)**. |
| `docs/stages/stage-0-report.md` | Full report: verified, assumed, untested, deviations, open questions, parked. |

**Test data:** `test-data/excel/` holds fictional copies of the three AA
workbooks (Master Schedule, Project Tracker, Business Projections). See section 5.

---

## 4. Decisions made by Galileo in this session

1. **Direction:** the existing timecard prototype is not in this repo. In a
   later stage its screens will be ported **into this repo**, not the other way.
2. **Hosting:** public repo on GitHub Pages for now. It moves to a paid private
   plan before real data enters. The final address will be a custom subdomain
   of the firm's domain (pending); the github.io address is for test deploys only.
3. **Naming:** the app is "Agency Artifact"; main tab "Home"; "Diagnostic" stays
   as a second tab until stage 0 closes.
4. **Icons:** keep the color icon; the 32px outline is a solid "A". A clean
   logo file will come later.
5. **Manifest pages:** privacy and terms are static pages in this repo; the
   firm website URL stays `REPLACE_ME` until Galileo fills it in.
6. **Public repository rule** (in `CLAUDE.md`): no real project, client, fee or
   staff data in the repo while it is public. **The formulas of Chris's models
   are not sensitive and may be committed** (decision 2026-10-13). Only names
   and figures are sensitive.
7. **Entra registration:** Galileo does it himself. Claude Code must not
   register anything.

---

## 5. The Excel workbooks (sensitive, read this)

- The **real** workbooks are in `Excell/Systems/` in the local folder. They hold
  real names, clients, rates, salaries, fees and billing. `Excell/` is
  **git-ignored** and was never committed. Never stage it.
- **Fictional copies** are committed in `test-data/excel/` (`*_FICTIONAL.xlsx`,
  with a README):
  - **Replaced:** project numbers and names (one fictional number and name per
    project, consistent across all three files, year prefix and order kept);
    clients; staff names and initials; billable rates; mixed rate; salaries;
    fees, contracts, billing and operating costs (scaled by a random factor per
    project or cost line, so relations within a row hold), including amounts
    typed inside formulas; tracker free-text notes (replaced by generic
    milestones); author and SharePoint metadata.
  - **Unchanged:** every formula, hours, dates, phases, statuses, percentages,
    headcount.
  - Excel recalculated everything. There are no new errors and formula counts
    match the originals. A scan of every file part found no real name or figure.
- Technical note for anyone editing these files: several cells are **outputs of
  dynamic-array formulas** (for example `Economics!A22:A49`, and Projections
  `P112`, `P123:T125`). Writing values into them breaks the spill. Edit inputs
  only.

---

## 6. Verified, assumed, untested (short version)

**Verified (ran it, saw it)**

- Typecheck, build and 22 tests pass. The manifest validates against the
  official v1.29 schema.
- Full browser sign-in flow against a **mocked** Microsoft login and Graph:
  - the popup lands only on `auth.html` and closes itself;
  - the token is exchanged;
  - the diagnostic shows PASS / PASS / PASS / DENIED;
  - `#/log` writes `Hours: 0.5` with Person set;
  - the test row is deleted.
- Live site: Home, `#/log`, privacy and terms load; assets return 200. The
  GitHub Actions deploys succeeded.
- With placeholder IDs, Confirm and the diagnostic show "Sign-in is not set up
  yet" immediately (deployed).

**Assumed**

- NAA works on all four Teams clients.
- The SharePoint details: list addressed by name, date format, Person lookup.
- `Person/EMail` and date filters work in Power Automate.

**Untested**

Everything in the tenant: Entra, consent, Teams clients, real Graph calls, the
permission boundary, catalog publishing, the reminder flows, the phone timing.

---

## 7. Next steps (in order)

1. **Galileo: Entra registration** (`docs/setup/entra-app.md`; values from
   `npm run entra:values`). With the current address:
   - Single-page application redirect URIs:
     `brk-multihub://agencyartifact.github.io`,
     `https://agencyartifact.github.io/AA-App/auth.html`,
     `http://localhost:5173/AA-App/auth.html`
   - Delegated Graph permissions `User.Read` and `Sites.ReadWrite.All`, with
     admin consent.
   - **No** secrets, **no** application permissions, **no** Application ID URI.
2. **Galileo sends:** the client ID, the tenant ID and the SharePoint hostname
   (`<name>.sharepoint.com`). Then put them in `src/config.ts` and push. The
   site redeploys automatically.
3. **Galileo: SharePoint preconditions** (from the brief):
   - test account `aa.test` (Business Basic);
   - site `AA Principals`: standalone (not connected to Teams), members Galileo
     and Chris only, list `TestFees` (Project text, Fee number);
   - site `AA Operations`: members Galileo, Chris and aa.test, list `TestHours`
     (Person, Date, Hours);
   - Teams admin: custom app upload allowed; Workflows app allowed.
4. Fill in the firm website URL (`teamsApp.developerWebsiteUrl`), run
   `npm run teams:package`, upload to the Teams admin center
   (`docs/setup/deploy.md`).
5. Run `docs/stages/stage-0-test-checklist.md`. Paste the diagnostic reports into
   the stage 0 report, then decide go or no-go.

**Stop rules from the brief:**

- If nested app authentication fails on any client, report it. Do not build a
  token-exchange server.
- If aa.test can read `TestFees` by any route, that is an immediate no-go.

---

## 8. Practical gotchas

- **The URL is case-sensitive:** `AA-App`, not `aa-app`. Phones often lowercase
  it, which gives a 404. Renaming the repo to lowercase is possible (one config
  line plus a GitHub rename) if Galileo wants it.
- **GitHub login on this machine:** `gh` is signed in as `AgencyArtifact`
  (active) and `Galileo1986` (inactive). Plain `git push` picked up the old
  `Galileo1986` credential and was refused. Push with:
  `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push`
  or run `gh auth setup-git` once.
- **Commit author** is the global git identity `Galileo1986`.
- **Browser sign-in** needs popups allowed. Inside Teams no popup is used.
- **GitHub warnings** (not failures): the Node 20 based actions are deprecated,
  and `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19. Parked.
- **The original stage brief** is in both `Handoff/` and `docs/stages/` (Q7).

---

## 9. Open questions for Galileo

- Q3. Phone stopwatch start: the Teams icon on the phone's home screen (as
  written) or the Agency Artifact icon inside Teams? Is "Teams in the
  background" the pass condition?
- Q4. During stage 0, should the Home tab open directly on the log test (one
  tap less in the timing)?
- Q5. Firm website URL for the manifest.
- Q6. Do the principals' first names and roles in `CLAUDE.md` and the docs count
  as "staff data"? Assumed not.
- Q7. Keep or remove `Handoff/stage-0-feasibility.md` (a duplicate of the brief)?
- New: rename the repo to lowercase `aa-app` so the address works however it is
  typed?

## 10. Parked

- Token prefetching via the manifest (`nestedAppAuthInfo`).
- Delegated `Sites.Selected`, to narrow Graph access to the two AA sites.
- A host that can send `Cache-Control: no-store` for `auth.html`.
- Update the deploy workflow's actions (Node 24, Ubuntu 26).
- Keep the icon generator in the repo once the clean logo file arrives.
