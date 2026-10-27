# Reminder flows in Power Automate (stage 0, task T5)

Brief v2, go criterion 4. Performed by Galileo at <https://make.powerautomate.com>, signed in as Galileo.

Goal: a scheduled Teams reminder reaches aa.test, then escalates to the coordinator (Galileo stands in), on Los Angeles time and on India time, including the date-boundary case.

You build **two flows** with the same logic. Only the time zone differs.

| Flow name | Recurrence time zone | Time zone ID in expressions |
|---|---|---|
| `AA Stage0 Reminder LA` | (UTC-08:00) Pacific Time (US & Canada) | `Pacific Standard Time` |
| `AA Stage0 Reminder India` | (UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi | `India Standard Time` |

The IDs are Windows time zone IDs. `Pacific Standard Time` follows daylight saving by itself.

## Logic

Each run:

1. Works out "today" (`yyyy-MM-dd`) and the current minute **in the flow's own time zone**.
2. Reads `TestHours` and keeps the rows **created by aa.test**.
3. Checks those rows two ways, separately:
   - **WorkDate match:** the `WorkDate` text equals today.
   - **Date match:** the raw `Date` value, as the SharePoint connector returns it, starts with today.
4. Writes a log line (`MatchLog`) with both counts and the raw values. You read it in the run history.
5. If either check found a row: no message.
6. If neither did: on the **reminder** run, the Flow bot messages aa.test; on the **escalation** run, it messages the coordinator.

Why "created by" and not the `Person` column: the app leaves `Person` empty when it cannot find the user in the site's user list, and the creator is always the signed-in person who logged the hours.

Why the Date rule is "starts with": nothing in Microsoft's docs says how a date-only value comes back. If it comes back shifted to another day, that check fails and the log shows the raw value. That is what the test is looking for. Do not change the rule to make it pass.

### Compressed schedule

For testing, the reminder and the escalation are minutes apart, not a day apart. The minute decides which run is which:

- reminder run at minute **R** (example `05`)
- escalation run at minute **E** (example `15`)
- threshold **T** halfway between (example `10`): minute below T is the reminder, T or later is the escalation.

R and E are minutes **on the flow's own clock**, in the same hour on that clock, at least 6 minutes apart. A run can start up to a minute late, and the threshold absorbs that.

India clock from the Los Angeles clock: **add 12 h 30 min** until November 1, 2026, and **add 13 h 30 min** from November 1 (Daylight Saving Time ends in the US). Example on October 13: 3:35 PM in Los Angeles is 4:05 AM on October 14 in India.

## Prerequisites

- [ ] The **Workflows** app (formerly "Power Automate") is *Allowed* in the Teams admin center (**Teams apps** > **Manage apps** > search "Workflows"). Flow bot messages need it. Source: [Microsoft Teams connector, known limitations](https://learn.microsoft.com/en-us/connectors/teams/).
- [ ] `TestHours` on `AA Operations` has the columns Person, Date (date only), WorkDate (text) and Hours.
- [ ] You know aa.test's sign-in address, written below as `aa.test@<domain>` (type it in **lower case**), and yours, written as `galileo@<domain>`.

## Build the LA flow

### 1. Create the flow

1. **My flows** > **New flow** > **Scheduled cloud flow**.
2. **Flow name:** `AA Stage0 Reminder LA`.
3. **Starting:** today, any time earlier than now. **Repeat every:** `1` `Day`.
4. Select **Create**.

### 2. Recurrence (the trigger)

Open the **Recurrence** card. Under the advanced parameters set:

| Field | Value |
|---|---|
| Interval | `1` |
| Frequency | `Day` |
| Time zone | `(UTC-08:00) Pacific Time (US & Canada)` |
| Start time | today's date, e.g. `2026-10-13T00:00:00` (no `Z`) |
| At these hours | the LA hour in which you will test, e.g. `15` |
| At these minutes | your R and E, e.g. `5,15` |

The *Preview* panel should list two runs, e.g. 3:05 PM and 3:15 PM. Source: [Recurrence trigger](https://learn.microsoft.com/en-us/azure/connectors/connectors-native-recurrence) (*At these hours* and *At these minutes* need frequency Day or Week; the time zone applies only with a start time).

### 3. Compose: LocalNow

**+** > **Add an action** > **Compose** (Data Operation). Rename it `LocalNow` (**...** > **Rename**). **Inputs** > **fx** (expression):

```
convertTimeZone(utcNow(), 'UTC', 'Pacific Standard Time')
```

### 4. Compose: Today

Add **Compose**, rename `Today`, expression:

```
formatDateTime(outputs('LocalNow'), 'yyyy-MM-dd')
```

### 5. Compose: Stage

Add **Compose**, rename `Stage`, expression (`10` is the threshold T):

```
if(less(int(formatDateTime(outputs('LocalNow'), 'mm')), 10), 'remind', 'escalate')
```

### 6. SharePoint: Get items

Add **SharePoint** > **Get items**. Leave the name `Get items`.

| Field | Value |
|---|---|
| Site Address | `AA Operations` (pick from the list) |
| List Name | `TestHours` |
| Filter Query | empty |
| Top Count | `100` |

No filter on purpose: the test list is small, and filtering in the flow lets both checks see the same rows.

### 7. Filter array: AATestRows

Add **Data Operation** > **Filter array**, rename `AATestRows`.

- **From:** expression `outputs('Get_items')?['body/value']`
- Condition, left: expression `toLower(item()?['Author']?['Email'])`
- Operator: `is equal to`
- Right: `aa.test@<domain>`

### 8. Select: RawDates

Add **Data Operation** > **Select**, rename `RawDates`.

- **From:** expression `body('AATestRows')`
- **Map** (key, then value as expression):
  - `ID`: `item()?['ID']`
  - `Date`: `item()?['Date']`
  - `WorkDate`: `item()?['WorkDate']`

### 9. Filter array: ByWorkDate

Add **Filter array**, rename `ByWorkDate`.

- **From:** expression `body('AATestRows')`
- Left: expression `item()?['WorkDate']`
- Operator: `is equal to`
- Right: expression `outputs('Today')`

### 10. Filter array: ByDate

Add **Filter array**, rename `ByDate`.

- **From:** expression `body('AATestRows')`
- Left: expression `string(item()?['Date'])`
- Operator: `starts with`
- Right: expression `outputs('Today')`

### 11. Compose: MatchLog

Add **Compose**, rename `MatchLog`, expression (one line):

```
concat('Today ', outputs('Today'), ', stage ', outputs('Stage'), '. WorkDate matched ', string(length(body('ByWorkDate'))), ', Date matched ', string(length(body('ByDate'))), '. aa.test rows: ', string(body('RawDates')))
```

### 12. Condition: no row today

Add **Control** > **Condition**.

- Left: expression `add(length(body('ByWorkDate')), length(body('ByDate')))`
- Operator: `is equal to`
- Right: `0`

Leave the **False** branch empty (a row was found, no message).

### 13. Inside True: Condition on Stage

In the **True** branch add another **Condition**:

- Left: expression `outputs('Stage')`
- Operator: `is equal to`
- Right: `remind`

**True (reminder):** add **Microsoft Teams** > **Post message in a chat or channel**:

| Field | Value |
|---|---|
| Post as | `Flow bot` |
| Post in | `Chat with Flow bot` |
| Recipient | `aa.test@<domain>` |
| Message | `AA reminder (LA): no hours logged for ` then the `Today` output (dynamic content), then `. Please log your time in Agency Artifact.` |

**False (escalation):** add the same action:

| Field | Value |
|---|---|
| Post as | `Flow bot` |
| Post in | `Chat with Flow bot` |
| Recipient | `galileo@<domain>` |
| Message | `AA escalation (LA): aa.test has still not logged hours for ` then the `Today` output, then `.` |

Source for Post as, Post in and Recipient: [Send a message in Teams using Power Automate](https://learn.microsoft.com/en-us/power-automate/teams/send-a-message-in-teams), section *Post a message as the Flow bot directly to a user*.

### 14. Save

Select **Save**, then **Flow checker**: no errors.

## Build the India flow

On the LA flow's page: **...** > **Save As**, name `AA Stage0 Reminder India`. Open the copy, **Edit**, and change only:

| Where | Change to |
|---|---|
| Recurrence > Time zone | `(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi` |
| Recurrence > At these hours | the **India** hour in which you will test |
| LocalNow expression | `convertTimeZone(utcNow(), 'UTC', 'India Standard Time')` |
| Both messages | `(LA)` becomes `(India)` |

Save, then turn the copy **on** (copies made with *Save As* start off).

## Reading a run

**My flows** > the flow > **Run history** > the run. Open **MatchLog**: its output is the log line. Copy it into the stage report for every test below. If a message did not arrive, check the action **Post message...** for its status.

To move a test to new minutes: **Edit** > Recurrence > change *At these hours* / *At these minutes* > **Save**. Do not use **Test** > **Manually**: the stage comes from the clock minute, so a manual run at the wrong minute gives the wrong stage.

## Tests

Run LA and India at different minutes so messages are easy to tell apart. Before each test, check that `TestHours` has **no row by aa.test dated today** on that flow's clock (the diagnostic deletes its own row; a `#/log` row stays until you delete it). The rows `aa.test row` and `stage0-delete-target`, dated `2026-01-01`, (test checklist A3) are in the past and do not count.

### Test 1: reminder, then escalation (no row). Both flows.

1. At minute R: aa.test gets the reminder in Teams **on the phone**, in a chat with **Workflows**. Note the time it arrived.
2. At minute E: Galileo gets the escalation. Note the time.
3. Run history: both runs *Succeeded*. MatchLog: `WorkDate matched 0, Date matched 0`.

### Test 2: silent when hours exist. Both flows.

1. As aa.test, in Teams: Agency Artifact > Home > **Log half an hour (phone test)**, leave the date, **+** once, **Confirm**.
2. Set R and E to the next free minutes.
3. Neither run sends a message. Copy both MatchLog lines.
4. On the log screen, **Delete this test row**.

### Test 3: date-boundary case. India flow.

The window: India is on the next date from **11:30 AM to midnight Los Angeles time** until November 1, 2026, and from **10:30 AM to midnight** after it. Run this inside the window, with aa.test on the India device (`m365-admin.md` part 6: device time zone Asia/Kolkata).

1. On the India device, open Agency Artifact > **Diagnostic**. Check: `Time zone: Asia/Kolkata (UTC+05:30)`, and `Local today` is one day **after** the Los Angeles date. **Copy report**: its write step shows the raw Date and WorkDate values Graph returned.
2. On the same device: Home > **Log half an hour (phone test)**, leave the date (the India date), **+**, **Confirm**. This row stays.
3. Set the India flow's R and E to the next free minutes **on the India clock**.
4. Expected: no message at R and none at E. Copy both MatchLog lines: they show which column matched and the raw Date value as the flow sees it.
5. **Delete this test row**. Set the device time zone back after the control.

Pass: the India flow finds the row and does not escalate. If WorkDate matched and Date did not, the stage is not failed. Record it; it becomes a finding and an open question on the date convention.

Why steps 1 and 2 are separate: the diagnostic deletes its own row straight after writing it, so the flow cannot find it. The log screen writes the same columns (Date and WorkDate both set to the device's local date) and keeps the row.

### Test 4: control. India flow.

Same steps as Test 3, **outside** the window (before 11:30 AM Los Angeles time until November 1, before 10:30 AM after it), when both cities are on the same date. Expected: silent, with both MatchLog counts recorded.

## If something looks wrong

- **AATestRows is empty although aa.test has rows.** Open **Get items** > **Show raw outputs**, find an aa.test row and check how `Author` and its `Email` look. Report the exact shape; do not change the filter to something else silently.
- **Date matched 0 but the row is there.** That is a result, not a fault: copy the raw `Date` from MatchLog into the report.
- **No message although the Condition went to True.** Check that the Workflows app is allowed, and that the recipient address is exact.

## Export a copy for the repository

For each flow: **My flows** > select the flow > **...** > **Export** > **Package (.zip)**. Name: the flow name. Select **Export** and save the zip.

If **Package (.zip)** is greyed out, the flow is inside a solution: go to **Solutions**, open the solution, **Export solution**, and save that zip instead.

Where to put it: the export contains both sign-in addresses (aa.test and Galileo). While the repo is public, keep the zips in `Excell/flows/` (git-ignored) and tell Claude Code. They move to `flows/` when the repo goes private, unless Galileo decides otherwise.
