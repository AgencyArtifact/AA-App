# Architecture overview

SOP. Version 2.0, 2026-10-14 (stage 1, T0). Changed only through a stage Blueprint, under the golden rule (SOP first, then code).
Status: everything about Harvest and Planner premium here is ASSUMED until the stage 1 report verifies it. Each statement marked "docs" is checked against current vendor documentation in T1, with the source cited in `docs/setup/`.

Replaces 1.0 (four layers on SharePoint Lists). The SharePoint data layer is superseded; its SOP stays as a record in `data.md`.

## Parts

| Part | Holds or does | Talks to | Must never |
|---|---|---|---|
| Harvest | Hours, approvals, invoices, rates, budgets. Enforces the financial boundary through roles | | |
| Planner premium | Project schedules, phases (parent tasks), weekly tasks | | Hold financial data |
| Microsoft 365 | Identity (Entra), Teams host, Graph | | |
| Connector (stage 2+) | Harvest logins per person; reminders | Harvest, Graph, Teams | Store money values; widen anyone's access; exist in stage 1 |
| App (AA Time card) | Custom front end designed by Galileo: timecard (own hours), Tasks (assigned in Planner), Studio | Graph directly (Planner). Harvest directly in stage 1; through the connector from stage 2 (decided in the stage 2 Blueprint) | Store financial data on the device or in logs; compute figures; decide access |
| AI and agents (future) | Summaries, rankings, proposals | Calculated outputs only | Write or alter a figure |

Rules:
- Every call runs as the signed-in person, with that person's own token (Graph: delegated, through nested app authentication; Harvest: that person's OAuth2 token). So no call can return more than the person could see in Harvest or Planner themselves.
- Figures come from Harvest or Planner, or from deterministic code that reads them. No language model in any path that produces a figure.

## What every interface spec contains

An interface is defined in this file, or in an SOP it links, before any code that uses it.

- Name, provider and caller.
- Shape: TypeScript types for every input and output; the vendor's fields and types.
- Units and time zone of every field.
- Access: which roles can use it, and how the provider enforces that.
- Freshness: how the caller knows how current the result is.
- Errors: every failure the caller must handle, and how it becomes visible to the user.
- Version, and what changed from the previous version.

## Interfaces in stage 1 (test only)

These exist to answer the stage 1 go criteria. They are not the production interfaces; those are defined in the stage that builds the team screens.

### I1. Graph sign-in (kept from stage 0)
- `src/auth/graphAuth.ts`. Nested app authentication in Teams, silent first, popup fallback; MSAL popup with `auth.html` in a browser.
- Scopes: `User.Read` now; `Tasks.ReadWrite` granted in Entra in T1 (`docs/setup/entra-app.md` step 4c) and requested by the app from T3. `Sites.ReadWrite.All` removed from the app in T0 and from Entra in T1.

### I2. Harvest sign-in (T2)
- `src/auth/harvestAuth.ts`. Harvest's client-side OAuth2 flow (`response_type=token`), opened through the Teams authentication popup inside Teams and a normal popup in a browser; callback page alongside `auth.html`. Exact endpoints and parameters: T1, from Harvest docs.
- Output: `{ accessToken: string; accountId: string; expiresAt: number }`, held in a module variable only. Never in local or session storage, IndexedDB, the URL after the callback closes, or logs.
- Errors: user closes the popup; Harvest returns an error parameter; token expired (sign in again). Each shown on the diagnostic line with Harvest's message.
- Detail (T2, 2026-10-14): one page, `harvest-auth.html` (`harvestAuthUrl` in `src/config.ts`, equal to the Redirect URL registered in Harvest), is both the popup's start page (`?start=1&state=...`, redirects to `https://id.getharvest.com/oauth2/authorize`) and the callback. It reads the response from both query and fragment. `state` is `teams.<uuid>` or `browser.<uuid>`, so the callback knows whether to answer with `notifySuccess`/`notifyFailure` (Teams) or `postMessage` to the app's origin (browser); the app refuses a mismatched state. The token travels in that answer, never through storage, and is removed from the address bar first. `accountId` is the first `harvest:<id>` in `scope`; a scope without one (`harvest:all`, `all`) is reported as an error, not resolved through `id.getharvest.com` (not proved). `validDomains` unchanged: Teams requires the start page on the app's domain, not the provider's domain ([Configure OAuth authentication for tab](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/how-to/authentication/auth-tab-aad), updated 2026-08-03).

### I3. Harvest API v2 calls (T3, diagnostic)
- Base `https://api.harvestapp.com/v2/`, headers `Authorization: Bearer <token>` and `Harvest-Account-Id`. Browser calls assume Harvest allows cross-origin requests for client-side apps: proved at Link before anything else is built on it.
- Calls: current user and role; my project assignments; create a time entry (0.5 h, `ZT-01`, task `SD`, today); delete it; create on `ZT-02` (expect refusal); read another person's time (expect refusal).
- Units: hours as decimal hours; `spent_date` as a calendar date (`YYYY-MM-DD`) in the person's local day, from `src/dates.ts`.
- Boundary check: the diagnostic lists each money field (rates, budgets, costs, amounts) as present or absent in every response. It never prints or keeps a money value.
- Detail (T3, 2026-10-14): `src/harvest/harvest.ts` (caller), `src/harvest/money.ts` (check), `src/diagnostic/harvestSteps.ts` (lines). Calls: `GET /users/me` (user ID, `access_roles`); `GET /users/me/project_assignments`; `POST /time_entries` {project_id, task_id, spent_date, hours 0.5, notes} on `ZT-01` / `SD`, then `DELETE /time_entries/{id}`; the same POST on `ZT-02`, deleted at once if accepted; `GET /time_entries?user_id=<other>`. Money check: any key matching rate, budget, cost, amount, fee, price or revenue, at any depth, reported as `VALUE` (number or numeric string), `null`, or absent; flags and text are not money. Outcomes: refusal lines report a 4xx as DENIED (expected) and an accepted call as ERROR; "other person's time" is PASS on a 200 with no entries by anyone else (proposed rule, waiting on Galileo). Test projects are matched by code, or by a name starting with the code; the assignments line lists project names, codes and task names (no money). The Harvest lines run only from the **Connect Harvest and run** button (the popup needs a click); the Harvest popup opens before the Graph calls. `ZT-02` project ID and the other person's user ID are in `config.harvest.test`: a Member cannot look them up, so the Administrator run prints them.

### I4. Graph Planner calls (T3, diagnostic)
- `GET /me/planner/tasks`; `PATCH /planner/tasks/{id}` with `percentComplete` 100, then 0, each with `If-Match` set to the task's current `@odata.etag`; read again after each.
- Reports: count; test task found or not; plan, bucket, parent present or not; percent complete.
- Assumed: tasks in a premium plan are visible to Graph's basic Planner endpoints. Criterion 1 tests this.

## Open questions (for later Blueprints)

- Whether the app calls Harvest directly or only through the connector once the connector exists (stage 2).
- Where weekly summaries and any derived figures are computed (connector or app), and from which Harvest reports.
- How tasks link to scope-of-work deliverables, if principle 9 is confirmed.
