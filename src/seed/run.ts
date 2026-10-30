import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { WORKSPACE, PIZZAS, SIDES, MERCH, MERCH_COLORS, MERCH_SIZES, HOURS, DELIVERY, POLICIES, FAQS, EXTRAS, SIZES } from "./forno";
import { seedSalon } from "./kasih";
import { seedOrders } from "./orders";
import { weightedLibrary, rng } from "@/demo/library";
import { insertDemoTurn } from "@/demo/replay";
import { addLocalDays, localDate, zoned, minutesOf, timeOf, localWeekday } from "@/lib/time";

type Log = (...a: unknown[]) => void;

export async function seedWorkspace({ withHistory = true, log = (() => {}) as Log } = {}) {
  const ws = WORKSPACE;
  const tz = ws.timezone;
  await db.delete(t.workspaces).where(eq(t.workspaces.id, ws.id));
  await db.insert(t.workspaces).values(ws);

  // Users
  const password = process.env.DEMO_PASSWORD ?? "forno7demo";
  const hash = await bcrypt.hash(password, 10);
  const [owner, service] = await db
    .insert(t.users)
    .values([
      // Fixed ids keep existing sessions valid across /api/demo/reset.
      { id: "00000000-0000-4000-8000-000000000001", workspaceId: ws.id, email: "owner@demo", name: "Lina Hassan", role: "owner", passwordHash: hash },
      { id: "00000000-0000-4000-8000-000000000002", workspaceId: ws.id, email: "service@demo", name: "Farid Aziz", role: "service", passwordHash: hash },
    ])
    .returning();
  log(`users: owner@demo, service@demo (password from DEMO_PASSWORD)`);

  // Channels
  await db.insert(t.channels).values([
    { workspaceId: ws.id, type: "simulator", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "telegram", mode: "autopilot", config: { botUsername: process.env.TELEGRAM_BOT_USERNAME ?? null } },
    { workspaceId: ws.id, type: "whatsapp", mode: "autopilot", config: { phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null } },
  ]);

  // Knowledge: pizzas
  let sort = 0;
  for (const p of PIZZAS) {
    const [item] = await db
      .insert(t.kbItems)
      .values({
        workspaceId: ws.id, kind: "product", category: "pizza", slug: p.slug, title: p.name, body: p.desc,
        data: { toppings: p.toppings, allergens: p.allergens, vegetarian: p.vegetarian, vegan: Boolean(p.vegan), halal: p.halal, spicy: Boolean(p.spicy) },
        tags: [p.vegetarian ? "vegetarian" : "", p.vegan ? "vegan" : "", p.spicy ? "spicy" : "", p.halal ? "halal" : "contains alcohol"].filter(Boolean),
        stockMode: null, unavailableUntil: p.soldOutToday ? addLocalDays(localDate(new Date(), tz), 1) : null,
        available: p.available ?? true, availabilityNote: p.note ?? null, sort: sort++,
      })
      .returning();
    await db.insert(t.kbVariants).values(SIZES.map((s, i) => ({ workspaceId: ws.id, itemId: item.id, size: s.code, priceMinor: p.prices[i] * 100, stock: null, sku: `${p.slug}-${s.code}` })));
  }
  for (const s of SIDES) {
    const [item] = await db
      .insert(t.kbItems)
      .values({
        workspaceId: ws.id, kind: "product", category: s.category, slug: s.slug, title: s.name, body: s.desc,
        data: { allergens: s.allergens, vegetarian: s.vegetarian, halal: s.halal }, tags: [s.category], sort: sort++,
        stockMode: "dailyQty" in s ? ("daily" as const) : null,
      })
      .returning();
    await db.insert(t.kbVariants).values({ workspaceId: ws.id, itemId: item.id, priceMinor: s.price * 100, stock: null, dailyQty: "dailyQty" in s ? (s.dailyQty as number) : null, sku: s.slug });
  }
  for (const m of MERCH) {
    const [item] = await db
      .insert(t.kbItems)
      .values({ workspaceId: ws.id, kind: "product", category: "merch", slug: m.slug, title: m.name, body: m.desc, data: { colors: MERCH_COLORS, sizes: MERCH_SIZES }, tags: ["merch"], sort: sort++, stockMode: "tracked" })
      .returning();
    const rows = MERCH_COLORS.flatMap((color) =>
      MERCH_SIZES.map((size, i) => ({
        workspaceId: ws.id, itemId: item.id, size, color, priceMinor: m.price * 100,
        stock: (m.stock as Record<string, number[]>)[color][i], sku: `${m.slug}-${color.replace(/\s/g, "").toLowerCase()}-${size}`,
      })),
    );
    await db.insert(t.kbVariants).values(rows);
  }
  log(`catalog: ${PIZZAS.length} pizzas × 3 sizes, ${SIDES.length} sides/drinks, ${MERCH.length} merch × ${MERCH_COLORS.length} colors × ${MERCH_SIZES.length} sizes`);

  // Hours, delivery, extras, policies, FAQs
  await db.insert(t.kbItems).values([
    { workspaceId: ws.id, kind: "hours", category: "hours", slug: "hours", title: "Opening hours", body: "Closed Mondays. Last orders 30 minutes before closing.", data: HOURS as unknown as Record<string, unknown> },
    { workspaceId: ws.id, kind: "info", category: "delivery", slug: "delivery", title: "Delivery zones and fees", body: `${DELIVERY.hours} ${DELIVERY.outside}`, data: { zones: DELIVERY.zones } },
    { workspaceId: ws.id, kind: "info", category: "menu", slug: "extras", title: "Extra toppings", body: "Add-ons available on any pizza.", data: { extras: EXTRAS.map((e) => ({ name: e.name, priceMinor: e.price * 100 })) } },
    ...POLICIES.map((p, i) => ({ workspaceId: ws.id, kind: "policy" as const, category: p.topic, slug: p.slug, title: p.title, body: p.body, sort: i })),
    ...FAQS.map((f, i) => ({ workspaceId: ws.id, kind: "faq" as const, category: f.topic, slug: `faq-${String(i + 1).padStart(2, "0")}`, title: f.q, body: f.a, sort: i })),
  ]);
  log(`knowledge: hours + ${HOURS.exceptions.length} exceptions, delivery zones, ${POLICIES.length} policies, ${FAQS.length} FAQs`);

  const today = localDate(new Date(), tz);

  // Seven days of labeled demo history so the Owner dashboard has a week to show.
  if (withHistory) {
    const lib = weightedLibrary();
    const r = rng(42);
    let count = 0;
    for (let d = 7; d >= 0; d--) {
      const day = addLocalDays(today, -d);
      const wd = localWeekday(zoned(day, "12:00", tz), tz);
      const n = wd === "mon" ? 12 : wd === "fri" || wd === "sat" ? 62 : 40;
      for (let i = 0; i < n; i++) {
        const minute = minutesOf("09:00") + Math.floor(r() * 14 * 60);
        const at = zoned(day, timeOf(minute), tz);
        if (at.getTime() > Date.now() - 60_000) continue;
        const turn = lib[Math.floor(r() * lib.length)];
        await insertDemoTurn(ws.id, tz, turn, at, r);
        count++;
      }
    }
    log(`demo history: ${count} labeled conversations over the last 7 days`);
  }
  void owner; void service;
  await seedOrders(ws.id, ws.currency);
  log("orders: 5 sample orders (2 waiting for approval)");
  await seedSalon(log);
  return { workspaceId: ws.id };
}
