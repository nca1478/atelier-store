// Creates the storefront's first administrator. Idempotent: re-running only
// checks that the account exists and that it carries the admin role.
//
//   npm run db:seed:admin
//
// The credentials come from ADMIN_EMAIL / ADMIN_PASSWORD. They have to come from
// outside the app because the role cannot be granted from the sign-up form:
// src/auth/config.ts declares `role` as an additional field with `input: false`,
// so a client that posts one has it stripped. This script and a manual UPDATE are
// the only two ways to reach 'admin'.
//
// Runs through tsx for the same reason src/db/seed.ts does — see the note there
// about the extensionless barrel in ./schema.

import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { auth } from '../auth/config';
import { db, getClient } from './connection';
import { users } from './schema';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'Atelier Admin';

async function seedAdmin() {
  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set. See .env.example.',
    );
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length === 0) {
    // Better Auth's own sign-up rather than an insert of our own: it writes the
    // `accounts` row in the shape it expects for email/password ('credential',
    // accountId = the user's id) and hashes the password with the algorithm a
    // later sign-in will verify against. Safe to call with no request in flight
    // because no plugins are registered — `nextCookies`, which is what would
    // reach for `next/headers`, is deliberately absent.
    await auth.api.signUpEmail({ body: { email, password, name } });
    console.log(`Created ${email}.`);
  } else {
    console.log(`${email} already exists — leaving the account alone.`);
  }

  const [promoted] = await db
    .update(users)
    .set({ role: 'admin', updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ role: users.role });

  if (!promoted) {
    throw new Error(`No row for ${email} — the sign-up did not land.`);
  }

  console.log(`${email} now carries the '${promoted.role}' role.`);
}

seedAdmin()
  .catch((error) => {
    console.error('Admin seed failed:', error);
    process.exitCode = 1;
  })
  // Without this the postgres-js pool keeps the process alive.
  .finally(() => getClient().end());
