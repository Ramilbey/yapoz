import bcrypt from "bcryptjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { extractText, getDocumentProxy } from "unpdf";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { WORKSPACE, PIZZAS, SIDES, MERCH, MERCH_COLORS, MERCH_SIZES, HOURS, DELIVERY, POLICIES, FAQS, EXTRAS, SIZES, DISTRICT } from "./forno";
import { CANDIDATES, resumeText, type SeedCandidate } from "./candidates";
import { weightedLibrary, rng } from "@/demo/library";
import { insertDemoTurn } from "@/demo/replay";
import { addLocalDays, localDate, zoned, minutesOf, timeOf, localWeekday } from "@/lib/time";
import { shortCode } from "@/lib/crypto";
import type { CandidateProfile } from "@/db/schema";

type Log = (...a: unknown[]) => void;

export async function seedWorkspace({ withHistory = true, log = (() => {}) as Log } = {}) {
  const ws = WORKSPACE;
  const tz = ws.timezone;
  await db.delete(t.workspaces).where(eq(t.workspaces.id, ws.id));
  await db.insert(t.workspaces).values(ws);

  // Users
  const password = process.env.DEMO_PASSWORD ?? "forno7demo";
  const hash = await bcrypt.hash(password, 10);
  const [owner, service, hr] = await db
    .insert(t.users)
    .values([
      // Fixed ids keep existing sessions valid across /api/demo/reset.
      { id: "00000000-0000-4000-8000-000000000001", workspaceId: ws.id, email: "owner@demo", name: "Lina Hassan", role: "owner", passwordHash: hash },
      { id: "00000000-0000-4000-8000-000000000002", workspaceId: ws.id, email: "service@demo", name: "Farid Aziz", role: "service", passwordHash: hash },
      { id: "00000000-0000-4000-8000-000000000003", workspaceId: ws.id, email: "hr@demo", name: "Mei Chen", role: "hr", passwordHash: hash },
    ])
    .returning();
  log(`users: owner@demo, service@demo, hr@demo (password from DEMO_PASSWORD)`);

  // Channels
  await db.insert(t.channels).values([
    { workspaceId: ws.id, type: "simulator", mode: "autopilot", config: {} },
    { workspaceId: ws.id, type: "telegram", mode: "autopilot", config: { botUsername: process.env.TELEGRAM_BOT_USERNAME ?? null } },
    { workspaceId: ws.id, type: "whatsapp", mode: "autopilot", config: { phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null } },
    { workspaceId: ws.id, type: "instagram", mode: "autopilot", config: { accountId: process.env.INSTAGRAM_ACCOUNT_ID ?? null } },
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
      })
      .returning();
    await db.insert(t.kbVariants).values({ workspaceId: ws.id, itemId: item.id, priceMinor: s.price * 100, stock: null, sku: s.slug });
  }
  for (const m of MERCH) {
    const [item] = await db
      .insert(t.kbItems)
      .values({ workspaceId: ws.id, kind: "product", category: "merch", slug: m.slug, title: m.name, body: m.desc, data: { colors: MERCH_COLORS, sizes: MERCH_SIZES }, tags: ["merch"], sort: sort++ })
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

  // Bookings for the next 14 days (phone/walk-in bookings already on the books). Saturday 8pm is full.
  const rand = rng(7);
  const today = localDate(new Date(), tz);
  const bookingRows: (typeof t.bookings.$inferInsert)[] = [];
  const names = ["Wong family", "Sarah K.", "Iqbal", "Dr. Lee", "Anita", "Mohd Faiz", "Chen Yi", "Rosli", "Jessica", "Tharun", "Ying", "Hana"];
  for (let d = 0; d < 14; d++) {
    const day = addLocalDays(today, d);
    const wd = localWeekday(zoned(day, "12:00", tz), tz);
    const hours = HOURS.weekly[wd];
    if (!hours?.length) continue;
    const weekend = wd === "fri" || wd === "sat";
    const n = weekend ? 14 : 7;
    for (let i = 0; i < n; i++) {
      const dinner = rand() < 0.75;
      const base = dinner ? minutesOf("18:00") + Math.floor(rand() * 6) * 30 : minutesOf("12:00") + Math.floor(rand() * 4) * 30;
      const party = 2 + Math.floor(rand() * 5);
      const startsAt = zoned(day, timeOf(base), tz);
      if (startsAt.getTime() < Date.now() + 3600_000) continue;
      // Keep seeded bookings under ~65% of capacity so live demo bookings always fit (Saturday 8pm aside).
      const occupied = (k: number) => bookingRows.filter((r) => r.startsAt!.getTime() <= k && r.endsAt!.getTime() > k).reduce((sum, r) => sum + r.partySize!, 0);
      const overlaps = [0, 30, 60].map((m) => startsAt.getTime() + m * 60_000);
      if (overlaps.some((k) => occupied(k) + party > 20)) continue;
      bookingRows.push({
        workspaceId: ws.id, customerName: names[Math.floor(rand() * names.length)], partySize: party, startsAt,
        endsAt: new Date(startsAt.getTime() + 90 * 60_000), refCode: shortCode("F7"), status: "confirmed", isDemo: true,
        notes: rand() < 0.2 ? "Birthday, bringing cake" : null,
      });
    }
    if (wd === "sat") {
      // Fill 8pm Saturday so the agent has to offer alternatives.
      for (const party of [8, 8, 8, 8]) {
        const startsAt = zoned(day, "20:00", tz);
        bookingRows.push({ workspaceId: ws.id, customerName: "Private group", partySize: party, startsAt, endsAt: new Date(startsAt.getTime() + 90 * 60_000), refCode: shortCode("F7"), status: "confirmed", isDemo: true });
      }
    }
  }
  if (bookingRows.length) await db.insert(t.bookings).values(bookingRows);
  log(`bookings: ${bookingRows.length} seeded for the next 14 days`);

  // Hiring
  const [req] = await db
    .insert(t.requisitions)
    .values({
      workspaceId: ws.id, title: "Pizza cook", createdBy: hr.id,
      description: `Wood-fired pizza cook for evening service (5pm–close) at our ${DISTRICT} restaurant. Stretch, top and bake Neapolitan-style pizzas, manage the oven fire, keep the station clean.`,
    })
    .returning();
  let pdfs = 0;
  for (const c of CANDIDATES) {
    const text = resumeText(c);
    let raw = text;
    let doc: { filename: string; bytes: Buffer; text: string } | null = null;
    if (c.format === "pdf") {
      const bytes = await renderResumePdf(text);
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      const { text: extracted } = await extractText(pdf, { mergePages: true });
      raw = String(extracted);
      doc = { filename: `${c.name.split(" ")[0].toLowerCase()}-resume.pdf`, bytes, text: raw };
      pdfs++;
    }
    const [cand] = await db
      .insert(t.candidates)
      .values({
        workspaceId: ws.id, fullName: c.name, source: c.format === "pdf" ? "upload" : "telegram_channel",
        sourceRef: c.format === "pdf" ? "seed: resume upload" : "seed: Forno Sette Jobs channel",
        roleInterest: "Pizza cook", telegramUsername: c.contact.telegram ?? null, email: c.contact.email ?? null,
        language: "en", district: c.district, totalYears: c.totalYears, availability: c.availability,
        profile: profileOf(c), rawText: raw, consent: true, consentAt: new Date(), parsedBy: "seed", parsedAt: new Date(),
      })
      .returning();
    if (doc) await db.insert(t.candidateDocuments).values({ workspaceId: ws.id, candidateId: cand.id, filename: doc.filename, mime: "application/pdf", bytes: doc.bytes, text: doc.text });
    await db.insert(t.matches).values({ workspaceId: ws.id, requisitionId: req.id, candidateId: cand.id, stage: "sourced" });
  }
  log(`hiring: requisition "Pizza cook", ${CANDIDATES.length} candidates (${pdfs} PDF resumes, ${CANDIDATES.length - pdfs} channel posts)`);

  // HR's built-in calendar: some busy blocks over the next 10 days.
  const busy: (typeof t.calendarEvents.$inferInsert)[] = [];
  for (let d = 0; d < 10; d++) {
    const day = addLocalDays(today, d);
    const wd = localWeekday(zoned(day, "12:00", tz), tz);
    if (wd === "sun" || wd === "sat") continue;
    busy.push({ workspaceId: ws.id, userId: hr.id, title: "Payroll and rosters", kind: "busy", startsAt: zoned(day, "10:00", tz), endsAt: zoned(day, "11:30", tz) });
    if (d % 2 === 0) busy.push({ workspaceId: ws.id, userId: hr.id, title: "Supplier meeting", kind: "busy", startsAt: zoned(day, "14:00", tz), endsAt: zoned(day, "15:00", tz) });
    busy.push({ workspaceId: ws.id, userId: hr.id, title: "Lunch rush on the floor", kind: "busy", startsAt: zoned(day, "12:30", tz), endsAt: zoned(day, "13:30", tz) });
  }
  await db.insert(t.calendarEvents).values(busy);

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
  return { workspaceId: ws.id };
}

