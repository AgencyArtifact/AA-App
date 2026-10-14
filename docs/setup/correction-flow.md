# Coordinator corrections through a flow (stage 0)

Decision (Galileo, 2026-10-13): coordinators correct other people's hours through a Power Automate flow, because no app permission separates coordinators from team (`docs/findings.md`). The full design comes after the probe below passes (Link gate: prove the connection first).

## Probe: can a flow edit another user's row with the own-items rule on?

Unknown: the rule is checked against the calling app's permission, and the Power Automate SharePoint connector is itself an app. About 5 minutes, as Galileo.

### 1. Create the flow

1. Open <https://make.powerautomate.com/environments/Default-6a257495-c628-470a-855d-94ccaedc4d7a/create> (the Create page of the default environment). If that address does not open, use <https://make.powerautomate.com> > **Create**.
2. **Instant cloud flow**. Name `AA Stage0 Correction Probe`. Trigger **Manually trigger a flow**. **Create**.

### 2. Edit aa.test's row

1. **+** > **Add an action** > **SharePoint** > **Update item**.
2. Site Address: `AA Operations`. List Name: `TestHours`. Id: `4` (the row `aa.test row`, created by aa.test).
3. Title: `aa.test row [flow]`. Leave every other field empty.

### 3. Restore it

1. Add a second **Update item**, same Site, List and Id `4`.
2. Title: `aa.test row`.

### 4. Run

1. **Save**, then **Test** > **Manually** > **Test** > **Run flow** > **Done**.
2. Expected if corrections by flow work: both actions green. If the first one fails: open it and copy the **status code** and the error **message**.

### 5. Evidence

Open <https://agencyartifact.sharepoint.com/sites/AAOperations/Lists/TestHours/AllItems.aspx>, row `aa.test row` > **...** > **Version history**: a version with `aa.test row [flow]`, then the restore, both **Modified by Galileo Morandi** (the flow runs with Galileo's connection).

Send back: "both green" or the status code and message.

**Result 2026-10-13 21:11 Los Angeles (Galileo, screenshot): both green** (Update item 0.4 s, Update item 1 0.3 s), connection galileo@, own-items setting on. The flow can edit another user's row. Delete by flow not yet run; it is part of the full design's test.

Flow path in Power Automate: `.../environments/Default-6a257495-c628-470a-855d-94ccaedc4d7a/flows/1d01a372-8728-4f07-8522-8cfe1fe466f5`.

## Full setup (outline approved by Galileo, 2026-10-13)

Schema and rules: `docs/architecture/data.md`, *TestCorrections*. About 30 minutes, as Galileo. Site address used below: `https://agencyartifact.sharepoint.com/sites/AAOperations`.

### Part A. Group "AA Coordinators" (3 minutes)

1. Open `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/newgrp.aspx` (Create Group).
2. **Name:** `AA Coordinators`. **About me:** `Coordinators whose hour corrections the flow applies`.
3. **Group owner:** `AA Operations Owners`.
4. **Who can view the membership of the group?** Group Members. **Who can edit the membership of the group?** Group Owner.
5. **Allow requests to join/leave this group?** No.
6. **Give group permission to this site:** tick **Contribute** only.
7. **Create**. The group's page opens, empty. Leave it empty for now (Test 2 adds aa.test).

### Part B. List "TestCorrections" (10 minutes)

1. Open `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/viewlsts.aspx` (Site contents) > **+ New** > **List** > **Blank list**. **Name:** `TestCorrections`. Untick *Show in site navigation* if you like. **Create**.
2. Add the columns with **+ Add column** on the list, names typed exactly (never renamed later):

| Name | Type | Settings |
|---|---|---|
| `TargetId` | Number | Decimal places 0, Require that this column contains information: Yes |
| `Action` | Choice | Choices `Edit` and `Delete` (one per line, delete the third default choice), default value none, required Yes |
| `NewHours` | Number | Decimal places 1 |
| `Reason` | Single line of text | Required Yes |
| `Status` | Choice | Choices `Requested`, `Applied`, `Rejected`, default value `Requested` |
| `Outcome` | Single line of text | |

3. Item-level permissions: on the list, **gear** (top right) > **List settings** > **Advanced settings**. **Read access:** Read all items. **Create and Edit access:** Create items and edit items that were created by the user. **OK**. Copy the List settings page address and send it to Claude Code (it holds the list id, for direct links).
4. Same List settings page > **Versioning settings**: *Create a version each time you edit an item* is **Yes**. **OK**.

### Part C. Show IDs in TestHours (1 minute)

Corrections name a row by its ID.

1. Open `https://agencyartifact.sharepoint.com/sites/AAOperations/Lists/TestHours/AllItems.aspx`.
2. **+ Add column** > **Show or hide columns** > tick **ID** > **Apply**.

### Part D. The flow (15 minutes)

1. Open `https://make.powerautomate.com/environments/Default-6a257495-c628-470a-855d-94ccaedc4d7a/create` > **Automated cloud flow**. **Name:** `AA Stage0 Corrections`. Trigger: search `When an item is created` (SharePoint) > **Create**.
2. Trigger card: **Site Address** `AA Operations`, **List Name** `TestCorrections`.
3. **+** > **SharePoint** > **Send an HTTP request to SharePoint**. Rename it `GetCoordinators` (card **...** > **Rename**).
   - Site Address `AA Operations`. Method `GET`.
   - Uri: `_api/web/sitegroups/getbyname('AA Coordinators')/users?$select=Email`
   - Headers: key `Accept`, value `application/json;odata=nometadata`.
