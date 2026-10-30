// Stock: what can still be sold, and the holds orders put on it.
// Three modes per item: "none" (made to order, on or off), "daily" (a fresh quantity every business day) and "tracked"
// (an on-hand count). Placing an order holds its stock; with payments on the hold lasts holdMinutes unless a passing
// receipt or staff firm it. Availability is always computed from the holds (expires_at > now()), so it is right even if
// nothing has run since a hold lapsed; expireDueOrders only does the follow-up (status, message, log), exactly once.
import { and, asc, eq, inArray, isNotNull, isNull, lte, ne, or, sql } from "drizzle-orm";
import { db, t } from "@/db";
import type { StockMode, StockSettings } from "@/db/schema";
import { addLocalDays, fmt, localDate, minutesOf, zoned } from "./time";
import { hoursForDate, type HoursData } from "./hours";
import { lockStaff, slotTaken, when } from "./schedule";

type Ws = typeof t.workspaces.$inferSelect;
type Order = typeof t.orders.$inferSelect;
type Hold = typeof t.stockHolds.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Exec = typeof db | Tx;

export const STOCK_DEFAULTS: Omit<StockSettings, "defaultMode"> = { dayStartsAt: "00:00", holdMinutes: 20, preorderDays: 7, lowStockDefault: 5 };

/** Until the owner picks one in Settings: bakeries count per day, restaurants and services make to order, shops count stock. */
export function guessMode(businessType: string | null | undefined): StockMode {
  const b = (businessType ?? "").toLowerCase();
  if (/bak|cake|pastr|bread|patisser|kuih|donut|dessert/.test(b)) return "daily";
  if (/restaurant|caf|pizz|food|kitchen|bistro|bar\b|stall|cater|diner|salon|spa\b|studio|clinic|barber/.test(b)) return "none";
  return "tracked";
}

export function stockSettings(ws: Pick<Ws, "settings">): StockSettings {
  const s = ws.settings.stock;
  return { defaultMode: s?.defaultMode ?? guessMode(ws.settings.business?.type), ...STOCK_DEFAULTS, ...s } as StockSettings;
}

export const modeOf = (item: { stockMode: StockMode | null }, ws: Pick<Ws, "settings">): StockMode => item.stockMode ?? stockSettings(ws).defaultMode;

/** The business day `now` falls in: before dayStartsAt it is still the previous day. */
export function businessDate(ws: Pick<Ws, "settings" | "timezone">, now = new Date()): string {
  return localDate(new Date(now.getTime() - minutesOf(stockSettings(ws).dayStartsAt) * 60_000), ws.timezone);
}

/** On for that business day: not switched off, and not "sold out" until a later day. */
export const itemOn = (item: { available: boolean; unavailableUntil: string | null }, date: string) => item.available && !(item.unavailableUntil && date < item.unavailableUntil);

/** "Sat 31 Oct" for messages. */
export const dayLabel = (ws: Pick<Ws, "timezone">, date: string) => fmt(zoned(date, "12:00", ws.timezone), ws.timezone, "EEE d MMM");

/**
 * Whether customers can order daily items for `date`: not in the past, within the pre-order window, and not a closed day.
 * Returns the problem in words the assistant can pass on, or null.
 */
export function dateProblem(ws: Pick<Ws, "settings" | "timezone">, date: string, hours: HoursData | null, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return `“${date}” isn't a date: use YYYY-MM-DD from the CALENDAR.`;
  const today = businessDate(ws, now);
  const last = addLocalDays(today, stockSettings(ws).preorderDays);
  if (date < today) return `${dayLabel(ws, date)} has already passed. Ask which day they want.`;
  if (date > last) return `We take orders up to ${stockSettings(ws).preorderDays} days ahead (until ${dayLabel(ws, last)}). Ask for a day up to then.`;
  if (hours && hoursForDate(hours, date, ws.timezone).closed) return `We're closed on ${dayLabel(ws, date)}. Offer another day.`;
  return null;
}

/** A hold that still counts against stock: firm, or held and not yet expired. */
const ACTIVE = sql`(${t.stockHolds.status} = 'firm' or (${t.stockHolds.status} = 'held' and (${t.stockHolds.expiresAt} is null or ${t.stockHolds.expiresAt} > now())))`;
export const holdActive = (h: Pick<Hold, "status" | "expiresAt">, now = new Date()) => h.status === "firm" || (h.status === "held" && (!h.expiresAt || h.expiresAt > now));

