// Seeded conversations used for (a) 7 days of labeled demo history and (b) the owner-only "Demo traffic" replay.
// Everything inserted from here is flagged is_demo = true and shown with a "demo data" label in the UI.
import { FAQS } from "@/seed/forno";

export type DemoTool = { name: string; label: string };
export type DemoTurn = {
  in: string;
  out: string;
  tools: DemoTool[];
  intent: string;
  topic: string;
  outcome: "auto_resolved" | "ordered" | "escalated" | "declined";
  sentiment: "positive" | "neutral" | "negative";
  escalation?: { category: string; priority: "low" | "normal" | "high" | "urgent"; summary: string; reason: string };
  gap?: { key: string; question: string };
};

const T = {
  hours: { name: "get_business_info", label: "checked hours" },
  delivery: { name: "get_business_info", label: "checked delivery zones" },
  policy: (what: string) => ({ name: "get_business_info", label: `checked ${what} policy` }),
  catalog: (q: string) => ({ name: "search_catalog", label: `searched menu: ${q}` }),
  variant: (what: string) => ({ name: "check_variant", label: `checked stock: ${what}` }),
  order: (what: string) => ({ name: "create_order", label: `ordered: ${what}` }),
  escalate: (why: string) => ({ name: "escalate", label: `escalated: ${why}` }),
};

const DYNAMIC: Record<string, string> = {
  "the truffle one available today?": "Sorry, the Funghi e Tartufo is sold out today. Our truffle delivery is late, it's back tomorrow. The Quattro Formaggi is the closest rich, cheesy pick.",
  "the apron got in red?": "Yes, Brick Red aprons are in stock in S, M and L (RM 69). XL has just one left.",
  "tshirt size M black ada?": "Our dark tee is Charcoal and size M is in stock, RM 59. Want me to hold one at the counter?",
};

const TOPIC_TOOLS: Record<string, (q: string) => DemoTool[]> = {
  hours: () => [T.hours],
  delivery: () => [T.delivery],
  location: () => [T.policy("location")],
  halal: () => [T.policy("halal")],
  payment: () => [T.policy("payment")],
  drinks: (q) => [q.includes("corkage") ? T.policy("corkage") : T.catalog("drinks")],
  menu: (q) => [T.catalog(q.includes("spicy") ? "spicy" : q.includes("vegan") ? "vegan" : "pizza")],
  stock: () => [T.variant("Funghi e Tartufo")],
  merch: (q) => [T.variant(q.includes("apron") ? "apron, Brick Red" : "T-shirt M, Charcoal")],
  events: () => [T.policy("events")],
  promotions: () => [T.policy("promotions")],
  food: () => [T.policy("dough")],
  house: () => [T.policy("house")],
  allergens: () => [T.policy("allergens"), T.escalate("severe allergy")],
  complaints: () => [T.policy("complaints"), T.escalate("complaint")],
};

const faqTurns: DemoTurn[] = FAQS.map((f) => {
  const esc = f.topic === "allergens" || f.topic === "complaints";
  return {
    in: f.q,
    out: DYNAMIC[f.q] ?? f.a,
    tools: (TOPIC_TOOLS[f.topic] ?? (() => [T.policy(f.topic)]))(f.q),
    intent: f.topic === "complaints" ? "complaint" : "question",
    topic: f.topic,
    outcome: esc ? "escalated" : "auto_resolved",
    sentiment: f.topic === "complaints" ? "negative" : "neutral",
    escalation: esc
      ? f.topic === "complaints"
        ? { category: "complaint", priority: "high", reason: "Complaint about a delivered order", summary: "Pizza arrived cold and soggy; customer upset, needs manager follow-up." }
        : { category: "allergy", priority: "high", reason: "Allergy question beyond listed allergens", summary: "Parent asking if a child with a nut allergy can eat safely; needs manager." }
      : undefined,
  } satisfies DemoTurn;
});