4. **+** > **Data Operation** > **Filter array**. Rename `IsCoordinator`.
   - From: expression `body('GetCoordinators')?['value']`
   - Left: expression `toLower(item()?['Email'])`, operator `is equal to`, right: expression `toLower(triggerOutputs()?['body/Author/Email'])`
5. **+** > **Control** > **Condition**. Left: expression `length(body('IsCoordinator'))`, operator `is greater than`, right `0`.
6. **False** branch (not a coordinator): **SharePoint** > **Update item**. Rename `Reject`. Site `AA Operations`, List `TestCorrections`, Id: expression `triggerOutputs()?['body/ID']`. Advanced parameters > **Show all**: **Title** expression `triggerOutputs()?['body/Title']`; **Status Value** `Rejected`; **Outcome** `Requester is not in AA Coordinators`.
7. **True** branch: **SharePoint** > **Get item**. Rename `Target`. Site `AA Operations`, List `TestHours`, Id: expression `triggerOutputs()?['body/TargetId']`.
8. Below `Target`, still in True: **Control** > **Condition**. Left: expression `triggerOutputs()?['body/Action/Value']`, operator `is equal to`, right `Edit`.
9. Inner **True** (Edit):
   - **SharePoint** > **Update item**. Rename `ApplyEdit`. Site `AA Operations`, List `TestHours`, Id: expression `triggerOutputs()?['body/TargetId']`. **Show all**: **Title** expression `body('Target')?['Title']`; **Hours** expression `triggerOutputs()?['body/NewHours']`.
   - **SharePoint** > **Update item**. Rename `MarkEdited`. List `TestCorrections`, Id expression `triggerOutputs()?['body/ID']`. **Title** expression `triggerOutputs()?['body/Title']`; **Status Value** `Applied`; **Outcome** expression `concat('Hours ', string(body('Target')?['Hours']), ' -> ', string(triggerOutputs()?['body/NewHours']))`.
10. Inner **False** (Delete):
   - **SharePoint** > **Delete item**. Rename `ApplyDelete`. Site `AA Operations`, List `TestHours`, Id expression `triggerOutputs()?['body/TargetId']`.
   - **SharePoint** > **Update item**. Rename `MarkDeleted`. List `TestCorrections`, Id expression `triggerOutputs()?['body/ID']`. **Title** expression `triggerOutputs()?['body/Title']`; **Status Value** `Applied`; **Outcome** expression `concat('Deleted row ', string(triggerOutputs()?['body/TargetId']), ': ', body('Target')?['Title'], ', ', string(body('Target')?['Hours']), ' h')`.
11. **Save**. The flow is on by default. A new request is picked up within a few minutes (the trigger checks periodically).

### Part E. Tests

Requests are created as **aa.test**, in a private window, at `https://agencyartifact.sharepoint.com/sites/AAOperations/Lists/TestCorrections/AllItems.aspx` > **+ New**. After each one, wait up to 5 minutes and refresh: `Status` and `Outcome` change.

| # | Before | Request (as aa.test) | Expected |
|---|---|---|---|
| 1 | aa.test **not** in AA Coordinators | Title `t1`, TargetId `1` (Galileo's `Hours test`), Action Edit, NewHours `2`, Reason `test 1` | Status **Rejected**, Outcome "Requester is not in AA Coordinators"; `Hours test` unchanged |
| 2 | Add aa.test to AA Coordinators: `https://agencyartifact.sharepoint.com/sites/AAOperations/_layouts/15/user.aspx` > **AA Coordinators** > **New** > **Add users** > aa.test > **Share** | Title `t2`, TargetId `1`, Edit, NewHours `2`, Reason `test 2` | **Applied**, Outcome `Hours 1 -> 2`; `Hours test` shows 2.0 |
| 3 | As **aa.test** (same private window), add a row to TestHours: Title `flow delete target`, Date and WorkDate `2026-01-01`, Hours 0.5. Note its ID. (Created by aa.test, so the flow on Galileo's connection deletes another user's row) | Title `t3`, TargetId = that ID, Action Delete, Reason `test 3` | **Applied**, Outcome `Deleted row ...`; row in the recycle bin |
| 4 | aa.test still in the group | Title `t4`, TargetId `1`, Edit, NewHours `1`, Reason `restore` | **Applied**, `Hours test` back to 1.0 |
| 5 | Remove aa.test from AA Coordinators (group page > tick aa.test > **Actions** > **Remove Users from Group**) | none | |

Send back: the `Status` and `Outcome` of t1 to t4 (one line each), and whether TestHours looks as expected.

If a request stays **Requested** for more than 10 minutes: <https://make.powerautomate.com> > **My flows** > `AA Stage0 Corrections` > **Run history** > the failed run > the red card's status code and message.

### Part F. Export

After the tests: `AA Stage0 Corrections` and `AA Stage0 Correction Probe` > **...** > **Export** > **Package (.zip)**. Keep the zips in `Excell/flows/` (git-ignored) while the repo is public; they contain sign-in addresses.