// Kasih Hair Studio: a fictional hair salon in Mont Kiara, the second sample business.
// It exists to show the same agent working for a services business, not just a restaurant.
import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import type { WorkspaceSettings, StaffSchedule } from "@/db/schema";
import { shortCode } from "@/lib/crypto";
import { zoned, localDate, localWeekday, addLocalDays } from "@/lib/time";

export const SALON = {
  id: "KASIH1",
  name: "Kasih Hair Studio",
  city: "Kuala Lumpur",
  timezone: "Asia/Kuala_Lumpur",
  currency: "MYR",
  settings: {
    confidenceThreshold: 0.55,
    demoTraffic: false,
    business: {
      type: "hair salon",
      description: "Friendly neighbourhood hair salon with three stylists. Cuts, colour, treatments and blow-dries for women, men and kids. Sells a small range of hair care products.",
      address: "2-7 Jalan Kiara 3, Mont Kiara, 50480 Kuala Lumpur",
      phone: null,
      website: null,
      languages: ["English", "Malay", "Mandarin"],
    },
    stock: { defaultMode: "none", dayStartsAt: "00:00", holdMinutes: 20, preorderDays: 7, lowStockDefault: 5 },
    appointments: { slotMinutes: 30, assignment: "specific", bookingDays: 30, minNoticeMinutes: 120, changeCutoffHours: 24, reminderMinutes: 60, bufferMinutes: 10, meetBase: "https://meet.jit.si", whatsappTemplate: null },
    live: true,
    sample: true,
    onboarding: { step: 6, completedAt: "2026-10-01T00:00:00.000Z" },
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

// The stylists log in with the same demo password. Hours sit inside the salon's opening hours.
const STYLISTS: { id: string; name: string; email: string; schedule: StaffSchedule; does: string[] }[] = [
  {
    id: "00000000-0000-4000-8000-000000000012", name: "Aina Sofea", email: "aina@kasih.example",
    schedule: { weekly: { mon: [], tue: [["10:00", "18:00"]], wed: [["10:00", "18:00"]], thu: [["12:00", "20:00"]], fri: [["12:00", "20:00"]], sat: [["10:00", "18:00"]], sun: [] }, exceptions: [{ date: "2026-11-20", hours: [], note: "Colour course in Petaling Jaya" }] },
    does: ["full-colour", "root-touch-up", "highlights", "keratin", "scalp-treatment"],
  },
  {
    id: "00000000-0000-4000-8000-000000000013", name: "Chong Mei Ling", email: "meiling@kasih.example",
    schedule: { weekly: { mon: [], tue: [["10:00", "19:00"]], wed: [], thu: [["10:00", "20:00"]], fri: [["10:00", "20:00"]], sat: [["09:00", "18:00"]], sun: [["10:00", "17:00"]] }, exceptions: [{ date: "2026-11-14", hours: [], note: "Family wedding" }] },
    does: ["womens-cut", "mens-cut", "kids-cut", "blow-dry", "updo"],
  },
  {
    id: "00000000-0000-4000-8000-000000000014", name: "Priya Nair", email: "priya@kasih.example",
    schedule: { weekly: { mon: [], tue: [["10:00", "19:00"]], wed: [["10:00", "19:00"]], thu: [], fri: [["11:00", "21:00"]], sat: [["09:00", "19:00"]], sun: [["10:00", "17:00"]] }, exceptions: [{ date: "2026-11-11", hours: [], note: "Annual leave" }] },
    does: ["womens-cut", "mens-cut", "root-touch-up", "full-colour", "scalp-treatment", "blow-dry"],
  },
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
  { slug: "policy-patch-test", topic: "colour", title: "Colour patch test", body: "First-time colour or lightening clients need a quick patch test at the salon at least 48 hours before the appointment. It's free and takes 5 minutes." },
  { slug: "policy-payment", topic: "payment", title: "Payment", body: "Cash, cards, DuitNow QR, Touch 'n Go eWallet and GrabPay. Prices can change after the consultation if your hair needs more product or time; the stylist will tell you before starting." },
  { slug: "policy-location", topic: "location", title: "Getting here", body: "2-7 Jalan Kiara 3, first floor above the bakery. Free parking in the building basement for 2 hours with our stamp." },
  { slug: "policy-kids", topic: "kids", title: "Kids", body: "Kids' cuts are for under-12s. Children under 5 need a parent with them in the chair." },
];

const FAQS: [string, string, string][] = [
  ["how much for long hair cut ah", "A women's cut and blow-dry for long hair is RM 110.", "prices"],
  ["open on monday?", "We're closed on Mondays. Tuesday to Sunday from 10am (9am on Saturdays).", "hours"],
  ["do u do keratin", "Yes, keratin smoothing from RM 350 for medium hair; it takes about 2.5 hours.", "treatments"],
  ["balayage price", "Balayage starts at RM 380 for medium hair and RM 450 for long hair.", "colour"],
  ["need patch test?", "Yes for first-time colour clients: a free 5-minute patch test at least 48 hours before.", "colour"],
  ["parking?", "Free basement parking for 2 hours with our stamp.", "location"],
  ["men haircut how long", "About 30 minutes.", "cuts"],
  ["do u cut kids hair", "Yes, kids' cuts for under-12s are RM 30.", "cuts"],
  ["which stylist is best for curly hair", "All three stylists cut curly hair; tell us your hair type and we'll match you.", "stylists"],
  ["got sell shampoo?", "Yes, bond repair shampoo and mask, and a heat protect spray. Ask about stock.", "products"],
  ["bridal hair trial?", "Yes, we can do an event updo as a trial; wedding packages are arranged with the team.", "styling"],
  ["can pay tng?", "Yes, Touch 'n Go eWallet works, plus cash, cards, DuitNow QR and GrabPay.", "payment"],
];

export async function seedSalon(log: (...a: unknown[]) => void = () => {}) {
  const ws = SALON;
  const tz = ws.timezone;
  await db.delete(t.workspaces).where(eq(t.workspaces.id, ws.id));
  await db.insert(t.workspaces).values(ws);
  const hash = await bcrypt.hash(process.env.DEMO_PASSWORD ?? "forno7demo", 10);
  await db.insert(t.users).values({ id: "00000000-0000-4000-8000-000000000011", workspaceId: ws.id, email: "owner@demo", name: "Nadia Lim", role: "owner", passwordHash: hash });
  await db.insert(t.users).values(STYLISTS.map((st) => ({ id: st.id, workspaceId: ws.id, email: st.email, name: st.name, role: "service" as const, passwordHash: hash })));
  await db.insert(t.channels).values([
    { workspaceId: ws.id, type: "simulator", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "telegram", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "whatsapp", mode: "autopilot", config: {} },
  ]);

  let sort = 0;
  const catalog = new Map<string, { id: string; title: string; variants: { id: string; option: string | null; priceMinor: number }[] }>();
  for (const sv of SERVICES) {
    const [item] = await db
      .insert(t.kbItems)
      .values({ workspaceId: ws.id, kind: "service", category: sv.category, slug: sv.slug, title: sv.name, body: sv.desc, data: { durationMinutes: sv.minutes }, inPerson: true, tags: [], stockMode: null, sort: sort++ })
      .returning();
    const variants = await db.insert(t.kbVariants).values(sv.prices.map(([opt, price]) => ({ workspaceId: ws.id, itemId: item.id, option: opt, priceMinor: price * 100, stock: null }))).returning();
    catalog.set(sv.slug, { id: item.id, title: sv.name, variants });
  }
  for (const p of PRODUCTS) {
    const [item] = await db.insert(t.kbItems).values({ workspaceId: ws.id, kind: "product", category: "hair care", slug: p.slug, title: p.name, body: p.desc, tags: [], stockMode: "tracked", sort: sort++ }).returning();
    await db.insert(t.kbVariants).values({ workspaceId: ws.id, itemId: item.id, priceMinor: p.price * 100, stock: p.stock });
  }
  await db.insert(t.kbItems).values([
    { workspaceId: ws.id, kind: "hours", category: "hours", slug: "hours", title: "Opening hours", body: "Closed Mondays.", data: HOURS as unknown as Record<string, unknown> },
    ...POLICIES.map((p, i) => ({ workspaceId: ws.id, kind: "policy" as const, category: p.topic, slug: p.slug, title: p.title, body: p.body, sort: i })),
    ...FAQS.map(([q, a, topic], i) => ({ workspaceId: ws.id, kind: "faq" as const, category: topic, slug: `faq-${String(i + 1).padStart(2, "0")}`, title: q, body: a, sort: i })),
  ]);

  // Staff rows: the owner doesn't take appointments; each stylist does their own services.
  await db.insert(t.staff).values([
    { userId: "00000000-0000-4000-8000-000000000011", workspaceId: ws.id, takesAppointments: false, schedule: null, serviceIds: [] },
    ...STYLISTS.map((st) => ({ userId: st.id, workspaceId: ws.id, takesAppointments: true, schedule: st.schedule, serviceIds: st.does.map((slug) => catalog.get(slug)!.id) })),
  ]);

  // Sample bookings, dated from today onto a day the stylist works.
  const today = localDate(new Date(), tz);
  const workDay = (st: (typeof STYLISTS)[number], from: number, step: 1 | -1) => {
    let date = addLocalDays(today, from);
    while (!(st.schedule.weekly[localWeekday(zoned(date, "12:00", tz), tz)]?.length) || st.schedule.exceptions.some((e) => e.date === date)) date = addLocalDays(date, step);
    return { date, open: st.schedule.weekly[localWeekday(zoned(date, "12:00", tz), tz)][0][0] };
  };
  const BOOKINGS = [
    { st: STYLISTS[1], slug: "womens-cut", option: "Long hair", customer: "Farah Ismail", channel: "whatsapp" as const, status: "confirmed" as const, from: 3, step: 1 as const, time: "14:00" },
    { st: STYLISTS[0], slug: "full-colour", option: "Medium hair", customer: "Jessica Tan", channel: "telegram" as const, status: "pending" as const, from: 5, step: 1 as const, time: "11:00" },
    { st: STYLISTS[2], slug: "mens-cut", option: "Standard", customer: "Arjun Menon", channel: "whatsapp" as const, status: "completed" as const, from: -4, step: -1 as const, time: "15:00" },
  ];
  for (const b of BOOKINGS) {
    const sv = catalog.get(b.slug)!;
    const v = sv.variants.find((x) => x.option === b.option)!;
    const minutes = SERVICES.find((x) => x.slug === b.slug)!.minutes;
    const { date, open } = workDay(b.st, b.from, b.step);
    const startsAt = zoned(date, b.time < open ? open : b.time, tz);
    const endsAt = new Date(startsAt.getTime() + minutes * 60_000);
    const done = b.status === "completed";
    const [order] = await db
      .insert(t.orders)
      .values({
        workspaceId: ws.id, refCode: shortCode("APT"), kind: "appointment", customerName: b.customer, fulfilment: "pickup", wanted: `${date} ${b.time}`, wantedDate: date,
        status: b.status, totalMinor: v.priceMinor, currency: ws.currency, channel: b.channel, isDemo: true, holdExpiresAt: null,
        createdAt: new Date(Math.min(startsAt.getTime(), Date.now()) - 2 * 86_400_000),
        confirmedAt: b.status === "pending" ? null : new Date(Math.min(startsAt.getTime(), Date.now()) - 2 * 86_400_000 + 5 * 60_000),
        completedAt: done ? endsAt : null,
      })
      .returning();
    await db.insert(t.orderItems).values({ workspaceId: ws.id, orderId: order.id, itemId: sv.id, variantId: v.id, name: `${sv.title}, ${v.option}`, quantity: 1, unitPriceMinor: v.priceMinor });
    await db.insert(t.appointments).values({
      workspaceId: ws.id, orderId: order.id, staffId: b.st.id, itemId: sv.id, variantId: v.id, startsAt, endsAt, meetLink: null,
      attendance: done ? "present" : null, attendanceBy: done ? "00000000-0000-4000-8000-000000000011" : null, attendanceAt: done ? endsAt : null, isDemo: true,
    });
  }

  log(`sample: ${ws.name} (${ws.id}) with ${SERVICES.length} services, ${PRODUCTS.length} products, ${FAQS.length} FAQs`);
}
