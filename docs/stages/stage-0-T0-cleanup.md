# Stage 0, T0: Repo cleanup to CLAUDE.md 1.0

Version 1, 2026-10-13. Expects CLAUDE.md version 1.1.
Runs before the rest of stage 0. Run it in a new Claude Code session started at the repo root, not in a session that predates CLAUDE.md 1.0.

## Goal

The repo matches the file map in CLAUDE.md, and nothing the agent loads or reads as instruction contradicts CLAUDE.md. Behaviour of the app does not change.

## Rules for this task

- Read and report first. Change nothing until Galileo approves the cleanup report (HALT).
- Git history is the archive. Deletions are done with `git rm` after approval, never outside git.
- Never edit `~/.claude/CLAUDE.md`. It is Galileo's personal file for all his projects. Report conflicts only.
- No refactoring, no dependency changes, no renaming inside `src/`. Code that conflicts with CLAUDE.md is listed for a later stage, not fixed now.

## Steps

**1. Safety point.**
Confirm the working tree is clean. Tag the current commit `pre-constitution-1.0`. If the tree is not clean, stop and ask.

**2. Instruction sources (read only).**
List everything Claude Code loads or follows as instruction, with its path and a one-line summary:
- every `CLAUDE.md`, `CLAUDE.local.md` and `.claude/CLAUDE.md` in the repo, in its subfolders, and in parent folders above the repo root;
- the contents of `.claude/` (settings, commands, agents, rules);
- `~/.claude/CLAUDE.md` (report only);
- the auto memory for this project, if any.

For each one, mark anything that contradicts CLAUDE.md 1.0 and name the CLAUDE.md section it contradicts.

**3. File inventory.**
Classify every top-level item, and every file under any docs or notes folder, as one of:
- KEEP: matches the file map.
- MOVE: right content, wrong place. Give the target path.
- CONFLICT: contradicts CLAUDE.md. Name the section. Typical cases: a FastAPI, SQLite, VPS or other server backend; the name "Checkplot"; separate timecard and admin apps; Atelier Galileo; agent rosters; Excel as the live store; email reading; hours inferred from calendar or files.
- OBSOLETE: no longer used.
- UNKNOWN: cannot tell. Galileo decides.

Code in `src/` is classified at file level only. List code that conflicts with CLAUDE.md (for example calls to a backend API, or local storage as the system of record) under "for a later stage".

**4. Previous CLAUDE.md.**
Compare the CLAUDE.md at tag `pre-constitution-1.0` with CLAUDE.md 1.0. For every item in the old file that 1.0 does not hold (repo conventions, build and deploy commands, hosting details, prototype structure), propose one destination: a line in CLAUDE.md "Current state" or "Writing rules", an SOP, or drop.

**5. Facts about the app.**
Record, from the code and config, not from memory: language and framework, build command, dev command, deploy method to GitHub Pages, hosted URL.

**6. Cleanup report (HALT).**
Write `docs/stages/stage-0-T0-cleanup-report.md` with the results of steps 2 to 5 as tables, plus the exact list of proposed actions: each `git mv`, each `git rm`, each change to CLAUDE.md written as an exact edit, and each auto memory entry proposed for removal. Stop and wait for Galileo's approval, item by item if he wants.

**7. Execute approved actions only.**
Apply them in one commit, message `cleanup to CLAUDE.md 1.0`. Changes to CLAUDE.md raise its version to 1.1 and update the expected version in the stage 0 brief. Auto memory entries are removed only as approved.

**8. Verify.**
- Run the build. Load the app with the dev command and at the hosted URL. Report the result as verified or not, with the output.
- Compare the tree with the file map in CLAUDE.md. List any remaining difference with its reason.
- Confirm the root `CLAUDE.md` is the only project CLAUDE.md, or list the others with the reason each one stays.

Append the step 8 results to the cleanup report. Then continue with T1 of the stage 0 brief.
