# Stage 0, T0: cleanup report

2026-10-13. Brief: `stage-0-T0-cleanup.md` v1 (currently at repo root). CLAUDE.md read: 1.0 (uncommitted in the working tree). Stage brief read: `stage-0-feasibility.md` v2 (repo root), expects 1.0. Versions match.

Status: steps 2 to 5 done, read only. **HALT at step 6.** Nothing in the repo was changed except writing this file.

## Read first: deviations and conflicts

1. **Step 1 stopped: the working tree is not clean.** `CLAUDE.md` is modified (it is the new 1.0) and nine items are untracked (the planning delivery plus older leftovers, see the inventory). The tag `pre-constitution-1.0` was **not** created. Proposal A0: tag the current commit `04799bd` ("Show 'sign-in not set up'...", 2026-10-13 00:30). That commit holds the pre-1.0 CLAUDE.md, so the tag is correct even though the tree is dirty. Your approval needed.
2. **Conflict, CLAUDE.md "Current state" and brief T3 versus the repo.** CLAUDE.md says the app is "React prototype of the AA Time card app, becoming the team view". T3 says "a dedicated route in the existing prototype". The timecard prototype is **not in this repo**. The repo holds only the stage 0 test build: Home, `#/diagnostic`, `#/log`. Your decision of the earlier round (recorded only in `docs/stages/stage-0-handoff.md`, section 4.1) was that the prototype's screens are ported into this repo in a later stage. Proposed fix: edit E2 below. If the prototype is meant to be ported now, that is a scope change for stage 0.
3. **Conflict, the public repository rule was dropped.** The pre-1.0 CLAUDE.md had a "Public repository rule" (no real project, client, fee or staff data while `AgencyArtifact/AA-App` is public; real workbooks only in the git-ignored `Excell/`). CLAUDE.md 1.0 does not hold it. The repo is still public, and `docs/setup/deploy.md` line 4 points to that rule. Proposed fix: edit E1. Until you decide I keep following the old rule.
4. **Much of stage 0 v2 already exists from the v1 rounds.** `src/config.ts`, `src/auth/graphAuth.ts`, `#/diagnostic`, the Teams package script, `docs/setup/entra-app.md` and `docs/setup/reminder-flow.md` exist. T1 to T5 will be revisions, not new files. Gaps against v2 found in passing: no `WorkDate` handling, no "edit another user's row" step, no app-start timer in the diagnostic; no `docs/setup/sharepoint-sites.md`. Not touched now (T0 forbids code changes).

## Step 2: instruction sources

