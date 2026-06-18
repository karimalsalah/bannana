/**
 * Primary database connection — Neon Postgres via postgres.js + Drizzle ORM.
 *
 * The `db` export is lazy: if DATABASE_URL is missing at import time the module
 * loads without throwing so the frontend/type-checker can import schema types
 * without a live connection string. A call to any query method will throw naturally
 * when the connection is attempted without credentials.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | undefined;

function getDb(): DrizzleDb {
  if (_db) return _db;
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error(
      "[banana-protocol] DATABASE_URL is not set. Set it in your environment before querying.",
    );
  }
  const client = postgres(url, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

/**
 * Drizzle ORM instance connected to Neon Postgres.
 * Lazy — safe to import in modules that may run without a live DB (e.g. type checks).
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export * from "./schema.js";
