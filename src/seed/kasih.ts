// Kasih Hair Studio: a fictional hair salon in Mont Kiara, the second sample business.
// It exists to show the same agent working for an appointment business, not just a restaurant.
import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import type { WorkspaceSettings } from "@/db/schema";
import { addLocalDays, localDate, localWeekday, zoned, timeOf, minutesOf } from "@/lib/time";
import { shortCode } from "@/lib/crypto";

export const SALON = {
  id: "KASIH1",
  name: "Kasih Hair Studio",
  city: "Kuala Lumpur",
  timezone: "Asia/Kuala_Lumpur",
  currency: "MYR",
  settings: {
    confidenceThreshold: 0.55,
    demoTraffic: false,
    resumeRetentionDays: 180,
    business: {
      type: "hair salon",
      description: "Friendly neighbourhood hair salon with three stylists. Cuts, colour, treatments and blow-dries for women, men and kids. Sells a small range of hair care products.",
      address: "2-7 Jalan Kiara 3, Mont Kiara, 50480 Kuala Lumpur",
      phone: null,
      website: null,
      languages: ["English", "Malay", "Mandarin"],
    },
    modules: { hiring: false },
    live: true,
    sample: true,
    onboarding: { step: 6, completedAt: "2026-10-01T00:00:00.000Z" },
    hr: { interviewMinutes: 30, workdayStart: "10:00", workdayEnd: "18:00", location: "Kasih Hair Studio, Mont Kiara" },
  } satisfies WorkspaceSettings,
};

const SERVICES: { slug: string; name: string; desc: string; minutes: number; prices: [string, number][]; category: string }[] = [
  { slug: "womens-cut", name: "Women's cut and blow-dry", desc: "Consultation, wash, cut and blow-dry.", minutes: 60, prices: [["Short hair", 85], ["Medium hair", 95], ["Long hair", 110]], category: "cuts" },
  { slug: "mens-cut", name: "Men's cut", desc: "Wash, cut and style.", minutes: 30, prices: [["Standard", 45]], category: "cuts" },
  { slug: "kids-cut", name: "Kids' cut (under 12)", desc: "Quick cut for kids, no wash.", minutes: 30, prices: [["Standard", 30]], category: "cuts" },
  { slug: "full-colour", name: "Full colour", desc: "Single-process colour, root to tip, with blow-dry.", minutes: 120, prices: [["Short hair", 180], ["Medium hair", 220], ["Long hair", 260]], category: "colour" },
  { slug: "root-touch-up", name: "Root touch-up", desc: "Regrowth colour up to 4 cm.", minutes: 90, prices: [["Standard", 140]], category: "colour" },
  { slug: "highlights", name: "Balayage / highlights", desc: "Hand-painted lightening with toner and blow-dry. Patch test needed 48 hours before for first-time colour clients.", minutes: 180, prices: [["Medium hair", 380], ["Long hair", 450]], category: "colour" },
  { slug: "keratin", name: "Keratin smoothing treatment", desc: "Frizz-reducing treatment that lasts about 3 months. Formaldehyde-free.", minutes: 150, prices: [["Medium hair", 350], ["Long hair", 420]], category: "treatments" },
  { slug: "scalp-treatment", name: "Scalp treatment", desc: "Exfoliating scalp scrub, massage and mask.", minutes: 45, prices: [["Standard", 90]], category: "treatments" },
  { slug: "blow-dry", name: "Wash and blow-dry", desc: "Wash and styled blow-dry for events.", minutes: 45, prices: [["Short hair", 50], ["Long hair", 70]], category: "styling" },
  { slug: "updo", name: "Event updo", desc: "Bridal or event updo. Trial recommended for weddings.", minutes: 60, prices: [["Standard", 150]], category: "styling" },
];

const PRODUCTS: { slug: string; name: string; desc: string; price: number; stock: number }[] = [
  { slug: "repair-shampoo", name: "Bond repair shampoo 250ml", desc: "Sulphate-free shampoo for coloured hair.", price: 78, stock: 12 },
  { slug: "repair-mask", name: "Bond repair mask 200ml", desc: "Weekly deep-conditioning mask.", price: 96, stock: 4 },
  { slug: "heat-spray", name: "Heat protect spray 150ml", desc: "Protects up to 230°C.", price: 65, stock: 0 },
];

