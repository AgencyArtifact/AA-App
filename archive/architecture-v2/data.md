# Data layer

> **Superseded 2026-10-14** (`docs/stages/stage-0-closeout.md`). The SharePoint data layer is not used. Kept as a record. Current architecture: `overview.md` 2.0.

SOP. Version 1.2, 2026-10-13 (stage 0, decision on hours access). Changes are listed at the end.
Status: everything in this file is ASSUMED until the stage 0 report verifies it. Each statement is marked "docs" when current Microsoft documentation states it (source in `docs/setup/`), otherwise it is assumed. Update to "verified" with a reference to the report as evidence arrives.

## Principle

Two kinds of rule, enforced in two ways (CLAUDE.md 1.2, *Roles and the financial boundary*):

1. **The financial boundary is a lock.** Access is decided by SharePoint permissions, applied to the signed-in user's own delegated token. The app never decides it. Because the app can only do what the user can already do in SharePoint, the boundary holds even if the app has a bug.
   Docs: a delegated Graph token "can't access anything the signed-in user couldn't access" (Graph permissions overview).
2. **Who edits whose hours is a record, not a lock** (Galileo's decision, 2026-10-13). Everyone on `AA Operations` can technically edit any hours row. The app offers each role only its own edits (team: own rows; coordinators and principals: any row). Version history records every change with the person who made it, and only principals can delete versions.

## Sites

| Site | Holds | Members | Teams connection |
|---|---|---|---|
| `AA Principals` (`/sites/AAPrincipals`) | All financial data, and anything calculated from it | Galileo, Chris | None. Team site with no Microsoft 365 group, never connected to a Teams team, because team membership would then control site membership. |
| `AA Operations` (`/sites/AAOperations`) | Operational data: register (operational fields), hours, tasks, deliverables | All staff | Open question. Stage 0 uses a team site with no Microsoft 365 group (see below). |

Rules:
- Financial data, and anything calculated from it, lives only on `AA Principals`.
- `AA Principals` has no grants to Everyone, Everyone except external users, or any group beyond the principals.
- Hours are operational and live on `AA Operations`. Hours converted into money live only on `AA Principals`.
- Both sites use the Pacific time zone in their regional settings. Assumed: this setting decides how date-only values are stored (see Dates).

Why no Microsoft 365 group on `AA Operations` either (docs): on group-connected team sites the permissions of the default groups cannot be modified, the Members group has the Edit level, and on Public sites "Everyone except external users" is added to Members automatically. The permission design below needs a custom level, not Edit.

## Permission levels on AA Operations

| Role | Level | Effect on hour lists (SharePoint) | What the app offers |
|---|---|---|---|
| Principals | Full Control (site Owners group) | Everything, including deleting versions and changing list settings | Edit and delete any row |
| Coordinators | Custom level `AA Team` | Create, edit, delete any row; view versions; cannot delete versions or change list settings | Edit and delete any row |
| Team | Custom level `AA Team` | Same as coordinators | Create rows; edit and delete own rows only |

`AA Team` = Contribute **without Delete Versions**. Granted directly or through a custom group, never through the default Members group.
- Docs ([Understanding permission levels](https://learn.microsoft.com/en-us/sharepoint/understanding-permission-levels), updated 2026-07-01): Contribute includes Add, Edit, Delete Items, View Versions and **Delete Versions**; it does not include Manage Lists. Edit (the default Members level) includes Manage Lists and Delete Versions.
- Why: version history is the control on hours. With Delete Versions a team member could erase the record of a change; with Manage Lists they could switch versioning off. `AA Team` has neither.
- Coordinators and team share one level on purpose: SharePoint cannot tell them apart for hours through the app (below). The coordinator role, as the app uses it, is decided in the Blueprint of the stage that builds hours (open question).

Why no "own items only" lock on hour lists (verified 2026-10-13, stage 0 report, findings):
- The list setting "Create and edit access: create items and edit items that were created by the user" is checked against the **app's** permission (the token's scope), not the user's level. With `Sites.ReadWrite.All` (Graph) or `AllSites.Write` (SharePoint REST) everyone is refused, Owners included. With `Sites.Manage.All` or `AllSites.Manage` everyone gets through, team members included. Only the SharePoint web interface honours the user's Override List Behaviors (Cancel Checkout).
- No delegated scope gives "coordinators yes, team no". Workarounds (a correction flow on an owner's connection, per-row permissions, a second app registration) were weighed and rejected as heavier than ten people need (Galileo, 2026-10-13). The correction-flow probe passed and is kept as a record in `docs/setup/correction-flow.md`.
- Rule: the app uses Microsoft Graph with `Sites.ReadWrite.All` only. Never grant it a manage-level or full-control scope.

Audit:
- Version history is on for every list holding hours: each edit shows who changed what and when. Checked in each list's Versioning settings. Docs do not state a default for lists. Observed 2026-10-13 (stage 0 report): a new blank list in this tenant had versioning on, 50 versions. Each new list is still checked, not assumed.
- Deletes: a deleted row goes to the site recycle bin with "Deleted by". Assumed from SharePoint's standard behaviour, not checked in docs for this stage: the user can empty it from their own view, then it stays in the second-stage bin, visible to site collection admins, until 93 days after the delete. So the record of a delete is shorter-lived than the record of an edit. Open question for the hours stage: soft delete (the app marks a row deleted instead of removing it), or remove Delete Items from `AA Team` too.
- Edits made in the SharePoint web interface are recorded the same way as edits through the app.

## App registration

Single-tenant Entra app, SPA platform, delegated Graph permissions `User.Read` and `Sites.ReadWrite.All`, admin consent, no client secret. Exact steps in `docs/setup/entra-app.md`.
Docs: `Sites.ReadWrite.All` is the least-privileged delegated permission for creating, updating and deleting list items. A narrower delegated `Sites.Selected` exists but needs an explicit per-site grant; parked.

## Dates and time zones

Open. The team works in Los Angeles and India.
Assumed: SharePoint date-only columns are stored as a UTC instant derived from the site's regional time zone, so a "today" written from India can read as a different date elsewhere. Docs are silent on storage and on how to write a date-only value through Graph.
Verified for a Pacific device (stage 0 report, C1): writing `2026-10-13` returns `2026-10-13T07:00:00Z` (midnight Pacific in UTC). India side still to test.
Stage 0 compares a date column with a `YYYY-MM-DD` text column. No real list gets a date column until the result is in.

## Lists

Stage 0 test lists only. Real lists are defined in the Blueprint gate of the stage that introduces the project register. Column names are internal names: created exactly as written, never renamed. Setup: `docs/setup/sharepoint-sites.md`.

### TestHours (AA Operations)

| Column | SharePoint type | Graph field and value written | Notes |
|---|---|---|---|
| `Title` | Single line of text (default, required) | `Title`: string | Short label written by the app |
| `Person` | Person, single | `PersonLookupId`: string, the user's id in the site's User Information List | Assumed convention (Microsoft Q&A only). The app looks the id up by UPN; if not found the field is left empty |
| `Date` | Date and time, date only | `Date`: `YYYY-MM-DD`, device-local date | Raw value returned by Graph is recorded by the diagnostic |
| `WorkDate` | Single line of text | `WorkDate`: `YYYY-MM-DD`, device-local date | Same date as `Date`, as plain text |
| `Hours` | Number, 1 decimal | `Hours`: number, multiples of 0.5 | Unit: hours |

Settings: Read access "Read all items"; Create and Edit access "Create and edit all items"; versioning on.
Access: everyone at `AA Team` or above creates, edits and deletes any row in SharePoint. The stage 0 diagnostic does not limit itself by role (it is a test tool); real screens offer team members their own rows only.

### TestCorrections (dropped)

Designed for coordinator corrections by flow, never built. Dropped with the decision of 2026-10-13: coordinators edit hours directly. Design kept in `docs/setup/correction-flow.md` as a record.

### TestFees (AA Principals)

| Column | SharePoint type | Notes |
|---|---|---|
| `Title` | Single line of text (default) | |
| `Project` | Single line of text | One row holds a distinctive made-up word, used for the Microsoft Search check |
| `Fee` | Number | Financial. The app reads the item count only, never field values |

Access: principals only, by site membership.

## Open questions

- Can team members read other people's hours, or only their own? Stage 0 uses "Read all items". The direction brief says hours are operational and visible, but not to whom.
- Is `AA Operations` connected to a Teams team? Stage 0 says no; connecting it would give team members Edit through the group, which this SOP forbids.
- Hours stage: soft delete or no Delete Items for `AA Team` (see Audit); where the app reads who is a coordinator (a SharePoint group is the likely answer, so the list of coordinators is kept in one place).

## Changes from 1.1

- Hours: the "own items only" lock is dropped; version history is the control (Galileo's decision, 2026-10-13; CLAUDE.md 1.2). Reason: the lock is checked against the app's scope (verified), so no app permission separates coordinators from team.
- New custom level `AA Team` (Contribute without Delete Versions) for team and coordinators. Replaces Contribute for team and the `Coordinator` level. Reason: docs, Contribute includes Delete Versions.
- `TestCorrections`, `AA Coordinators` group and the correction flow: dropped before being built.
- Verified Pacific date-only write recorded under Dates.

## Changes from 1.0 to 1.1

- Sites: both are team sites with no Microsoft 365 group, Pacific time zone, URLs fixed. Reason: docs on group-connected sites (default groups not editable, Members at Edit, Everyone except external users on Public sites).
- Team level: "never the default Members group (Edit)". Reason: docs, Edit includes Manage Lists.
- Override List Behaviors: documentation status recorded (Server page only; SharePoint Online page calls it Override Check-Out).
- Version history: set explicitly, default not relied on. Reason: docs state no default for lists.
- Lists: column schemas of `TestHours` and `TestFees` written out.
