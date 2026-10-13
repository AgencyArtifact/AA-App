# Reminder flow in Power Automate (stage 0, task T5)

Performed by Galileo at <https://make.powerautomate.com>, signed in as Galileo.
Goal (go criterion 3): a scheduled Teams reminder reaches aa.test, then
escalates to the coordinator (Galileo stands in), on Los Angeles time and on
India time.

You build **two flows** with the same logic:

| Flow name | Time zone in the trigger | Time zone ID in expressions |
|---|---|---|
| `AA Stage0 Reminder LA` | (UTC-08:00) Pacific Time (US & Canada) | `Pacific Standard Time` |
| `AA Stage0 Reminder India` | (UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi | `India Standard Time` |

The ID strings are Windows time zone IDs; `Pacific Standard Time` follows
daylight saving automatically.

## Logic

Each run:

1. Works out "today" and the current minute **in the flow's time zone**.
2. Looks in `TestHours` for a row with Date = today and Person = aa.test.
3. If a row exists: does nothing.
4. If none, and this is the **reminder** run: Flow bot messages aa.test.
5. If none, and this is the **escalation** run: Flow bot messages the coordinator.

For testing, the reminder and the escalation are minutes apart in the same
hour, not a day apart. Which run is which is decided by the minute:

- reminder run at minute **R** (example 20)
- escalation run at minute **E** (example 30)
- threshold **T** halfway between (example 25): minute < T is the reminder,
  minute ≥ T is the escalation.

Pick R and E inside the same clock hour and at least 6 minutes apart. Runs can
start up to a minute late, which the threshold absorbs.

## Prerequisites

- [ ] The **Workflows** app (formerly "Power Automate") is *Allowed* in the
      Teams admin center (**Teams apps** > **Manage apps** > search
      "Workflows"). Flow bot messages need it.
      Source: [Microsoft Teams connector, known limitations](https://learn.microsoft.com/en-us/connectors/teams/).
- [ ] `TestHours` exists on `AA Operations` with columns Person (person),
      Date (date only), Hours (number).
- [ ] You know aa.test's sign-in address, written below as `aa.test@<domain>`,
      and yours, written as `galileo@<domain>`.

## Build the LA flow

### 1. Create the flow

1. **My flows** > **New flow** > **Scheduled cloud flow**.
2. **Flow name:** `AA Stage0 Reminder LA`.
3. **Starting:** today, any time earlier than now. **Repeat every:** `1` `Day`.
4. Select **Create**.

### 2. Configure the trigger (Recurrence)

Open the **Recurrence** card. Under the advanced parameters set:

| Field | Value |
|---|---|
| Interval | `1` |
| Frequency | `Day` |
| Time zone | `(UTC-08:00) Pacific Time (US & Canada)` |
| Start time | today's date, e.g. `2026-10-13T00:00:00` (no `Z`) |
| At these hours | the LA hour in which you will test, e.g. `15` |
| At these minutes | `20,30` (your R and E) |

The *Preview* panel should list two runs today, e.g. 3:20 PM and 3:30 PM.
Reference: [Recurrence trigger](https://learn.microsoft.com/en-us/azure/connectors/connectors-native-recurrence)
(*At these hours* and *At these minutes* need frequency Day or Week; the time
zone applies only with a start time).

### 3. Compose: LocalNow

**+** > **Add an action** > search **Compose** (Data Operation).
Rename it `LocalNow` (… > **Rename**). **Inputs** > **fx** (expression):

```
convertTimeZone(utcNow(), 'UTC', 'Pacific Standard Time')
```

### 4. Compose: Today

Add **Compose**, rename `Today`, expression:

```
formatDateTime(outputs('LocalNow'), 'yyyy-MM-dd')
```

### 5. Compose: Stage

Add **Compose**, rename `Stage`, expression (25 is the threshold T):

```
if(less(int(formatDateTime(outputs('LocalNow'), 'mm')), 25), 'remind', 'escalate')
```

### 6. SharePoint: Get items

Add **SharePoint** > **Get items**.

| Field | Value |
|---|---|
| Site Address | `AA Operations` (pick from the list) |
| List Name | `TestHours` |
| Filter Query | `Date eq '@{outputs('Today')}' and Person/EMail eq 'aa.test@<domain>'` |
| Top Count | `1` |

To enter the filter: type `Date eq '`, insert the `Today` output through the
dynamic content (lightning) icon, then type
`' and Person/EMail eq 'aa.test@<domain>'`.

### 7. Condition: no row today

Add **Control** > **Condition**.

- Left: expression `length(outputs('Get_items')?['body/value'])`
- Operator: `is equal to`
- Right: `0`

Leave the **False** branch empty.

### 8. Inside True: Condition on Stage

In the **True** branch add another **Condition**:

- Left: dynamic content `Outputs` of `Stage`
- Operator: `is equal to`
- Right: `remind`

**True (reminder)**: add **Microsoft Teams** > **Post message in a chat or channel**:

| Field | Value |
|---|---|
| Post as | `Flow bot` |
| Post in | `Chat with Flow bot` |
| Recipient | `aa.test@<domain>` |
| Message | `AA reminder (LA): no hours logged for @{outputs('Today')}. Please log your time in Agency Artifact.` |

**False (escalation)**: add the same action:

| Field | Value |
|---|---|
| Post as | `Flow bot` |
| Post in | `Chat with Flow bot` |
| Recipient | `galileo@<domain>` |
| Message | `AA escalation (LA): aa.test has still not logged hours for @{outputs('Today')}.` |

Source for the Post as / Post in / Recipient options:
[Send a message in Teams using Power Automate](https://learn.microsoft.com/en-us/power-automate/teams/send-a-message-in-teams),
section *Post a message as the Flow bot directly to a user*.

### 9. Save

Select **Save**, then the **Flow checker** icon: no errors.

## Build the India flow

On the LA flow's page: **…** > **Save As**, name `AA Stage0 Reminder India`.
Open the copy, select **Edit**, and change only:

| Where | Change to |
|---|---|
| Recurrence > Time zone | `(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi` |
| Recurrence > At these hours | the **India** hour in which you will test |
| LocalNow expression | `convertTimeZone(utcNow(), 'UTC', 'India Standard Time')` |
| Both messages | replace `(LA)` with `(India)` |

Save, then turn the copy **on** (copies made with *Save As* start off).

## Test procedure

Run the LA and India tests at different times, or stagger their minutes, so
the messages are easy to tell apart. Record each result in the stage report.

**Test 1: reminder then escalation (no row).**

1. Make sure `TestHours` has no row for aa.test dated today (in that flow's
   time zone).
2. At minute R: aa.test receives the reminder in Teams **on the phone**, in a
   chat with **Workflows**. Note the time received.
3. At minute E: Galileo receives the escalation. Note the time.
4. In **My flows** > the flow > **Run history**, both runs are *Succeeded*.

**Test 2: no message when hours exist.**

1. As aa.test, add a row to `TestHours` (list in the browser): Person =
   aa.test, Date = today, Hours = 0.5.
2. Move R and E to the next free minutes (edit the trigger) or use
   **Test** > **Manually** at a minute before T and again after T.
3. No message is sent. Run history shows the Condition went to **False**.
4. Delete the row afterwards.

**Test 3: time zone (stronger, optional).** Between 11:30 and 23:59 LA time
(daylight saving) India is already on the next date. Add an aa.test row dated
the **LA** date, then run both flows: the LA flow stays silent; the India flow
still reminds, because India's "today" has no row.

### If the filter finds nothing although the row exists

Open the run, select **Get items**, **Show raw outputs**. Two known pitfalls:

- *Person filter.* If `Person/EMail` is rejected or never matches, delete the
  `and Person/EMail ...` part of the filter, then after **Get items** add
  **Data Operation** > **Filter array** with From = `value` of Get items and
  condition `item()?['Person']?['Email']` is equal to `aa.test@<domain>`. Point
  the Condition in step 7 at `length(body('Filter_array'))` instead.
- *Date-only values.* SharePoint stores a date-only value as midnight in the
  **site's regional time zone**. If the raw output shows a different day,
  check **Site settings** > **Regional settings** on `AA Operations` and note
  it in the report as an open question; do not work around it silently.

## Export a copy for the repository

For each flow: **My flows** > select the flow > **…** > **Export** >
**Package (.zip)**. Name: the flow name. Select **Export** and save the zip in
the repository folder `flows/` (for example
`flows/AA_Stage0_Reminder_LA.zip`).

If **Package (.zip)** is greyed out the flow is inside a solution: go to
**Solutions**, open the solution, **Export solution**, and save that zip to
`flows/` instead.
