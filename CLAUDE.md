# CLAUDE.md: AA Time card app, repo AA-App

Version 4.0, 2026-10-26. Public repository guard. Replaces 2.0 (`archive/CLAUDE-v2.0.md`); a 3.0 draft of the same day was never committed and is kept as a record in the private repo.

## What this repo is

The AA Time card app: one screen in Teams where a person sees their Planner tasks, logs hours in half-hour steps on a task, confirms the day, and marks a task complete or reopens it. React, TypeScript, Vite, hosted on GitHub Pages, Microsoft sign-in through nested app authentication, no server.

Everything else about the system lives in the private repo AgencyArtifact/AA-Ops: the constitution, the frozen decisions, the stage briefs and Blueprints, the SOPs, the scripts, the setup steps and the secrets. That repo's `CLAUDE.md` is the authority for this one. A session that starts here without AA-Ops added stops and asks for it.

## Public repo rules

- Never commit real project codes or names, clients, fees, rates, staff names or emails, hour totals, tokens or secrets. Test fixtures included: use invented values such as `0000 Sample` and `person@example.com`.
- No calculation logic and no totals here. They live in AA-Ops.
- Real workbooks stay in the git-ignored `Excell/`; local planning notes in the git-ignored `docs/planning/`.
- Entra client and tenant IDs, the Teams app ID, and SharePoint site and list IDs in `src/config.ts` are configuration, not secrets. Data values are never configuration.

## Invariants of the app

From the AA-Ops constitution; repeated here because every change in `src/` must keep them.

- The app never calls Harvest, never signs anyone in to Harvest, and never reads, stores or shows money.
- Hours come only from the signed-in person, entered in the app. The app acts only as that person (delegated Graph). Access is decided by Microsoft 365 permissions, never only in the interface.
- People are matched by Microsoft 365 email, never by name. Projects by Planner plan ID through the register. Phases by exact bucket name.
- The app never creates or assigns tasks, never shows or edits tasks whose title starts with `Milestone:`, never approves hours, never sets up projects, never produces reports.
- One screen, half-hour steps, confirm the day, no strikethrough on completed tasks, English only, Agency Artifact branding only.
- Standard Microsoft 365 only: no server, no Dataverse, no premium connectors. Say why before adding any runtime dependency.
- Numbers come from code, never from a language model.
- Nothing is stored on the device beyond the sign-in library's session cache.

## Working here

- BLAST applies (AA-Ops `docs/BLAST.md`): SOP first, then code. No code before the current slice's Blueprint is approved in AA-Ops.
- Ask before deleting files, changing files outside the slice, or writing to SharePoint or Planner beyond the Link tests Galileo approved.
- When something fails: read the real error, fix, retest, add an entry to `docs/findings.md`.
- No em dashes in docs, code comments or UI copy. English only. Complete files, never snippets.
- Commands: `npm run dev`, `npm test`, `npm run build`, `npm run teams:package`, `npm run entra:values`.
- Push with `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -u origin main` (`docs/findings.md`, 2026-10-13). Every push to `main` runs `.github/workflows/deploy-pages.yml`: test, build, publish.

## File map

```
CLAUDE.md            this file
docs/findings.md     learnings from building the app, cumulative
docs/setup/          setup steps that concern only this app (Entra registration, hosting)
src/                 the app
tools/               dev-time scripts (Teams package, Entra values)
teams/, public/      Teams icons, static pages
archive/             earlier designs and stages (records, not instructions)
```
