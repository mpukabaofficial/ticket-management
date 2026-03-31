---
name: Users page selectors and component structure
description: Key selectors, aria-labels, and component behaviour for the /users page and its dialogs — needed every time E2E tests touch user management
type: project
---

Admin credentials: `admin@example.com` / `password321!` (from `backend/.env.test` / `e2e/global-setup.ts`).

**Users page (`/users`)**
- Heading: `getByRole("heading", { name: "Users" })`
- "Show deleted" checkbox: `getByLabel("Show deleted")` — id is `show-deleted`
- Create button: `getByRole("button", { name: /create user/i })`

**Create dialog**
- Triggered by "Create User" button; `role="dialog"` is the container
- Form labels are `Name`, `Email`, `Password` (exact, via `getByLabel("Name")` etc.)
- Submit button text: `"Create User"` (pending: `"Creating..."`)
- Success toast: `"User created successfully"`

**Edit dialog**
- Trigger: `getByRole("button", { name: "Edit {userName}" })` (aria-label pattern)
- Dialog heading: `"Edit User"`
- Password placeholder: `"Leave empty to keep unchanged"` — field label is still `"Password"`
- Submit button text: `"Save Changes"` (pending: `"Saving..."`)
- Success toast: `"User updated successfully"`

**Delete flow**
- Trigger: `getByRole("button", { name: "Delete {userName}" })` (aria-label; only for non-ADMIN)
- Container: `role="alertdialog"` with heading `"Delete User"`
- Confirm button: `getByRole("button", { name: /^delete$/i })` (exact to avoid matching "Delete User" heading)
- Cancel button: `getByRole("button", { name: /cancel/i })`
- Success toast: `"User deleted successfully"`

**Table row lookup**
- `getByRole("row", { name: /email@example\.com/i })` — rows include all cell text so email is a reliable unique anchor
- Deleted rows have `opacity-50` class and a `"Deleted"` badge alongside the role badge
- STRICT MODE TRAP: A table row's accessible name is built from ALL its cell text. `row.getByText("Admin")` will match the name cell, part of the email cell, AND the badge — causing a strict-mode violation. Always scope assertions inside a row to a specific cell: `row.getByRole("cell", { name: "Admin", exact: true })`. For badge text use `row.getByText("ADMIN", { exact: true })` — this works because exact matching limits it to the badge `<span>`.

**Show deleted toggle behaviour**
- Default: `showDeleted = false` — deleted rows filtered out of table
- Toggle on: deleted rows visible, `opacity-50` class, "Deleted" badge shown

**Why:** These selectors were verified against the actual component source in `UsersTable.tsx` and `UserFormDialog.tsx` during the first E2E test writing session.

**How to apply:** Use these selectors directly when writing or updating E2E tests for the /users page. Verify if component source changed before trusting this memory.
