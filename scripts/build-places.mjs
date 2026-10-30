// Regenerates src/lib/places.json, the country and city lists in the business form: npm run places
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const { cityMapping } = createRequire(import.meta.url)("city-timezones");
const byCountry = new Map();
for (const { country, city, timezone } of cityMapping) {
  if (!city || !timezone) continue; // a few rows, such as Antarctica, have neither
  const c = byCountry.get(country) ?? { zones: new Set(), cities: new Set() };
  c.zones.add(timezone);
  c.cities.add(city);
  byCountry.set(country, c);
}
const sorted = (s) => [...s].sort((a, b) => a.localeCompare(b));
const places = Object.fromEntries(sorted(byCountry.keys()).map((name) => [name, { zones: sorted(byCountry.get(name).zones), cities: sorted(byCountry.get(name).cities) }]));
writeFileSync("src/lib/places.json", JSON.stringify(places) + "\n");
console.log(`${byCountry.size} countries, ${cityMapping.length} cities`);
