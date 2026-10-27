# Stage 1 handoff 1

2026-10-14, end of session. For the next Claude Code session: read `CLAUDE.md` (2.0), `docs/stages/stage-1-feasibility.md`, `docs/stages/stage-0-closeout.md`, `docs/findings.md`, then this file.

## Gate status

| Task | Status |
|---|---|
| T0 Constitution and cleanup (Blueprint, HALT) | **Done, approved by Galileo 2026-10-14.** Commit `16560fc`, pushed, deployed (GitHub Pages run 38633602557, success, 20:37Z). |
| T1 Setup steps | **Written**, commit `f4a5fc0`, **local only, not pushed** (Galileo to approve the push). Galileo has not run the steps yet. |
| T2 Harvest sign-in module | Not started. Blocked on the Harvest OAuth2 client ID. |
| T3 Diagnostic | Not started. |
| T4 Teams package | Not started. Q10 to resolve as one tab pointing at the diagnostic (brief's recommendation). |
| T5 Test checklist | Not started. |

## What T0 did (approved)

- `CLAUDE.md` 2.0: Harvest + Planner premium, connector allowed from stage 2 only, roles in Harvest terms, principle 10 replaced, principles 4 and 9 kept "to confirm by Galileo".
- Galileo's instruction in session (outranks the brief's "two jobs"): BQE is out. The app is a **custom front end designed by Galileo, running in Teams, with three areas: timecard (Today), Tasks (assigned in Planner) and Studio**, over Harvest and Planner. Written into CLAUDE.md 2.0. Report this as a deviation from the brief.
- `docs/architecture/overview.md` 2.0 (parts and stage 1 test interfaces I1 to I4); `data.md` marked superseded.
- Stage 0 records moved with `git mv` to `docs/archive/stage-0/` (brief, report, checklist, handoffs 1 to 4, T0 cleanup files, `correction-flow.md`, `sharepoint-sites.md`, `m365-admin.md`); index in `docs/archive/README.md`. `stage-0-closeout.md` stays in `docs/stages/` until stage 1 closes.
- Planning pages moved out of git: Harvest page to `docs/planning/`, BQE page to `Research/`. `docs/planning/`, `Research/`, `Claude outputs/` are git-ignored (public repo, they name staff).
- Code removed: `src/graph/sharepoint.ts`, `src/diagnostic/rows*.ts`, `src/log/`, SharePoint steps in `runDiagnostic.ts`, `config.sharepoint`, `Sites.ReadWrite.All` from `config.graphScopes` (now `["User.Read"]`). New `src/graph/me.ts` (`getMe`). Home links to `#/diagnostic`. Diagnostic now reports host, time zone and Graph sign-in only.
- Verified: `npm test` 14/14 pass, `tsc` clean, `npm run build` and `npm run teams:package` succeed.

## What T1 produced

- `docs/setup/harvest.md`: Enterprise 30-day trial, client `Zanthorpe Test`, projects `ZT-01 Test Project` / `ZT-02 Unassigned`, tasks Concept and SD with fictional rates and fee budgets, aa.test invited as Member, OAuth2 app (Redirect URL `https://agencyartifact.github.io/AA-App/harvest-auth.html`, single account, Harvest product only, no secret), role mapping for both Harvest permission frameworks.
- `docs/setup/planner-premium.md`: trial for Galileo only, premium plan `ZT-01 Test Project`, parent `SD`, subtask `AA Stage1 Test Task` assigned to aa.test, early criterion 2 check.
- `docs/setup/entra-app.md` step 4c: remove `Sites.ReadWrite.All`, add `Tasks.ReadWrite` with admin consent (safe now: the deployed build no longer requests Sites).
- `docs/findings.md`: three entries (below).

## Key facts found (sources in the setup pages)

1. **Harvest CORS verified** (preflight from the app origin: 200, `access-control-allow-origin: *`, headers `authorization, harvest-account-id, content-type`). Do not set `User-Agent` from the browser.
2. **Harvest client-side flow:** `https://id.getharvest.com/oauth2/authorize?client_id=...&response_type=token[&state&redirect_uri]`; returns `access_token`, `token_type`, `expires_in`, `scope`, `state`; no refresh token; `redirect_uri` must start with the registered URL. Docs do not say fragment or query: handle both in T2.
3. **Harvest new permissions framework** (help article updated 2026-10-14): Member, Project Manager, People Admin, Accounting, Executive Manager, Administrator. Coordinator test = Project Manager (new) or Manager without "See billable rates and amounts" (old).
4. **Planner premium vs Graph:** Learn says premium plans are not on the Planner API; the Update plannerTask page says Project tasks replicated to Planner accept `percentComplete` updates only. Criterion 1 is likely to fail at least partly; run it as briefed.
5. **Criterion 2:** Microsoft FAQ says basic users can edit premium plans created by licensed users; community reports conflict on marking complete.
6. **Planner trial grants Project Plan 3**, not Plan 1 (deviation to report).
7. **"Other person's time is refused" (criterion 4):** Harvest lists only a Member's own entries rather than refusing. Proposed T3 rule: pass = only own entries returned (or 403). Galileo has not answered yet.
8. Harvest sign-in is testable only on the deployed app (localhost not registered).

## Waiting on Galileo

- Run `docs/setup/harvest.md`, `docs/setup/planner-premium.md`, and `docs/setup/entra-app.md` step 4c; send back what each page's *Send back* section lists.
- **Harvest OAuth2 client ID** (unblocks T2). Also: which permissions framework the account shows; the account ID.
- Approve pushing `f4a5fc0` (and this handoff's commit).
- Answer item 7 above.

## Next steps for Claude Code

1. When the client ID arrives: T2, `src/auth/harvestAuth.ts` + `harvest-auth.html` callback page (Vite entry like `auth.html`), `config.harvest.clientId`, token in memory only. Check Teams docs on whether `id.getharvest.com` must be in `validDomains` for the Teams authentication popup; cite the page.
2. T3 diagnostic lines per brief and `overview.md` I3/I4; add `Tasks.ReadWrite` to `config.graphScopes` only after Galileo confirms consent (step 4c).
3. T4, T5, then the test matrix.

## Repo state

- `main` local: `f4a5fc0` (T1) on top of `16560fc` (T0, pushed), plus this handoff's commit. Push command (findings): `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push origin main`.
- `.claude/settings.local.json` now allows `Edit` and `Bash` (Galileo's request, machine-local). CLAUDE.md still requires asking before deletes and tenant operations.
- SharePoint sites and test lists stay until stage 1 closes (Galileo deletes them).
