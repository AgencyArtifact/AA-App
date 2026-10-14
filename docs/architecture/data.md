# Data layer

SOP. Version 1.1, 2026-10-13 (stage 0 Blueprint, T1). Changes from 1.0 are listed at the end.
Status: everything in this file is ASSUMED until the stage 0 report verifies it. Each statement is marked "docs" when current Microsoft documentation states it (source in `docs/setup/`), otherwise it is assumed. Update to "verified" with a reference to the report as evidence arrives.

## Principle

The financial boundary lives here. Access is decided by SharePoint permissions, applied to the signed-in user's own delegated token. The app never decides access. Because the app can only do what the user can already do in SharePoint, the boundary holds even if the app has a bug.
Docs: a delegated Graph token "can't access anything the signed-in user couldn't access" (Graph permissions overview).

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

Why no Microsoft 365 group on `AA Operations` either (docs): on group-connected team sites the permissions of the default groups cannot be modified, the Members group has the Edit level, and on Public sites "Everyone except external users" is added to Members automatically. The permission design below needs team members at Contribute, not Edit.

## Permission levels on AA Operations

| Role | Level | Effect on hour lists |
|---|---|---|
| Principals | Full Control (site Owners group) | Everything |
| Coordinators | Custom level "Coordinator": Contribute plus Override List Behaviors | Edit and delete any row |
| Team | Contribute, granted directly or through a custom group, never the default Members group | Create rows; edit and delete only rows they created |

Team members must never hold Edit (the default Members level). Docs: Edit includes Manage Lists, Contribute does not. With Manage Lists a team member could change list settings, including the own-items rule below.

Hour lists use the list setting "Create and edit access: create items and edit items that were created by the user". Users whose level includes Override List Behaviors bypass it.
- Docs (SharePoint Server page only): Override List Behaviors lets a user "change or override settings which allow users to read/edit only their own items"; it is in Full Control and Design, not in Edit or Contribute. The SharePoint in Microsoft 365 page names the same permission "Override Check-Out" and does not mention the own-items bypass.
- Observed on screen 2026-10-13 (TestHours, Advanced settings, Item-level Permissions): "Note: Users with the Cancel Checkout permission can read and edit all items." Cancel Checkout is the permission the docs call Override Check-Out (SharePoint in Microsoft 365) and Override List Behaviors (Server). This ties the bypass to the permission the Coordinator level adds, in the SharePoint interface.
- Not in docs: the item-level setting itself, whether it also blocks deleting other users' rows, and whether the bypass applies to Graph writes the same way as in the SharePoint interface. Tested in stage 0 (criterion 6).
- **Verified 2026-10-13 (stage 0 report, findings):** the setting blocks both editing and deleting other users' rows, through Graph and in the interface, for Contribute. The bypass works **only in the SharePoint interface**: through Graph an Owner (Full Control) is refused with 403, and gets 200/204 once the setting is off. So coordinator corrections cannot go through Graph with this design. How coordinators correct hours is **open** (Galileo's decision, options in the stage 0 report). The Coordinator row in the table above holds for the interface only until then.
- **Verified 2026-10-13, REST and manage-scope tests (stage 0 report, findings):** the own-items setting is checked against the **app's** permission level (the token's scopes), not the user's. With `Sites.ReadWrite.All` (Graph) or `AllSites.Write` (SharePoint REST) everyone is refused, Owners included. With `Sites.Manage.All` or `AllSites.Manage` everyone gets through, **team members included**. No delegated scope gives "coordinators yes, team no". Rules from now on:
  - The app uses Microsoft Graph with `Sites.ReadWrite.All` only. Never grant the app a manage-level or full-control scope while the own-items setting protects hours.
  - Coordinator corrections go through a Power Automate flow (Galileo's decision, 2026-10-13). Assumed until the stage 0 probe passes (`docs/setup/correction-flow.md`): the SharePoint connector, running with an owner's connection, can edit and delete other users' rows with the own-items setting on. Version history then shows the connection's account; the coordinator is recorded on the correction request. Request list, coordinator check and flow are designed after the probe.
Audit: version history is on for every list holding hours, so every correction shows who changed what. It is checked in each list's Versioning settings. Docs do not state a default for lists. Observed 2026-10-13 (stage 0 report): a new blank list in this tenant had versioning on, 50 versions. Each new list is still checked, not assumed.

## App registration

Single-tenant Entra app, SPA platform, delegated Graph permissions `User.Read` and `Sites.ReadWrite.All`, admin consent, no client secret. Exact steps in `docs/setup/entra-app.md`.
Docs: `Sites.ReadWrite.All` is the least-privileged delegated permission for creating, updating and deleting list items. A narrower delegated `Sites.Selected` exists but needs an explicit per-site grant; parked.

## Dates and time zones

Open. The team works in Los Angeles and India.
Assumed: SharePoint date-only columns are stored as a UTC instant derived from the site's regional time zone, so a "today" written from India can read as a different date elsewhere. Docs are silent on storage and on how to write a date-only value through Graph.
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

Settings: Read access "Read all items"; Create and Edit access "Create items and edit items that were created by the user"; versioning on.
Access: team (Contribute) creates rows and edits or deletes its own; coordinators and principals edit or delete any.

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

## Changes from 1.0

- Sites: both are team sites with no Microsoft 365 group, Pacific time zone, URLs fixed. Reason: docs on group-connected sites (default groups not editable, Members at Edit, Everyone except external users on Public sites).
- Team level: "never the default Members group (Edit)". Reason: docs, Edit includes Manage Lists.
- Override List Behaviors: documentation status recorded (Server page only; SharePoint Online page calls it Override Check-Out).
- Version history: set explicitly, default not relied on. Reason: docs state no default for lists.
- Lists: column schemas of `TestHours` and `TestFees` written out.
