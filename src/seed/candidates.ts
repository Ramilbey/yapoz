// 30 synthetic candidates for the "Pizza cook" role. Names, employers and contacts are invented.
// Half arrive as PDF resumes, half as plain-text posts in Forno Sette's own Telegram jobs channel.
// Some formal CVs include personal details (age, marital status, religion) the way many Malaysian CVs do;
// Jawab's ranking redacts those lines and never scores on them.

export type SeedCandidate = {
  name: string;
  format: "pdf" | "post";
  district: string;
  languages: string[];
  availability: string[]; // evenings, weekends, mornings, weekdays, nights, full-time, part-time
  totalYears: number;
  skills: { name: string; years: number }[];
  roles: { title: string; place: string; from: number; to: number | "present" }[];
  highlights: string[];
  personal?: string;
  contact: { telegram?: string; email?: string };
  start?: string;
};

export const CANDIDATES: SeedCandidate[] = [
  {
    name: "Aiman Hakim bin Roslan", format: "pdf", district: "Brickfields", languages: ["Malay", "English"],
    availability: ["evenings", "weekends"], totalYears: 6,
    skills: [{ name: "wood-fired oven", years: 5 }, { name: "Neapolitan dough", years: 5 }, { name: "line cooking", years: 6 }],
    roles: [
      { title: "Head pizzaiolo", place: "Fuoco Lento, Bukit Bintang", from: 2022, to: 2025 },
      { title: "Pizza cook", place: "Dapur Api Pizzeria, Bangsar South", from: 2020, to: 2022 },
      { title: "Commis", place: "Hotel kitchen, KL Sentral", from: 2019, to: 2020 },
    ],
    highlights: [
      "Ran the wood-fired oven alone on Friday and Saturday nights, 180+ covers per service",
      "Managed oven fire from 6pm lighting to 11pm close, keeping the deck at 430–470°C",
      "Trained 3 junior cooks on stretching and turning pizzas in a wood-fired oven",
    ],
    personal: "Age: 29 | Marital status: Married | Religion: Islam | Nationality: Malaysian",
    contact: { email: "aiman.hakim@example.com" }, start: "Can start in 2 weeks",
  },
  {
    name: "Tan Mei Ling", format: "pdf", district: "Bangsar South", languages: ["English", "Mandarin", "Cantonese", "Malay"],
    availability: ["evenings", "weekends", "full-time"], totalYears: 5,
    skills: [{ name: "wood-fired oven", years: 4 }, { name: "dough fermentation", years: 4 }, { name: "food safety", years: 5 }],
    roles: [
      { title: "Senior pizza cook", place: "Brace & Ember, Damansara Heights", from: 2021, to: "present" },
      { title: "Prep cook", place: "Little Lantern Café, Mid Valley", from: 2020, to: 2021 },
    ],
    highlights: [
      "4 years on a wood-fired oven doing 48-hour cold-fermented dough",
      "Holds a Neapolitan pizza course certificate (2022) and a food handler certificate",
      "Works dinner service five nights a week, 5pm to close",
    ],
    personal: "Date of birth: 14/02/1997 | Gender: Female | Marital status: Single",
    contact: { email: "meiling.tan@example.com" }, start: "One month notice",
  },
  {
    name: "Arjun Pillai", format: "pdf", district: "Seputeh", languages: ["English", "Tamil", "Malay"],
    availability: ["mornings", "weekdays"], totalYears: 8,
    skills: [{ name: "wood-fired oven", years: 6 }, { name: "bread baking", years: 8 }, { name: "kitchen management", years: 3 }],
    roles: [
      { title: "Bakery and pizza lead", place: "Grainhouse Bakery, Mid Valley", from: 2019, to: "present" },
      { title: "Baker", place: "Morning Crust, Brickfields", from: 2017, to: 2019 },
    ],
    highlights: [
      "6 years firing a wood oven for breads and lunch pizzas",
      "Prefers morning shifts only, 6am to 2pm, Monday to Friday",
      "Cut dough waste by 20% with a new portioning system",
    ],
    contact: { email: "arjun.pillai@example.com" },
  },
  {
    name: "Daniel Wong", format: "post", district: "Mont Kiara", languages: ["English", "Cantonese"],
    availability: ["evenings", "weekends"], totalYears: 5,
    skills: [{ name: "wood-fired oven", years: 3 }, { name: "deck oven", years: 2 }],
    roles: [
      { title: "Pizza cook", place: "Oak & Flame, Sri Hartamas", from: 2022, to: "present" },
      { title: "Pizza cook", place: "Slice Club, Mont Kiara", from: 2020, to: 2022 },
    ],
    highlights: ["3 yrs wood fire oven at Oak & Flame, 2 yrs deck oven before that", "can open and close the oven, do dough by myself", "free evenings + weekend"],
    contact: { telegram: "danielwong_cooks_demo" },
  },
  {
    name: "Nurul Izzah binti Kamal", format: "post", district: "Damansara Heights", languages: ["Malay", "English"],
    availability: ["evenings"], totalYears: 3,
    skills: [{ name: "wood-fired oven", years: 2 }, { name: "pastry", years: 1 }],
    roles: [{ title: "Pizza cook", place: "Brace & Ember, Damansara Heights", from: 2023, to: "present" }],
    highlights: ["2 tahun wood-fired pizza (2 years)", "before that 1 year pastry", "boleh kerja malam, evening shift ok"],
    contact: { telegram: "izzah_kitchen_demo" },
  },
  {
    name: "Hafiz Rahman", format: "pdf", district: "Kepong", languages: ["Malay", "English"],
    availability: ["evenings", "nights", "weekends"], totalYears: 9,
    skills: [{ name: "wood-fired oven", years: 7 }, { name: "Neapolitan dough", years: 7 }, { name: "team leadership", years: 3 }],
    roles: [
      { title: "Pizza chef", place: "Ember Republic, Kepong", from: 2018, to: "present" },
      { title: "Line cook", place: "Kopi & Co, Segambut", from: 2016, to: 2018 },
    ],
    highlights: ["7 years as pizza chef on a wood-fired oven", "Leads a team of 4 on night shift", "Competed in a regional pizza competition, 2nd place (2023)"],
    personal: "Age: 33 | Married with 2 children",
    contact: { email: "hafiz.rahman@example.com" },
  },
  {
    name: "Priya Nair", format: "post", district: "Brickfields", languages: ["English", "Tamil", "Malay"],
    availability: ["evenings", "weekends"], totalYears: 4,
    skills: [{ name: "wood-fired oven", years: 3.5 }, { name: "dough lab", years: 2 }],
    roles: [
      { title: "Pizza cook", place: "Casa Fumo, Bukit Bintang", from: 2021, to: "present" },
      { title: "Dough lab assistant", place: "Casa Fumo central kitchen", from: 2021, to: 2023 },
    ],
    highlights: ["3.5 years on wood-fired oven at Casa Fumo", "also ran the dough lab — mixing, balling, fermentation logs", "can do evenings and weekends, stay in Brickfields 5 min away"],
    contact: { telegram: "priya_pizza_demo" },
  },
  {
    name: "Marco Rossi", format: "pdf", district: "TTDI", languages: ["English", "Italian"],
    availability: ["evenings", "weekends", "full-time"], totalYears: 12,
    skills: [{ name: "wood-fired oven", years: 10 }, { name: "Neapolitan dough", years: 12 }, { name: "menu development", years: 4 }],
    roles: [
      { title: "Pizzaiolo", place: "Antica Brace, Naples", from: 2013, to: 2020 },
      { title: "Head pizzaiolo", place: "Lievito, TTDI", from: 2020, to: "present" },
    ],
    highlights: ["10 years on wood-fired ovens in Naples and Kuala Lumpur", "Designed the dough programme at Lievito (72-hour biga)", "Holds an employment pass, transferable"],
    personal: "Age: 38 | Nationality: Italian",
    contact: { email: "marco.rossi@example.com" }, start: "Available from next month",
  },
  {
    name: "Siti Aisyah binti Omar", format: "post", district: "Cheras", languages: ["Malay"],
    availability: ["evenings", "weekends"], totalYears: 1,
    skills: [{ name: "conveyor oven", years: 1 }],
    roles: [{ title: "Crew", place: "QuickSlice, Cheras", from: 2025, to: "present" }],
    highlights: ["1 tahun kerja pizza fast food, conveyor oven", "nak belajar wood fire", "boleh shift malam"],
    contact: { telegram: "aisyah_crew_demo" },
  },
  {
    name: "Kevin Lim", format: "pdf", district: "Petaling Jaya", languages: ["English", "Mandarin", "Malay"],
    availability: ["weekends"], totalYears: 4,
    skills: [{ name: "wood-fired oven", years: 4 }, { name: "catering events", years: 2 }],
    roles: [{ title: "Weekend pizza cook", place: "Firepit Social, SS2", from: 2022, to: "present" }],
    highlights: ["4 years weekend shifts on a wood-fired oven", "Runs mobile oven at weekend events and weddings", "Weekdays taken by a full-time logistics job"],
    contact: { email: "kevin.lim@example.com" },
  },
  {
    name: "Faizal Osman", format: "post", district: "Setapak", languages: ["Malay", "English"],
    availability: ["evenings", "nights"], totalYears: 5,
    skills: [{ name: "wok cooking", years: 5 }],
    roles: [{ title: "Wok cook", place: "Gerai Faizal, Setapak night market", from: 2020, to: "present" }],
    highlights: ["5 years wok cook at night market", "never work pizza but fast learner", "can work late night"],
    contact: { telegram: "faizal_wok_demo" },
  },
  {
    name: "Lakshmi Devi", format: "pdf", district: "Sentul", languages: ["English", "Tamil", "Malay"],
    availability: ["evenings", "weekdays"], totalYears: 4,
    skills: [{ name: "bread baking", years: 3 }, { name: "wood-fired oven", years: 1 }],
    roles: [
      { title: "Pizza cook", place: "Ember Republic, Kepong", from: 2025, to: "present" },
      { title: "Baker", place: "Sentul Bread House", from: 2022, to: 2025 },
    ],
    highlights: ["3 years artisan bread, 1 year wood-fired pizza", "Strong on hydration and fermentation", "Evening shifts preferred"],
    contact: { email: "lakshmi.devi@example.com" },
  },
  {
    name: "Jason Teh", format: "post", district: "Sri Hartamas", languages: ["English", "Mandarin"],
    availability: ["evenings", "part-time"], totalYears: 3,
    skills: [{ name: "wood-fired oven", years: 3 }],
    roles: [{ title: "Pizza cook (part-time)", place: "Oak & Flame, Sri Hartamas", from: 2023, to: "present" }],
    highlights: ["3 yrs wood-fired, part time", "looking for 4 evenings a week", "can start immediately"],
    contact: { telegram: "jason_teh_demo" },
  },
  {
    name: "Amirul Asyraf", format: "post", district: "Bangsar", languages: ["Malay", "English"],
    availability: ["evenings", "weekends"], totalYears: 3,
    skills: [{ name: "wood-fired oven", years: 2.5 }, { name: "grill", years: 0.5 }],
    roles: [{ title: "Pizza cook", place: "Telawi Slice, Bangsar", from: 2023, to: "present" }],
    highlights: ["2.5 years wood fire pizza at Telawi Slice", "I live in Bangsar, walking distance", "evening and weekend ok"],
    contact: { telegram: "amirul_bangsar_demo" },
  },
  {
    name: "Grace Chong", format: "pdf", district: "Subang Jaya", languages: ["English", "Mandarin", "Cantonese"],
    availability: ["evenings", "weekends"], totalYears: 6,
    skills: [{ name: "wood-fired oven", years: 5 }, { name: "kitchen opening", years: 1 }],
    roles: [{ title: "Sous chef (pizza)", place: "Rosso Vivo, SS15 Subang", from: 2020, to: "present" }],
    highlights: ["5 years wood-fired oven, part of the opening team at Rosso Vivo", "Comfortable leading the pass on busy nights", "Would relocate closer for the right role"],
    personal: "Age: 31 | Marital status: Single",
    contact: { email: "grace.chong@example.com" },
  },
  {
    name: "Ravi Shankar", format: "pdf", district: "Kuchai Lama", languages: ["English", "Tamil", "Malay"],
    availability: ["evenings", "full-time"], totalYears: 8,
    skills: [{ name: "line cooking", years: 8 }, { name: "wood-fired grill", years: 4 }],
    roles: [{ title: "Grill cook", place: "Charcoal Road, Kuchai Lama", from: 2018, to: "present" }],
    highlights: ["4 years on a wood-fired grill (meat, not pizza)", "8 years line cooking overall", "Full-time evenings"],
    contact: { email: "ravi.shankar@example.com" },
  },
  {
    name: "Zul Hilmi", format: "post", district: "Wangsa Maju", languages: ["Malay"],
    availability: ["evenings"], totalYears: 3,
    skills: [{ name: "deck oven", years: 3 }],
    roles: [{ title: "Pizza cook", place: "Pizza Corner Wangsa", from: 2022, to: "present" }],
    highlights: ["3 tahun pizza deck oven (electric)", "belum pernah wood fire", "shift petang/malam ok"],
    contact: { telegram: "zulhilmi_demo" },
  },
  {
    name: "Hannah Lee", format: "pdf", district: "Bangsar South", languages: ["English", "Korean"],
    availability: ["evenings", "weekends"], totalYears: 1,
    skills: [{ name: "wood-fired oven", years: 1 }, { name: "culinary diploma", years: 2 }],
    roles: [{ title: "Commis", place: "Dapur Api Pizzeria, Bangsar South", from: 2025, to: "present" }],
    highlights: ["Diploma in Culinary Arts (2024)", "1 year commis at a wood-fired pizzeria", "Eager to grow into a pizza cook role"],
    contact: { email: "hannah.lee@example.com" },
  },
  {
    name: "Muthu Krishnan", format: "post", district: "Brickfields", languages: ["Tamil", "English", "Malay"],
    availability: ["evenings", "weekends"], totalYears: 6,
    skills: [{ name: "tandoor oven", years: 4 }, { name: "bread (naan)", years: 6 }],
    roles: [{ title: "Tandoor cook", place: "Little India Tandoor House, Brickfields", from: 2020, to: "present" }],
    highlights: ["4 years tandoor (wood/charcoal), naan and breads", "want to move into pizza", "near Bangsar"],
    contact: { telegram: "muthu_tandoor_demo" },
  },
  {
    name: "Farah Nadia", format: "pdf", district: "Ampang", languages: ["Malay", "English"],
    availability: ["mornings", "weekdays"], totalYears: 3,
    skills: [{ name: "pastry", years: 3 }],
    roles: [{ title: "Pastry cook", place: "Sugar & Salt Patisserie, Ampang", from: 2022, to: "present" }],
    highlights: ["3 years pastry, laminated doughs", "Morning shifts", "Interested in dessert pizzas"],
    contact: { email: "farah.nadia@example.com" },
  },
  {
    name: "Eric Chan", format: "pdf", district: "Bukit Bintang", languages: ["English", "Cantonese", "Mandarin"],
    availability: ["evenings", "nights"], totalYears: 5,
    skills: [{ name: "wood-fired oven", years: 5 }, { name: "inventory", years: 2 }],
    roles: [{ title: "Pizza cook", place: "Casa Fumo, Bukit Bintang", from: 2020, to: "present" }],
    highlights: ["5 years wood-fired oven at a 120-seat pizzeria", "Handles nightly stock count and dough orders", "Evening and late-night shifts"],
    contact: { email: "eric.chan@example.com" },
  },
  {
    name: "Syafiq Iskandar", format: "post", district: "Puchong", languages: ["Malay", "English"],
    availability: ["evenings"], totalYears: 3,
    skills: [{ name: "wood-fired oven", years: 3 }],
    roles: [{ title: "Pizza cook", place: "Bara Pizza, Puchong", from: 2022, to: "present" }],
    highlights: ["3 years wood fire oven at Bara Pizza Puchong", "evening shift only", "got own transport"],
    contact: { telegram: "syafiq_bara_demo" },
  },
  {
    name: "Joanne Yap", format: "post", district: "Seputeh", languages: ["English", "Mandarin"],
    availability: ["evenings", "weekends"], totalYears: 2,
    skills: [{ name: "front of house", years: 2 }],
    roles: [{ title: "Server", place: "Little Lantern Café, Mid Valley", from: 2024, to: "present" }],
    highlights: ["2 years service/front of house", "no kitchen experience", "open to kitchen training"],
    contact: { telegram: "joanne_yap_demo" },
  },
  {
    name: "Danish Haziq", format: "pdf", district: "Titiwangsa", languages: ["Malay", "English"],
    availability: ["evenings", "weekends", "full-time"], totalYears: 4,
    skills: [{ name: "wood-fired oven", years: 4 }, { name: "Neapolitan dough", years: 3 }],
    roles: [{ title: "Pizza cook", place: "Sette Colli Pizzeria, Ipoh", from: 2021, to: 2025 }],
    highlights: ["4 years wood-fired oven in Ipoh, moved to KL in 2025", "Comfortable doing 100+ pizzas per night", "Full-time evenings"],
    personal: "Age: 27 | Religion: Islam",
    contact: { email: "danish.haziq@example.com" },
  },
  {
    name: "Ong Wei Jie", format: "post", district: "Kepong", languages: ["Mandarin", "English"],
    availability: ["weekends", "part-time"], totalYears: 0.5,
    skills: [{ name: "wood-fired oven", years: 0.5 }],
    roles: [{ title: "Part-time kitchen helper", place: "Ember Republic, Kepong", from: 2026, to: "present" }],
    highlights: ["student, 6 months part time helper", "weekends only", "learning to stretch dough"],
    contact: { telegram: "weijie_ong_demo" },
  },
  {
    name: "Anand Raj", format: "pdf", district: "Mid Valley", languages: ["English", "Tamil", "Malay"],
    availability: ["evenings", "weekends"], totalYears: 4,
    skills: [{ name: "wood-fired oven", years: 3 }, { name: "prep and mise en place", years: 4 }],
    roles: [
      { title: "Pizza cook", place: "Lievito, TTDI", from: 2023, to: "present" },
      { title: "Prep cook", place: "Grainhouse Bakery, Mid Valley", from: 2022, to: 2023 },
    ],
    highlights: ["3 years on the wood-fired oven at Lievito", "Works the dinner rush 5pm–11pm", "Food handler certificate, typhoid vaccination up to date"],
    contact: { email: "anand.raj@example.com" },
  },
  {
    name: "Nadia Karim", format: "pdf", district: "Shah Alam", languages: ["Malay", "English", "Arabic"],
    availability: ["mornings", "weekdays", "full-time"], totalYears: 10,
    skills: [{ name: "Italian cuisine", years: 10 }, { name: "wood-fired oven", years: 2 }, { name: "kitchen management", years: 5 }],
    roles: [{ title: "Executive sous chef", place: "Hotel Italian restaurant, Shah Alam", from: 2017, to: "present" }],
    highlights: ["10 years Italian kitchens, 5 in management", "2 years supervising a wood-fired pizza station", "Daytime roles only"],
    personal: "Marital status: Married",
    contact: { email: "nadia.karim@example.com" },
  },
  {
    name: "Tommy Goh", format: "post", district: "Chow Kit", languages: ["English", "Mandarin", "Malay"],
    availability: ["evenings", "nights"], totalYears: 3,
    skills: [{ name: "delivery", years: 3 }],
    roles: [{ title: "Delivery rider", place: "Pizza delivery, Chow Kit", from: 2023, to: "present" }],
    highlights: ["3 years delivery rider for pizza shop", "want to work inside kitchen", "night ok"],
    contact: { telegram: "tommy_goh_demo" },
  },
  {
    name: "Iskandar Zulkarnain", format: "pdf", district: "Bangsar", languages: ["Malay", "English"],
    availability: ["mornings", "weekdays"], totalYears: 6,
    skills: [{ name: "wood-fired oven", years: 5 }, { name: "Neapolitan dough", years: 5 }],
    roles: [{ title: "Lunch pizza lead", place: "Telawi Slice, Bangsar", from: 2020, to: "present" }],
    highlights: ["5 years wood-fired oven, lunch service lead", "Weekday mornings and lunch only (school pickup in the evening)", "Lives in Bangsar"],
    contact: { email: "iskandar.z@example.com" },
  },
  {
    name: "Yusuf Ali", format: "pdf", district: "Damansara Heights", languages: ["English", "Malay", "Arabic"],
    availability: ["evenings", "weekends"], totalYears: 5,
    skills: [{ name: "wood-fired oven", years: 4 }, { name: "Neapolitan dough", years: 4 }, { name: "allergen control", years: 2 }],
    roles: [
      { title: "Pizza cook", place: "Brace & Ember, Damansara Heights", from: 2022, to: "present" },
      { title: "Pizza cook", place: "Fuoco Lento, Bukit Bintang", from: 2021, to: 2022 },
    ],
    highlights: ["4 years wood-fired oven across two pizzerias", "Set up the allergen board and nut-free prep area at Brace & Ember", "Evenings and weekends, 10 minutes from Bangsar"],
    contact: { email: "yusuf.ali@example.com" },
  },
];