export type Avail = {
  variantId: string;
  itemId: string;
  itemTitle: string;
  name: string;
  date: string;
  mode: StockMode;
  on: boolean;
  /** daily: that day's quantity; tracked: on hand; null = not counted. */
  base: number | null;
  /** Reserved by orders not yet confirmed. */
  held: number;
  /** daily: confirmed for that day. */
  sold: number;
  /** What a new order can still have. null = no limit. */
  left: number | null;
  /** Tracked: alert below this (0 = never). */
  lowAt: number;
};
export const availKey = (variantId: string, date: string) => `${variantId}|${date}`;

const SIZE: Record<string, string> = { XS: "XS", S: "Small", M: "Medium", L: "Large", XL: "XL", XXL: "XXL" };
/** "Medium Charcoal Forno Sette T-shirt". */
export const optionName = (title: string, v: { size: string | null; color: string | null; option: string | null }) =>
  [v.size ? SIZE[v.size] ?? v.size : null, v.color, title, v.option ? `(${v.option})` : null].filter(Boolean).join(" ");

/**
 * Live availability for each (variant, date): base stock minus active holds (and, for a day, what was already sold).
 * `date` only matters for daily items and the on/off check; pass the business date otherwise. `excludeOrder` leaves
 * one order's own holds out, for re-checking an order whose hold lapsed.
 */
export async function availability(x: Exec, ws: Pick<Ws, "settings" | "timezone">, wants: { variantId: string; date: string }[], opts: { excludeOrder?: string } = {}): Promise<Map<string, Avail>> {
  const out = new Map<string, Avail>();
  const ids = [...new Set(wants.map((w) => w.variantId))];
  if (!ids.length) return out;
  const dates = [...new Set(wants.map((w) => w.date))];
  const rows = await x
    .select({ v: t.kbVariants, stockMode: t.kbItems.stockMode, available: t.kbItems.available, unavailableUntil: t.kbItems.unavailableUntil, title: t.kbItems.title })
    .from(t.kbVariants)
    .innerJoin(t.kbItems, eq(t.kbItems.id, t.kbVariants.itemId))
    .where(inArray(t.kbVariants.id, ids));
  const overrides = await x.select().from(t.dailyStock).where(and(inArray(t.dailyStock.variantId, ids), inArray(t.dailyStock.date, dates)));
  const holds = await x
    .select({
      variantId: t.stockHolds.variantId, date: t.stockHolds.date,
      held: sql<number>`coalesce(sum(${t.stockHolds.qty}) filter (where ${ACTIVE}), 0)::int`,
      sold: sql<number>`coalesce(sum(${t.stockHolds.qty}) filter (where ${t.stockHolds.status} = 'consumed'), 0)::int`,
    })
    .from(t.stockHolds)
    .where(and(inArray(t.stockHolds.variantId, ids), or(isNull(t.stockHolds.date), inArray(t.stockHolds.date, dates)), opts.excludeOrder ? ne(t.stockHolds.orderId, opts.excludeOrder) : undefined))
    .groupBy(t.stockHolds.variantId, t.stockHolds.date);
  const s = stockSettings(ws);
  for (const w of wants) {
    const r = rows.find((x) => x.v.id === w.variantId);
    if (!r) continue;
    const mode = r.stockMode ?? s.defaultMode;
    const on = itemOn(r, w.date);
    // Holds made under another mode (the owner switched it) keep their own meaning: daily ones carry a date, tracked ones don't.
    const h = holds.find((x) => x.variantId === w.variantId && x.date === (mode === "daily" ? w.date : null));
    const held = mode === "none" ? 0 : h?.held ?? 0;
    const sold = mode === "daily" ? h?.sold ?? 0 : 0;
    const base = mode === "daily" ? overrides.find((o) => o.variantId === w.variantId && o.date === w.date)?.qty ?? r.v.dailyQty : mode === "tracked" ? r.v.stock : null;
    const left = !on ? 0 : base === null ? null : Math.max(0, base - held - sold);
    out.set(availKey(w.variantId, w.date), {
      variantId: w.variantId, itemId: r.v.itemId, itemTitle: r.title, name: optionName(r.title, r.v), date: w.date, mode, on, base, held, sold, left,
      lowAt: r.v.lowStockAt ?? s.lowStockDefault,
    });
  }
  return out;
}