const HOURS = {
  weekly: {
    mon: [],
    tue: [["10:00", "19:00"]],
    wed: [["10:00", "19:00"]],
    thu: [["10:00", "21:00"]],
    fri: [["10:00", "21:00"]],
    sat: [["09:00", "19:00"]],
    sun: [["10:00", "17:00"]],
  },
  lastOrdersMinutesBeforeClose: 0,
  exceptions: [{ date: "2026-12-25", hours: [], note: "Closed for Christmas" }],
};

const POLICIES = [
  { slug: "policy-booking", topic: "booking", title: "Appointments and cancellations", body: "Book at least 2 hours ahead. Free cancellation or rescheduling up to 24 hours before; later cancellations or no-shows are charged 50% of the service. We hold your slot for 10 minutes." },
  { slug: "policy-patch-test", topic: "colour", title: "Colour patch test", body: "First-time colour or lightening clients need a quick patch test at the salon at least 48 hours before the appointment. It's free and takes 5 minutes." },
  { slug: "policy-payment", topic: "payment", title: "Payment", body: "Cash, cards, DuitNow QR, Touch 'n Go eWallet and GrabPay. Prices can change after the consultation if your hair needs more product or time; the stylist will tell you before starting." },
  { slug: "policy-location", topic: "location", title: "Getting here", body: "2-7 Jalan Kiara 3, first floor above the bakery. Free parking in the building basement for 2 hours with our stamp." },
  { slug: "policy-kids", topic: "kids", title: "Kids", body: "Kids' cuts are for under-12s. Children under 5 need a parent with them in the chair." },
];

const FAQS: [string, string, string][] = [
  ["how much for long hair cut ah", "A women's cut and blow-dry for long hair is RM 110.", "prices"],
  ["can book tmr 3pm for haircut?", "Check availability for tomorrow 3pm and offer to book.", "booking"],
  ["got slot this sat?", "Check Saturday's availability for the service they want.", "booking"],
  ["open on monday?", "We're closed on Mondays. Tuesday to Sunday from 10am (9am on Saturdays).", "hours"],
  ["do u do keratin", "Yes, keratin smoothing from RM 350 for medium hair; it takes about 2.5 hours.", "treatments"],
  ["balayage price", "Balayage starts at RM 380 for medium hair and RM 450 for long hair.", "colour"],
  ["need patch test?", "Yes for first-time colour clients: a free 5-minute patch test at least 48 hours before.", "colour"],
  ["can cancel my appointment", "Free up to 24 hours before. Send your booking reference and we'll sort it.", "booking"],
  ["parking?", "Free basement parking for 2 hours with our stamp.", "location"],
  ["men haircut how long", "About 30 minutes.", "cuts"],
  ["do u cut kids hair", "Yes, kids' cuts for under-12s are RM 30.", "cuts"],
  ["which stylist is best for curly hair", "All three stylists cut curly hair; tell us your hair type and we'll match you.", "stylists"],
  ["got sell shampoo?", "Yes, bond repair shampoo and mask, and a heat protect spray. Ask about stock.", "products"],
  ["bridal hair trial?", "Yes, book an event updo as a trial; wedding packages are arranged with the team.", "styling"],
  ["can pay tng?", "Yes, Touch 'n Go eWallet works, plus cash, cards, DuitNow QR and GrabPay.", "payment"],
];

