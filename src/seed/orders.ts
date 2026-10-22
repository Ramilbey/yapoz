// A few sample orders for Forno Sette so the Orders page has something to show before the first real one.
import { and, eq, inArray } from "drizzle-orm";
import { db, t } from "@/db";

type Spec = { ref: string; name: string; channel: "telegram" | "whatsapp" | "instagram"; fulfilment: "pickup" | "delivery"; address?: string; wanted?: string; notes?: string; status: "pending" | "confirmed" | "ready" | "completed"; paid?: boolean; ageMin: number; lines: { slug: string; size: string; qty: number; note?: string }[] };

const SPECS: Spec[] = [
  { ref: "ORD-DEMO", name: "Aiman R.", channel: "whatsapp", fulfilment: "pickup", wanted: "7:30pm tonight", status: "pending", ageMin: 4, lines: [{ slug: "margherita", size: "L", qty: 2, note: "extra basil" }, { slug: "diavola", size: "M", qty: 1 }] },
  { ref: "ORD-DEMA", name: "Wei Ling", channel: "telegram", fulfilment: "delivery", address: "Unit 12-3, Menara Telawi, Jalan Telawi 3, Bangsar Baru", status: "pending", ageMin: 11, notes: "Please call when downstairs", lines: [{ slug: "quattro-formaggi", size: "L", qty: 1 }, { slug: "marinara", size: "S", qty: 2 }] },
  { ref: "ORD-DEMB", name: "Farah N.", channel: "instagram", fulfilment: "pickup", wanted: "6pm", status: "confirmed", paid: true, ageMin: 38, lines: [{ slug: "diavola", size: "L", qty: 2 }] },
  { ref: "ORD-DEMC", name: "Daniel K.", channel: "whatsapp", fulfilment: "pickup", status: "ready", ageMin: 52, lines: [{ slug: "margherita", size: "M", qty: 3 }] },
  { ref: "ORD-DEMD", name: "Siti Z.", channel: "telegram", fulfilment: "delivery", address: "B-8, Pangsapuri Mutiara, Jalan Maarof", status: "completed", paid: true, ageMin: 190, lines: [{ slug: "margherita", size: "L", qty: 1 }, { slug: "diavola", size: "L", qty: 1 }] },
];

export async function seedOrders(workspaceId: string, currency: string) {
  const items = await db.select({ id: t.kbItems.id, slug: t.kbItems.slug, title: t.kbItems.title }).from(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), inArray(t.kbItems.slug, [...new Set(SPECS.flatMap((s) => s.lines.map((l) => l.slug)))])));
  const variants = await db.select().from(t.kbVariants).where(inArray(t.kbVariants.itemId, items.map((i) => i.id)));
  const SIZE = { S: "Small", M: "Medium", L: "Large" } as Record<string, string>;
  for (const s of SPECS) {
    const lines = s.lines.flatMap((l) => {
      const item = items.find((i) => i.slug === l.slug);
      const v = item && variants.find((x) => x.itemId === item.id && x.size === l.size);
      return item && v ? [{ item, v, l }] : [];
    });
    if (!lines.length) continue;
    const at = (min: number) => new Date(Date.now() - min * 60_000);
    const created = at(s.ageMin);
    const [o] = await db
      .insert(t.orders)
      .values({
        workspaceId, refCode: s.ref, customerName: s.name, fulfilment: s.fulfilment, address: s.address ?? null, wanted: s.wanted ?? null, notes: s.notes ?? null, status: s.status, paid: Boolean(s.paid),
        totalMinor: lines.reduce((n, x) => n + x.v.priceMinor * x.l.qty, 0), currency, channel: s.channel, isDemo: true, createdAt: created,
        confirmedAt: s.status === "pending" ? null : new Date(created.getTime() + 3 * 60_000),
        readyAt: s.status === "ready" || s.status === "completed" ? new Date(created.getTime() + 25 * 60_000) : null,
        completedAt: s.status === "completed" ? new Date(created.getTime() + 40 * 60_000) : null,
      })
      .returning();
    await db.insert(t.orderItems).values(lines.map(({ item, v, l }) => ({ workspaceId, orderId: o.id, itemId: item.id, variantId: v.id, name: `${SIZE[l.size] ?? l.size} ${item.title}`, quantity: l.qty, unitPriceMinor: v.priceMinor, note: l.note ?? null })));
  }
}
