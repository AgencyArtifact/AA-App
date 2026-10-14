# SharePoint sites and test lists (stage 0, task T1)

Performed by Galileo, signed in as Global Admin. About 30 minutes.
Result: two sites, two test lists and one custom permission level, set up
exactly as `docs/architecture/data.md` expects. Every step ends with a check.

Names used by the app (`src/config.ts`): sites `/sites/AAOperations` and
`/sites/AAPrincipals`, lists `TestHours` and `TestFees`. If SharePoint gives a
different URL (for example `/sites/AAOperations2` because the name is taken),
tell Claude Code; the config must match.

Column names: type them exactly as written, and never rename a column after
creating it. SharePoint fixes a column's internal name (the one Graph uses)
when the column is created; renaming changes only the label.

## Direct links (after setup)

TestHours list id `3d4f19f9-ac90-49fb-a089-918818410229` (from its List settings address, 2026-10-13).

| Page | Address |
|---|---|
| TestHours list | `https://agencyartifact.sharepoint.com/sites/AAOperations/Lists/TestHours/AllItems.aspx` |
| TestHours list settings | `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/listedit.aspx?List=%7B3d4f19f9-ac90-49fb-a089-918818410229%7D` |
| TestHours advanced settings (item-level permissions) | `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/advsetng.aspx?List=%7B3d4f19f9-ac90-49fb-a089-918818410229%7D` |
| AA Operations permissions | `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/user.aspx` |
| AA Operations recycle bin | `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/RecycleBin.aspx` |
| AA Principals permissions | `https://agencyartifact.sharepoint.com/sites/AAPrincipals/_layouts/15/user.aspx` |

Versioning settings: open List settings and choose **Versioning settings** (its page address was not recorded yet).

## 1. Create the two sites (no Microsoft 365 group)

Both sites are team sites **without** a Microsoft 365 group, so no Teams team
controls their membership and their permission groups can be edited (on
group-connected team sites they cannot, see Sources).

For each site, in this order: `AA Principals`, then `AA Operations`.

1. Open the SharePoint admin center: <https://admin.microsoft.com> >
   **Admin centers** > **SharePoint**.
2. **Sites** > **Active sites** > **Create**.
3. Do **not** pick the first **Team site** option (that one creates a
   Microsoft 365 group). Select **Browse more sites** (some tenants show
   **Other options**), then **Team site**. The panel must not mention a
   Microsoft 365 group or group email address. If it does, go back.
4. **Site name:** `AA Principals` (then `AA Operations`).
   **Site address:** `AAPrincipals` (then `AAOperations`).
   **Primary administrator:** you.
   **Time zone:** `(UTC-08:00) Pacific Time (US and Canada)`.
   **Language:** English.
5. Select **Finish**.

Check:
- [ ] The site URL is `https://<tenant>.sharepoint.com/sites/AAPrincipals` (and `.../AAOperations`).
- [ ] In **Active sites**, the site's row shows no Microsoft 365 group and no Teams icon.
- [ ] On the site: **Settings** (gear) > **Site information** > **View all site settings** > **Regional settings**: time zone is Pacific Time. This setting decides how SharePoint stores date-only values, which the date-boundary case tests.

## 2. Members of each site

This part uses three SharePoint pages. Each has a fixed address; paste it in
the browser to be sure you are on the right one. `<site>` is
`https://agencyartifact.sharepoint.com/sites/AAPrincipals` or
`.../sites/AAOperations`.

| Page | Address | How you recognise it |
|---|---|---|
| **P1. Permissions page** | `<site>/_layouts/15/user.aspx` | Title "Permissions"; ribbon with **Grant Permissions**, **Check Permissions**, **Permission Levels**; table with columns **Name**, **Type**, **Permission Levels** |
| **P2. A group's page** | open it from P1 by selecting the group's name | Title "People and Groups > <group name>"; menu **New**, **Actions**, **Settings**; list of the group's members |
| **P3. Site collection administrators** | `<site>/_layouts/15/mngsiteadmin.aspx` | Title "Site Collection Administrators"; one box with names |