export async function seedSalon(log: (...a: unknown[]) => void = () => {}) {
  const ws = SALON;
  const tz = ws.timezone;
  await db.delete(t.workspaces).where(eq(t.workspaces.id, ws.id));
  await db.insert(t.workspaces).values(ws);
  const hash = await bcrypt.hash(process.env.DEMO_PASSWORD ?? "forno7demo", 10);
  await db.insert(t.users).values({ id: "00000000-0000-4000-8000-000000000011", workspaceId: ws.id, email: "owner@demo", name: "Nadia Lim", role: "owner", passwordHash: hash });
  await db.insert(t.channels).values([
    { workspaceId: ws.id, type: "simulator", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "telegram", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "whatsapp", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "instagram", mode: "autopilot", config: {} },
  ]);
  const [appt] = await db
    .insert(t.bookingTypes)
    .values({ workspaceId: ws.id, key: "appointment", name: "Salon appointment", unit: "appointment", capacity: 3, durationMinutes: 60, slotMinutes: 30, maxPerBooking: 1, leadMinutes: 120, notes: "Three stylists. Each service sets its own length." })
    .returning();

  let sort = 0;
  for (const sv of SERVICES) {
    const [item] = await db
      .insert(t.kbItems)
      .values({ workspaceId: ws.id, kind: "service", category: sv.category, slug: sv.slug, title: sv.name, body: sv.desc, data: { durationMinutes: sv.minutes, bookingType: "appointment" }, tags: [], sort: sort++ })
      .returning();
    await db.insert(t.kbVariants).values(sv.prices.map(([opt, price]) => ({ workspaceId: ws.id, itemId: item.id, option: opt, priceMinor: price * 100, stock: null })));
  }
  for (const p of PRODUCTS) {
    const [item] = await db.insert(t.kbItems).values({ workspaceId: ws.id, kind: "product", category: "hair care", slug: p.slug, title: p.name, body: p.desc, tags: [], sort: sort++ }).returning();
    await db.insert(t.kbVariants).values({ workspaceId: ws.id, itemId: item.id, priceMinor: p.price * 100, stock: p.stock });
  }
  await db.insert(t.kbItems).values([
    { workspaceId: ws.id, kind: "hours", category: "hours", slug: "hours", title: "Opening hours", body: "Closed Mondays.", data: HOURS as unknown as Record<string, unknown> },
    ...POLICIES.map((p, i) => ({ workspaceId: ws.id, kind: "policy" as const, category: p.topic, slug: p.slug, title: p.title, body: p.body, sort: i })),
    ...FAQS.map(([q, a, topic], i) => ({ workspaceId: ws.id, kind: "faq" as const, category: topic, slug: `faq-${String(i + 1).padStart(2, "0")}`, title: q, body: a, sort: i })),
  ]);

  // A realistic diary for the next 10 days: stylists already partly booked.
  const today = localDate(new Date(), tz);
  const names = ["Amanda", "Siti", "Mei Xin", "Priya", "Jason", "Farah", "Grace", "Hui Wen"];
  const rows: (typeof t.bookings.$inferInsert)[] = [];
  let seed = 11;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let d = 0; d < 10; d++) {
    const day = addLocalDays(today, d);
    const wd = localWeekday(zoned(day, "12:00", tz), tz);
    const hours = (HOURS.weekly as Record<string, string[][]>)[wd];
    if (!hours?.length) continue;
    for (let i = 0; i < 5; i++) {
      const sv = SERVICES[Math.floor(r() * SERVICES.length)];
      const start = minutesOf(hours[0][0]) + Math.floor(r() * 12) * 30;
      if (start + sv.minutes > minutesOf(hours[0][1])) continue;
      const startsAt = zoned(day, timeOf(start), tz);
      if (startsAt.getTime() < Date.now() + 2 * 3600_000) continue;
      rows.push({ workspaceId: ws.id, customerName: names[Math.floor(r() * names.length)], partySize: 1, startsAt, endsAt: new Date(startsAt.getTime() + sv.minutes * 60_000), refCode: shortCode("KA"), status: "confirmed", isDemo: true, bookingTypeId: appt.id, kind: "appointment", serviceName: sv.name });
    }
  }
  if (rows.length) await db.insert(t.bookings).values(rows);
  log(`sample: ${ws.name} (${ws.id}) with ${SERVICES.length} services, ${PRODUCTS.length} products, ${FAQS.length} FAQs, ${rows.length} appointments`);
}