| Path | What it is | Contradicts CLAUDE.md 1.0? |
|---|---|---|
| `CLAUDE.md` (repo root) | Constitution 1.0, uncommitted | It is the reference |
| `CLAUDE_Old.md` (root, untracked) | Byte-identical to the committed pre-1.0 CLAUDE.md. Not auto-loaded (wrong name), but reads as instruction | Yes. Authority order puts the brief above CLAUDE.md ("Authority order"); calculation fixed as pure TypeScript in the app (1.0 left it open, `overview.md` open questions); coordinators have no rule on editing hours ("Roles") |
| `CLAUDE.local.md`, `.claude/CLAUDE.md`, subfolder CLAUDE.md | None exist | |
| Parent folders `C:\Projects_Cowork\`, `C:\` | No CLAUDE.md, no `.claude/` | |
| `.claude/settings.local.json` (git-ignored) | Tool permission allowlist only: npm, tsc, vitest, gh run, one cleanup of `dist-teams`, one past anonymization script run | No |
| `.claude/` commands, agents, rules | None exist | |
| `~/.claude/CLAUDE.md` | Does not exist | |
| `~/.claude/settings.json` | Permissions, theme, update channel. No hooks | No |
| `~/.claude/skills/` | Global skills (Vercel, web design guidelines, find-skills) | Not contradicting; Vercel deploy skills are irrelevant while hosting is GitHub Pages ("Current state"). Report only |
| Auto memory for this project | Memory folder exists and is empty | None to remove |
| `BLAST System Protocol.docx` (root, untracked) | Generic B.L.A.S.T. prompt for another tool ("Antigravity"): `gemini.md` as constitution, `task_plan.md`, `progress.md`, `.env` credentials, discovery questions | Yes. "File map", "Never" (secrets), "Build protocol" (1.0 already holds the adapted version) |
| `Handoff/stage-0-feasibility.md` | Stage 0 brief v1, identical to `docs/stages/stage-0-feasibility.md` | Superseded by brief v2 (4 criteria instead of 6) |
| `docs/stages/stage-0-feasibility.md` | Brief v1 | Superseded by v2 |
| `docs/stages/stage-0-handoff.md` (untracked) | Handoff summary of rounds 1 and 2; says "read CLAUDE.md, then this file" | Restates v1 criteria and old CLAUDE.md sections. Its section 4 is the only written record of your round 2 decisions |

## Step 3: file inventory

| Item | Class | Note / target |
|---|---|---|
| `CLAUDE.md` | KEEP | Commit 1.0 (with approved edits as 1.1) |
| `CLAUDE_Old.md` | OBSOLETE | Identical to the commit at the proposed tag; history keeps it |
| `BLAST System Protocol.docx` | CONFLICT | See step 2. Untracked, never committed |
| `files.zip` | OBSOLETE | Planning delivery; its five files are byte-identical to the root copies |
| `files/` | OBSOLETE | Empty folder, created 01:11 (unzip target) |
| `Init_code/` | OBSOLETE | Empty folder, never tracked. If it was meant for the timecard prototype, see conflict 2 |
| `stage-0-feasibility.md` (root) | MOVE | `docs/stages/stage-0-feasibility.md`, replacing v1 |
| `stage-0-T0-cleanup.md` (root) | MOVE | `docs/stages/stage-0-T0-cleanup.md` |
| `overview.md` (root) | MOVE | `docs/architecture/overview.md` |
| `data.md` (root) | MOVE | `docs/architecture/data.md` |
| `findings.md` (root) | MOVE | `docs/findings.md` |
| `Handoff/` | OBSOLETE | Duplicate of brief v1 (answers open question Q7 of the stage 0 report) |
| `Excell/` | KEEP (ignored) | Real workbooks, git-ignored, never committed. Local only |
| `README.md` | KEEP | One line, `# AA-App` |
| `index.html`, `auth.html` | KEEP | Vite entry points (app; blank MSAL popup bridge). Not in file map: E6 |
| `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore` | KEEP | Standard build config |
| `.github/workflows/deploy-pages.yml` | KEEP | Pages deploy. Not in file map: E6 |
| `public/` (privacy, terms pages) | KEEP | Required by the Teams manifest. Not in file map: E6 |
| `teams/icons/` | KEEP | Manifest icons. Not in file map: E6 |
| `test-data/excel/` | KEEP | Fictional workbooks, formulas unchanged. Not in file map: E6 |
| `flows/README.md` | KEEP | Home for exported flows (T5). Not in file map: E6 |
| `scripts/` | MOVE | `tools/`. The file map defines `tools/` as dev-time scripts never deployed, which these are (Teams package builder, Entra values printer). See A3 |
| `src/` (15 files) | KEEP | No file conflicts with CLAUDE.md: no backend calls, no local storage as system of record (MSAL keeps tokens in sessionStorage only), no Checkplot or Atelier Galileo |
| `docs/setup/deploy.md` | KEEP | Line 4 points to the dropped public repo rule: A6 |
| `docs/setup/entra-app.md` | KEEP | Revised in T1 |
| `docs/setup/reminder-flow.md` | KEEP | Revised in T5 (checks `Date` only today) |
| `docs/stages/stage-0-report.md` | KEEP | Report of v1 rounds; rewritten at the end of v2 |
| `docs/stages/stage-0-test-checklist.md` | KEEP | Revised for the v2 test matrix |
| `docs/stages/stage-0-handoff.md` | UNKNOWN | You decide. Recommendation: commit unchanged as a dated record, because its section 4 holds decisions written nowhere else |