The page called **People and Groups** with a list of groups (your screenshot of
2026-10-13) is a fourth page. It is not used here; ignore the `Everyone`
entries it may show.

### 2a. AA Principals: Galileo and Chris only

On **P1** (`https://agencyartifact.sharepoint.com/sites/AAPrincipals/_layouts/15/user.aspx`):
1. Look at the table. Expected: three rows, *AA Principals Owners* (Full Control), *AA Principals Members*, *AA Principals Visitors*. Nothing else.
2. Ribbon **Check Permissions**: type `Everyone except external users`, select it, **Check Now**. Expected: **None**.
   (`Everyone` cannot be typed in this tenant. That is fine: step 1 and 2b cover it.)
3. Select the name **AA Principals Owners**. This opens P2 for that group.

On **P2, AA Principals Owners**:
4. **New** > **Add Users** > type `Chris` > **Share**. Expected members: you and Chris, nobody else.
5. Go back to P1 (browser Back, or paste the P1 address again).

On **P1** again:
6. Select **AA Principals Members**. On its P2: expected empty. Back to P1.
7. Select **AA Principals Visitors**. On its P2: expected empty.

On **P3** (`https://agencyartifact.sharepoint.com/sites/AAPrincipals/_layouts/15/mngsiteadmin.aspx`):
8. Read the names in the box. Change nothing. Send them to Claude Code. A tenant admin entry may appear; that is expected.

Check (the "no Everyone grant" part of go criterion 3):
- [ ] P1 shows only the three AA Principals groups.
- [ ] Check Permissions for `Everyone except external users`: None.
- [ ] Owners: Galileo and Chris. Members and Visitors: empty.
- [ ] Names on P3 sent to Claude Code.

### 2b. AA Operations: Galileo, Chris, and aa.test at Contribute

On **P1** (`https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/user.aspx`):
1. Select the name **AA Operations Owners**. This opens its P2.

On **P2, AA Operations Owners**:
2. **New** > **Add Users** > type `Chris` > **Share**. Expected members: you and Chris.
3. Go back to P1.

On **P1** again:
4. Ribbon **Grant Permissions**. A sharing box opens.
5. Type `aa.test` and select the account. Select **Show options**.
6. Under **Select a permission level**, choose **Contribute**.
   Not the default (*AA Operations Members*, which is **Edit**): Edit includes
   *Manage Lists*, which would let aa.test switch off versioning.
   Since 2026-10-13 aa.test moves from Contribute to **AA Team** (part 3).
7. Untick **Send an email invitation** if you prefer. **Share**.
8. The table now shows a row `AA Test`, type User, permission level **Contribute**.
9. Ribbon **Check Permissions**: type `aa.test`, **Check Now**. Expected: **Contribute**, given directly, and nothing else.

Check:
- [ ] P1 shows the three AA Operations groups plus `AA Test` at Contribute.
- [ ] Check Permissions for aa.test: Contribute only.
- [ ] Owners: Galileo and Chris. aa.test is not in Members, Owners or Visitors.

## 3. AA Team permission level (on AA Operations)

Changed 2026-10-13 (`data.md` 1.2): this replaces the earlier `Coordinator`
level. `AA Team` is Contribute **without Delete Versions**, for team members
and coordinators alike, so nobody but principals can erase version history.

**This tenant (the `Coordinator` level already exists): convert it.**
1. Open the Permission Levels page of AA Operations:
   `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/role.aspx`
   (or **P1** > ribbon **Permission Levels**).
2. Select the name **Coordinator** (the link).
3. **Name:** `AA Team`. **Description:** `Contribute without Delete Versions: version history cannot be erased.`
4. Under **List Permissions**, untick **Override List Behaviors** (some pages
   say *Override Check-Out*) and untick **Delete Versions**. Change nothing else.
