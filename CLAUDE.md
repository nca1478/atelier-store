# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

This is an early-stage Next.js 16 (App Router, Turbopack) storefront. Authentication (Better Auth) and the
database layer (Drizzle ORM + Postgres) are wired up; no product/store features exist yet beyond the default
`create-next-app` scaffold.

## Commands

```bash
npm run dev          # start dev server (Turbopack)
npm run build         # production build
npm run start          # run production build
npm run lint            # ESLint (flat config, eslint-config-next)

npm run db:generate   # generate SQL migrations from src/db/schema/* (drizzle-kit generate)
npm run db:push        # push schema directly to the database (no migration files)
npm run db:migrate      # apply generated migrations
npm run db:studio        # open Drizzle Studio
```

There is no test runner configured in this repo.

## Architecture

- **Path alias**: `@/*` maps to `src/*` (see `tsconfig.json`).
- **`src/db/`** — Drizzle ORM setup.
  - `connection.ts` exports `db` (drizzle instance over `postgres-js`) and `client`, reading `DATABASE_URL`.
  - `schema/` — one file per table domain, re-exported through `schema/index.ts`. `users.ts` currently defines
    the four Better Auth tables: `users`, `sessions`, `accounts`, `verifications`. Add new tables as sibling
    files and re-export them from `index.ts`.
  - `src/lib/db.ts` re-exports `db`/`DB` from `src/db/connection.ts` for app code to import.
  - `drizzle.config.ts` points at `src/db/schema/*` and outputs migrations to `./drizzle`.
- **`src/auth/config.ts`** — the single Better Auth server instance (`auth`), configured with the Drizzle
  adapter (`provider: 'pg'`) and mapped to the schema tables above. Email/password auth is enabled; GitHub and
  Google social providers are configured via env vars. Exports inferred `Session`/`User` types via
  `auth.$Infer`.
- **`src/app/api/auth/[...all]/route.ts`** — mounts the Better Auth handler for all `/api/auth/*` routes via
  `toNextJsHandler(auth)`. This is the only API route; don't hand-roll auth endpoints elsewhere.
- **`src/lib/auth-client.ts`** — client-side Better Auth instance (`createAuthClient`) for use in Client
  Components, exporting `signIn`, `signUp`, `signOut`, `useSession`. Points at
  `NEXT_PUBLIC_BETTER_AUTH_URL` (falls back to `http://localhost:3000`).

## Environment variables

See `.env.example`: `DATABASE_URL` (Postgres, required), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and optional
`GITHUB_CLIENT_ID`/`SECRET` and `GOOGLE_CLIENT_ID`/`SECRET` for OAuth. Add `NEXT_PUBLIC_BETTER_AUTH_URL` when
deploying somewhere other than `localhost:3000`, since `auth-client.ts` reads it directly.

## Working in this Next.js version

Read `AGENTS.md` first: this project's `node_modules/next` may include breaking changes vs. the Next.js you
were trained on. Check `node_modules/next/dist/docs/` for the current API before writing routing, data
fetching, or config code.
