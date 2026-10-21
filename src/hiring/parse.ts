import type Anthropic from "@anthropic-ai/sdk";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";
import { claude } from "@/agent/claude";
import { env } from "@/lib/env";
import { resolveDistrict } from "@/lib/geo";
import type { CandidateProfile } from "@/db/schema";

const AVAIL = ["evenings", "weekends", "mornings", "weekdays", "nights", "full-time", "part-time"];

const TOOL: Anthropic.Messages.Tool = {
  name: "record_profile",
  description: "Record the structured, job-relevant profile extracted from the resume.",
  input_schema: {
    type: "object",
    properties: {
      full_name: { type: "string" },
      headline: { type: "string", description: "Current or most recent role and place" },
      skills: { type: "array", items: { type: "object", properties: { name: { type: "string", description: "lowercase skill, e.g. 'wood-fired oven', 'hair colouring', 'barista', 'customer service'" }, years: { type: "number" } }, required: ["name", "years"] } },
      past_roles: { type: "array", items: { type: "object", properties: { title: { type: "string" }, place: { type: "string" }, years: { type: "number" } }, required: ["title", "place", "years"] } },
      availability: { type: "array", items: { type: "string", enum: AVAIL } },
      district: { type: ["string", "null"], description: "Area where they live, as written" },
      languages: { type: "array", items: { type: "string" } },
      total_years: { type: "number", description: "Total years of relevant work experience" },
      contact_channel: { type: "string", enum: ["telegram", "whatsapp", "email", "phone", "unknown"] },
      contact_value: { type: ["string", "null"] },
      summary: { type: "string", description: "One factual sentence about their relevant experience" },
    },
    required: ["full_name", "headline", "skills", "past_roles", "availability", "district", "languages", "total_years", "contact_channel", "contact_value", "summary"],
  },
};

export async function parseCandidate(candidateId: string) {
  const [c] = await db.select().from(t.candidates).where(eq(t.candidates.id, candidateId));
  if (!c) return null;
  const res = await claude().messages.create({
    model: env.fastModel,
    max_tokens: 1200,
    system:
      "You extract job-relevant facts from resumes and job-seeker posts for a local business. Only record skills, experience, availability, location, languages and contact. Never record age, date of birth, gender, religion, ethnicity, nationality, marital status, family, health or appearance. Don't guess numbers that aren't stated; use 0 when unknown.",
    tools: [TOOL],
    tool_choice: { type: "tool", name: "record_profile" },
    messages: [{ role: "user", content: c.rawText.slice(0, 20_000) }],
  });
  const block = res.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
  if (!block) throw new Error("No profile returned");
  const p = block.input as Record<string, unknown>;
  const profile: CandidateProfile = {
    headline: String(p.headline ?? ""),
    skills: (p.skills as CandidateProfile["skills"]) ?? [],
    pastRoles: ((p.past_roles as { title: string; place: string; years: number }[]) ?? []).map((r) => ({ title: r.title, place: r.place, years: r.years })),
    availability: ((p.availability as string[]) ?? []).filter((a) => AVAIL.includes(a)),
    district: (p.district as string | null) ?? null,
    languages: (p.languages as string[]) ?? [],
    totalYears: Number(p.total_years ?? 0),
    contact: { channel: String(p.contact_channel ?? "unknown"), value: (p.contact_value as string | null) ?? null },
    summary: String(p.summary ?? ""),
  };
  const fullName = String(p.full_name || c.fullName);
  await db
    .update(t.candidates)
    .set({
      profile, fullName: c.fullName === "Unnamed candidate" || c.fullName === "Applicant" ? fullName : c.fullName,
      district: resolveDistrict(profile.district) ?? profile.district ?? c.district,
      totalYears: profile.totalYears, availability: profile.availability, parsedBy: env.fastModel, parsedAt: new Date(),
    })
    .where(eq(t.candidates.id, candidateId));
  return profile;
}

export async function parseCandidateJob(payload: Record<string, unknown>) {
  if (!env.hasAnthropic) return; // stays unparsed; HR sees "not parsed yet"
  await parseCandidate(String(payload.candidateId));
}