function profileOf(c: SeedCandidate): CandidateProfile {
  return {
    headline: `${c.roles[0].title}, ${c.roles[0].place}`,
    skills: c.skills,
    pastRoles: c.roles.map((r) => ({ title: r.title, place: r.place, years: Math.max(1, (r.to === "present" ? 2026 : r.to) - r.from) })),
    availability: c.availability,
    district: c.district,
    languages: c.languages,
    totalYears: c.totalYears,
    contact: c.contact.telegram ? { channel: "telegram", value: `@${c.contact.telegram}` } : { channel: "email", value: c.contact.email ?? null },
    summary: c.highlights[0],
  };
}

async function renderResumePdf(text: string): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 790;
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const isHeader = i === 0 || /^[A-Z ]{6,}$/.test(line);
    const f = isHeader ? bold : font;
    const size = i === 0 ? 18 : isHeader ? 11 : 10;
    for (const chunk of wrap(line, f, size, 495)) {
      if (y < 60) {
        page = pdf.addPage([595, 842]);
        y = 790;
      }
      page.drawText(chunk, { x: 50, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= size + 6;
    }
    if (line === "") y -= 4;
  });
  return Buffer.from(await pdf.save());
}

function wrap(line: string, font: { widthOfTextAtSize: (s: string, n: number) => number }, size: number, max: number): string[] {
  if (!line) return [];
  const words = line.split(" ");
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > max && cur) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}
