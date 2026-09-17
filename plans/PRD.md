# DevTask — Product Requirements Document

> Source: user brief, 2026-09-17. This is the canonical spec for the project.
> Logo: `assets/devtask-logo.png`

## 1. Overview

DevTask is a personal, offline-first project and task management app designed specifically for a software developer who works on multiple projects simultaneously.

The purpose of the app is to help manage all active projects, organize their tasks, track deadlines and payments, and — most importantly — make sure the user knows what to work on **today**.

The app must be:

- Completely offline, local-first
- No backend, no account/login, no cloud sync, no backup requirement
- Fast and responsive
- Personal use
- **React Native**
- Highly polished visually; modern, professional; **no UI slop**

Losing data is acceptable. Simplicity and reliability matter more than cloud backup/sync.

## 2. Core Concept

DevTask must NOT feel like Jira/Asana/generic PM tooling. Opening the app answers one question: **"What do I need to work on today?"**

Relative periods turn into actionable daily work automatically:

- Task: "Implement WhatsApp template editor"
- Start working after: 2 days · Work/deadline period: 1 week
- DevTask calculates actual dates.
- After 2 days: notification "🔵 It's time to work on …" → task appears in Today.
- If not finished: Mark done / Continue / Postpone / Block.
- Deadline approaching → warning if still incomplete.

## 3. Projects

Fields: Title, Owner, Creation/start date, Deadline period, Calculated deadline, Payment info, Tasks, Overall progress.

Deadline entered as a **period**, not a date: 1 day, 2 days, 3 days, 1 week, 2 weeks, 1 month, 2 months… App calculates actual deadline from creation/start date.

## 4. Project Dashboard

Example:

```
Sadah CRM
████████████░░░ 78%
Deadline: 2 weeks remaining
Payment: $5,000 pledged · $3,000 paid · $2,000 remaining
Tasks: 12 total · 9 done · 1 in progress · 1 blocked · 1 todo
```

Shows: completed, active, blocked, overdue, upcoming tasks, payment history. Progress auto-calculated from tasks.

## 5. Owners

One owner per project. Select existing or "+ Add new owner" inline. Owner fields: Name, Company, Phone, Email, Notes. Keep simple.

## 6. Project Payments

Optional. Pledged amount + individual payments (amount, date, note). Currency USD.

```
Pledged: $5,000
Payments: Sep 03 $1,000 · Sep 10 $2,000
Total paid: $3,000 → Remaining: $2,000  (= Pledged − Total)
```

## 7. Tasks

Fields: Title, Project, Status, Priority, Start/trigger period, Deadline period, Calculated start date, Calculated deadline, Estimated work time, Notification settings, Blocked status/reason, Created date, Completed date, Postponement history.

## 8. Task Status

Four statuses: **To Do · In Progress · Blocked · Done**.

Flow: To Do → In Progress → Done; In Progress → Blocked → In Progress.
Status change must be extremely easy (swipe/tap → [Start] [Done] [Postpone]).

## 9. Task Deadlines and Relative Periods

Same relative logic as projects:

```
created → +trigger (e.g. 2 days) → start notification → +deadline (e.g. 1 week) → deadline
```

Preserve BOTH the original rule and calculated date:

```
triggerValue: 2, triggerUnit: days    → triggerAt: 2026-09-17
deadlineValue: 1, deadlineUnit: week  → deadlineAt: 2026-09-24
```

Units (extensible): days, weeks, months.

## 10. Task Work Time

Optional estimate, distinct from deadline: 15m, 30m, 1h, 2h, 4h… Enables daily/weekly workload views.

## 11. Today Screen (most important screen)

```
Good morning 👋
Tuesday, September 15
TODAY — 5 tasks · 3h 40m planned
────────────────────
Qistar    ● Implement property filters   1h 30m · To Do · Due today
Sadah     ◐ WhatsApp template editor     1h · In Progress
Client CRM ⚠ Fix invoice calculation     45m · Overdue
Alba3ati  ✓ Push notification testing    25m · Done
────────────────────
3 / 5 completed
UP NEXT — Tomorrow · 3 tasks
```

Priority order: 1. Overdue → 2. Today → 3. Approaching deadline → 4. Upcoming. Group by project where appropriate.

## 12. Daily Workflow

To Do → In Progress → Done with minimal interaction. Quick actions: Start / Complete / Postpone / Block.

## 13. Task Postponement

Fast: options Tomorrow / In 2 days / Next week / Custom.
Postponing does NOT move the actual deadline unless explicitly chosen (prevents hiding deadline problems). Maintain postponement history.

## 14. Notifications (local only, no backend)

