import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type Db = NodePgDatabase<typeof schema>;

let poolInstance: pg.Pool | undefined;
let dbInstance: Db | undefined;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  return url;
}

/** Lazy pool — safe to import without DATABASE_URL until first query (Next/Vercel build). */
export function getPool(): pg.Pool {
  if (!poolInstance) {
    const connectionString = requireDatabaseUrl();
    const forceSsl =
      process.env.DATABASE_SSL === "true" ||
      /neon\.tech|sslmode=require/i.test(connectionString);
    const disableSsl =
      process.env.DATABASE_SSL === "false" || /sslmode=disable/i.test(connectionString);
    poolInstance = new Pool({
      connectionString,
      // Neon / Vercel: use the pooled connection string from the Neon console.
      max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 5,
      ssl: !disableSsl && forceSsl
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" }
        : undefined,
    });
  }
  return poolInstance;
}

export function getDb(): Db {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

/** Back-compat lazy exports used across api-server and Next route handlers. */
export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getPool(), prop, receiver);
    return typeof value === "function" ? (value as Function).bind(getPool()) : value;
  },
});

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    return typeof value === "function" ? (value as Function).bind(getDb()) : value;
  },
});

export * from "./schema";
