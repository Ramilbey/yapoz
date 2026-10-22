// Forno Sette: a fictional wood-fired pizzeria in Bangsar, Kuala Lumpur. All prices in MYR.
import type { WorkspaceSettings } from "@/db/schema";

export const WORKSPACE = {
  id: "FORNO7",
  name: "Forno Sette",
  city: "Kuala Lumpur",
  timezone: "Asia/Kuala_Lumpur",
  currency: "MYR",
  settings: {
    confidenceThreshold: 0.55,
    demoTraffic: false,
    resumeRetentionDays: 180,
    business: {
      type: "wood-fired pizzeria",
      description: "Neapolitan-style wood-fired pizzeria in Bangsar with a 40-seat dining room, a terrace and its own delivery riders nearby. Also sells aprons and T-shirts.",
      address: "27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur",
      phone: null,
      website: null,
      languages: ["English", "Malay"],
    },
    modules: { hiring: true },
    live: true,
    sample: true,
    onboarding: { step: 6, completedAt: "2026-10-01T00:00:00.000Z" },
    hr: { interviewMinutes: 30, workdayStart: "10:00", workdayEnd: "18:00", location: "Forno Sette, 27 Jalan Telawi 3, Bangsar Baru" },
    // Made-up account details: nothing here is a real bank account.
    payments: {
      enabled: true,
      requireReceipt: true,
      note: "Please put your order code in the payment reference.",
      accounts: [
        { id: "demo-bank", type: "bank_transfer", provider: "Sample Bank", accountName: "Forno Sette Sdn Bhd", accountNumber: "1234 5678 9012" },
        { id: "demo-duitnow", type: "duitnow", provider: "DuitNow", accountName: "Forno Sette Sdn Bhd", accountNumber: "012-345 6789" },
      ],
    },
  } satisfies WorkspaceSettings,
};

export const BOOKING_TYPES = [
  { key: "table", name: "Table", unit: "party" as const, capacity: 32, durationMinutes: 90, slotMinutes: 30, maxPerBooking: 10, leadMinutes: 60, notes: "Tables are held 15 minutes. Groups of 8+ pay a RM 100 deposit." },
];

export const DISTRICT = "Bangsar";

type Pizza = {
  slug: string;
  name: string;
  desc: string;
  toppings: string[];
  allergens: string[];
  vegetarian: boolean;
  vegan?: boolean;
  halal: boolean;
  spicy?: boolean;
  prices: [number, number, number]; // S, M, L in RM
  available?: boolean;
  note?: string;
};

export const SIZES = [
  { code: "S", label: 'Small 9"', serves: "1 person" },
  { code: "M", label: 'Medium 12"', serves: "1–2 people" },
  { code: "L", label: 'Large 15"', serves: "2–3 people" },
];

