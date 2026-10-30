import { z } from "zod";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { body, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { addLocalDays } from "@/lib/time";
import { businessDate } from "@/lib/stock";

const Patch = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().toLowerCase().min(1).max(40).optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  body: z.string().trim().max(4000).optional(),
  available: z.boolean().optional(),
  availabilityNote: z.string().trim().max(200).nullable().optional(),
  active: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  /** null = the business's default (Settings → Stock). */
  stockMode: z.enum(["none", "daily", "tracked"]).nullable().optional(),
  /** Services: in person (the business address) rather than an online meeting link. */
  inPerson: z.boolean().optional(),
  /** "on"; "today" = sold out today (back on next business day by itself); "until_on" = off until turned back on. */
  off: z.enum(["on", "today", "until_on"]).optional(),
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const { off, ...b } = await body(req, Patch);
  const [before] = await db.select().from(t.kbItems).where(and(eq(t.kbItems.id, id), eq(t.kbItems.workspaceId, s.workspaceId)));
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const switched = off === undefined ? {} : off === "today" ? { available: true, unavailableUntil: addLocalDays(businessDate(ws), 1) } : { available: off === "on", unavailableUntil: null, ...(off === "on" ? { availabilityNote: null } : {}) };
  const [item] = await db
    .update(t.kbItems)
    .set({ ...b, ...switched, updatedAt: new Date() })
    .where(and(eq(t.kbItems.id, id), eq(t.kbItems.workspaceId, s.workspaceId)))
    .returning();
  if (!item) throw new HttpError(404, "Not found");
  const fields = [...Object.keys(b), ...(off ? ["off"] : [])];
  const props: Record<string, unknown> = { itemId: id, title: item.title, fields };
  if (off) props.off = off;
  if (b.stockMode !== undefined) props.stockMode = b.stockMode;
  if (b.inPerson !== undefined) props.inPerson = b.inPerson;
  if (b.available !== undefined || off) {
    props.available = item.available;
    props.unavailableUntil = item.unavailableUntil;
    props.availabilityNote = item.availabilityNote ?? null;
    if (!fields.includes("availabilityNote")) fields.push("availabilityNote");
  }
  if (b.title !== undefined && before && before.title !== item.title) props.previousTitle = before.title;
  await audit(s, "kb.updated", props);
  return ok({ item });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await apiSession(["owner", "service"]);
  const { id } = await ctx.params;
  const [item] = await db.select({ title: t.kbItems.title }).from(t.kbItems).where(and(eq(t.kbItems.id, id), eq(t.kbItems.workspaceId, s.workspaceId)));
  await db.delete(t.kbItems).where(and(eq(t.kbItems.id, id), eq(t.kbItems.workspaceId, s.workspaceId)));
  if (item) await audit(s, "kb.deleted", { itemId: id, title: item.title });
  return ok({ ok: true });
});
