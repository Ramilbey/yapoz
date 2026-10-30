// What the "How you sell" step starts from and what the Go live checklist warns about: the stock, payment and
// booking settings with their defaults, the saved products and services, and who takes bookings.
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, t } from "@/db";
import { appointmentSettings, guessInPerson, loadHours } from "@/lib/schedule";
import { modeOf, optionName, stockSettings } from "@/lib/stock";
import type { SetupChecks, SetupSelling } from "./types";

type Ws = typeof t.workspaces.$inferSelect;

export async function setupSelling(ws: Ws, ownerId: string): Promise<SetupSelling> {
  const items = await db
    .select()
    .from(t.kbItems)
    .where(and(eq(t.kbItems.workspaceId, ws.id), inArray(t.kbItems.kind, ["product", "service"]), eq(t.kbItems.active, true)))
    .orderBy(asc(t.kbItems.sort), asc(t.kbItems.title));
  const variants = items.length ? await db.select().from(t.kbVariants).where(inArray(t.kbVariants.itemId, items.map((i) => i.id))) : [];
  const team = await db.select({ userId: t.users.id, name: t.users.name, takes: t.staff.takesAppointments }).from(t.users).leftJoin(t.staff, eq(t.staff.userId, t.users.id)).where(eq(t.users.workspaceId, ws.id));
  const owner = team.find((u) => u.userId === ownerId);
  const stock = stockSettings(ws);
  return {
    businessType: ws.settings.business.type,
    address: ws.settings.business.address,
    stock,
    stockSaved: Boolean(ws.settings.stock),
    appointments: appointmentSettings(ws),
    appointmentsSaved: Boolean(ws.settings.appointments),
    payments: ws.settings.payments ?? null,
    inPersonGuess: guessInPerson(ws.settings.business.type),
    hours: await loadHours(db, ws.id),
    owner: { userId: ownerId, name: owner?.name ?? "", takesAppointments: Boolean(owner?.takes) },
    team: team.length,
    bookers: team.filter((u) => u.takes).length,
    products: items
      .filter((i) => i.kind === "product")
      .map((i) => ({
        id: i.id, title: i.title, stockMode: i.stockMode, mode: modeOf(i, ws),
        options: variants.filter((v) => v.itemId === i.id).map((v) => ({ id: v.id, label: optionName(i.title, v), stock: v.stock, dailyQty: v.dailyQty })),
      })),
    services: items.filter((i) => i.kind === "service").map((i) => ({ id: i.id, title: i.title, inPerson: i.inPerson, durationMinutes: Number(i.data?.durationMinutes) || null, data: i.data })),
  };
}

const hasHours = (s: SetupSelling) => Boolean(s.hours && Object.values(s.hours.weekly).some((d) => d.length));

/** The Go live warnings, as counts: nothing here blocks going live. */
export function setupChecks(s: SetupSelling): SetupChecks {
  return {
    services: s.services.length,
    inPersonServices: s.services.filter((x) => x.inPerson).length,
    bookers: s.bookers,
    hasHours: hasHours(s),
    hasAddress: Boolean(s.address.trim()),
    paymentsOn: Boolean(s.payments?.enabled && s.payments.accounts.length),
    stockMode: s.stock.defaultMode,
    dailyWithoutQty: s.products.filter((p) => p.mode === "daily" && p.options.some((o) => o.dailyQty === null)).length,
    firstService: s.services[0]?.title ?? null,
  };
}