export const PIZZAS: Pizza[] = [
  { slug: "margherita", name: "Margherita", desc: "San Marzano tomato, fior di latte, basil, extra-virgin olive oil.", toppings: ["tomato", "fior di latte", "basil", "olive oil"], allergens: ["gluten", "dairy"], vegetarian: true, halal: true, prices: [28, 38, 52] },
  { slug: "marinara", name: "Marinara", desc: "Tomato, garlic, oregano, olive oil. No cheese.", toppings: ["tomato", "garlic", "oregano", "olive oil"], allergens: ["gluten"], vegetarian: true, vegan: true, halal: true, prices: [24, 32, 44] },
  { slug: "diavola", name: "Diavola", desc: "Tomato, mozzarella, spicy beef pepperoni, Calabrian chilli oil.", toppings: ["tomato", "mozzarella", "beef pepperoni", "chilli oil"], allergens: ["gluten", "dairy"], vegetarian: false, halal: true, spicy: true, prices: [34, 46, 62] },
  { slug: "quattro-formaggi", name: "Quattro Formaggi", desc: "Mozzarella, gorgonzola, parmigiano, smoked scamorza, wildflower honey.", toppings: ["mozzarella", "gorgonzola", "parmigiano", "scamorza", "honey"], allergens: ["gluten", "dairy"], vegetarian: true, halal: true, prices: [36, 49, 66] },
  { slug: "funghi-tartufo", name: "Funghi e Tartufo", desc: "Wild mushrooms, black truffle cream, mozzarella, thyme.", toppings: ["mushrooms", "truffle cream", "mozzarella", "thyme"], allergens: ["gluten", "dairy"], vegetarian: true, halal: true, prices: [42, 58, 76], available: false, note: "Truffle: sold out today. Our truffle delivery is late, back tomorrow." },
  { slug: "capricciosa", name: "Capricciosa", desc: "Tomato, mozzarella, smoked turkey ham, artichoke, mushroom, olives.", toppings: ["tomato", "mozzarella", "smoked turkey ham", "artichoke", "mushroom", "olives"], allergens: ["gluten", "dairy"], vegetarian: false, halal: true, prices: [36, 48, 64] },
  { slug: "pollo-pesto", name: "Pollo Pesto", desc: "Basil pesto, grilled chicken, cherry tomato, mozzarella.", toppings: ["basil pesto (pine nuts)", "grilled chicken", "cherry tomato", "mozzarella"], allergens: ["gluten", "dairy", "tree nuts (pine nuts)"], vegetarian: false, halal: true, prices: [34, 46, 62] },
  { slug: "ortolana", name: "Ortolana", desc: "Grilled zucchini, eggplant, peppers, red onion, mozzarella. Can be made without cheese.", toppings: ["zucchini", "eggplant", "peppers", "red onion", "mozzarella"], allergens: ["gluten", "dairy"], vegetarian: true, halal: true, prices: [32, 44, 58] },
  { slug: "salsiccia", name: "Salsiccia e Friarielli", desc: "Beef fennel sausage, broccoli rabe, smoked provola, chilli flakes.", toppings: ["beef fennel sausage", "broccoli rabe", "smoked provola", "chilli flakes"], allergens: ["gluten", "dairy"], vegetarian: false, halal: true, spicy: true, prices: [38, 52, 70] },
  { slug: "bianca-limone", name: "Bianca al Limone", desc: "No tomato. Fior di latte, ricotta, lemon zest, mint, black pepper.", toppings: ["fior di latte", "ricotta", "lemon zest", "mint"], allergens: ["gluten", "dairy"], vegetarian: true, halal: true, prices: [32, 44, 58] },
  { slug: "gamberi", name: "Gamberi", desc: "Tiger prawns, garlic, chilli, cherry tomato, parsley, mozzarella.", toppings: ["tiger prawns", "garlic", "chilli", "cherry tomato", "parsley", "mozzarella"], allergens: ["gluten", "dairy", "shellfish"], vegetarian: false, halal: true, spicy: true, prices: [42, 56, 74] },
  { slug: "vodka-rosa", name: "Vodka Rosa", desc: "Vodka tomato cream, stracciatella, basil. Contains alcohol.", toppings: ["vodka tomato cream", "stracciatella", "basil"], allergens: ["gluten", "dairy"], vegetarian: true, halal: false, prices: [36, 49, 66] },
  { slug: "rendang-rossa", name: "Rendang Rossa", desc: "House signature. Slow-cooked beef rendang, red onion, mozzarella, crispy shallots, coriander.", toppings: ["beef rendang", "red onion", "mozzarella", "crispy shallots", "coriander"], allergens: ["gluten", "dairy"], vegetarian: false, halal: true, spicy: true, prices: [38, 52, 70] },
  { slug: "agnello-piccante", name: "Agnello Piccante", desc: "Spicy lamb spread, mozzarella, red onion, wildflower honey.", toppings: ["spicy lamb", "mozzarella", "red onion", "honey"], allergens: ["gluten", "dairy"], vegetarian: false, halal: true, spicy: true, prices: [40, 54, 72] },
];

