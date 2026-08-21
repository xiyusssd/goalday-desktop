# GoalDay · 目标日

A local-first goal & weekly planning desktop app. The core loop is a **Todo → Doing → Done** workflow with **drag-and-drop weekly scheduling**, **journal review**, and **stats**, plus optional cloud sync and Chinese/English bilingual UI.

Built with **Tauri v2 + React + TypeScript**. The frontend is plain web tech, so the same `src/` code can be reused for iOS / Android via Tauri Mobile.

## Features

- **Day plan** — split each day into morning / afternoon / evening; drag a task into a slot, or keep it in the "today's todos" or "inbox" list. Flip days or jump back to today.
- **Week board** — seven columns (Mon–Sun); drag tasks from the inbox onto any day, or quick-add directly in a column.
- **Home** — time-based greeting, today's completion ring, completion-rate / streak / total-done cards, and lists for today / overdue / in-progress tasks plus goal progress bars.
- **Money** — log income / expenses (8 expense + 4 income categories with icons), monthly summary, and an expense-breakdown bar chart.
- **Fitness** — log workouts (8 types + duration / calories / sets), weekly count / duration / streak, a weekly volume chart, and the day's workout list.
- **Notes** — sticky-note cards with pinning, 7 colors, live search, and a side drawer editor.
- **Journal** — per-day review with a 5-level mood picker.
- **Stats** — completion rate, total done, streak, a per-day completion chart, and progress by goal.
- **Goals** — manage goals (name + color) in Settings; link tasks to goals and track progress per goal.
- **Task detail** — click any card to open a side drawer: title, start / due date, priority (low / medium / high), recurrence rule, linked goal, notes.
- **Recurring tasks** — daily / weekly / monthly; instances are materialized onto the days you view, each completing independently.
- **Delete dialog** — delete a single day only, or the whole recurring series; undo within a few seconds.
- **"Not done — log why"** — clear a task and write the reason straight into that day's journal.
- **Search & filter** — keyword search plus priority / goal filters on planner views.
- **Keyboard shortcuts** — `1`–`9` switch views, `n` quick-add, `/` search, `?` help, `Esc` close.
- **Backup** — export / import all data as JSON (import merges by update time).
- **Dark mode** — light / dark / follow system.
- **Cloud sync (optional)** — plug in your own Supabase project for multi-device realtime sync; otherwise it stays fully offline.
- **Bilingual** — switch between Chinese and English in Settings.

Data is stored in `localStorage`; with cloud sync enabled it merges through Supabase (last-write-wins, including soft deletes).

## Tech stack

| Layer | Choice |
|-------|--------|
| Desktop shell | Tauri v2 (Rust) |
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Drag & drop | @dnd-kit |
| Dates | Day.js |
| Cloud | Supabase (Postgres + Auth) |

## Getting started

> ⚠️ **Note:** the default `node` on some machines points to ChatGPT.app's bundled Node (library-validation hardened), which can't load native modules like rollup/esbuild. Use a standalone Node (e.g. `brew install node`, `/opt/homebrew/bin/node`). `dev.sh` / `build.sh` pick a working Node automatically.

```bash
pnpm install   # first time
./dev.sh       # start the desktop app (starts Vite automatically)
```

## Build

```bash
./build.sh                  # release build → .app
./build.sh --bundles dmg    # also produce a .dmg
```

Apple Silicon output:

- `.app`: `src-tauri/target/release/bundle/macos/GoalDay.app`
- `.dmg`: `src-tauri/target/release/bundle/dmg/GoalDay_0.1.0_aarch64.dmg`

> `build.sh` builds only `.app` by default. The `.dmg` step drives Finder via Apple Events to lay out the window, which fails with `-1743` unless the terminal is granted "Automation" permission. Grant it under **System Settings → Privacy & Security → Automation → Finder**, then run `./build.sh --bundles dmg`.
>
> Also avoid `pnpm tauri build` on macOS — esbuild's install script check will block it.
>
> Binaries are not code-signed / notarized; first launch needs right-click → Open (or allow under Privacy & Security).

