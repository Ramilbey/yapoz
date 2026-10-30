// Saves a reviewed draft into Knowledge: products and services with priced options, hours,
// delivery, policies and FAQs (including the owner's answers to the open questions).
import { db, t } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { guessInPerson } from "@/lib/schedule";
import { stockSettings } from "@/lib/stock";
import { onboardingOf } from "@/lib/workspace";
import type { Draft } from "./types";

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "item";

export async function importDraft(workspaceId: string, draft: Draft, opts: { replace: boolean }) {
  return db.transaction(async (tx) => {
    const [ws] = await tx.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
    if (opts.replace) {
      await tx.delete(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), inArray(t.kbItems.kind, ["product", "service", "policy", "faq", "hours", "info"])));
    }
    const taken = new Set((await tx.select({ slug: t.kbItems.slug }).from(t.kbItems).where(eq(t.kbItems.workspaceId, workspaceId))).map((r) => r.slug));
    const unique = (base: string) => {
      let s = base;
      for (let i = 2; taken.has(s); i++) s = `${base}-${i}`;
      taken.add(s);
      return s;
    };

    // The type the business will have once this is saved: it picks where services happen and the stock default.
    const type = ws.settings.business.type || draft.businessType;
    const inPerson = guessInPerson(type);
    const tracked = stockSettings({ settings: { ...ws.settings, business: { ...ws.settings.business, type } } }).defaultMode === "tracked";

    let sort = 0;
    let items = 0;
    for (const it of draft.items) {
      const priced = it.options.filter((o) => o.price !== null);
      const body = it.description || (priced.length ? "" : "Price on request.");
      const [row] = await tx
        .insert(t.kbItems)
        .values({
          workspaceId, kind: it.kind, category: it.category.toLowerCase(), slug: unique(`${it.kind}-${slugify(it.name)}`), title: it.name, body, tags: it.tags.map((x) => x.toLowerCase()),
          data: it.kind === "service" ? { durationMinutes: it.durationMinutes ?? null } : {}, sort: sort++,
          inPerson: it.kind === "service" ? inPerson : false,
          // A count on the list means the owner counts it, even where the business default would ignore counts.
          stockMode: !tracked && priced.some((o) => o.stock !== null) ? "tracked" : null,
        })
        .returning();
      if (priced.length) {
        const single = priced.length === 1;
        await tx.insert(t.kbVariants).values(priced.map((o) => ({ workspaceId, itemId: row.id, option: single && !o.label ? null : o.label, priceMinor: Math.round((o.price ?? 0) * 100), stock: o.stock ?? null })));
      }
      items++;
    }

    if (draft.hours) {
      await tx.delete(t.kbItems).where(and(eq(t.kbItems.workspaceId, workspaceId), eq(t.kbItems.kind, "hours")));
      await tx.insert(t.kbItems).values({
        workspaceId, kind: "hours", category: "hours", slug: unique("hours"), title: "Opening hours", body: draft.hours.notes,
        data: { weekly: draft.hours.weekly, lastOrdersMinutesBeforeClose: draft.hours.lastOrdersMinutesBeforeClose, exceptions: [] },
      });
    }
    if (draft.delivery) {
      await tx.insert(t.kbItems).values({ workspaceId, kind: "info", category: "delivery", slug: unique("delivery"), title: draft.delivery.offered ? "Delivery" : "No delivery", body: draft.delivery.details || (draft.delivery.offered ? "We deliver." : "We don't deliver.") });
    }
    for (const [i, p] of draft.policies.entries()) {
      await tx.insert(t.kbItems).values({ workspaceId, kind: "policy", category: p.topic.toLowerCase(), slug: unique(`policy-${slugify(p.topic)}`), title: p.title, body: p.body, sort: i });
    }
    const faqs = [...draft.faqs, ...draft.openQuestions.filter((q) => q.answer.trim()).map((q) => ({ question: q.question, answer: q.answer.trim(), topic: "general" }))];
    for (const [i, f] of faqs.entries()) {
      await tx.insert(t.kbItems).values({ workspaceId, kind: "faq", category: f.topic.toLowerCase(), slug: unique(`faq-${slugify(f.question).slice(0, 30)}`), title: f.question, body: f.answer, sort: i });
    }

    const settings = structuredClone(ws.settings);
    if (draft.summary && !settings.business.description) settings.business.description = draft.summary;
    if (draft.businessType && !settings.business.type) settings.business.type = draft.businessType;
    const onboarding = onboardingOf(settings);
    settings.onboarding = { ...onboarding, step: Math.max(onboarding.step, 4) };
    await tx.update(t.workspaces).set({ settings }).where(eq(t.workspaces.id, workspaceId));
    await tx.insert(t.events).values({ workspaceId, type: "setup.imported", props: { items, faqs: faqs.length, policies: draft.policies.length } });
    return { items, faqs: faqs.length, policies: draft.policies.length, hours: Boolean(draft.hours) };
  });
}
