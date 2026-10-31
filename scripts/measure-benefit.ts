// Prints the Phase 2 measures from the database. Read-only for a real business; --synthetic also makes a labelled test
// run in a throwaway business, on a local database only.
//   npm run measure -- --workspace FORNO7          real records of one business
//   npm run measure -- --workspace FORNO7 --demo   its records labelled as demo data
//   npm run measure -- --synthetic [--keep]        20 synthetic orders; --keep leaves the business in place afterwards
import "./env";
import { eq } from "drizzle-orm";
import { db, t, sql } from "@/db";
import { benefitReport, measureBenefit } from "@/lib/benefit";
import { runSyntheticOrders } from "./synthetic-orders";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => (flag(name) ? args[args.indexOf(name) + 1] : undefined);
const local = () => ["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL || process.env.POSTGRES_URL || "http://none").hostname);

try {
  if (flag("--synthetic")) {
    if (!local()) throw new Error("--synthetic writes test records, so it only runs against a local database.");
    const workspaceId = await runSyntheticOrders();
    console.log(`SYNTHETIC RUN: 20 test orders in throwaway business ${workspaceId}. Not customer data.\n`);
    console.log(benefitReport(await measureBenefit(workspaceId, { demo: true })));
    if (!flag("--keep")) await db.delete(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  } else {
    const workspaceId = value("--workspace");
    if (!workspaceId) throw new Error("Pass --workspace <id>, or --synthetic.");
    const demo = flag("--demo");
    console.log(`${demo ? "Records labelled as demo data" : "Real records"} of ${workspaceId}\n`);
    console.log(benefitReport(await measureBenefit(workspaceId, { demo })));
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
