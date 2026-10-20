import type Anthropic from "@anthropic-ai/sdk";
import { db, t } from "@/db";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { claude } from "@/agent/claude";
import { env } from "@/lib/env";
import { distanceKm, resolveDistrict } from "@/lib/geo";
import type { Criteria, Evidence } from "@/db/schema";

export const AVAILABILITY = ["evenings", "weekends", "mornings", "weekdays", "nights", "full-time", "part-time"] as const;

// ---------- Fairness ----------
const PROTECTED: { re: RegExp; label: string }[] = [
  { re: /\b(male|female|man|woman|women|men|lady|ladies|guy|guys|girl|girls|boy|boys|lelaki|perempuan)\b/i, label: "gender" },
  { re: /\b(young|younger|youthful|older (?:person|people|candidates?)|age[ds]?|(?:under|below)\s*\d{2}(?!\s*(?:km|kms|min|mins|minutes|rm|%|years?\s*(?:of\s*)?exp))|\d{2}\s*(?:-|to)\s*\d{2}\s*(?:years?\s*old|yo)|\d{2}\s*(?:years?\s*old|yo))\b/i, label: "age" },
  { re: /\b(muslim|christian|hindu|buddhist|sikh|religio\w*|non-?muslim|tudung|hijab)\b/i, label: "religion" },
  { re: /\b((?:malay|chinese|indian|bumi(?:putera)?)\s+(?:only|candidates?|guy|girl|person|people|staff))\b/i, label: "ethnicity" },
  { re: /\b(single|married|unmarried|divorced|no kids|without children|no children)\b/i, label: "marital status" },
  { re: /\b(photo|pretty|good[-\s]?looking|attractive|handsome|fair[-\s]?skinned|tall|slim)\b/i, label: "appearance" },
];

export function protectedPreferences(request: string): string[] {
  const found = new Set<string>();
  for (const p of PROTECTED) if (p.re.test(request)) found.add(p.label);
  return [...found];
}

/** Strip personal details and the name before anything is scored. */
export function redactForRanking(text: string, fullName?: string): string {
  let out = text
    .split("\n")
    .map((line) =>
      line
        .split("|")
        .filter((seg) => !/\b(age|date of birth|dob|born|gender|sex|religion|race|ethnicity|marital|married|single|nationality|children|photo|height|weight|bangsa|agama)\b/i.test(seg))
        .join("|")
        .trim(),
    )
    .filter((l) => l && !/^personal details$/i.test(l))
    .join("\n");
  if (fullName) {
    for (const part of fullName.split(/\s+/).filter((p) => p.length > 2 && !/^(bin|binti|a\/l|a\/p)$/i.test(p))) {
      out = out.replace(new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), "[name]");
    }
  }
  return out;
}

// ---------- Criteria ----------
const CRITERIA_TOOL: Anthropic.Messages.Tool = {
  name: "record_criteria",
  description: "Record explicit, job-relevant hiring criteria.",
  input_schema: {
    type: "object",
    properties: {
      role: { type: "string" },
      skills: {
        type: "array",
        items: { type: "object", properties: { name: { type: "string", description: "lowercase, e.g. 'wood-fired oven'" }, min_years: { type: ["number", "null"] }, required: { type: "boolean" } }, required: ["name", "min_years", "required"] },
      },
      availability: { type: "array", items: { type: "string", enum: [...AVAILABILITY] } },
      near_district: { type: ["string", "null"] },
      max_km: { type: ["number", "null"], description: "Default 10 when 'near' is used without a distance" },
      languages: { type: "array", items: { type: "string" } },
      min_total_years: { type: ["number", "null"] },
      ignored: { type: "array", items: { type: "string" }, description: "Any part of the request that refers to gender, age, religion, ethnicity, marital status, family, appearance or photos, quoted. These are NOT criteria." },
    },
    required: ["role", "skills", "availability", "near_district", "max_km", "languages", "min_total_years", "ignored"],
  },
};

