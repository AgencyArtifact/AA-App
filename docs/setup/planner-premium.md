# Planner premium trial and test plan (stage 1, task T1)

Performed by Galileo. About 20 minutes. Everything here is fictional.
Result: a premium plan `ZT-01 Test Project` with phase `SD` and the task `AA Stage1 Test Task` under it, assigned to aa.test. Only Galileo holds a premium licence; aa.test keeps Business Basic.

## Read first: what the documentation predicts

- **Criterion 1 (Graph) is predicted to fail, partly.** Microsoft's Planner API overview says: "Premium plans and tasks aren't available on the Planner API in Microsoft Graph. Only basic plans may be accessed using this API." But the *Update plannerTask* page says: "For Project tasks that are replicated to Planner, only the **percentComplete** property can be updated." So a premium task assigned to aa.test may still appear in `GET /me/planner/tasks` and accept a percent change. The test decides; this is why it is still worth running.
- **Criterion 2 (no paid licence) is supported by Microsoft's FAQ:** "Planner in Microsoft 365 users have editing access for premium plans created by users with a Planner and Project license", but "accessing advanced capabilities with premium plans requires a paid license." Community answers disagree about marking tasks complete. The test decides.
- **The trial is not Plan 1.** Microsoft's trial article says the 30-day trial gives "the power of the Project Plan 3 license". That is more than the brief's Plan 1. It does not change criteria 1 or 2, which are about aa.test, not you. Recorded as a deviation.

## 1. Start the premium trial for Galileo only

Page: Planner in Teams (Teams > Apps > **Planner**), or <https://planner.cloud.microsoft> signed in as you.
1. Select **Try Project** next to the diamond icon (on the web, **Try Project** or the **Timeline** view also start it).
2. If it asks for admin approval: approve it in the Microsoft 365 admin center at <https://admin.microsoft.com/#/catalog> (or the request notification you receive), for yourself only.
3. Check at <https://admin.microsoft.com/#/users>: open **aa.test** > **Licenses and apps**. Only **Microsoft 365 Business Basic** is ticked. If the trial added a Project or Planner licence to aa.test, untick it and save.

## 2. Create the premium plan

Page: <https://planner.cloud.microsoft>, signed in as you.
1. **+ New plan** > choose **Premium plan**. Name `ZT-01 Test Project`.
2. Share it with aa.test: in the plan, open **Share** (or the members icon), add **AA Test**.
   Planner plans are tied to Microsoft 365 groups; if it asks for a group, create a new one named `ZT-01 Test Project`, private, members you and aa.test.
3. In **Grid** view add the task `SD` (the phase).
4. Add the task `AA Stage1 Test Task`, then make it a **subtask** of `SD` (select the row > **...** > **Make subtask**, or indent it under `SD`).
5. On `AA Stage1 Test Task`: **Assigned to** AA Test, **Finish** a date this week, **% complete** 0.
6. No fees, rates or budgets anywhere in the plan: names, notes or custom fields (CLAUDE.md, financial boundary).

## 3. Quick check as aa.test (criterion 2, first look)

In a private window or the Teams web client as aa.test: Teams > **Planner** > **My tasks** (or **My plans** > ZT-01 Test Project).
- Note whether aa.test can open the plan, see `AA Stage1 Test Task`, and mark it complete. Then set it back to not complete.
- The full criterion 2 run on a phone is in the T5 checklist; this is only so we know early.

## Send back to Claude Code

- Did the trial start for you without admin approval? Which licence name appears on your user in the admin center?
- aa.test's licences after step 1 (only Business Basic expected).
- Step 3: could aa.test open the plan, see the task, mark it done? The exact message if not.
- Anything that differed from these steps.

## Sources (checked 2026-10-14)

| Value | Source |
|---|---|
| Premium plans not on the Graph Planner API | [Use the Planner REST API](https://learn.microsoft.com/en-us/graph/api/resources/planner-overview) (updated 2025-08-06), *Important* box |
| Project tasks replicated to Planner: only `percentComplete` can be updated; `If-Match` required; 204 on success; least privileged delegated permission `Tasks.ReadWrite` | [Update plannerTask](https://learn.microsoft.com/en-us/graph/api/plannertask-update) (updated 2025-07-23) |
| `GET /me/planner/tasks`; least privileged `Tasks.Read` (`Tasks.ReadWrite` also allowed) | [List tasks (plannerUser)](https://learn.microsoft.com/en-us/graph/api/planneruser-list-tasks) (updated 2026-05-19) |
| Trial: **Try Project** next to the diamond icon in Teams, or Try Project / Timeline on the web; 30 days; Project Plan 3 power; may need admin approval | [How to access a 30-day trial of Planner's premium features](https://support.microsoft.com/en-us/planner/how-to-access-a-30-day-trial-of-planner-s-premium-features) |
| Basic users can edit premium plans created by licensed users; advanced capabilities need a licence; Plan 1 needed for Timeline, People, Goals views; plans are tied to Microsoft 365 groups; "create a new premium plan" | [Frequently asked questions about Microsoft Planner](https://support.microsoft.com/en-us/planner/frequently-asked-questions-about-microsoft-planner) |
| Community reports that unlicensed users cannot mark premium tasks complete (not official) | [Microsoft Q&A: unlicensed users basic edit to premium plan](https://learn.microsoft.com/en-us/answers/questions/5381126/unlicensed-users-basic-edit-to-premium-plan) |
