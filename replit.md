# LifePath 2.0

*The App That Fixes What Life Breaks* — a science-backed personal development system grounded in peer-reviewed behavioural science and clinical research.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/lifepath run dev` — run the web app (port 22368)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React + Vite + Tailwind CSS + framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Fonts: Syne (headings) + DM Sans (body) from Google Fonts

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth (all endpoints)
- `lib/db/src/schema/` — Drizzle DB schemas (users, tasks, urges, streaks, rooms, etc.)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/lifepath/src/` — React web app

## Architecture decisions

- Single-user model for MVP: all endpoints derive userId from the first user in the DB
- Life Score is computed on-the-fly from task completion, sessions, urges, streaks, and mood logs
- Procrastination risk is a heuristic score recalculated per request from today's task state
- Streak milestones are hard-coded constants backed by published neuroscience (Lembke, Volkow, etc.)
- Daily insights rotate deterministically by day-of-year (no random seed, always same insight per day)

## Product

LifePath 2.0 has three science-backed modules:

1. **Procrastination Killer** — Temporal Motivation Theory, Tiny Habits (BJ Fogg), Implementation Intentions (Gollwitzer), self-compassion recovery (Sirois), Temptation Bundling (Milkman)
2. **Addiction & Compulsive Habit Recovery** — Dopamine seesaw (Lembke), HALT method, Urge Surfing (ACT/Hayes), Neurological recovery timeline (fMRI research)
3. **Body Doubling** — Social facilitation (Zajonc), Flow states (Csikszentmihalyi), Pomodoro timing, virtual room presence

All modules feed into a unified **Life Score** (0–100), with a **Simulation Engine** showing Current Path vs Goal Path as the user builds habits.

## User preferences

- Founded by Muslim Abubakar Toro
- Dark-only UI: background #0A0E1A, accent #2B6BFF, cyan #00C8FF, success #00E5A0
- Fonts: Syne (display) + DM Sans (body) — never Inter, Roboto, or Arial
- Science citations must be accurate to original peer-reviewed publications

## Gotchas

- Routes /streaks and /streaks/relapse are handled by urges.ts router (mounted twice in index.ts)
- The rooms table is pre-seeded with 5 default public rooms
- Life Score upserts daily — only one score row per user per day
- After codegen, always re-run `pnpm run typecheck` to catch TS2308 collisions

## Pointers

- See `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