**For a later stage (code, not fixed now):**
- `src/log/` (`#/log`, the "log half an hour" phone test) was built for v1 criterion 1. V2 times cold start to the diagnostic write. Whether `#/log` stays for the separate "Today screen" timing is a T1 question.
- `src/diagnostic/runDiagnostic.ts` lacks the v2 steps (time zone, WorkDate, edit of another user's row, timer from app start). T3.

## Step 4: pre-1.0 CLAUDE.md items not held by 1.0

| Old item | Proposed destination |
|---|---|
| Public repository rule (no real data while public, `Excell/` ignored, fictional copies, formulas not sensitive) | CLAUDE.md "Current state": E1 |
| Hosting details, build and dev commands (none in the old file; facts from step 5) | CLAUDE.md "Current state": E1 |
| App is the stage 0 test build; prototype ported later | CLAUDE.md "Current state": E2 |
| Entra client ID and tenant ID are configuration, not secrets, in one config file | CLAUDE.md "Never": E3 |
| Never persist financial data on the client (localStorage, IndexedDB, cache) and never log it | CLAUDE.md "Roles and the financial boundary": E4 (your rule to confirm) |
| State why before adding any runtime dependency | CLAUDE.md "Decide or ask": E5 |
| Timecard details: Confirm on Today and Tasks only; no strikethrough on completed tasks; percentage rollups are means; hours on an unassigned project flagged for review, not blocked | CLAUDE.md timecard paragraph: E7 (your choice; alternative: hold for the timecard stage's views SOP) |
| Lists created by a provisioning script from stage 2 on | Drop. The 1.0 file map already names provisioning under `tools/` |
| Calculation is pure TypeScript, ops and finance separate modules | Drop. 1.0 deliberately left where calculation runs open (`overview.md`) |
| An entity carrying money is split: operational record on Operations, financial twin on Principals, same ID | Drop from CLAUDE.md; it belongs in `data.md` when the register Blueprint defines real lists. Parked |
| Hiding a screen is not security | Drop. Covered by "The app never decides access" and the bug test |
| Galileo does tests in Teams and admin-center actions; write precise steps | Drop. Covered by Stylize gate and `docs/setup/` |
| Authority order (brief above CLAUDE.md) | Drop. Replaced by 1.0 |

## Step 5: facts about the app (from code and config)

| Fact | Value | Source |
|---|---|---|
| Language, framework | TypeScript 5.9.3, React 19.3.0, built with Vite 8.3.4. MSAL Browser 5.25.0, Teams JS 2.58.0. Tests: Vitest 5.0.4 | `package.json` |
| Node | `>=23.6` locally (scripts read `src/config.ts` by type stripping); CI uses Node 24 | `package.json`, workflow |
| Dev command | `npm run dev`: Vite on port 5173 (strict), base `/AA-App/`, so `http://localhost:5173/AA-App/` | `vite.config.ts`, `src/config.ts` |
| Build command | `npm run build`: `tsc --noEmit && vite build`, output `dist/` (entries `index.html`, `auth.html`) | `package.json`, `vite.config.ts` |
| Tests | `npm test` (`vitest run`) | `package.json` |
| Teams package | `npm run teams:package`, output `dist-teams/aa-app-<version>.zip` | `scripts/build-teams-package.mjs` |
| Deploy | GitHub Actions on every push to `main` (and manual): `npm ci`, `npm test`, `npm run build`, upload `dist/`, deploy to Pages. Pages source must be "GitHub Actions" | `.github/workflows/deploy-pages.yml` |
| Repo | `https://github.com/AgencyArtifact/AA-App.git`, public | `git remote -v`, `docs/setup/deploy.md` |
| Hosted URL | `https://agencyartifact.github.io/AA-App/` (routes `#/`, `#/diagnostic`, `#/log`) | `config.appUrl` in `src/config.ts` |
| Entra values | Still `REPLACE_ME` placeholders | `src/config.ts` |

These replace the brief's assumptions about the app.

## Step 6: proposed actions (approve item by item)

All in one commit `cleanup to CLAUDE.md 1.0`, except A0 (a tag, before the commit).

**Git**
- **A0.** `git tag pre-constitution-1.0 04799bd`
- **A1.** Move the planning delivery into place, then `git add` (they are untracked, so `git mv` does not apply):
  - `stage-0-feasibility.md` to `docs/stages/stage-0-feasibility.md` (overwrites v1; v1 stays in history)
  - `stage-0-T0-cleanup.md` to `docs/stages/stage-0-T0-cleanup.md`
  - `overview.md` to `docs/architecture/overview.md`
  - `data.md` to `docs/architecture/data.md`
  - `findings.md` to `docs/findings.md`
- **A2.** `git rm -r Handoff/`
- **A3.** `git mv scripts tools`, plus three one-line edits so behaviour is unchanged:
  - `package.json`: `"node scripts/build-teams-package.mjs"` to `"node tools/build-teams-package.mjs"`; `"node scripts/print-entra-values.mjs"` to `"node tools/print-entra-values.mjs"`
  - `src/config.ts` line 5 comment: `Node scripts in scripts/` to `Node scripts in tools/` (comment only)
  - Alternative if you prefer no change: keep `scripts/` and add it to the file map instead.
- **A4.** `docs/stages/stage-0-handoff.md`: `git add` unchanged (recommended), or delete.
- **A5.** Commit `CLAUDE.md` with the approved edits below, as version 1.1. Update `docs/stages/stage-0-feasibility.md` header line to "Expects CLAUDE.md version 1.1." and `docs/stages/stage-0-T0-cleanup.md` likewise.
- **A6.** `docs/setup/deploy.md` lines 4 and 5: `(public while it holds no real data; see the public repository rule in` / `` `CLAUDE.md`). There is no server. `` becomes `(public while it holds no real data; see "Public repo" under Current state in` / `` `CLAUDE.md`). There is no server. `` (only if E1 is approved).

