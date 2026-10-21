// Browser walkthrough: a brand-new business from the landing page to going live, with screenshots.
// Usage: node scripts/walkthrough.mjs <outDir>   (server on http://localhost:3000)
import { chromium } from "playwright";
const OUT = process.argv[2] ?? "walk";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, timezoneId: "Asia/Kuala_Lumpur" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
const shot = async (name, full = false) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
const step = (s) => console.log("•", s);

// Landing (lite mode keeps screenshots deterministic)
await page.goto(`${BASE}/?fx=low`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await shot("01-landing-hero");
for (const id of ["how", "any", "ring"]) {
  await page.evaluate((i) => document.getElementById(i)?.scrollIntoView(), id);
  await page.waitForTimeout(1800);
  await shot(`02-landing-${id}`);
}
step("landing ok");
// Sample switcher talks to the salon
await page.getByRole("radio", { name: /Kasih Hair Studio/ }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /open on monday/ }).click();
await page.waitForTimeout(4000);
await shot("03-landing-simulator-salon");
step("simulator ok");

// Sign up
const email = `owner${Date.now()}@example.com`;
await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
await page.getByLabel("Business name").fill("Bunga Florist");
await page.getByLabel("Your name").fill("Siti Aminah");
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill("bunga-florist-2026");
await shot("04-signup");
await page.getByRole("button", { name: "Create my workspace" }).click();
await page.waitForURL("**/app/setup", { timeout: 20000 });
await page.waitForTimeout(1200);
await shot("05-setup-basics");
step("signed up: " + page.url());

// Step 1: basics
await page.getByLabel("What kind of business").fill("florist");
await page.getByLabel("Address").fill("12 Jalan Bangsar Utama 1, Bangsar, 59000 Kuala Lumpur");
await page.getByLabel("Languages customers write in").fill("English, Malay");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByLabel(/Explain your business/).waitFor();
await page.getByLabel(/Explain your business/).fill("Small florist in Bangsar. Hand-tied bouquets from RM 89 (small) to RM 189 (large). Same-day delivery in KL for RM 15 if ordered before 2pm. Open Tue-Sun 9am to 7pm, closed Mondays. Workshops on Saturdays at 10am, 8 people max, RM 150 per person.");
await page.waitForTimeout(400);
await shot("06-setup-describe");
step("describe ok");

// No Claude key on this server: put a draft in place the way /api/setup/draft would, then review it in the UI.
await page.evaluate(async () => {
  const draft = {
    summary: "Small florist in Bangsar selling hand-tied bouquets with same-day delivery in KL, plus Saturday workshops.",
    businessType: "florist",
    hours: { weekly: { mon: [], tue: [["09:00", "19:00"]], wed: [["09:00", "19:00"]], thu: [["09:00", "19:00"]], fri: [["09:00", "19:00"]], sat: [["09:00", "19:00"]], sun: [["09:00", "19:00"]] }, lastOrdersMinutesBeforeClose: 0, notes: "" },
    items: [
      { kind: "product", name: "Hand-tied bouquet", category: "bouquets", description: "Seasonal flowers, wrapped in kraft paper.", options: [{ label: "Small", price: 89, stock: null }, { label: "Medium", price: 129, stock: null }, { label: "Large", price: 189, stock: null }], durationMinutes: null, bookingType: null, tags: ["bestseller"] },
      { kind: "service", name: "Saturday flower workshop", category: "workshops", description: "Make your own bouquet, all materials included.", options: [{ label: null, price: 150, stock: null }], durationMinutes: 120, bookingType: "workshop", tags: [] },
    ],
    bookingTypes: [{ key: "workshop", name: "Workshop seat", unit: "party", capacity: 8, durationMinutes: 120, slotMinutes: 60, maxPerBooking: 8, leadMinutes: 1440, notes: "Saturdays at 10am only." }],
    delivery: { offered: true, details: "Same-day delivery in Kuala Lumpur for RM 15 if ordered before 2pm." },
    policies: [{ topic: "delivery", title: "Same-day delivery", body: "Order before 2pm for same-day delivery in KL. RM 15." }],
    faqs: [{ question: "can deliver today?", answer: "Yes if you order before 2pm, RM 15 within KL.", topic: "delivery" }, { question: "open monday?", answer: "We're closed on Mondays.", topic: "hours" }],
    openQuestions: [{ question: "Do you do wedding flowers?", why: "Florists get asked this a lot", answer: "" }],
  };
  await fetch("/api/setup/draft", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft }) });
  await fetch("/api/workspace", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ onboardingStep: 3 }) });
});
await page.reload({ waitUntil: "networkidle" });
await page.getByText("A few questions for you").waitFor();
await page.getByLabel("Do you do wedding flowers?").fill("Yes, wedding and event flowers by appointment. Send us your date and we'll quote.");
await page.waitForTimeout(1500);
await shot("07-setup-review");
await shot("07b-setup-review-full", true);
await page.getByRole("button", { name: "Save and continue" }).click();
await page.getByRole("heading", { name: "Channels" }).waitFor({ timeout: 15000 });
await page.waitForTimeout(800);
await shot("08-setup-channels");
step("review saved, channels shown");

