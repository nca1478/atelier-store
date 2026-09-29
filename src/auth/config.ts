import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/connection';
import { users, sessions, accounts, verifications } from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    // The schema keys are plural ("users", not "user"), so Better Auth has to look up
    // `<model>s` when resolving tables. Without this it reports a schema mismatch and
    // every model lookup misses.
    usePlural: true,
    schema: {
      users,
      sessions,
      accounts,
      verifications,
    },
  }),
  user: {
    additionalFields: {
      // `input: false` keeps `role` out of the sign-up and update-user request
      // bodies: a client that posts `{"role":"admin"}` gets it stripped rather
      // than stored. `defaultValue` is what Better Auth writes on sign-up; the
      // column default in src/db/schema/users.ts backs it at the database level.
      role: { type: 'string', required: false, input: false, defaultValue: 'user' },
    },
  },
  session: {
    // Sessions live in the `sessions` table, so signing in survives a restart —
    // only the cookie is client-side. Seven days, renewed at most once a day on
    // return visits, which is why a signed-in visitor rarely meets the form
    // again.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: {
      // Better Auth invents its own primary keys, and by default that is a
      // 32-character nanoid like `1HecjtcyfYxwmjkEcMtTYUvomCyRs4ay` — which
      // Postgres rejects for the `uuid` columns in src/db/schema/users.ts, since
      // Better Auth supplies the id instead of letting `defaultRandom()` run.
      // "uuid" makes it call `crypto.randomUUID()` and the two agree again.
      generateId: 'uuid',
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;