import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type DB = PostgresJsDatabase<typeof schema>;

// The client and the drizzle instance are created on first use instead of at module
// load. `next build` evaluates every route module to collect page data — including
// /api/auth/[...all], which reaches this file through `auth` — so a missing or
// unparseable DATABASE_URL must not throw before any page is prerendered.
let client: ReturnType<typeof postgres> | undefined;
let instance: DB | undefined;

export function getClient(): ReturnType<typeof postgres> {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set. See .env.example for the expected shape.');
    }
    client = postgres(connectionString);
  }
  return client;
}

export function getDb(): DB {
  if (!instance) {
    instance = drizzle(getClient(), { schema });
  }
  return instance;
}

/**
 * Lazy stand-in for the drizzle instance: forwards every property access to the real
 * `db` and only opens the connection when something actually queries. Callers keep
 * importing `db` directly; better-auth's drizzle adapter holds this reference across
 * module evaluation without touching the database.
 */
export const db = new Proxy({} as DB, {
  get(_target, property) {
    const real: object = getDb();
    return Reflect.get(real, property, real);
  },
  has(_target, property) {
    return Reflect.has(getDb(), property);
  },
  ownKeys() {
    return Reflect.ownKeys(getDb());
  },
  getOwnPropertyDescriptor(_target, property) {
    return Reflect.getOwnPropertyDescriptor(getDb(), property);
  },
});
