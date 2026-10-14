# Harvest trial, test data and OAuth2 application (stage 1, task T1)

Performed by Galileo. About 30 minutes. Everything here is fictional: the repo is public.
Result: a Harvest trial account with one test client, two test projects, aa.test as Member, and an OAuth2 application whose client ID goes into `src/config.ts`.

In the steps, `<acct>` is the subdomain Harvest gives the account (you choose it at sign-up), so the account lives at `https://<acct>.harvestapp.com`. If a page address below differs from what your browser shows, use the named menu and write the real address into this file.

## 0. Before you start

- Which permissions framework the account has decides the role names (see *Roles*). Check it at step 2 and write it in *Send back*.
- aa.test needs its mailbox to accept the invitation. Open <https://outlook.office.com> as aa.test in a private window when step 4 asks.

## 1. Start the trial (Enterprise)

Page: <https://www.getharvest.com/pricing>.
1. Choose **Enterprise**, then start the **30-day free trial** (no credit card).
   Enterprise is the plan with **Timesheet approvals** and the **Activity log**; the planning page needs both. During the trial most premium features are on, except SAML single sign-on, which this stage does not use.
2. Sign up with your Agency Artifact work address. Account name: `Agency Artifact Test`.

## 2. Account preferences

Page: Settings > Preferences (`https://<acct>.harvestapp.com/company/preferences`, check the address).
1. **Timer mode: Duration.** The diagnostic writes 0.5 h as a duration; Harvest's "create via duration" call needs this mode.
2. **Time display: Decimal.**
3. Save.

Then open your own profile, **Permissions** tab, and note which roles you see:
- **New framework:** Member, Project Manager, People Admin, Accounting, Executive Manager, Administrator.
- **Old framework:** Member, Manager, Administrator.

## 3. Client, tasks, projects

Client. Page: Manage > Clients (`https://<acct>.harvestapp.com/clients`). **+ New client**: `Zanthorpe Test`. Save.

Tasks. Page: Manage > Tasks (`https://<acct>.harvestapp.com/tasks`). **+ New task** twice: `Concept`, `SD`. Billable, default rate `150`. Do **not** tick "add to all future projects".

Projects. Page: Projects > **+ New project** (`https://<acct>.harvestapp.com/projects/new`). Create both:

| Field | `ZT-01 Test Project` | `ZT-02 Unassigned` |
|---|---|---|
| Client | Zanthorpe Test | Zanthorpe Test |
| Project code | ZT-01 | ZT-02 |
| Type | Time & Materials | Time & Materials |
| Billable rates | Task billable rate (Concept 150, SD 150) | Task billable rate (Concept 150, SD 150) |
| Budget | Fees per task: Concept 4000, SD 6000 | Fees per task: Concept 4000, SD 6000 |
| Tasks | Concept, SD | Concept, SD |
| Team | Galileo, aa.test (after step 4) | Galileo only |

The rates and budgets exist only so there is money data to hide. Figures are fictional.

## 4. Invite aa.test

Page: Team (`https://<acct>.harvestapp.com/team`) > **+ Invite person**.
1. Name `AA Test`, email: aa.test's work address.
2. Role: **Member** (both frameworks).
3. Cost rate `60`, default billable rate `150` (fictional; gives cost fields to look for).
4. Projects: assign **ZT-01 Test Project** only.
5. Save and send the invitation. As aa.test, open the invitation mail in <https://outlook.office.com>, accept, and set a Harvest password.
6. Back on `ZT-01` (Projects > ZT-01 > Edit), confirm aa.test is on the team. On `ZT-02`, confirm aa.test is **not**.

Also give yourself a cost rate (`80`) on your own profile, so the Administrator control run has cost fields.

## 5. The OAuth2 application

Page: <https://id.getharvest.com/developers> (Harvest ID, signed in as you) > **Create new OAuth2 application**.

