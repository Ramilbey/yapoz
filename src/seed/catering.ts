// Dapur Mak Long Catering: a fictional event caterer in Petaling Jaya, the third sample business.
// It is a different shape on purpose: orders are by the tray or per portion, with minimum quantities and days of lead
// time, and nothing is counted in stock. Its catalogue goes in through the same setup import a new owner uses
// (src/setup/import.ts), so it shows what setup alone can express. What it can't express is listed in
// docs/third-business-gaps.md, and tests/catering.test.ts pins each of those gaps.
import bcrypt from "bcryptjs";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import type { WorkspaceSettings } from "@/db/schema";
import { Draft } from "@/setup/types";
import { importDraft } from "@/setup/import";

export const CATERER = {
  id: "CATER1",
  name: "Dapur Mak Long Catering",
  city: "Petaling Jaya",
  timezone: "Asia/Kuala_Lumpur",
  currency: "MYR",
  settings: {
    confidenceThreshold: 0.55,
    demoTraffic: false,
    business: {
      type: "catering",
      description: "Home-style Malay catering for kenduri, office lunches and birthdays. Cooked fresh to order, delivered in Klang Valley.",
      address: "12 Jalan SS 2/55, 47300 Petaling Jaya",
      phone: null,
      website: null,
      languages: ["English", "Malay"],
    },
    stock: { defaultMode: "none", dayStartsAt: "00:00", holdMinutes: 20, preorderDays: 60, lowStockDefault: 5 },
    live: true,
    sample: true,
    onboarding: { step: 6, completedAt: "2026-10-01T00:00:00.000Z" },
  } satisfies WorkspaceSettings,
};

const day: [string, string][] = [["08:00", "17:00"]];

/** The whole catalogue as the setup wizard's draft: what a new owner would review and import. */
export const CATERING_DRAFT = Draft.parse({
  summary: CATERER.settings.business.description,
  businessType: "catering",
  hours: { weekly: { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: [] }, lastOrdersMinutesBeforeClose: 0, notes: "Closed Sundays. Kitchen deliveries go out from 9am." },
  items: [
    { kind: "product", name: "Nasi impit set", category: "mains", description: "Nasi impit, rendang ayam, kuah kacang, serunding and acar. Priced per portion. Minimum 20 portions.", options: [{ label: "Per portion", price: 18 }] },
    { kind: "product", name: "Nasi briyani gam set", category: "mains", description: "Briyani gam with ayam masak merah, dalca and acar timun. Priced per portion. Minimum 30 portions.", options: [{ label: "Per portion", price: 22 }] },
    { kind: "product", name: "Ayam percik tray", category: "mains", description: "Grilled ayam percik, 40 pieces a tray. Minimum 2 trays.", options: [{ label: "Tray of 40", price: 260 }] },
    { kind: "product", name: "Satay", category: "sides", description: "Chicken or beef satay with peanut sauce, ketupat and cucumber. Sold in sets of 10 sticks. Minimum 10 sets.", options: [{ label: "Chicken, 10 sticks", price: 14 }, { label: "Beef, 10 sticks", price: 18 }] },
    { kind: "product", name: "Kuih platter", category: "desserts", description: "Assorted kuih (seri muka, kuih lapis, onde-onde), 30 pieces a platter. Minimum 2 platters.", options: [{ label: "Platter of 30", price: 65 }] },
    { kind: "product", name: "Teh tarik and sirap bandung, 5 litres", category: "drinks", description: "Dispenser pot, 5 litres, about 25 cups. Cups not included.", options: [{ label: "Teh tarik", price: 55 }, { label: "Sirap bandung", price: 40 }] },
  ],
  delivery: { offered: true, details: "Klang Valley only. RM 40 within Petaling Jaya, Subang and Shah Alam; RM 70 for KL and Selangor beyond that. Setup of a buffet table is RM 120 and must be asked for when ordering." },
  policies: [
    { topic: "minimum order", title: "Minimum quantities", body: "Nasi impit set: 20 portions. Nasi briyani gam set: 30 portions. Ayam percik: 2 trays. Satay: 10 sets (100 sticks). Kuih platter: 2 platters. We cannot take smaller orders." },
    { topic: "lead time", title: "Lead time", body: "Order at least 3 days ahead for up to 100 portions and at least 7 days ahead for more than 100 portions. For anything sooner, the team decides if the kitchen can do it, and it may cost extra." },
    { topic: "deposit", title: "Deposit and payment", body: "50% deposit by bank transfer to confirm the date, the balance on delivery. The deposit is not refundable within 48 hours of the event." },
    { topic: "halal", title: "Halal", body: "All food is halal. The kitchen uses no pork or alcohol, and handles peanuts, prawn and egg." },
  ],
  faqs: [
    { question: "Boleh order untuk kenduri 150 orang?", answer: "Boleh. Untuk lebih 100 pax, sila order sekurang-kurangnya 7 hari lebih awal. Pasukan kami akan sahkan tarikh dan menu.", topic: "lead time" },
    { question: "Do you do vegetarian?", answer: "Not at the moment. Ask the team and we can check if the kitchen can prepare a vegetable dish for a large order.", topic: "menu" },
  ],
});

/** Same shape as the salon's seed: fixed id, demo logins, setup import for the catalogue. */
export async function seedCatering(log: (...a: unknown[]) => void = () => {}) {
  const ws = CATERER;
  await db.delete(t.workspaces).where(eq(t.workspaces.id, ws.id));
  await db.insert(t.workspaces).values(ws);
  const hash = await bcrypt.hash(process.env.DEMO_PASSWORD ?? "forno7demo", 10);
  const ownerId = "00000000-0000-4000-8000-000000000021";
  await db.insert(t.users).values([
    { id: ownerId, workspaceId: ws.id, email: "owner@demo", name: "Zainab Long", role: "owner", passwordHash: hash },
    { id: "00000000-0000-4000-8000-000000000022", workspaceId: ws.id, email: "service@demo", name: "Hafiz Long", role: "service", passwordHash: hash },
  ]);
  await db.insert(t.staff).values({ userId: ownerId, workspaceId: ws.id, takesAppointments: false });
  await db.insert(t.channels).values([
    { workspaceId: ws.id, type: "simulator", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "telegram", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "whatsapp", mode: "autopilot", config: {} },
  ]);
  const r = await importDraft(ws.id, CATERING_DRAFT, { replace: true });
  log(`sample: ${ws.name} (${ws.id}) with ${r.items} items, ${r.policies} policies, ${r.faqs} FAQs`);
}
