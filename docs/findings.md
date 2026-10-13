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

### 2026-10-13: git push refused with 403 although gh is logged in as AgencyArtifact
- Stage and gate: stage 0, T0 step 7 (push after cleanup).
- Symptom: `git push` returned `remote: Permission to AgencyArtifact/AA-App.git denied to Galileo1986.` and HTTP 403.
- Cause (verified): Git's credential helper on this machine is Git Credential Manager (`credential.helper=manager`), which holds the `Galileo1986` login. The GitHub CLI holds both accounts and `AgencyArtifact` is its active one, but plain `git push` does not ask the CLI.
- Fix: push through the CLI's credentials for that command only: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -u origin main`. No config changed.
- Rule from now on: push to `AgencyArtifact/AA-App` with the command above (or give `Galileo1986` write access to the repo, Galileo's choice). Recorded in `docs/setup/deploy.md`.