| Field | Value | Why |
|---|---|---|
| Name | `Agency Artifact Time card (test)` | Shown to people when they connect |
| Redirect URL | `https://agencyartifact.github.io/AA-App/harvest-auth.html` | The callback page T2 adds. Harvest accepts a `redirect_uri` only if it starts with this URL. Localhost is not registered: Harvest sign-in is tested on the deployed app only |
| Multi Account | **No** | One account |
| Products | **Harvest** only (not Forecast) | Least access |

Save. Copy the **Client ID** into `src/config.ts` (Claude Code adds a `harvest.clientId` field in T2; until then send it back). **Do not copy or create a client secret**: the client-side flow does not use one, and stage 1 has no server to hold it.

## Roles for the test matrix (later, in T5)

| Run | Old framework | New framework |
|---|---|---|
| aa.test as Member | Member | Member |
| aa.test as Manager, without rates | Manager, with **"See billable rates and amounts"** unticked | **Project Manager** (cannot see or edit rates by definition) |
| Galileo, control run | Administrator | Administrator |

Docs: Managers can never see cost rates and amounts (old framework); Project Managers cannot see or edit rates (new framework). Criterion 4 checks this by field presence.

## Send back to Claude Code

- The account ID (in the Harvest address bar on some pages, or ask in T3: the diagnostic prints it after connecting).
- The OAuth2 **Client ID**.
- Which permissions framework the account shows (new or old).
- Anything that differed from these steps.

## Sources (checked 2026-10-14)

| Value | Source |
|---|---|
| Plans: Free, Teams, Enterprise, Enterprise Plus; 30-day trial, no card; Enterprise has Timesheet approvals and Activity log; trial includes premium features except SAML | [Harvest pricing](https://www.getharvest.com/pricing) |
| OAuth2 app fields (Name, Redirect URL, Multi Account, Products); client-side flow `https://id.getharvest.com/oauth2/authorize?client_id=...&response_type=token`; `redirect_uri` must start with the registered URL; returns `access_token`, `token_type`, `expires_in`, `scope`, `state`; no refresh token; headers `Authorization: Bearer`, `Harvest-Account-Id`, `User-Agent`; implicit flow is for apps that "run entirely on the browser and issue Cross-Origin requests" | [Harvest API v2: Authentication](https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/) (no date shown) |
| Cross-origin calls allowed from the app's origin | **Verified** 2026-10-14: preflight `OPTIONS https://api.harvestapp.com/v2/users/me` from `Origin: https://agencyartifact.github.io` returned 200 with `access-control-allow-origin: *`, methods `GET, POST, PATCH, PUT, DELETE`, headers `authorization, harvest-account-id, content-type` |
| Create via duration needs `project_id`, `task_id`, `spent_date`; `hours` decimal; only when the account tracks duration; delete returns 200; Members list only their own time; money fields `billable_rate`, `cost_rate`, `user_assignment.hourly_rate/budget`, `task_assignment.hourly_rate/budget` | [Harvest API v2: Time entries](https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/) |
| New framework: six built-in roles; Member logs own time on assigned projects, sees no financial information; Project Manager cannot see or edit rates; rolling out, may not apply to every account | [Permissions](https://support.getharvest.com/hc/en-us/articles/44171549176077-Permissions) (updated 2026-10-14) |
| Old framework: Managers can never see cost rates and amounts or other people's time outside their projects and people | [What can people with Manager permissions never access](https://support.getharvest.com/hc/en-us/articles/30704133376269) (updated 2025-10-08) |
| Fee budgets per task need billable rates; Time & Materials projects | [How to set project budgets](https://support.getharvest.com/hc/en-us/articles/360048686811-How-to-set-project-budgets) (updated 2026-10-14) |
| Invite person, Timer mode, Time display | [Quick start guide](https://support.getharvest.com/hc/en-us/articles/4411239395341-Quick-start-guide) (updated 2026-10-05) |
