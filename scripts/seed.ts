import "./env";
import { seedWorkspace } from "@/seed/run";
import { sql } from "@/db";

const withHistory = !process.argv.includes("--no-history");
await seedWorkspace({ withHistory, log: console.log });
await sql.end();
