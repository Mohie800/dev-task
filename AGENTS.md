# AGENTS.md — dev-task-mobile

Personal offline-first task manager. Spec: `../plans/PRD.md`. Roadmap: `../plans/ROADMAP.md`.

## Stack
Expo SDK 57 · React Native 0.86 · TypeScript strict · expo-router (SDK 57 = NO react-navigation — do not import it) · Zustand · expo-sqlite · expo-notifications · date-fns · Inter fonts.

## Architecture
- `app/` — expo-router routes. `(tabs)` = Today / Tasks / Projects / Settings. Modals: `project/edit`, `task/edit`.
- `src/theme/` — design tokens (colors light/dark, spacing, type, radius, shadows). Color = status meaning ONLY (no UI slop, PRD §27).
- `src/db/` — SQLite (WAL, FK on). Migrations in `src/db/migrations/` (append, never edit applied ones). Repos in `src/db/repos/`.
- `src/lib/periods.ts` — relative-period engine. Rules (value+unit) preserved next to calculated dates. Month-clamped.
- `src/lib/taskQueries.ts` — Today/overdue/upcoming selectors (pure functions).
- `src/lib/notifications.ts` — rescheduleAll() re-arms everything on data changes. Scheduled notifications survive reboot.
- `src/stores/` — zustand (data cache + settings).

## Rules
- Screen refresh via `usePathname()` effect (SDK 57 router has no useFocusEffect).
- Postponing a task NEVER moves its deadline (PRD §13); history goes to `task_postponements`.
- Dates stored as UTC ISO strings; day comparisons in JS via date-fns, not SQL.
- Adding a task must stay under 10 seconds (PRD §28) — no required fields beyond title + project.

## Commands
- Typecheck: `npx tsc --noEmit`
- Bundle check: `CI=1 npx expo export --platform android`
- Native build: `cd android && ./gradlew assembleRelease` (needs `ANDROID_HOME=/root/Android/Sdk`)