export const EXTRAS = [
  { name: "Extra mozzarella", price: 4 },
  { name: "Burrata (whole)", price: 12 },
  { name: "Calabrian chilli oil", price: 2 },
  { name: "Rocket and parmigiano", price: 5 },
  { name: "Beef pepperoni", price: 6 },
  { name: "Grilled chicken", price: 7 },
  { name: "Fried egg", price: 3 },
];

export const SIDES = [
  { slug: "garlic-knots", name: "Garlic knots (6)", category: "sides", price: 14, desc: "Wood-fired dough knots, garlic butter, parsley.", allergens: ["gluten", "dairy"], vegetarian: true, halal: true },
  { slug: "burrata-salad", name: "Burrata and heirloom tomato", category: "sides", price: 32, desc: "Whole burrata, tomatoes, basil oil, sourdough crumbs.", allergens: ["gluten", "dairy"], vegetarian: true, halal: true },
  { slug: "rocket-salad", name: "Rocket and pear salad", category: "sides", price: 22, desc: "Rocket, pear, walnuts, parmigiano, balsamic.", allergens: ["dairy", "tree nuts (walnuts)"], vegetarian: true, halal: true },
  { slug: "tiramisu", name: "Tiramisu", category: "desserts", price: 18, desc: "Mascarpone, espresso, cocoa. Alcohol-free.", allergens: ["gluten", "dairy", "egg"], vegetarian: true, halal: true },
  { slug: "nutella-calzone", name: "Nutella calzone", category: "desserts", price: 24, desc: "Folded dough, Nutella, hazelnuts, icing sugar. Shareable.", allergens: ["gluten", "dairy", "tree nuts (hazelnuts)"], vegetarian: true, halal: true },
  { slug: "house-lemonade", name: "House lemonade", category: "drinks", price: 12, desc: "Fresh lemon, mint, soda. Non-alcoholic.", allergens: [], vegetarian: true, halal: true },
  { slug: "italian-soda", name: "Italian soda", category: "drinks", price: 11, desc: "Blood orange, lemon or bergamot. Non-alcoholic.", allergens: [], vegetarian: true, halal: true },
  { slug: "peroni", name: "Peroni Nastro Azzurro (330ml)", category: "drinks", price: 26, desc: "Italian lager. 18+ only.", allergens: ["gluten"], vegetarian: true, halal: false },
];

export const MERCH_COLORS = ["Charcoal", "Brick Red", "Cream"];
export const MERCH_SIZES = ["S", "M", "L", "XL"];
export const MERCH = [
  {
    slug: "apron",
    name: "Forno Sette canvas apron",
    price: 69,
    desc: "Heavy cotton canvas, leather neck strap, two front pockets. Cut in four sizes.",
    // stock[color][size]
    stock: { Charcoal: [4, 9, 7, 3], "Brick Red": [2, 6, 5, 1], Cream: [0, 3, 4, 2] },
  },
  {
    slug: "tshirt",
    name: "Forno Sette T-shirt",
    price: 59,
    desc: "Heavyweight 220gsm cotton tee with the oven-door print on the back.",
    stock: { Charcoal: [6, 12, 10, 4], "Brick Red": [3, 8, 6, 0], Cream: [5, 7, 2, 1] },
  },
];

export const HOURS = {
  weekly: {
    mon: [],
    tue: [["12:00", "22:30"]],
    wed: [["12:00", "22:30"]],
    thu: [["12:00", "22:30"]],
    fri: [["12:00", "23:30"]],
    sat: [["12:00", "23:30"]],
    sun: [["11:00", "22:00"]],
  } as Record<string, [string, string][]>,
  lastOrdersMinutesBeforeClose: 30,
  exceptions: [
    { date: "2026-10-31", hours: [["12:00", "17:00"]], note: "Closed from 5pm for a private event" },
    { date: "2026-12-24", hours: [["17:00", "23:30"]], note: "Christmas Eve, dinner only, set menu" },
    { date: "2026-12-25", hours: [["12:00", "22:00"]], note: "Christmas Day" },
    { date: "2026-12-28", hours: [["12:00", "22:30"]], note: "Open this Monday for the holidays" },
    { date: "2026-12-31", hours: [["17:00", "01:00"]], note: "New Year's Eve, open until 1am" },
    { date: "2027-01-01", hours: [["15:00", "22:00"]], note: "New Year's Day, opening late" },
  ] as { date: string; hours: [string, string][]; note: string }[],
};