/** Quantity per variant across an order's lines. */
export function needs(lines: { variantId: string | null; quantity: number }[]) {
  const m = new Map<string, number>();
  for (const l of lines) if (l.variantId) m.set(l.variantId, (m.get(l.variantId) ?? 0) + l.quantity);
  return m;
}

/** Row-lock the variants (in id order, so two transactions can't deadlock): holds on the same option queue here. */
export async function lockVariants(tx: Tx, ids: string[]) {
  if (ids.length) await tx.select({ id: t.kbVariants.id }).from(t.kbVariants).where(inArray(t.kbVariants.id, ids)).orderBy(asc(t.kbVariants.id)).for("update");
}

/** What a customer asking for `need` is told when there isn't enough. The number always comes from here, never the model. */
export function shortMessage(ws: Pick<Ws, "timezone">, a: Avail, need: number, name = a.name): string | null {
  if (a.left === null || need <= a.left) return null;
  const day = a.mode === "daily" ? ` for ${dayLabel(ws, a.date)}` : "";
  if (!a.on) return `${name} isn't available${day}.`;
  return a.left <= 0 ? `${name} is sold out${day}.` : `We can do at most ${a.left} of ${name}${day} (asked for ${need}).`;
}

/**
 * Hold stock for a new order inside its transaction. Locks the variants, re-checks availability, and inserts one hold per
 * counted option. Returns the problems (nothing is held then), or null when everything is held.
 */
export async function holdForOrder(tx: Tx, ws: Ws, o: { lines: { variantId: string; quantity: number; name: string }[]; date: string }, check = true): Promise<{ problems: string[]; holds: { variantId: string; qty: number; date: string | null }[] }> {
  const need = needs(o.lines);
  const ids = [...need.keys()];
  await lockVariants(tx, ids);
  const av = await availability(tx, ws, ids.map((variantId) => ({ variantId, date: o.date })));
  const problems: string[] = [];
  const holds: { variantId: string; qty: number; date: string | null }[] = [];
  for (const [id, qty] of need) {
    const a = av.get(availKey(id, o.date));
    if (!a) continue;
    const short = check ? shortMessage(ws, a, qty, o.lines.find((l) => l.variantId === id)?.name) : null;
    if (short) problems.push(short);
    else if (a.mode !== "none" && a.base !== null) holds.push({ variantId: id, qty, date: a.mode === "daily" ? a.date : null });
  }
  return { problems, holds };
}

/**
 * The order's lapsed holds, taken again if the stock is still there (staff kept it, or asked for another receipt after
 * the timer ran out but before the order was expired). Returns the problem, or null.
 */
async function revive(tx: Tx, ws: Ws, order: Order, holds: Hold[]): Promise<string | null> {
  const now = new Date();
  const lapsed = holds.filter((h) => h.status === "held" && h.expiresAt && h.expiresAt <= now);
  if (!lapsed.length) return null;
  await lockVariants(tx, lapsed.map((h) => h.variantId));
  const date = order.wantedDate ?? businessDate(ws);
  const av = await availability(tx, ws, lapsed.map((h) => ({ variantId: h.variantId, date: h.date ?? date })), { excludeOrder: order.id });
  for (const h of lapsed) {
    const a = av.get(availKey(h.variantId, h.date ?? date));
    const short = a && shortMessage(ws, a, h.qty);
    if (short) return `The reserved stock was released when the timer ran out, and now: ${short}`;
  }
  return null;
}

/**
 * Stop the timer: the receipt passed, or staff pressed Keep reserved. The holds become firm and stay until staff confirm
 * (consumed) or reject/cancel (released). Must run inside the order's row lock.
 */
