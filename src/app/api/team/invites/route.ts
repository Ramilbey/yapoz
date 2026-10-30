import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { hit } from "@/lib/ratelimit";

const Body = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email"), role: z.enum(["owner", "service"]) });

/** No email service: the owner copies the link and sends it however they like (WhatsApp, Telegram, email). */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  if (!(await hit(`invite:${s.workspaceId}`, "day", 50)).ok) throw new HttpError(429, "Too many invites today.");
  const b = await body(req, Body);
  const [exists] = await db.select({ id: t.users.id }).from(t.users).where(and(eq(t.users.workspaceId, s.workspaceId), eq(sql`lower(${t.users.email})`, b.email)));
  if (exists) throw new HttpError(409, "That person is already on your team.");
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600_000);
  await db.insert(t.invites).values({ token, workspaceId: s.workspaceId, email: b.email, role: b.role, createdBy: s.userId, expiresAt });
  await audit(s, "team.invited", { email: b.email, role: b.role });
  return ok({ token, url: `${env.appUrl}/invite/${token}`, expiresAt });
});