export const ADDRESS = "27 Jalan Telawi 3, Bangsar Baru, 59100 Kuala Lumpur";

export const DELIVERY = {
  zones: [
    { name: "Zone A", areas: ["Bangsar", "Bangsar South", "Mid Valley", "Brickfields", "Damansara Heights", "KL Sentral"], fee: 5, minOrder: 40, eta: "30–40 min" },
    { name: "Zone B", areas: ["Mont Kiara", "Sri Hartamas", "TTDI", "Seputeh", "Kuchai Lama", "Petaling Jaya SS2", "Bukit Bintang", "KLCC"], fee: 9, minOrder: 60, eta: "45–60 min" },
  ],
  outside: "Outside Zone A and B we're on GrabFood and foodpanda (search Forno Sette Bangsar). We don't run our own riders there.",
  hours: "Delivery runs during opening hours and stops 30 minutes before closing.",
};

export const POLICIES: { slug: string; topic: string; title: string; body: string; data?: Record<string, unknown> }[] = [
  {
    slug: "policy-location",
    topic: "location",
    title: "Address and getting here",
    body: `${ADDRESS}. Two minutes' walk from Bangsar Village II. Parking: Bangsar Village II basement, or street parking paid through the Flexi Parking app. Nearest LRT: Bangsar station, then a 10-minute walk or a short e-hailing ride. Ground floor is step-free and we have an accessible restroom.`,
  },
  {
    slug: "policy-halal",
    topic: "halal",
    title: "Halal and pork-free",
    body: "Our kitchen is pork-free and all meat comes from JAKIM-certified halal suppliers. The restaurant itself is not halal-certified because we serve beer and wine, and the Vodka Rosa pizza contains alcohol. Every other pizza is made without alcohol.",
  },
  {
    slug: "policy-allergens",
    topic: "allergens",
    title: "Allergens",
    body: "Each item lists its allergens. Our dough contains gluten. The kitchen handles tree nuts (pesto, walnuts, hazelnuts), shellfish (prawns), egg and dairy, so cross-contact is possible. We cannot guarantee any dish is free of an allergen. For severe allergies please speak with the manager before ordering.",
  },
  {
    slug: "policy-payment",
    topic: "payment",
    title: "Payment methods",
    body: "We accept cash, Visa, Mastercard, Amex, DuitNow QR, Touch 'n Go eWallet, GrabPay and Boost. No cheques. Groups of 8 or more pay a RM 100 deposit by DuitNow to confirm, deducted from the bill.",
  },
  {
    slug: "policy-booking",
    topic: "booking",
    title: "Table bookings",
    body: "Tables for 1 to 10 people can be booked here in 30-minute slots, at least 1 hour ahead. Each table is held for 90 minutes. We hold your table 15 minutes past the booking time; message us if you're running late. Free cancellation up to 2 hours before. Groups of 8+ pay a RM 100 deposit, forfeited if cancelled less than 24 hours before. For 11+ guests our events team arranges it personally. Walk-ins welcome; on Friday and Saturday nights after 7:30pm expect a 20–40 minute wait.",
  },
  {
    slug: "policy-events",
    topic: "events",
    title: "Catering and private events",
    body: "Private hire: the whole restaurant (40 seated, 60 standing) is available on Mondays, and for weekday lunches. Minimum spend RM 3,500 Tuesday–Thursday evenings and RM 6,000 Friday–Saturday. Mobile wood-fired oven catering for 30–150 guests starts from RM 45 per head. The events team sends a quote within one working day; we never confirm a private event over chat.",
  },
  {
    slug: "policy-complaints",
    topic: "complaints",
    title: "Complaints and refunds",
    body: "If something is wrong with your order, tell us within 2 hours with a photo. The duty manager reviews every case personally and will remake the order or refund to the original payment method. Only the manager can approve a refund.",
  },
  {
    slug: "policy-drinks",
    topic: "drinks",
    title: "Drinks and corkage",
    body: "We serve Peroni, two local craft beers, Italian wines by the glass and bottle, house lemonade, Italian sodas and mocktails. Corkage is RM 40 per bottle of wine, maximum 2 bottles per table. Alcohol is served to guests aged 18+ only.",
  },
  {
    slug: "policy-dough",
    topic: "food",
    title: "Our dough and sizes",
    body: "Dough is fermented for 48 hours with Italian 00 flour. It's not sourdough. Pizzas are baked at 450°C in about 90 seconds. Sizes: Small 9\" (1 person), Medium 12\" (1–2), Large 15\" (2–3). Half-and-half is available on Medium and Large, priced at the more expensive half. No added MSG.",
  },
  {
    slug: "policy-house",
    topic: "house",
    title: "House rules and facilities",
    body: "No dress code. Dogs are welcome on the terrace (6 tables) and we bring water bowls. Smoking and vaping are not allowed anywhere, including the terrace, under Malaysian law. Free Wi-Fi; staff will share the password at your table. High chairs available. Bring your own birthday cake, no cake-cutting fee.",
  },
  {
    slug: "policy-promos",
    topic: "promotions",
    title: "Promotions",
    body: "Lunch set Tuesday to Friday 12pm–3pm: any Small pizza + side salad + house lemonade or Italian soda for RM 29. No other promotions run right now, and discounts can't be stacked.",
  },
  {
    slug: "policy-jobs",
    topic: "jobs",
    title: "Working at Forno Sette",
    body: "We're hiring pizza cooks. Apply by sending /apply to our Telegram bot. Please don't send CVs through this chat.",
  },
];