export async function firmHolds(tx: Tx, ws: Ws, order: Order, by: "receipt" | "staff"): Promise<{ ok: true } | { ok: false; error: string }> {
  const holds = await tx.select().from(t.stockHolds).where(eq(t.stockHolds.orderId, order.id)).for("update");
  if (by === "staff") {
    const problem = await revive(tx, ws, order, holds);
    if (problem) return { ok: false, error: problem };
  } else if (!order.holdExpiresAt || order.holdExpiresAt <= new Date()) return { ok: false, error: "The timer already ran out." };
  await tx.update(t.stockHolds).set({ status: "firm", expiresAt: null }).where(and(eq(t.stockHolds.orderId, order.id), eq(t.stockHolds.status, "held")));
  await tx.update(t.orders).set({ holdExpiresAt: null, firmedBy: by }).where(eq(t.orders.id, order.id));
  await tx.insert(t.events).values({ workspaceId: order.workspaceId, type: by === "staff" ? "order.kept_reserved" : "stock.firmed", props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, holds: holds.filter((h) => h.status !== "released").length }, isDemo: order.isDemo });
  return { ok: true };
}

/** Staff asked for another receipt: a fresh window starts (taking the stock again if the old window ran out). */
export async function restartHold(tx: Tx, ws: Ws, order: Order): Promise<{ ok: true; expiresAt: Date } | { ok: false; error: string }> {
  const holds = await tx.select().from(t.stockHolds).where(eq(t.stockHolds.orderId, order.id)).for("update");
  const problem = await revive(tx, ws, order, holds);
  if (problem) return { ok: false, error: problem };
  const [o] = await tx
    .update(t.orders)
    .set({ holdExpiresAt: sql`now() + make_interval(mins => ${stockSettings(ws).holdMinutes})`, firmedBy: null })
    .where(eq(t.orders.id, order.id))
    .returning({ at: t.orders.holdExpiresAt });
  await tx.update(t.stockHolds).set({ status: "held", expiresAt: o.at }).where(and(eq(t.stockHolds.orderId, order.id), inArray(t.stockHolds.status, ["held", "firm"])));
  return { ok: true, expiresAt: o.at! };
}

/**
 * Confirming: the order's own active holds are consumed (tracked ones come off the on-hand count). An option whose hold
 * lapsed or never existed (older orders) is re-checked against what's left first. Returns the problem, or null.
 */
export async function consumeForOrder(tx: Tx, ws: Ws, order: Order, items: { variantId: string | null; quantity: number; name: string }[]): Promise<{ problem: string | null; moved: boolean }> {
  const need = needs(items);
  const ids = [...need.keys()];
  if (!ids.length) return { problem: null, moved: false };
  await lockVariants(tx, ids);
  const holds = await tx.select().from(t.stockHolds).where(eq(t.stockHolds.orderId, order.id)).for("update");
  const date = order.wantedDate ?? businessDate(ws);
  const av = await availability(tx, ws, ids.map((variantId) => ({ variantId, date })), { excludeOrder: order.id });
  const now = new Date();
  const plan: { id: string; qty: number; hold: Hold | undefined; a: Avail | undefined }[] = [];
  for (const [id, qty] of need) {
    const hold = holds.find((h) => h.variantId === id && holdActive(h, now));
    const a = av.get(availKey(id, date));
    if (!hold && a) {
      const short = shortMessage(ws, a, qty, items.find((i) => i.variantId === id)?.name);
      if (short) return { problem: `${short.replace(/ \(asked for \d+\)\.$/, ".")} Reject the order or ${a.mode === "daily" ? "raise that day's quantity" : "restock it"} first.`, moved: false };
    }
    plan.push({ id, qty, hold, a });
  }
  let moved = false;
  // Lapsed holds are replaced by the consumed one below.
  await tx.update(t.stockHolds).set({ status: "released" }).where(and(eq(t.stockHolds.orderId, order.id), eq(t.stockHolds.status, "held"), lte(t.stockHolds.expiresAt, sql`now()`)));
  for (const p of plan) {
    const tracked = p.hold ? p.hold.date === null : p.a?.mode === "tracked";
    if (p.hold) await tx.update(t.stockHolds).set({ status: "consumed", expiresAt: null }).where(eq(t.stockHolds.id, p.hold.id));
    else if (p.a && p.a.mode !== "none" && p.a.base !== null) {
      await tx.insert(t.stockHolds).values({ workspaceId: order.workspaceId, orderId: order.id, variantId: p.id, date: tracked ? null : date, qty: p.qty, status: "consumed", isDemo: order.isDemo });
    } else continue;
    if (tracked) await tx.update(t.kbVariants).set({ stock: sql`${t.kbVariants.stock} - ${p.hold?.qty ?? p.qty}` }).where(and(eq(t.kbVariants.id, p.id), isNotNull(t.kbVariants.stock)));
    moved = true;
  }
  return { problem: null, moved };
}