5. **Submit** at the bottom.

**New tenant: create it.** P1 > **Permission Levels** > select **Contribute**
> **Copy Permission Level** > Name and Description as above > untick
**Delete Versions** > **Create**.

Check:
- [ ] **Permission Levels** lists `AA Team` and no `Coordinator`. Open it: the Contribute permissions minus Delete Versions, nothing else.

How to assign it: on **P1** of AA Operations, tick the person's row > ribbon
**Edit User Permissions** > tick **AA Team**, untick **Contribute** > **OK**.

## 4. List TestHours (on AA Operations)

1. On AA Operations: **New** > **List**. Under *Create from blank* choose **List** (not a template). **Name:** `TestHours`. Leave **Show list in site navigation** ticked: it only adds a link in the site menu and changes no permission. **Create**.
2. Add columns with **+ Add column**, exactly:

   | Name | Type | Settings |
   |---|---|---|
   | `Person` | Person | Allow multiple selections: off |
   | `Date` | Date and time | Include time: **off** (date only) |
   | `WorkDate` | Single line of text | |
   | `Hours` | Number | Decimal places: 1 |

   Keep the default `Title` column (the app writes a short label in it).
3. **Settings** (gear) > **List settings** > **Advanced settings** >
   **Item-level Permissions**:
   - **Read access:** *Read all items*.
   - **Create and Edit access:** *Create and edit all items* (changed 2026-10-13, `data.md` 1.2: no own-items lock on hours; version history is the control).
   - **OK**.
4. **Settings** > **List settings** > **Versioning settings** >
   *Create a version each time you edit an item in this list?* **Yes**. Keep the
   number of versions shown. **OK**.
5. Add one row yourself (as Galileo), for the edit and delete tests. How to
   add a row: on the list page select the blue **+ New** button (top left); a
   form opens on the right; fill the fields; **Save** at the bottom of the form.
   The row then appears in the list.
   - **Title:** `Galileo row`
   - **Person:** you (person picker)
   - **Date:** today (calendar picker)
   - **WorkDate:** today typed as `YYYY-MM-DD`, for example `2026-10-13`
   - **Hours:** `1`

Check:
- [ ] List URL ends in `/Lists/TestHours`.
- [ ] Advanced settings show the two item-level choices above.
- [ ] Versioning settings: Yes. Write down the version limit shown (the default is not documented).
- [ ] The Galileo row exists.

## 5. List TestFees (on AA Principals)

1. On AA Principals: **New** > **List**. Under *Create from blank* choose **List**. **Name:** `TestFees`. Leave **Show list in site navigation** ticked: it only adds a link in the site menu and changes no permission. **Create**.
2. Add columns: `Project` (Single line of text), `Fee` (Number).
3. Add one row (blue **+ New** button, top left; fill the form on the right;
   **Save**):
   - **Title:** `Fee test`
   - **Project:** a made-up word that cannot appear anywhere else in the
     firm's files or email, for example `Zanthorpe`
   - **Fee:** `1000`

   Send the word to Claude Code; it goes in the test checklist, because
   Microsoft Search looks for it. The word and the figure are fictional, so
   they may sit in the public repo.

Check:
- [ ] List URL ends in `/Lists/TestFees`.
- [ ] After 30 minutes or more, **Galileo** (signed in as himself) opens the SharePoint start page `https://agencyartifact.sharepoint.com`, types the word in **Search in SharePoint** (blue bar, top), presses Enter, then makes sure the search covers the whole organization: the line under the search box must read **Organization** only. If it reads *Organization > Communication site* (the start page is itself a site, so the first search is scoped to it, `scope=site` in the address; seen 2026-10-13), select **Organization**. Stay on the **All** tab. He must **find** the `Fee test` item of TestFees. If nothing appears, indexing is not done yet: try again later (it can take hours). This is the positive control: aa.test finding nothing only proves something once Galileo's search shows the row is indexed.