export async function deriveCriteria(request: string, roleTitle: string): Promise<{ criteria: Criteria; fairnessNotice: boolean }> {
  const flagged = protectedPreferences(request);
  const res = await claude().messages.create({
    model: env.smartModel,
    max_tokens: 700,
    system:
      "Turn an HR manager's plain-language hiring request into explicit job-relevant criteria. Only skills, years of experience, availability, location and languages are criteria. Anything about gender, age, religion, ethnicity, marital status, family or appearance goes into `ignored` and is never a criterion. 'Wood-fired', 'wood fire', 'woodfire' all mean the skill 'wood-fired oven'.",
    tools: [CRITERIA_TOOL],
    tool_choice: { type: "tool", name: "record_criteria" },
    messages: [{ role: "user", content: `Role: ${roleTitle}\nRequest: ${request}` }],
  });
  const block = res.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
  if (!block) throw new Error("No criteria returned");
  const c = block.input as Record<string, unknown>;
  const near = resolveDistrict(c.near_district as string | null) ?? (c.near_district as string | null);
  const criteria: Criteria = {
    role: String(c.role || roleTitle),
    skills: ((c.skills as { name: string; min_years: number | null; required: boolean }[]) ?? []).map((s) => ({ name: s.name.toLowerCase(), minYears: s.min_years ?? undefined, required: Boolean(s.required) })),
    availability: ((c.availability as string[]) ?? []).filter((a) => (AVAILABILITY as readonly string[]).includes(a)),
    near: near ? { district: near, maxKm: Number(c.max_km ?? 10) || 10 } : null,
    languages: (c.languages as string[]) ?? [],
    minTotalYears: (c.min_total_years as number | null) ?? null,
    ignored: [...new Set([...((c.ignored as string[]) ?? []), ...flagged])],
  };
  return { criteria, fairnessNotice: criteria.ignored.length > 0 };
}

// ---------- Hard filter ----------
const GENERIC = new Set(["oven", "cook", "cooking", "experience", "pizza", "skills", "skill", "kitchen", "work"]);
function skillTokens(name: string) {
  return name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !GENERIC.has(w));
}
function skillYears(profile: { skills?: { name: string; years: number }[] } | null, name: string): number {
  const toks = skillTokens(name);
  if (!profile?.skills) return 0;
  const hits = profile.skills.filter((s) => (toks.length ? toks.some((tk) => s.name.toLowerCase().includes(tk)) : s.name.toLowerCase().includes(name.toLowerCase())));
  return hits.reduce((m, s) => Math.max(m, Number(s.years) || 0), 0);
}
const AVAIL_SATISFIES: Record<string, string[]> = {
  evenings: ["evenings", "nights", "full-time"],
  nights: ["nights", "evenings"],
  weekends: ["weekends", "full-time"],
  mornings: ["mornings", "full-time"],
  weekdays: ["weekdays", "full-time"],
  "full-time": ["full-time"],
  "part-time": ["part-time", "weekends", "evenings"],
};

type CandRow = typeof t.candidates.$inferSelect;

function filterReasons(c: CandRow, cr: Criteria): string[] {
  const reasons: string[] = [];
  if (!c.profile) reasons.push("not parsed yet");
  for (const s of cr.skills.filter((x) => x.required && x.minYears)) {
    const y = skillYears(c.profile, s.name);
    if (y < (s.minYears ?? 0) - 1) reasons.push(`${y ? `${y} yr` : "no"} ${s.name}`);
  }
  for (const a of cr.availability) {
    const ok = (AVAIL_SATISFIES[a] ?? [a]).some((x) => c.availability.includes(x));
    if (!ok) reasons.push(`not available ${a}`);
  }
  if (cr.near) {
    const d = distanceKm(c.district, cr.near.district);
    if (d !== null && d > cr.near.maxKm * 1.6) reasons.push(`${d} km from ${cr.near.district}`);
  }
  if (cr.minTotalYears && Number(c.totalYears ?? 0) < cr.minTotalYears - 1) reasons.push(`${c.totalYears ?? 0} yrs total`);
  return reasons;
}

// ---------- Ranking ----------
const RANK_TOOL: Anthropic.Messages.Tool = {
  name: "record_ranking",
  description: "Record a fit score and evidence for each candidate.",
  input_schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ref: { type: "string" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            summary: { type: "string", description: "One line: why this score" },
            evidence: {
              type: "array",
              minItems: 2,
              maxItems: 3,
              items: { type: "object", properties: { quote: { type: "string", description: "Copied VERBATIM from the resume text, 4-25 words" }, why: { type: "string", description: "Which criterion it supports or contradicts, a few words" } }, required: ["quote", "why"] },
            },
          },
          required: ["ref", "score", "summary", "evidence"],
        },
      },
    },
    required: ["results"],
  },
};