Types:
- **Daily 9:00 AM**: "☀️ Good morning — You have 5 tasks scheduled for today."
- **Task start** (at calculated triggerAt, 9 AM default): "🔵 It's time to work on …"
- **Deadline warning** (configurable: 1/2/3 days before): "⚠️ Deadline tomorrow …"
- **10 PM unfinished**: "🌙 You have 3 unfinished tasks today." with Complete/Postpone actions.
- **Blocked reminder** (at blockedReminderAt): "🔴 Blocked task reminder …"

Must be resilient to app closed/backgrounded/device restart/date changes.

## 15–21. (Consolidated)

- **Blocked tasks**: optional reason + reminder date; Unblock → In Progress (or chosen status).
- **Overdue**: stay visible until completed; visually obvious, not overwhelming; actions: Complete/Start/Postpone/Change deadline/Block.
- **Upcoming**: Tomorrow 3 tasks, Thursday 2… lightweight, not a calendar.
- **Weekly workload**: bar chart Mon–Fri + per-project hours (e.g. Planned 27h / Available ~35h; Sadah 12h, Qistar 7h…). Lightweight viz only.
- **Tasks screen**: global, across projects. Filters: All/Today/Upcoming/Overdue/In Progress/Blocked/Done + Project/Owner/Priority/Deadline. Search.
- **Projects screen**: cards with progress bar, tasks x/y, time remaining, $ remaining. Sort/filter: Active/Completed/Deadline/Progress/Owner.

## 24–26. Data Architecture

```
React Native → UI → Zustand → SQLite → Local Notifications
```

No backend/API/auth/cloud DB/accounts/sync/push server. All data on device.

Entities: `projects`, `owners`, `tasks`, `payments`, `task_postponements`, `notifications`, `settings`.

Data model (conceptual; improvable in implementation but MUST preserve rule-vs-calculated-date distinction):

```ts
Project { id, title, ownerId, createdAt, deadlineValue, deadlineUnit, deadlineAt, pledgedAmount, updatedAt }
Task { id, projectId, title, status, priority, createdAt,
       triggerValue, triggerUnit, triggerAt,
       deadlineValue, deadlineUnit, deadlineAt,
       estimatedMinutes, blockedReason, blockedReminderAt, completedAt, updatedAt }
Payment { id, projectId, amount, date, note, createdAt }
TaskPostponement { id, taskId, fromDate, toDate, createdAt }
```

## 27. UI/UX Requirements

Polish level: **Linear / Things / Raycast** — but DevTask's own identity.

- Excellent typography, strong hierarchy, consistent spacing
- Minimal decoration, subtle borders, very restrained shadows
- Smooth animations, haptics where appropriate, fast interactions
- Clear empty states; excellent dark AND light mode; consistent iconography; accessible contrast; proper touch targets
- No card overload, no excessive gradients, no generic "AI dashboard" aesthetic
- Color = meaning only: To Do neutral · In Progress blue · Blocked red/orange · Done green · Overdue red. Interface NOT color-saturated.

## 28–33. Interaction Design

- Complete: swipe → Done. Postpone: swipe → Postpone → Tomorrow. Start: tap → Start. Block: tap → Block → optional reason.
- **Adding a task < 10 seconds.**
- Global prominent "+" → quick create Project / Task / Payment (task most common).
- Project progress = done/total % (work-time weighting later).
- Priority: None/Low/Medium/High/Urgent — visually subtle, affects Today ordering.
- Today = daily plan with visible completion progress (e.g. ██████████████░░ 80% · 4/5).
- Empty states designed intentionally ("You're all caught up 🎉" / "No projects yet").

## 34–36. Settings & Performance

Settings: notifications (master toggle, daily time, EOD time, deadline warning period), appearance (System/Light/Dark), defaults (duration, priority, postponement options), data (Clear all / Export JSON / Import JSON — optional but useful).

No auto-backup; data disposable; manual export only.

Performance: instant Today, instant status changes, instant create, smooth nav, no spinners for local ops, indexed queries.

## 37. MVP Scope

- Projects: CRUD, owner, relative deadline, calculated deadline, progress
- Tasks: CRUD, project, status, priority, relative start/deadline, work time, blocked state + reason, postponement
- Today: today/overdue/upcoming, progress, quick actions
- Notifications: 9 AM daily, task start, deadline warning, 10 PM unfinished, blocked reminder
- Payments: pledged, payments, remaining, history
- Data: SQLite, fully offline, local notifications
- UI: premium polish, light/dark, smooth interactions, haptics

## 38. Product Philosophy

> "Don't make me manage the task manager. Make the task manager manage my work."

Continuous conversion of project plans into clear daily actions. Not an enterprise PM platform — a personal execution system.