/**
 * Reject, cancel or expire: every hold goes back. Consumed tracked holds put the count back on the shelf; older orders
 * confirmed before holds existed give back what they took. Returns whether any stock moved.
 */
export async function releaseForOrder(tx: Tx, order: Order, items: { variantId: string | null; quantity: number }[]): Promise<boolean> {
  const holds = await tx.select().from(t.stockHolds).where(and(eq(t.stockHolds.orderId, order.id), ne(t.stockHolds.status, "released"))).for("update");
  await lockVariants(tx, [...new Set(holds.map((h) => h.variantId))]);
  for (const h of holds) if (h.status === "consumed" && h.date === null) await tx.update(t.kbVariants).set({ stock: sql`${t.kbVariants.stock} + ${h.qty}` }).where(and(eq(t.kbVariants.id, h.variantId), isNotNull(t.kbVariants.stock)));
  if (holds.length) await tx.update(t.stockHolds).set({ status: "released" }).where(inArray(t.stockHolds.id, holds.map((h) => h.id)));
  const [any] = holds.length ? [true] : await tx.select({ id: t.stockHolds.id }).from(t.stockHolds).where(eq(t.stockHolds.orderId, order.id)).limit(1);
  if (!any && order.stockTaken) {
    const need = needs(items);
    await lockVariants(tx, [...need.keys()]);
    for (const [id, qty] of need) await tx.update(t.kbVariants).set({ stock: sql`${t.kbVariants.stock} + ${qty}` }).where(and(eq(t.kbVariants.id, id), isNotNull(t.kbVariants.stock)));
    return need.size > 0;
  }
  return holds.some((h) => h.status !== "released");
}

/** What the customer is told when their order (or booking) expires. Fixed wording: never the AI's. */
export const expiryMessage = (refCode: string, minutes: number, kind: "order" | "appointment" = "order") =>
  kind === "appointment"
    ? `Your booking ${refCode} expired because we didn't receive payment within ${minutes} minutes, so the time is free again. Just message us to book again.`
    : `Your order ${refCode} expired because we didn't receive payment within ${minutes} minutes. Just message us to order again.`;

/**
 * Orders whose timer ran out: mark them expired, give their stock back, tell the customer once, and log it. Safe to run
 * from anywhere at any time (page loads, new messages, the sweep): each order is claimed by one conditional update, so
 * two runs at once never expire or message the same order twice.
 */
export async function expireDueOrders(workspaceId?: string): Promise<number> {
  const claimed = await db.transaction(async (tx) => {
    const due = tx
      .select({ id: t.orders.id })
      .from(t.orders)
      .where(and(eq(t.orders.status, "pending"), isNotNull(t.orders.holdExpiresAt), lte(t.orders.holdExpiresAt, sql`now()`), workspaceId ? eq(t.orders.workspaceId, workspaceId) : undefined))
      .limit(50)
      .for("update", { skipLocked: true });
    const rows = await tx
      .update(t.orders)
      .set({ status: "expired", expiredAt: sql`now()`, cancelReason: "No payment arrived in time" })
      .where(and(inArray(t.orders.id, due), eq(t.orders.status, "pending")))
      .returning();
    for (const o of rows) {
      const items = await tx.select({ variantId: t.orderItems.variantId, quantity: t.orderItems.quantity }).from(t.orderItems).where(eq(t.orderItems.orderId, o.id));
      const released = await releaseForOrder(tx, o, items);
      await tx.insert(t.events).values({ workspaceId: o.workspaceId, type: "order.expired", props: { orderId: o.id, refCode: o.refCode, threadId: o.threadId, expiresAt: o.holdExpiresAt?.toISOString() ?? null }, isDemo: o.isDemo });
      if (released) await tx.insert(t.events).values({ workspaceId: o.workspaceId, type: "stock.released", props: { orderId: o.id, refCode: o.refCode, threadId: o.threadId, why: "expired" }, isDemo: o.isDemo });
    }
    return rows;
  });
  if (!claimed.length) return 0;
  // notify imports the agent pipeline, which imports this file through the order tools: load it only when needed.
  const { notifyCustomer } = await import("./notify");
  const wss = await db.select().from(t.workspaces).where(inArray(t.workspaces.id, [...new Set(claimed.map((o) => o.workspaceId))]));
  for (const o of claimed) {
    const ws = wss.find((w) => w.id === o.workspaceId);
    await notifyCustomer(o, "expired", expiryMessage(o.refCode, ws ? stockSettings(ws).holdMinutes : STOCK_DEFAULTS.holdMinutes, o.kind), null).catch((e) => console.error("[stock] couldn't tell the customer about an expired order", e));
  }
  return claimed.length;
}