const extra: DemoTurn[] = [
  { in: "2 large margherita pickup 7pm pls", out: "Done! 2 Large Margherita for pickup at 7:00pm, RM 104. Your order code is F7-K2QD. Please send your payment receipt here to confirm.", tools: [T.catalog("margherita"), T.order("2 Large Margherita, pickup")], intent: "order", topic: "orders", outcome: "ordered", sentiment: "positive" },
  { in: "can order 1 diavola medium + 2 lemonade deliver to bangsar village", out: "Got it: 1 Medium Diavola and 2 lemonades for delivery, RM 69 including delivery. Order code F7-M8TX.", tools: [T.catalog("diavola"), T.order("Diavola M + 2 lemonade, delivery")], intent: "order", topic: "orders", outcome: "ordered", sentiment: "positive" },
  { in: "1 marinara small and 1 tiramisu takeaway", out: "Your order is in: 1 Small Marinara and 1 Tiramisu for pickup. Reference F7-R4WN.", tools: [T.catalog("marinara"), T.order("Marinara S + Tiramisu, pickup")], intent: "order", topic: "orders", outcome: "ordered", sentiment: "positive" },
  { in: "large margherita how much", out: "Large Margherita (15\") is RM 52. Medium RM 38, Small RM 28.", tools: [T.variant("Margherita L")], intent: "price", topic: "menu", outcome: "auto_resolved", sentiment: "neutral" },
  { in: "rendang pizza spicy or not", out: "The Rendang Rossa has a gentle, warm heat. It's our signature. Medium is RM 52.", tools: [T.catalog("rendang")], intent: "question", topic: "menu", outcome: "auto_resolved", sentiment: "positive" },
  { in: "I want to discuss a franchise for Penang", out: "Thanks for your interest! I've passed this to our owner, who handles partnerships personally. They'll reply here soon.", tools: [T.escalate("franchise")], intent: "partnership", topic: "partnership", outcome: "escalated", sentiment: "neutral", escalation: { category: "partnership", priority: "normal", reason: "Franchise enquiry", summary: "Wants to discuss a Forno Sette franchise in Penang." } },
  { in: "we supply mozzarella, can talk to your purchasing?", out: "Thank you! I've shared this with our team, and someone will reach out here.", tools: [T.escalate("wholesale")], intent: "partnership", topic: "wholesale", outcome: "escalated", sentiment: "neutral", escalation: { category: "wholesale", priority: "low", reason: "Supplier pitch", summary: "Mozzarella supplier asking for purchasing contact." } },
  { in: "if i order 25 large pizza can give 30% discount?", out: "Great question. I've passed your order to our manager, who'll come back to you on pricing for 25 pizzas.", tools: [T.escalate("price negotiation")], intent: "negotiation", topic: "pricing", outcome: "escalated", sentiment: "neutral", escalation: { category: "negotiation", priority: "normal", reason: "Bulk discount request", summary: "Asking 30% off for 25 large pizzas; needs manager decision." } },
  { in: "i want refund my order was wrong", out: "I'm sorry about that. Could you send a photo of the order? Our duty manager will review it personally and make it right.", tools: [T.policy("complaints"), T.escalate("refund")], intent: "refund", topic: "complaints", outcome: "escalated", sentiment: "negative", escalation: { category: "refund", priority: "high", reason: "Refund request", summary: "Says the delivered order was wrong; wants a refund." } },
  { in: "can write my assignment about italy", out: "Sorry, I can only help with Forno Sette's menu and orders.", tools: [], intent: "off_topic", topic: "off_topic", outcome: "declined", sentiment: "neutral" },
  { in: "who will win the election", out: "Sorry, I can only help with Forno Sette's menu and orders.", tools: [], intent: "off_topic", topic: "off_topic", outcome: "declined", sentiment: "neutral" },
  { in: "do u have gluten free base?", out: "Good question. I'll check with the team and get back to you here shortly.", tools: [T.catalog("gluten free"), T.escalate("knowledge gap")], intent: "question", topic: "dietary", outcome: "escalated", sentiment: "neutral", escalation: { category: "knowledge_gap", priority: "low", reason: "Not in knowledge base", summary: "Asked about a gluten-free base; no answer on file." }, gap: { key: "gluten-free base", question: "gluten-free?" } },
  { in: "gluten free pizza available?", out: "Let me check with the team and come back to you here.", tools: [T.catalog("gluten free"), T.escalate("knowledge gap")], intent: "question", topic: "dietary", outcome: "escalated", sentiment: "neutral", escalation: { category: "knowledge_gap", priority: "low", reason: "Not in knowledge base", summary: "Gluten-free pizza question; no answer on file." }, gap: { key: "gluten-free base", question: "gluten-free?" } },
  { in: "student discount ada?", out: "I'll check with the team and reply here soon.", tools: [T.policy("promotions"), T.escalate("knowledge gap")], intent: "question", topic: "promotions", outcome: "escalated", sentiment: "neutral", escalation: { category: "knowledge_gap", priority: "low", reason: "Not in knowledge base", summary: "Asked about a student discount." }, gap: { key: "student discount", question: "student discount?" } },
  { in: "cauliflower crust can?", out: "Let me check with the team and get back to you.", tools: [T.catalog("cauliflower"), T.escalate("knowledge gap")], intent: "question", topic: "dietary", outcome: "escalated", sentiment: "neutral", escalation: { category: "knowledge_gap", priority: "low", reason: "Not in knowledge base", summary: "Asked about cauliflower / keto crust." }, gap: { key: "cauliflower or keto crust", question: "cauliflower / keto crust?" } },
  { in: "sell frozen pizza to bring home?", out: "I'll check with the team and let you know here.", tools: [T.catalog("frozen"), T.escalate("knowledge gap")], intent: "question", topic: "menu", outcome: "escalated", sentiment: "neutral", escalation: { category: "knowledge_gap", priority: "low", reason: "Not in knowledge base", summary: "Asked about frozen take-home pizzas." }, gap: { key: "frozen take-home pizza", question: "frozen pizza to take home?" } },
  { in: "thank youuu the pizza was amazing last night!!", out: "That made our day, thank you! Come back soon.", tools: [], intent: "feedback", topic: "feedback", outcome: "auto_resolved", sentiment: "positive" },
  { in: "best pizza in bangsar fr", out: "Thank you! The oven crew will be very happy to hear it.", tools: [], intent: "feedback", topic: "feedback", outcome: "auto_resolved", sentiment: "positive" },
];

export const LIBRARY: DemoTurn[] = [...faqTurns, ...extra];

/** Weighted pick so the mix looks like a real week: mostly questions, some orders, a few escalations. */
export function weightedLibrary(): DemoTurn[] {
  const out: DemoTurn[] = [];
  for (const t of LIBRARY) {
    let w = 2;
    if (t.outcome === "ordered") w = 6;
    if (t.topic === "hours" || t.topic === "delivery" || t.topic === "menu") w = 4;
    if (t.gap?.key === "gluten-free base") w = 4;
    if (t.outcome === "escalated" && !t.gap) w = 1;
    if (t.outcome === "declined") w = 1;
    for (let i = 0; i < w; i++) out.push(t);
  }
  return out;
}

export const DEMO_NAMES = [
  "Aisha Rahman", "Jun Wei", "Kavitha S.", "Hakim", "Melissa Tan", "Arif Danial", "Sharon Lee", "Ganesh", "Nur Amira", "Bryan Ooi",
  "Farhan", "Chloe Ng", "Deepa", "Haziq", "Rachel Lim", "Amir", "Vanessa", "Syahmi", "Ken Lau", "Puteri", "Adam K.", "Siew Mei",
];

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
