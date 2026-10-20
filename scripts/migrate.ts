import "./env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const reset = process.argv.includes("--reset");
const url = process.env.DATABASE_URL_LISTEN ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = postgres(url, { max: 1, onnotice: () => {} });

if (reset) {
  console.log("Dropping schema public…");
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  await sql`CREATE SCHEMA public`;
}
await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
console.log("Migrations applied.");
await sql.end();