function years(r: SeedCandidate["roles"][number]) {
  const to = r.to === "present" ? 2026 : r.to;
  return `${r.from}–${r.to === "present" ? "present" : r.to}, ${Math.max(1, to - r.from)} yr${to - r.from === 1 ? "" : "s"}`;
}

const AVAIL_TEXT: Record<string, string> = {
  evenings: "evenings", weekends: "weekends", mornings: "mornings", weekdays: "weekdays", nights: "late nights", "full-time": "full-time", "part-time": "part-time",
};

export function resumeText(c: SeedCandidate): string {
  if (c.format === "post") {
    const role = c.roles[0];
    return [
      `Hi all, looking for kitchen job (pizza cook).`,
      `Name: ${c.name}`,
      `Now: ${role.title} at ${role.place}`,
      ...c.highlights.map((h) => `- ${h}`),
      `Stay at ${c.district}. Languages: ${c.languages.join(", ")}.`,
      `Available: ${c.availability.map((a) => AVAIL_TEXT[a]).join(", ")}.`,
      c.contact.telegram ? `PM me @${c.contact.telegram}` : "",
    ].filter(Boolean).join("\n");
  }
  return [
    c.name.toUpperCase(),
    `Pizza cook | ${c.district}, Kuala Lumpur`,
    [c.contact.email, c.contact.telegram ? `Telegram @${c.contact.telegram}` : null].filter(Boolean).join(" | "),
    "",
    c.personal ? "PERSONAL DETAILS" : "",
    c.personal ?? "",
    c.personal ? "" : "",
    "SUMMARY",
    `${c.totalYears} years in professional kitchens. ${c.highlights[0]}.`,
    "",
    "EXPERIENCE",
    ...c.roles.flatMap((r, i) => [`${r.title}, ${r.place} (${years(r)})`, ...(i === 0 ? c.highlights.slice(1).map((h) => `- ${h}`) : [])]),
    "",
    "SKILLS",
    c.skills.map((s) => `${s.name} (${s.years} yrs)`).join(", "),
    "",
    "AVAILABILITY",
    `${c.availability.map((a) => AVAIL_TEXT[a]).join(", ")}.${c.start ? ` ${c.start}.` : ""}`,
    "",
    "LANGUAGES",
    c.languages.join(", "),
  ].filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");
}