**Untracked files to remove.** They were never in git, so removing them happens outside git and cannot be undone from history. Approve each:
- **A7.** `CLAUDE_Old.md`: delete (the tag A0 preserves the same text).
- **A8.** `files.zip` and empty `files/`: delete.
- **A9.** Empty `Init_code/`: delete.
- **A10.** `BLAST System Protocol.docx`: move out of the repo (for example to your planning folder). Not deleted, since no copy exists in git.

**CLAUDE.md edits (exact)**
- **E0.** Line 3: `Version 1.0, 2026-10-13.` becomes `Version 1.1, 2026-10-13.`
- **E1.** In "Current state", replace
  `- Hosting: GitHub Pages. Not revisited until a brief says so.`
  with
  ```
  - Hosting: GitHub Pages, repo `AgencyArtifact/AA-App`, at `https://agencyartifact.github.io/AA-App/`. The address is set only in `config.appUrl` (`src/config.ts`). Every push to `main` runs `.github/workflows/deploy-pages.yml`: test, build, publish. Not revisited until a brief says so.
  - Public repo: while the repo is public, no real project, client, fee or staff data is committed, test fixtures included. The real workbooks stay in the git-ignored `Excell/`. Fictional copies with unchanged formulas are in `test-data/excel/` (formulas are not sensitive, decision 2026-10-13). The repo goes private before the first stage that needs real data.
  - Commands: `npm run dev` (`http://localhost:5173/AA-App/`), `npm test`, `npm run build`, `npm run teams:package`, `npm run entra:values`.
  ```
- **E2.** In "Current state", replace
  `- App: React prototype of the AA Time card app (the name "Checkplot" is retired), becoming the team view.`
  with
  `- App: TypeScript, React and Vite. This repo holds the stage 0 test build (Home, `#/diagnostic`, `#/log`). The AA Time card prototype (the name "Checkplot" is retired) is outside this repo; its screens are ported in here in a later stage and become the team view.`
- **E3.** In "Never", replace
  `- Store secrets in the repo or the app. There are none: auth is delegated and the app is a single-page app.`
  with
  `- Store secrets in the repo or the app. There are none: auth is delegated and the app is a single-page app. The Entra client ID and tenant ID are configuration, not secrets, and live in `src/config.ts`.`
- **E4.** In "Roles and the financial boundary", after the paragraph ending `never only in the interface.` insert the line
  `The app never stores financial data on the device (local storage, IndexedDB, caches) and never writes it to logs.`
- **E5.** In "Decide or ask", after `- Low-risk technical choices: decide, record the assumption in the report, continue.` insert
  `- State why before adding any runtime dependency.`
- **E6.** In "File map", replace the block with
  ```
  CLAUDE.md               constitution (this file)
  docs/architecture/      SOPs; layer SOPs are created when a stage first needs them
    overview.md           layers and interface contracts
    data.md               sites, lists, permissions, boundary enforcement
  docs/stages/            stage briefs and stage reports
  docs/findings.md        cumulative learnings, target of self-annealing
  docs/setup/             click-by-click setup steps for Galileo
  src/                    the app
  index.html, auth.html   Vite entry points (app; blank sign-in popup page)
  public/                 static pages served as is (privacy, terms)
  teams/                  Teams app icons; the package is built by tools/
  tools/                  deterministic dev-time scripts (imports, provisioning, calculation tests, Teams package), never deployed
  flows/                  exported Power Automate flows
  test-data/              fictional data for tests (no real data while the repo is public)
  .github/workflows/      GitHub Pages deploy
  Excell/                 real workbooks, local only, git-ignored
  ```
  (If A3 is rejected, replace the `tools/` reference on the `teams/` line with `scripts/` and add `scripts/` with the same description.)
- **E7.** (Your choice.) In "Runtime architecture", replace
  `Its settled experience is kept: three areas (Today, Tasks, Studio), half-hour steps, an explicit confirm action, English only, Agency Artifact branding only.`
  with
  `Its settled experience is kept: three areas (Today, Tasks, Studio), half-hour steps, an explicit confirm action on Today and Tasks only, no strikethrough on completed tasks, percentage rollups as means, hours on an unassigned project flagged for review rather than blocked, English only, Agency Artifact branding only.`

**Auto memory:** no entries exist. Nothing to remove.

## Open questions

- Q1. Approve A0 (tag on `04799bd` despite the dirty tree)?
- Q2. Conflict 2: is the timecard prototype ported in stage 0, or later as E2 says?
- Q3. Conflict 3: restore the public repo rule (E1)?
- Q4. Each of A1 to A10 and E0 to E7.

## Parked

- `README.md` is one line; a short pointer to CLAUDE.md and the commands would help a future maintainer.

## Step 8: verification

Not run yet. Appended here after the approved actions are executed.
