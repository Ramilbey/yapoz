// A few sample orders for Forno Sette so the Orders page has something to show before the first real one.
import { and, eq, inArray } from "drizzle-orm";
import { db, t } from "@/db";
import { assessReceipt, sha256 } from "@/lib/receipts";
import type { ReceiptReading } from "@/db/schema";
import { fmt } from "@/lib/time";

type Spec = { ref: string; name: string; channel: "telegram" | "whatsapp"; fulfilment: "pickup" | "delivery"; address?: string; wanted?: string; notes?: string; status: "pending" | "confirmed" | "ready" | "completed"; paid?: boolean; firmedBy?: "receipt" | "staff" | null; receipt?: "ok" | "short" | "other_account"; ageMin: number; lines: { slug: string; size: string; qty: number; note?: string }[] };

const SPECS: Spec[] = [
  { ref: "ORD-DEMO", name: "Aiman R.", channel: "whatsapp", fulfilment: "pickup", wanted: "7:30pm tonight", status: "pending", firmedBy: "receipt", receipt: "ok", ageMin: 4, lines: [{ slug: "margherita", size: "L", qty: 2, note: "extra basil" }, { slug: "diavola", size: "M", qty: 1 }] },
  { ref: "ORD-DEMA", name: "Wei Ling", channel: "telegram", fulfilment: "delivery", address: "Unit 12-3, Menara Telawi, Jalan Telawi 3, Bangsar Baru", status: "pending", firmedBy: null, receipt: "short", ageMin: 11, notes: "Please call when downstairs", lines: [{ slug: "quattro-formaggi", size: "L", qty: 1 }, { slug: "marinara", size: "S", qty: 2 }] },
  { ref: "ORD-DEMB", name: "Farah N.", channel: "telegram", fulfilment: "pickup", wanted: "6pm", status: "confirmed", paid: true, receipt: "ok", ageMin: 38, lines: [{ slug: "diavola", size: "L", qty: 2 }] },
  { ref: "ORD-DEMC", name: "Daniel K.", channel: "whatsapp", fulfilment: "pickup", status: "ready", receipt: "other_account", ageMin: 52, lines: [{ slug: "margherita", size: "M", qty: 3 }] },
  { ref: "ORD-DEMD", name: "Siti Z.", channel: "telegram", fulfilment: "delivery", address: "B-8, Pangsapuri Mutiara, Jalan Maarof", status: "completed", paid: true, receipt: "ok", ageMin: 190, lines: [{ slug: "margherita", size: "L", qty: 1 }, { slug: "diavola", size: "L", qty: 1 }] },
];

const esc = (x: string) => x.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

/** A made-up bank transfer confirmation, as an SVG, so the sample orders have a receipt to look at. */
function syntheticReceipt(r: ReceiptReading): Buffer {
  const rows = [["Amount", `${r.currency} ${r.amount?.toFixed(2)}`], ["To", r.payeeName ?? ""], ["Account", r.payeeAccount ?? ""], ["Date", r.paidAt?.replace("T", " ") ?? ""], ["Reference", r.reference ?? ""]];
  const body = rows.map(([k, v], i) => `<text x="24" y="${112 + i * 34}" fill="#667" font-size="13">${k}</text><text x="296" y="${112 + i * 34}" fill="#111" font-size="15" text-anchor="end">${esc(v)}</text>`).join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="300" font-family="Helvetica,Arial,sans-serif"><rect width="320" height="300" fill="#fff"/><rect width="320" height="52" fill="#1a5d4a"/><text x="24" y="33" fill="#fff" font-size="17" font-weight="bold">Sample Bank · Transfer successful</text>${body}<text x="24" y="282" fill="#99a" font-size="11">Synthetic sample receipt: not a real payment</text></svg>`);
}

export async function seedOrders(workspaceId: string, currency: string) {
  const items = await db.select({ id: t.kbItems.id, slug: t.kbItems.slug, title: t.kbItems.title }).from(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), inArray(t.kbItems.slug, [...new Set(SPECS.flatMap((s) => s.lines.map((l) => l.slug)))])));
  const variants = await db.select().from(t.kbVariants).where(inArray(t.kbVariants.itemId, items.map((i) => i.id)));
  const SIZE = { S: "Small", M: "Medium", L: "Large" } as Record<string, string>;
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
  const accounts = ws?.settings.payments?.accounts ?? [];
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
        totalMinor: lines.reduce((n, x) => n + x.v.priceMinor * x.l.qty, 0), currency, channel: s.channel, isDemo: true, createdAt: created, holdExpiresAt: null, firmedBy: s.firmedBy ?? null,
        confirmedAt: s.status === "pending" ? null : new Date(created.getTime() + 3 * 60_000),
        readyAt: s.status === "ready" || s.status === "completed" ? new Date(created.getTime() + 25 * 60_000) : null,
        completedAt: s.status === "completed" ? new Date(created.getTime() + 40 * 60_000) : null,
      })
      .returning();
    if (s.receipt && accounts.length) {
      const total = lines.reduce((n, x) => n + x.v.priceMinor * x.l.qty, 0);
      const paid = new Date(created.getTime() + 2 * 60_000);
      const reading: ReceiptReading = {
        looksLikeReceipt: true, amount: (s.receipt === "short" ? total - 1000 : total) / 100, currency: currency, paidAt: fmt(paid, ws.timezone, "yyyy-MM-dd'T'HH:mm"),
        payeeName: s.receipt === "other_account" ? "AHMAD BIN ROSLI" : accounts[0].accountName.toUpperCase(),
        payeeAccount: s.receipt === "other_account" ? "7788 1122 3344" : accounts[0].accountNumber,
        payerName: s.name.toUpperCase(), reference: `SMP${s.ref.slice(-4)}${Math.abs(total)}`, method: "Sample Bank transfer", status: "successful", legibility: "clear", oddities: [],
      };
      const file = syntheticReceipt(reading);
      const { verdict, checks } = assessReceipt({ reading, order: { totalMinor: total, currency, createdAt: created }, accounts, timezone: ws.timezone, now: new Date(), duplicates: [] });
      await db.insert(t.orderReceipts).values({ workspaceId, orderId: o.id, mime: "image/svg+xml", sha256: sha256(file), bytes: file, reading, checks, verdict, model: "sample data", isDemo: true, createdAt: paid });
    }
    await db.insert(t.orderItems).values(lines.map(({ item, v, l }) => ({ workspaceId, orderId: o.id, itemId: item.id, variantId: v.id, name: `${SIZE[l.size] ?? l.size} ${item.title}`, quantity: l.qty, unitPriceMinor: v.priceMinor, note: l.note ?? null })));
  }
}
