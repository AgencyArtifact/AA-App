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
