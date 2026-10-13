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

### AA Principals: Galileo and Chris only

1. On the site: **Settings** > **Site permissions** > **Advanced permissions settings**.
2. Open the **AA Principals Owners** group and add Chris (you are already in it as primary administrator).
3. Leave **Members** and **Visitors** groups empty.

Check (this is the "no Everyone grant" check of go criterion 3):
- [ ] The **Advanced permissions settings** page lists only the three site groups (Owners, Members, Visitors), with no other row.
- [ ] Owners contains exactly Galileo and Chris. Members and Visitors are empty.
- [ ] No row and no group member is `Everyone`, `Everyone except external users`, or any other group.
- [ ] Ribbon **Check Permissions**: enter `Everyone except external users`, select **Check Now**. Result: **None**. Repeat for `Everyone`.
- [ ] **Site Collection Administrators** (Site settings > Users and Permissions): note who is listed. A tenant admin role group may appear there; that is expected and not a grant to staff. Write what you see in the test checklist.

### AA Operations: Galileo, Chris, and aa.test at Contribute

1. On the site: **Settings** > **Site permissions** > **Advanced permissions settings**.
2. Open the **AA Operations Owners** group and add Chris.
3. Back on **Advanced permissions settings**, ribbon **Grant Permissions**.
4. Type `aa.test`. Select **Show options**.
5. Under **Select a permission level**, choose **Contribute**.
   Not the default (**Members**, which is **Edit**): Edit includes *Manage
   Lists*, which would let aa.test switch off the own-items rule of step 4.
6. Untick **Send an email invitation** if you prefer. Select **Share**.

Check:
- [ ] The page lists `aa.test` as its own row with permission level **Contribute**, and aa.test is in no site group.
- [ ] Ribbon **Check Permissions** for `aa.test`: **Contribute** only.

## 3. Coordinator permission level (on AA Operations)

1. On AA Operations: **Settings** > **Site permissions** > **Advanced permissions settings**.
2. Ribbon **Permission Levels**. Select the name **Contribute** (the link, not the checkbox).
3. At the bottom select **Copy Permission Level**.
4. **Name:** `Coordinator`. **Description:** `Contribute plus Override List Behaviors: edit and delete any row in own-items lists.`
5. Under **List Permissions**, tick **Override List Behaviors** (description:
   *Discard or check in a document which is checked out to another user, and
   change or override settings which allow users to read/edit only their own
   items*). Change nothing else.
6. Select **Create**.

Do not assign it to anyone yet. The test matrix assigns it to aa.test later.

Check:
- [ ] **Permission Levels** lists `Coordinator`. Open it: the Contribute permissions plus Override List Behaviors, nothing else.

How to assign it later (test matrix, aa.test as coordinator): **Advanced
permissions settings** > tick the `aa.test` row > ribbon **Edit User
Permissions** > tick **Coordinator**, untick **Contribute** > **OK**. To go back,
reverse the ticks.

## 4. List TestHours (on AA Operations)

1. On AA Operations: **New** > **List** > **Blank list**. **Name:** `TestHours`. **Create**.
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
   - **Create and Edit access:** *Create items and edit items that were created by the user*.
   - **OK**.
4. **Settings** > **List settings** > **Versioning settings** >
   *Create a version each time you edit an item in this list?* **Yes**. Keep the
   number of versions shown. **OK**.
5. Add one row yourself (as Galileo), for the edit and delete tests: Title
   `Galileo row`, Person you, Date today, WorkDate today as `YYYY-MM-DD`, Hours `1`.

Check:
- [ ] List URL ends in `/Lists/TestHours`.
- [ ] Advanced settings show the two item-level choices above.
- [ ] Versioning settings: Yes. Write down the version limit shown (the default is not documented).
- [ ] The Galileo row exists.

## 5. List TestFees (on AA Principals)

1. On AA Principals: **New** > **List** > **Blank list**. **Name:** `TestFees`. **Create**.
2. Add columns: `Project` (Single line of text), `Fee` (Number).
3. Add one row: Title `Fee test`, Project a distinctive made-up word that
   appears nowhere else in the tenant (for example `Zanthorpe`), Fee `1000`.
   Write the word in the test checklist: Microsoft Search looks for it.

Check:
- [ ] List URL ends in `/Lists/TestFees`.
- [ ] After 30 minutes or more, **Galileo** searches the word in Microsoft Search (office.com or the SharePoint start page) and **finds** the row. This is the positive control: aa.test finding nothing only proves something once Galileo's search shows the row is indexed.

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
| "Browse more sites" > Team site gives a site with no group; time zone chosen at creation | Not in docs (the page does not say which template is groupless) | Interface; checked by the "no group" check in step 1 |
| Group-connected team sites: default groups' permissions cannot be modified | Docs | [Customize SharePoint site permissions](https://learn.microsoft.com/en-us/sharepoint/customize-sharepoint-site-permissions) (updated 2026-07-01), note under *Assign a new permission level* |
| Grant Permissions > Show options > choose permission level; Edit User Permissions | Docs | same page, *Grant site access to a group*, *Assign a new permission level* |
| Members group default is Edit; Edit includes Manage Lists; Contribute does not | Docs | [Understanding permission levels](https://learn.microsoft.com/en-us/sharepoint/understanding-permission-levels) (updated 2026-07-01) |
| "Everyone except external users" is added to Members automatically on Public group-connected team sites | Docs | same page, note under *Default permission levels* |
| Permission Levels > select Contribute > Copy Permission Level > Create | Docs | [How to create and edit permission levels](https://learn.microsoft.com/en-us/sharepoint/how-to-create-and-edit-permission-levels) (updated 2026-07-01) |
| Override List Behaviors: description, and that it overrides "read/edit only their own items" | Docs for SharePoint Server only. The SharePoint in Microsoft 365 page lists the same permission as *Override Check-Out* and describes only check-out | [User permissions and permission levels (Server)](https://learn.microsoft.com/en-us/sharepoint/sites/user-permissions-and-permission-levels) (updated 2023-10-26); tested by go criterion 6 |
| Item-level Permissions in Advanced settings, option wording | Not in docs | Interface; tested by go criterion 6 |
| Versioning settings location | Docs (no default stated for lists) | [Enable and configure versioning](https://support.microsoft.com/en-us/office/enable-and-configure-versioning-for-a-list-or-library-1555d642-23ee-446a-990a-bcab618c7a37) |
| Check Permissions for Everyone groups | Not in docs | Interface; the behavioural test is go criterion 3 |
| Microsoft Search shows only results the user can access | Docs | [Overview of Microsoft Search](https://learn.microsoft.com/en-us/microsoftsearch/overview-microsoft-search) (updated 2026-05-08) |
| Date-only column storage and time zone | Not in docs (Graph docs only say "presented as a date only") | [dateTimeColumn](https://learn.microsoft.com/en-us/graph/api/resources/datetimecolumn) (updated 2024-03-13); tested by the date-boundary case |