/** 40 FAQs written the way customers actually type in KL. `q` is how it arrives, `a` is the house answer. */
export const FAQS: { q: string; a: string; topic: string }[] = [
  { q: "u guys halal ah?", a: "Our kitchen is pork-free and our meat comes from JAKIM-certified halal suppliers. We're not halal-certified as a restaurant because we serve beer and wine, and the Vodka Rosa contains alcohol.", topic: "halal" },
  { q: "open on monday?", a: "We're closed on Mondays. Tuesday to Sunday we're open from midday (11am on Sundays).", topic: "hours" },
  { q: "wat time u close tonite", a: "Tuesday–Thursday 10:30pm, Friday–Saturday 11:30pm, Sunday 10pm. Last orders 30 minutes before closing.", topic: "hours" },
  { q: "can bring own wine? corkage how much", a: "Yes. Corkage is RM 40 per bottle, maximum 2 bottles per table.", topic: "drinks" },
  { q: "do u deliver to mont kiara", a: "Yes, Mont Kiara is Zone B: RM 9 delivery, RM 60 minimum order, about 45–60 minutes.", topic: "delivery" },
  { q: "delivery to subang can?", a: "Subang is outside our own delivery zones. You can order us on GrabFood or foodpanda.", topic: "delivery" },
  { q: "parking got or not", a: "Bangsar Village II basement is a 2-minute walk, or street parking through the Flexi Parking app.", topic: "location" },
  { q: "is there vegan option", a: "The Marinara is fully vegan, and the Ortolana can be made without cheese.", topic: "menu" },
  { q: "can i pay with tng", a: "Yes, Touch 'n Go eWallet works. We also take DuitNow QR, GrabPay, Boost, cards and cash.", topic: "payment" },
  { q: "kids menu?", a: "No separate kids menu, but a Small 9\" pizza is perfect for kids, and we have high chairs.", topic: "menu" },
  { q: "dog friendly??", a: "Dogs are welcome on our terrace and we'll bring a water bowl.", topic: "house" },
  { q: "wheelchair accessible?", a: "Yes. The ground floor is step-free and we have an accessible restroom.", topic: "location" },
  { q: "how big is the large pizza", a: "Large is 15\" and feeds 2–3 people. Medium is 12\", Small is 9\".", topic: "menu" },
  { q: "the truffle one available today?", a: "Depends on the day's stock; check the Funghi e Tartufo availability.", topic: "stock" },
  { q: "got spicy pizza?", a: "Diavola, Rendang Rossa, Salsiccia, Gamberi and Agnello Piccante all have heat. Add Calabrian chilli oil to anything for RM 2.", topic: "menu" },
  { q: "can i reserve for 12 ppl", a: "Up to 10 can be booked here. For 11 or more, our events team arranges the table personally.", topic: "booking" },
  { q: "can bring birthday cake? any charge", a: "Of course, bring your own cake. There's no cake-cutting fee.", topic: "house" },
  { q: "wifi pw?", a: "We have free Wi-Fi; staff will share the password at your table.", topic: "house" },
  { q: "do u do catering for office lunch", a: "Yes, mobile wood-fired oven catering for 30–150 guests from RM 45 per head. Our events team sends a quote within one working day.", topic: "events" },
  { q: "any promo now", a: "Lunch set Tuesday to Friday, 12–3pm: Small pizza, side salad and a lemonade or Italian soda for RM 29.", topic: "promotions" },
  { q: "is ur dough sourdough", a: "It's a 48-hour fermented dough with Italian 00 flour, not sourdough.", topic: "food" },
  { q: "msg free?", a: "Yes, no added MSG.", topic: "food" },
  { q: "how long wait for walk in fri night", a: "Usually 20–40 minutes after 7:30pm on Fridays and Saturdays. Booking ahead is the safe bet.", topic: "booking" },
  { q: "how to cancel my booking", a: "Send us your booking reference here. Cancellation is free up to 2 hours before.", topic: "booking" },
  { q: "running 20 min late still can keep table?", a: "We hold tables for 15 minutes. Send your booking reference and we'll let the floor know you're coming.", topic: "booking" },
  { q: "the apron got in red?", a: "Yes, in Brick Red. Stock depends on the size.", topic: "merch" },
  { q: "tshirt size M black ada?", a: "Our dark tee is Charcoal; stock depends on the size.", topic: "merch" },
  { q: "my son has nut allergy can he eat the pizza", a: "The Pollo Pesto contains pine nuts, and our kitchen handles tree nuts, so cross-contact is possible. Our manager will talk you through it before you order.", topic: "allergens" },
  { q: "where exactly r u", a: `${ADDRESS}, two minutes from Bangsar Village II.`, topic: "location" },
  { q: "open christmas day?", a: "Yes, 12pm–10pm on Christmas Day. Christmas Eve is dinner only from 5pm.", topic: "hours" },
  { q: "any dress code", a: "No dress code at all.", topic: "house" },
  { q: "can do half half pizza?", a: "Yes, on Medium and Large, priced at the more expensive half.", topic: "menu" },
  { q: "extra cheese how much", a: "Extra mozzarella RM 4, a whole burrata RM 12.", topic: "menu" },
  { q: "do u have beer", a: "Peroni, two local craft beers, and Italian wines. 18+ only.", topic: "drinks" },
  { q: "non alcoholic drinks got what", a: "House lemonade, Italian sodas (blood orange, lemon, bergamot) and mocktails.", topic: "drinks" },
  { q: "hi um do you guys have like a table for two tomorrow around seven thanks", a: "Check slots for tomorrow 7pm for 2 and offer to book.", topic: "booking" },
  { q: "hiring? looking for part time kitchen job", a: "We're hiring pizza cooks. Send /apply to our Telegram bot to apply.", topic: "jobs" },
  { q: "outdoor seating available?", a: "Yes, 6 tables on the terrace. It's non-smoking.", topic: "house" },
  { q: "can smoke at the terrace?", a: "Sorry, smoking and vaping aren't allowed anywhere at the restaurant, including the terrace.", topic: "house" },
  { q: "pizza came cold n soggy wat la", a: "So sorry. Please send a photo; our duty manager reviews it personally and will make it right.", topic: "complaints" },
];
