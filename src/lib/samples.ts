// Sample businesses: fictional workspaces anyone can try from the public site.
import { db, t } from "@/db";
import { eq, sql } from "drizzle-orm";
import { env } from "./env";

export async function sampleWorkspaces() {
  return db
    .select({ id: t.workspaces.id, name: t.workspaces.name, type: sql<string>`${t.workspaces.settings}->'business'->>'type'` })
    .from(t.workspaces)
    .where(sql`(${t.workspaces.settings}->>'sample')::boolean is true`)
    .orderBy(t.workspaces.createdAt);
}

/** Which business a simulator message goes to: a requested sample, else the signed-in user's own, else the demo. */
export async function simulatorWorkspace(requested: string | null | undefined, own: string | null): Promise<string | null> {
  const ref = requested?.toUpperCase();
  if (ref && ref !== own) {
    const [w] = await db.select({ id: t.workspaces.id, settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, ref));
    return w?.settings.sample ? w.id : null;
  }
  return own ?? ref ?? env.demoWorkspaceId;
}