/**
 * A receipt that passes the checks arrived after the order expired: put it back in Pending with its stock reserved (firm,
 * no timer) for staff to check, if the stock is still there and the day it was for hasn't passed. Returns the problem otherwise.
 */
export async function reopenExpired(ws: Ws, orderId: string): Promise<{ ok: true; order: Order } | { ok: false; problems: string[] }> {
  const r = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(t.orders).where(and(eq(t.orders.id, orderId), eq(t.orders.workspaceId, ws.id))).for("update");
    if (!order || order.status !== "expired") return { ok: false as const, problems: ["The order isn't expired any more."] };
    const today = businessDate(ws);
    if (order.wantedDate && order.wantedDate < today) return { ok: false as const, problems: [`It was for ${dayLabel(ws, order.wantedDate)}, which has passed.`] };
    // A booking gets its time back only if it hasn't passed and nobody else has taken it since.
    if (order.kind === "appointment") {
      const [a] = await tx.select().from(t.appointments).where(eq(t.appointments.orderId, order.id));
      if (!a || a.startsAt <= new Date()) return { ok: false as const, problems: [a ? `It was for ${when(ws, a.startsAt)}, which has passed.` : "The booking has no time on record."] };
      if (a.staffId) {
        await lockStaff(tx, a.staffId);
        if (await slotTaken(tx, ws, a.staffId, a.startsAt, a.endsAt, order.id)) return { ok: false as const, problems: [`The time (${when(ws, a.startsAt)}) was booked by someone else after it expired.`] };
      }
    }
    const items = await tx.select().from(t.orderItems).where(eq(t.orderItems.orderId, order.id));
    const held = await holdForOrder(tx, ws, { lines: items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, quantity: i.quantity, name: i.name })), date: order.wantedDate ?? today });
    if (held.problems.length) return { ok: false as const, problems: held.problems };
    if (held.holds.length) await tx.insert(t.stockHolds).values(held.holds.map((h) => ({ workspaceId: ws.id, orderId: order.id, variantId: h.variantId, date: h.date, qty: h.qty, status: "firm" as const, isDemo: order.isDemo })));
    const [reopened] = await tx.update(t.orders).set({ status: "pending", expiredAt: null, cancelReason: null, holdExpiresAt: null, firmedBy: "receipt" }).where(eq(t.orders.id, order.id)).returning();
    await tx.insert(t.events).values({ workspaceId: ws.id, type: "order.reopened", props: { orderId: order.id, refCode: order.refCode, threadId: order.threadId, holds: held.holds.length }, isDemo: order.isDemo });
    return { ok: true as const, order: reopened, variantIds: held.holds.map((h) => h.variantId) };
  });
  if (!r.ok) return r;
  await checkLowStock(ws.id, r.variantIds).catch((e) => console.error("[stock] low-stock check failed", e));
  return { ok: true, order: r.order };
}