await page.getByRole("button", { name: /Continue/ }).last().click();
await page.getByText("Test chat").waitFor();
await page.getByLabel("Message").fill("can deliver today?");
await page.getByRole("button", { name: "Send" }).click();
await page.waitForTimeout(6000);
await shot("09-setup-test-chat");
step("test chat");

await page.getByRole("button", { name: "Looks good, continue" }).click();
await page.getByRole("button", { name: "Go live", exact: true }).waitFor();
await page.waitForTimeout(1200);
await shot("10-setup-go-live");
await page.getByRole("button", { name: "Go live", exact: true }).click();
await page.waitForURL("**/app/today", { timeout: 20000 });
await page.waitForTimeout(2000);
await shot("11-today-new-business");
step("live → today");

// Knowledge and settings for the new business
await page.goto(`${BASE}/app/knowledge`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await shot("12-knowledge");
await page.getByRole("tab", { name: "Bookings" }).click();
await page.waitForTimeout(600);
await shot("13-knowledge-bookings");
await page.goto(`${BASE}/app/settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await shot("14-settings", true);

// Invite a teammate and accept the link in a fresh browser
await page.getByLabel("Invite by email").fill("staff@bungaflorist.test");
await page.getByRole("button", { name: "Create invite link" }).click();
await page.waitForTimeout(1500);
const link = await page.locator('code[aria-label="Invite link"]').first().textContent();
step("invite link " + link);
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const p2 = await ctx2.newPage();
await p2.goto(link.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle" });
await p2.screenshot({ path: `${OUT}/15-invite.png` });
await p2.getByLabel("Your name").fill("Farid");
await p2.getByLabel("Password").fill("farid-service-2026");
await p2.getByRole("button", { name: "Join the team" }).click();
await p2.waitForURL("**/app/inbox", { timeout: 20000 });
await p2.waitForTimeout(1500);
await p2.screenshot({ path: `${OUT}/16-service-desk.png` });
step("invite accepted → " + p2.url());

// Sign out, sign back in with only email + password
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL("**/login");
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill("bunga-florist-2026");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/app/today", { timeout: 20000 });
step("re-login without workspace id ok");

// The salon sample: bookings page with appointments
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL("**/login");
await page.getByRole("button", { name: /On more than one business/ }).click();
await page.getByLabel("Workspace ID").fill("KASIH1");
await page.getByLabel("Email").fill("owner@demo");
await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD ?? "forno7demo");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.waitForURL("**/app/**", { timeout: 20000 });
await page.goto(`${BASE}/app/bookings`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await shot("17-salon-bookings");
await page.goto(`${BASE}/app/knowledge`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await shot("18-salon-knowledge");
await page.goto(`${BASE}/app/hiring`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await shot("19-salon-hiring-off");

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no page errors");
await browser.close();
