# Data layer

SOP. Version 1.0, 2026-10-13.
Status: everything in this file is ASSUMED until the stage 0 report verifies it. Update each section to "verified" with a reference to the report as evidence arrives.

## Principle

The financial boundary lives here. Access is decided by SharePoint permissions, applied to the signed-in user's own delegated token. The app never decides access. Because the app can only do what the user can already do in SharePoint, the boundary holds even if the app has a bug.

## Sites

| Site | Holds | Members | Teams connection |
|---|---|---|---|
| `AA Principals` | All financial data, and anything calculated from it | Galileo, Chris | None. Standalone, never connected to a Teams team, because team membership would then control site membership. |
| `AA Operations` | Operational data: register (operational fields), hours, tasks, deliverables | All staff | Open question |

Rules:
- Financial data, and anything calculated from it, lives only on `AA Principals`.
- `AA Principals` has no grants to Everyone, Everyone except external users, or any group beyond the principals.
- Hours are operational and live on `AA Operations`. Hours converted into money live only on `AA Principals`.

## Permission levels on AA Operations

| Role | Level | Effect on hour lists |
|---|---|---|
| Principals | Full Control (site owners) | Everything |
| Coordinators | Custom level "Coordinator": Contribute plus Override List Behaviors | Edit and delete any row |
| Team | Contribute | Create rows; edit and delete only rows they created |

Hour lists use the list setting "Create and edit access: create items and edit items that were created by the user". Users whose level includes Override List Behaviors bypass it.
Assumed: the bypass applies to Graph writes the same way it applies in the SharePoint interface. Tested in stage 0.

Audit: version history is on for every list holding hours, so every correction shows who changed what.
Assumed: version history is on by default for new lists. Checked in stage 0.

## App registration

Single-tenant Entra app, SPA platform, delegated Graph permissions `User.Read` and `Sites.ReadWrite.All`, admin consent, no client secret. Exact steps in `docs/setup/entra-app.md` (written in stage 0).

## Dates and time zones

Open. The team works in Los Angeles and India.
Assumed: SharePoint date-only columns are stored as a UTC instant derived from the site's regional time zone, so a "today" written from India can read as a different date elsewhere.
Stage 0 compares a date column with a `YYYY-MM-DD` text column. No real list gets a date column until the result is in.

## Lists

Stage 0 test lists only: `TestHours` (Operations), `TestFees` (Principals). Real lists are defined in the Blueprint gate of the stage that introduces the project register.

## Open questions

- Can team members read other people's hours, or only their own? The direction brief says hours are operational and visible, but not to whom.
- Is `AA Operations` connected to a Teams team?
