# DevTask — Build Roadmap

Working doc, updated as milestones land. Spec: `PRD.md`.

## Stack decision (2026-09-17)

- **Expo (managed) + TypeScript** — SDK 57, RN 0.86
  - SQLite: `expo-sqlite` · State: `zustand` · Navigation: `expo-router` (SDK 57 — NO react-navigation)
  - Local notifications: `expo-notifications` · Haptics: `expo-haptics` · Dates: `date-fns` · Font: Inter
- Theme: custom tokens, Linear/Things restraint, color = status meaning only

## Milestones

### M0 — Scaffold ✅ `ef0636b`
Expo TS app, git, folder skeleton, theme tokens (light/dark), zustand + sqlite bootstrap.

### M1 — Data layer ✅ `d5396ba`
Repos (owners/projects/tasks/payments/settings), migration v2 (`postponed_to`), postponement history, `taskQueries.ts` selectors.

### M2–M5 — Screens + notifications ✅ `4ce8ead` `16f0978`
Today (overdue/today/completed/up-next + weekly bars), Tasks (filters + search), Projects cards, Project dashboard (progress, payments, history), task/project forms, task detail (block/unblock, postpone history), Settings (notif times, appearance, export/import/clear). Notification engine: 9AM daily, task start, deadline warning, 10PM, blocked reminders. App icon + splash from brand logo.

### M6 — Polish ✅
Haptics, swipe quick actions, brand icon + splash. **Release APK v1.0.0 built on-host** (gradle 48m, 4 ABIs), re-signed with release keystore, sha256 `de0e9a0d…e950`. Served at `http://47.236.229.201:8931/dev-task-v1.0.0.apk` (temp). Repo branch: `master`.

## Build host

- Android SDK: `/root/Android/Sdk` (platform 36, build-tools 36.0.0, NDK 27.1.12297006, cmake 3.22.1) · JDK 17
- `ANDROID_HOME=/root/Android/Sdk` required for gradle
- Release keystore: `/root/projects/dev-task/keystore/devtask-release.keystore`, alias `devtask`
- Sign flow: `assembleRelease` → zipalign → apksigner

## Notes
- Data disposable; no backup/sync in scope. Currency USD.
- Postponement never silently extends a deadline.