/** Every tracked option that has fallen below its threshold, for the Today page. */
export async function lowStockList(ws: Ws): Promise<Avail[]> {
  const rows = await db
    .select({ id: t.kbVariants.id, stockMode: t.kbItems.stockMode })
    .from(t.kbVariants)
    .innerJoin(t.kbItems, eq(t.kbItems.id, t.kbVariants.itemId))
    .where(and(eq(t.kbVariants.workspaceId, ws.id), eq(t.kbItems.active, true), eq(t.kbItems.kind, "product"), isNotNull(t.kbVariants.stock)));
  const ids = rows.filter((r) => modeOf(r, ws) === "tracked").map((r) => r.id);
  const date = businessDate(ws);
  const av = await availability(db, ws, ids.map((variantId) => ({ variantId, date })));
  return [...av.values()].filter((a) => a.left !== null && a.lowAt > 0 && a.left < a.lowAt).sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
}

/**
 * After stock moved: one Needs-you card per tracked option that dropped below its threshold ("Only 3 left of Medium
 * Charcoal T-shirt"), and the card closes itself once it's back above. The open-card unique key makes it one card even
 * when two orders land at once.
 */
export async function checkLowStock(workspaceId: string, variantIds: string[]) {
  if (!variantIds.length) return;
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  if (!ws) return;
  const date = businessDate(ws);
  const av = await availability(db, ws, [...new Set(variantIds)].map((variantId) => ({ variantId, date })));
  for (const a of av.values()) {
    if (a.mode !== "tracked" || a.left === null) continue;
    const key = `low_stock:${a.variantId}`;
    if (a.lowAt > 0 && a.left < a.lowAt) {
      const summary = a.left <= 0 ? `${a.name} is out of stock` : `Only ${a.left} left of ${a.name}`;
      const [row] = await db
        .insert(t.escalations)
        .values({ workspaceId, threadId: null, dedupeKey: key, category: "low_stock", priority: a.left <= 0 ? "normal" : "low", reason: `Below ${a.lowAt}`, summary: `${summary}. Restock it in Knowledge, or change its alert level.` })
        .onConflictDoNothing({ target: [t.escalations.workspaceId, t.escalations.dedupeKey], where: sql`status = 'open' and dedupe_key is not null` })
        .returning({ id: t.escalations.id });
      if (row) await db.insert(t.events).values({ workspaceId, type: "stock.low", props: { variantId: a.variantId, itemId: a.itemId, name: a.name, left: a.left, threshold: a.lowAt } });
      // Still the same card: it shows the latest count.
      else await db.update(t.escalations).set({ summary: `${summary}. Restock it in Knowledge, or change its alert level.`, priority: a.left <= 0 ? "normal" : "low" }).where(and(eq(t.escalations.workspaceId, workspaceId), eq(t.escalations.dedupeKey, key), eq(t.escalations.status, "open")));
    } else {
      await db.update(t.escalations).set({ status: "resolved", resolvedAt: new Date() }).where(and(eq(t.escalations.workspaceId, workspaceId), eq(t.escalations.dedupeKey, key), eq(t.escalations.status, "open")));
    }
  }
}

/** Today's stock (or another day's) for every daily item: usual quantity, that day's, held, sold and left. */
export async function dailyBoard(ws: Ws, date: string) {
  const rows = await db
    .select({ v: t.kbVariants, stockMode: t.kbItems.stockMode, sort: t.kbItems.sort })
    .from(t.kbVariants)
    .innerJoin(t.kbItems, eq(t.kbItems.id, t.kbVariants.itemId))
    .where(and(eq(t.kbVariants.workspaceId, ws.id), eq(t.kbItems.active, true), eq(t.kbItems.kind, "product")))
    .orderBy(asc(t.kbItems.sort));
  const daily = rows.filter((r) => modeOf(r, ws) === "daily");
  const av = await availability(db, ws, daily.map((r) => ({ variantId: r.v.id, date })));
  const overrides = daily.length ? await db.select().from(t.dailyStock).where(and(inArray(t.dailyStock.variantId, daily.map((r) => r.v.id)), eq(t.dailyStock.date, date))) : [];
  return daily.map((r) => {
    const a = av.get(availKey(r.v.id, date))!;
    return { itemId: r.v.itemId, itemTitle: a.itemTitle, variantId: r.v.id, name: a.name, usualQty: r.v.dailyQty, override: overrides.find((o) => o.variantId === r.v.id)?.qty ?? null, qty: a.base, held: a.held, sold: a.sold, left: a.left, on: a.on };
  });
}
