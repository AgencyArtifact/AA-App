# Microsoft 365 admin setup for stage 0 (start here)

Performed by Galileo with the Microsoft 365 admin credentials. Do the parts in
order; each ends with a check. Claude Code never signs in to the tenant: it
writes these steps and reads back what you report.

| Part | What | Where | Time |
|---|---|---|---|
| 1 | Confirm your admin role | Microsoft 365 admin center | 2 min |
| 2 | Create the test account `aa.test` | Microsoft 365 admin center | 5 min |
| 3 | Allow custom app upload in Teams | Teams admin center | 5 min, then hours to apply |
| 4 | Register the app | Entra admin center: `docs/setup/entra-app.md` | 10 min |
| 5 | Sites, lists, permission level | SharePoint: `docs/setup/sharepoint-sites.md` | 30 min |
| 6 | India test device | A phone or laptop signed in as `aa.test` | 5 min |

Start part 3 early: Teams policy changes take time to reach users.

## 1. Confirm your admin role

1. Sign in at <https://admin.cloud.microsoft> (same as <https://admin.microsoft.com>) with the admin credentials.
2. If the top shows **Simplified view**, switch to **Dashboard view**.
3. **Users** > **Active users** > **Filter set** > **Global admins**.

Check:
- [ ] Your account is in the list. If not, stop: someone with Global Administrator must assign the role (**Users** > **Active users** > your name > **Manage roles**).

Microsoft advises using Global Administrator only when needed. For stage 0 it
is the simplest single role that covers every part below.

## 2. Create the test account aa.test

1. **Users** > **Active users** > **Add a user**.
2. **Set up the basics**:
   - First name `AA`, last name `Test`, display name `AA Test`, username `aa.test`, domain: the firm's domain.
   - Password: keep **Automatically create a password** and **Require this user to change their password when they first sign in**.
   - **Next**.
3. **Assign product licenses**: location **United States**, license **Microsoft 365 Business Standard** only (the tenant has no Business Basic; Standard is a superset, and Teams and SharePoint behave the same). Leave **Power Automate Free** unticked: aa.test only receives reminders. **Next**. Remove the license when stage 0 ends to free the seat.
4. **Optional settings**: leave **Roles** as *User (no admin center access)*. **Next**.
5. **Finish adding**. Copy the temporary password from the completion page; keep it off the repo and off chat.
6. In a private browser window, sign in once as `aa.test` at <https://www.office.com>, set the new password, and complete any sign-in security prompt.

Check:
- [ ] `aa.test@<domain>` appears in **Active users** with Business Standard.
- [ ] `aa.test` can sign in and open Teams on the web (<https://teams.microsoft.com>).

## 3. Allow custom app upload in Teams

Needed so Galileo and `aa.test` can sideload the test package before it goes
to the org catalog (go criterion 5 covers the catalog).

1. Open the Teams admin center: <https://admin.teams.microsoft.com>.
2. **Teams apps** > **Manage apps** > **Actions** (or the settings button) > **Org-wide app settings**. Under **Custom apps**, turn on **Let users interact with custom apps** (the label may end with "in preview"). **Save**.
3. **Teams apps** > **Setup policies** > **Add**.
   - Name `AA app testers`, description `Can upload the Agency Artifact test app`.
   - Turn on **Upload custom apps**. Change nothing else. **Save**.
4. Tick the `AA app testers` row (make sure no other row is ticked) > **Manage users** > **Assign users** > add yourself and `aa.test` > **Apply**.

A grey banner on the Setup policies page says app setup policies have changed and apps are now installed from the Manage apps page. The **Upload custom apps** switch is still in the policy (seen 2026-10-13).

Check:
- [ ] Org-wide **Custom apps**: the section has two switches, **Let users install and use available apps by default** and **Let users interact with custom apps in preview**. Both On (seen 2026-10-13).
- [ ] Policy `AA app testers`: **Upload custom apps** On, **User pinning** On (seen 2026-10-13).
- [ ] The policies page cannot list who a policy is assigned to (its **Manage users** menu only offers *Assign users* and *Bulk unassign users*). Check per user instead: <https://admin.teams.microsoft.com/users> > click the user > **Policies** tab > **App setup policy** reads `AA app testers`. Do it for yourself and for `aa.test`.
- [ ] Later (allow a few hours): in Teams, **Apps** > **Manage your apps** shows **Upload an app** > **Upload a custom app** for both accounts.

## 4. Register the app

Follow `docs/setup/entra-app.md`. Paste the client ID and tenant ID into
`src/config.ts`, or send them to Claude Code to do it (they are configuration,
not secrets).

## 5. SharePoint sites and lists

Follow `docs/setup/sharepoint-sites.md`.

## 6. India test device

For the date-boundary case. On a phone or laptop where `aa.test` is signed in
to Teams, set the device time zone to India (Asia/Kolkata, UTC+05:30):
- iPhone: **Settings** > **General** > **Date & Time** > turn off **Set Automatically** > **Time Zone** > Kolkata.
- Android: **Settings** > **System** > **Date & time** > turn off automatic time zone > **Time zone** > India.
- Windows: **Settings** > **Time & language** > **Date & time** > turn off **Set time zone automatically** > (UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi.

Switch it back after the test.

## Send back to Claude Code

- Client ID and tenant ID (part 4).
- Tenant host name `<tenant>.sharepoint.com` and the two site URLs (part 5).
- Anything on screen that did not match these steps, with its exact wording.

## Sources (checked 2026-10-13)

| Step | Source |
|---|---|
| Add a user, license, roles; Dashboard and Simplified views; "Global admins" filter | [Add users and assign licenses](https://learn.microsoft.com/en-us/microsoft-365/admin/add-users/add-users) (updated 2026-04-28) |
| Org-wide custom app setting, app setup policy "Upload custom apps", assignment | [Manage custom app policies and settings](https://learn.microsoft.com/en-us/microsoftteams/teams-custom-app-policies-and-settings) (updated 2026-04-14) |
| Policy delay "a few hours" | Not stated for setup policies on that page (it says "a few hours" for admin-uploaded apps). Assumed similar |
| Device time zone menus | Not checked against vendor docs; menu names vary by OS version |