function squash(s: string) {
  return s.toLowerCase().replace(/[“”"']/g, "").replace(/\s+/g, " ").trim();
}

export async function rankRequisition(workspaceId: string, requisitionId: string, criteria: Criteria) {
  const [req] = await db.select().from(t.requisitions).where(and(eq(t.requisitions.id, requisitionId), eq(t.requisitions.workspaceId, workspaceId)));
  if (!req) throw new Error("Requisition not found");
  // Hard filter in SQL: consented candidates attached to this requisition and still in play.
  const rows = await db
    .select({ m: t.matches, c: t.candidates })
    .from(t.matches)
    .innerJoin(t.candidates, eq(t.matches.candidateId, t.candidates.id))
    .where(and(eq(t.matches.requisitionId, requisitionId), eq(t.candidates.consent, true), notInArray(t.matches.stage, ["hired", "rejected"])));

  const passing: typeof rows = [];
  const filtered: { matchId: string; reasons: string[] }[] = [];
  for (const r of rows) {
    const reasons = filterReasons(r.c, criteria);
    if (reasons.length) filtered.push({ matchId: r.m.id, reasons });
    else passing.push(r);
  }
  // Pre-sort so the shortlist sent to the model is the most plausible set.
  const pre = (c: CandRow) =>
    criteria.skills.reduce((s, k) => s + Math.min(skillYears(c.profile, k.name), 10), 0) - (criteria.near ? (distanceKm(c.district, criteria.near.district) ?? 10) / 5 : 0);
  passing.sort((a, b) => pre(b.c) - pre(a.c));
  const shortlist = passing.slice(0, 16);

  const criteriaText = [
    `Role: ${criteria.role}`,
    ...criteria.skills.map((s) => `Skill: ${s.name}${s.minYears ? `, ${s.minYears}+ years` : ""}${s.required ? " (required)" : " (nice to have)"}`),
    criteria.availability.length ? `Availability: ${criteria.availability.join(", ")}` : "",
    criteria.near ? `Location: near ${criteria.near.district} (within ~${criteria.near.maxKm} km)` : "",
    criteria.languages.length ? `Languages: ${criteria.languages.join(", ")}` : "",
    criteria.minTotalYears ? `Total experience: ${criteria.minTotalYears}+ years` : "",
  ].filter(Boolean).join("\n");

  const docs = shortlist.map((r, i) => {
    const d = criteria.near ? distanceKm(r.c.district, criteria.near.district) : null;
    return { ref: `C${i + 1}`, row: r, distance: d, text: redactForRanking(r.c.rawText, r.c.fullName) };
  });

  const batches: (typeof docs)[] = [];
  for (let i = 0; i < docs.length; i += 4) batches.push(docs.slice(i, i + 4));
  const results = (
    await Promise.all(
      batches.map(async (batch) => {
        const res = await claude().messages.create({
          model: env.smartModel,
          max_tokens: 1800,
          system: `You rank anonymized candidates for a restaurant job against explicit criteria. Score 0-100 with this rubric: required skill years vs minimum (40), availability match (20), distance to the restaurant (15), relevance and recency of past roles (15), languages and other stated criteria (10). Use only what the resume says. Never consider names, gender, age, religion, ethnicity, marital status or appearance. Evidence quotes must be copied verbatim from that candidate's text.`,
          tools: [RANK_TOOL],
          tool_choice: { type: "tool", name: "record_ranking" },
          messages: [
            {
              role: "user",
              content: `CRITERIA\n${criteriaText}\n\n${batch.map((d) => `=== ${d.ref} ===${d.distance !== null ? `\n(lives ~${d.distance} km from ${criteria.near?.district})` : ""}\n${d.text}`).join("\n\n")}`,
            },
          ],
        });
        const block = res.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
        return ((block?.input as { results?: { ref: string; score: number; summary: string; evidence: Evidence[] }[] })?.results ?? []);
      }),
    )
  ).flat();

  const ranked: { matchId: string; score: number }[] = [];
  for (const d of docs) {
    const r = results.find((x) => x.ref === d.ref);
    if (!r) continue;
    const hay = squash(d.text);
    const evidence = (r.evidence ?? []).filter((e) => e.quote && hay.includes(squash(e.quote).replace(/\.$/, ""))).slice(0, 3);
    const score = Math.max(0, Math.min(100, Math.round(r.score)));
    await db
      .update(t.matches)
      .set({ score, evidence, summary: r.summary, distanceKm: d.distance, updatedAt: new Date(), stage: d.row.m.stage === "sourced" && score >= 70 ? "shortlisted" : d.row.m.stage })
      .where(eq(t.matches.id, d.row.m.id));
    ranked.push({ matchId: d.row.m.id, score });
  }
  // Candidates that were filtered out, or didn't make the shortlist, carry no score for this search.
  const unscored = [...filtered.map((f) => f.matchId), ...passing.slice(16).map((p) => p.m.id)];
  for (const f of filtered) {
    await db.update(t.matches).set({ score: null, evidence: [], summary: `Filtered: ${f.reasons.join(", ")}`, updatedAt: new Date() }).where(eq(t.matches.id, f.matchId));
  }
  if (passing.length > 16) {
    await db.update(t.matches).set({ score: null, evidence: [], summary: "Not in the top shortlist for this search" }).where(inArray(t.matches.id, passing.slice(16).map((p) => p.m.id)));
  }
  await db.update(t.requisitions).set({ criteria, rankedAt: new Date() }).where(eq(t.requisitions.id, requisitionId));
  return { ranked: ranked.sort((a, b) => b.score - a.score), filtered: filtered.length, unscored: unscored.length };
}