## 6. Send back to Claude Code

- The tenant host name (`<tenant>.sharepoint.com`) and the two site URLs.
- The versioning limit shown, the Site Collection Administrators you saw, and anything that did not match these steps (exact wording on screen).

## Sources (checked 2026-10-13)

"Docs" means Microsoft documentation states it. "Not in docs" means the step
follows the SharePoint interface but no current Microsoft page confirms it;
stage 0 tests cover those.

| Step | Status | Source |
|---|---|---|
| Create site: Active sites > Create; first Team site option is group-connected; URL from the name, suffixed if taken | Docs | [Create a site](https://learn.microsoft.com/en-us/sharepoint/create-site-collection) (updated 2026-07-06) |
| "Other options" > Team site gives a site with no group; time zone chosen at creation | Not in docs. Seen on screen 2026-10-13: tenant shows **Other options** > template **Team site**, text "This option does not create a Microsoft 365 Group, shared Outlook inbox, shared calendar, OneNote notebook, or Planner plan." | Interface (Galileo's screenshot) |
| Group-connected team sites: default groups' permissions cannot be modified | Docs | [Customize SharePoint site permissions](https://learn.microsoft.com/en-us/sharepoint/customize-sharepoint-site-permissions) (updated 2026-07-01), note under *Assign a new permission level* |
| Grant Permissions > Show options > choose permission level; Edit User Permissions | Docs | same page, *Grant site access to a group*, *Assign a new permission level* |
| Members group default is Edit; Edit includes Manage Lists; Contribute does not | Docs | [Understanding permission levels](https://learn.microsoft.com/en-us/sharepoint/understanding-permission-levels) (updated 2026-07-01) |
| "Everyone except external users" is added to Members automatically on Public group-connected team sites | Docs | same page, note under *Default permission levels* |
| Permission Levels > select Contribute > Copy Permission Level > Create | Docs | [How to create and edit permission levels](https://learn.microsoft.com/en-us/sharepoint/how-to-create-and-edit-permission-levels) (updated 2026-07-01) |
| Contribute includes Delete Versions (reason for `AA Team`) | Docs | [Understanding permission levels](https://learn.microsoft.com/en-us/sharepoint/understanding-permission-levels) (updated 2026-07-01), *List permissions and permission levels*, checked 2026-10-13 |
| Override List Behaviors: description, and that it overrides "read/edit only their own items" (no longer used, kept for the record) | Docs for SharePoint Server only. The SharePoint in Microsoft 365 page lists the same permission as *Override Check-Out* and describes only check-out | [User permissions and permission levels (Server)](https://learn.microsoft.com/en-us/sharepoint/sites/user-permissions-and-permission-levels) (updated 2023-10-26); tested by go criterion 6 |
| Item-level Permissions in Advanced settings, option wording | Not in docs. Seen on screen 2026-10-13, with the note "Users with the Cancel Checkout permission can read and edit all items." | Interface (Galileo's screenshot); Graph behaviour tested by go criterion 6 |
| Versioning settings location | Docs (no default stated for lists) | [Enable and configure versioning](https://support.microsoft.com/en-us/office/enable-and-configure-versioning-for-a-list-or-library-1555d642-23ee-446a-990a-bcab618c7a37) |
| Check Permissions for Everyone groups | Not in docs | Interface; the behavioural test is go criterion 3 |
| Microsoft Search shows only results the user can access | Docs | [Overview of Microsoft Search](https://learn.microsoft.com/en-us/microsoftsearch/overview-microsoft-search) (updated 2026-05-08) |
| Date-only column storage and time zone | Not in docs (Graph docs only say "presented as a date only") | [dateTimeColumn](https://learn.microsoft.com/en-us/graph/api/resources/datetimecolumn) (updated 2024-03-13); tested by the date-boundary case |