## Windows (Win10 / Win11)

The same code builds for Windows, but it can't be cross-compiled from macOS (needs the MSVC toolchain + WebView2 linking), so the Windows package is built on GitHub Actions — see `.github/workflows/windows-build.yml`.

It produces an **NSIS installer (`.exe`)** with WebView2 auto-install (Win10), a Chinese/English install UI, and per-user (no admin) installation.

**To build the installer:**

1. Push this repo to GitHub.
2. Trigger a build, either:
   - **Tag a release:** `git tag v0.1.0 && git push origin v0.1.0` — CI creates a GitHub Release and attaches the `.exe`.
   - **Manually:** repo **Actions → Windows Build → Run workflow** — download `goalday-windows-nsis` from that run's **Artifacts**.
3. Install `GoalDay_0.1.0_x64-setup.exe` on the target machine.

> Also unsigned, so SmartScreen may show "Unknown publisher" — click **More info → Run anyway**.

### Windows smoke test (automatic)

Compiling isn't enough to prove the app actually runs on Windows. `.github/workflows/windows-smoke.yml` (on push to `main`, PRs, or manual trigger) runs the app on a Windows runner:

- **Layer 1 · launches without crashing (hard gate)** — builds a debug binary, starts it, waits 8s, and asserts the process is still alive. This catches missing WebView2 / DLL / init failures.
- **Layer 2 · UI renders and is interactive (best-effort)** — drives the running window via `tauri-driver` + WebDriver, asserting the sidebar, branding text, and navigation don't crash. This is `continue-on-error` because it depends on msedgedriver matching the Edge version, which is inherently flaky in CI.

The smoke script lives in `webdriver/` (separate deps, not in the main `package.json`).

## Cloud sync (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query** and run the whole `supabase-schema.sql` from the repo root. It creates the `tasks` / `journals` / `goals` / `transactions` / `workouts` / `notes` tables + indexes and enables RLS so each user only reads/writes their own rows. It's idempotent (`create ... if not exists`).
3. Under **Settings → API**, copy the **Project URL** and **anon / public key** (never the `service_role` key).
4. In the app, open **Settings → Cloud sync** and paste both, then save.
5. Sign up / sign in with email:
   - ⚠️ **Email confirmation is on by default** — confirm the link in your inbox before signing in. To skip it (self-hosted use only), disable "Confirm email" under **Authentication → Providers → Email**.
6. The app auto-syncs once after login; local changes then push after a 1.5s debounce. The sync dot in the sidebar bottom shows state (green = synced / yellow = syncing / red = failed / gray = local only).

Sync is **last-write-wins**: rows merge by `id`, newest `updatedAt` wins, and soft deletes (`deleted=true`) carry `updatedAt` so deletions propagate correctly.

## Testing

```bash
pnpm test   # node --experimental-strip-types --test, no extra deps
```

Unit tests cover date / finance / fitness / recurrence / stats / storage and the sync-core mapping + merge logic.

## Project structure

```
goalday-desktop/
├── src/                  # React frontend
│   ├── components/       # views & UI (Day, Week, Home, Money, Fitness, …)
│   ├── lib/              # date, finance, fitness, storage, supabase, sync, hotkeys, i18n
│   └── store/            # Zustand slices (task, goal, journal, finance, fitness, note)
├── src-tauri/            # Tauri (Rust) shell, capabilities, icons
├── scripts/              # icon generation (make_icon.py / make-icon.sh)
├── webdriver/            # Windows runtime smoke test
├── .github/workflows/    # Windows build + smoke CI
├── supabase-schema.sql   # optional cloud-sync schema
├── dev.sh / build.sh     # Node-aware dev & build helpers
└── README.md
```

## Roadmap

- **Mobile** — reuse the same `src/` via Tauri Mobile for iOS / Android; the data & sync layer is already platform-agnostic (`localStorage` + Supabase), so mainly the local-storage adapter changes.