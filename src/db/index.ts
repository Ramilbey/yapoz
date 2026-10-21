import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Globals = { __sql?: postgres.Sql; __listenSql?: postgres.Sql };
const g = globalThis as unknown as Globals;

function url() {
  const u = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!u) {
    return "postgres://dummy:dummy@localhost:5432/dummy";
  }
  return u;
}

/** Pooled client. With Supabase use the transaction pooler (port 6543) here. */
export const sql =
  g.__sql ??
  postgres(url(), {
    max: Number(process.env.DB_POOL_MAX ?? 10),
    prepare: !/:6543\//.test(process.env.DATABASE_URL ?? ""),
    idle_timeout: 20,
    onnotice: () => {},
  });
if (process.env.NODE_ENV !== "production") g.__sql = sql;

export const db = drizzle(sql, { schema, casing: "snake_case" });
export type DB = typeof db;

/** Dedicated connection for LISTEN. Needs a session-mode connection (Supabase: port 5432 / session pooler). */
export function listenClient() {
  if (!g.__listenSql) {
    g.__listenSql = postgres(process.env.DATABASE_URL_LISTEN || url(), { max: 1, idle_timeout: 0, onnotice: () => {} });
  }
  return g.__listenSql;
}

export * as t from "./schema";
