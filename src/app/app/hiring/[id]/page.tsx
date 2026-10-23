"use client";
import useSWR from "swr";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Textarea } from "@/components/ui/field";
import { cx } from "@/components/ui/cx";

type Criteria = {
  role: string;
  skills: { name: string; minYears?: number; required: boolean }[];
  availability: string[];
  near?: { district: string; maxKm: number } | null;
  languages: string[];
  minTotalYears?: number | null;
  ignored: string[];
};
type Match = {
  id: string; score: number | null; evidence: { quote: string; why: string }[]; summary: string | null; stage: string; distanceKm: number | null;
  candidateId: string; fullName: string; source: string; sourceRef: string | null; district: string | null; totalYears: number | null; availability: string[];
  profile: { headline: string; languages: string[]; skills: { name: string; years: number }[] } | null; botReachable: boolean; telegramUsername: string | null; parsedAt: string | null; hasDocument: boolean;
  outreach: { id: string; kind: string; status: string; channel: string; error: string | null } | null;
  interview: { id: string; startsAt: string; mode: string; meetUrl: string | null; status: string; provider: string } | null;
};
type Data = { requisition: { id: string; title: string; description: string; rawRequest: string | null; criteria: Criteria | null; fairnessNotice: boolean; rankedAt: string | null }; matches: Match[]; aiConfigured: boolean; botUsername: string | null };

const AVAIL = ["evenings", "weekends", "mornings", "weekdays", "nights", "full-time", "part-time"];
const DISTRICTS = ["Bangsar", "Bangsar South", "Mid Valley", "Brickfields", "Damansara Heights", "Mont Kiara", "Sri Hartamas", "TTDI", "Bukit Bintang", "KLCC", "Petaling Jaya", "Cheras", "Kepong"];
const STAGE_LABEL: Record<string, string> = { sourced: "Sourced", shortlisted: "Shortlisted", invited: "Invited", scheduled: "Interview booked", interviewed: "Interviewed", hired: "Hired", rejected: "Rejected" };
const SOURCE_LABEL: Record<string, string> = { telegram_channel: "Jobs channel post", bot_apply: "Applied via bot", upload: "Uploaded resume" };

export default function RequisitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const { data, mutate } = useSWR<Data>(`/api/hiring/requisitions/${id}`, getJson);
  useLive(["matches", "outreach", "interviews", "candidates"], () => mutate(), 400);
  const [request, setRequest] = useState("");
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [dirty, setDirty] = useState(false);
  const [phase, setPhase] = useState<null | "search" | "rank">(null);
  const [step, setStep] = useState(0);
  const [showFiltered, setShowFiltered] = useState(false);

  useEffect(() => {
    if (data && !dirty) {
      setCriteria(data.requisition.criteria);
      if (!request) setRequest(data.requisition.rawRequest ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  useEffect(() => {
    if (!phase) return;
    setStep(0);
    const a = setTimeout(() => setStep(1), phase === "search" ? 2500 : 300);
    const b = setTimeout(() => setStep(2), phase === "search" ? 3500 : 1200);
    return () => (clearTimeout(a), clearTimeout(b));
  }, [phase]);

  async function search() {
    setPhase("search");
    try {
      const r = await send<{ criteria: Criteria; ranked: unknown[]; ms: number }>(`/api/hiring/requisitions/${id}/search`, "POST", { request });
      setCriteria(r.criteria);
      setDirty(false);
      await mutate();
      toast(`Ranked ${r.ranked.length} candidates in ${(r.ms / 1000).toFixed(1)}s.`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setPhase(null);
    }
  }
  async function rerank() {
    if (!criteria) return;
    setPhase("rank");
    try {
      await send(`/api/hiring/requisitions/${id}/rank`, "POST", { criteria });
      setDirty(false);
      await mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setPhase(null);
    }
  }
  const edit = (c: Criteria) => (setCriteria(c), setDirty(true));

  const ranked = useMemo(() => (data?.matches ?? []).filter((m) => m.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)), [data]);
  const others = useMemo(() => (data?.matches ?? []).filter((m) => m.score === null), [data]);

  if (!data) return <p className="text-muted">Loading…</p>;
  const req = data.requisition;
  return (
    <div>
      <div className="mb-8 border-b border-line pb-6">
        <Link href="/app/hiring" className="text-[13px] text-muted hover:text-fg">Roles and candidates</Link>
        <h1 className="font-display mt-1 text-[38px] font-extrabold leading-none sm:text-[44px]">{req.title}</h1>
        <p className="mt-2 max-w-[70ch] text-[15px] text-muted">{req.description}</p>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <label htmlFor="req" className="mb-2 block text-[14px] text-fg-2">Describe who you need, in plain words</label>
          <Textarea id="req" rows={2} value={request} onChange={(e) => setRequest(e.target.value)} placeholder="e.g. part-time barista, 1+ year experience, weekends, lives nearby" className="text-[16px]" />
        </div>
        <Button variant="primary" size="lg" loading={phase === "search"} disabled={request.trim().length < 3 || !data.aiConfigured} onClick={search}>
          Find candidates
        </Button>
      </section>
      {!data.aiConfigured ? <p className="mt-2 text-[13px] text-signal-ink">Ranking needs ANTHROPIC_API_KEY on the server.</p> : null}

      {criteria ? (
        <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[14px] text-fg-2">Criteria Yapoz is ranking on. Click any chip to change it.</h2>
            {dirty ? <Button size="sm" variant="brass" loading={phase === "rank"} onClick={rerank}>Re-rank with these</Button> : null}
          </div>
          <CriteriaEditor c={criteria} onChange={edit} />
          {req.fairnessNotice || criteria.ignored.length ? (
            <p className="mt-4 border-t border-line pt-3 text-[14px] text-fg-2">
              <span className="font-medium text-fg">Ranked on skills and availability only.</span> Yapoz never filters or scores on gender, age, religion, ethnicity, marital status or photos, and removes names and personal details before ranking.
              {criteria.ignored.length ? <span className="text-muted"> Left out of this search: {criteria.ignored.join(", ")}.</span> : null}
            </p>
          ) : (
            <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">Names and personal details (age, religion, marital status) are removed before ranking. Scores use only job-relevant criteria.</p>
          )}
        </section>
      ) : null}

      {phase ? (
        <ol className="mt-8 space-y-2 text-[15px]">
          {["Turning your request into criteria", `Filtering ${data.matches.length} candidates in the database`, "Ranking the shortlist and pulling evidence from each resume"].slice(phase === "rank" ? 1 : 0).map((s, i) => {
            const idx = phase === "rank" ? i + 1 : i;
            return (
              <li key={s} className={cx("flex items-center gap-3", idx <= step ? "text-fg" : "text-muted")}>
                <span className={cx("h-2 w-2 rounded-full", idx < step ? "bg-brass" : idx === step ? "live-dot bg-brass" : "bg-line-strong")} />
                {s}
              </li>
            );
          })}
        </ol>
      ) : null}

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-[24px] font-bold">{ranked.length ? `Ranked shortlist, ${ranked.length}` : "Ranked shortlist"}</h2>
          {req.rankedAt ? <span className="num text-[12px] text-muted">ranked {new Date(req.rankedAt).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })}</span> : null}
        </div>
        {ranked.length === 0 ? (
          <p className="max-w-[60ch] text-[15px] text-muted">Describe the role above and Yapoz ranks the {data.matches.length} candidates from your own sources: the jobs channel, people who applied through the bot, and uploads.</p>
        ) : (
          <ol className="divide-y divide-line border-y border-line">
            {ranked.map((m, i) => (
              <CandidateRow key={m.id} m={m} rank={i + 1} onChange={mutate} botUsername={data.botUsername} />
            ))}
          </ol>
        )}
      </section>

      {others.length ? (
        <section className="mt-10">
          <button onClick={() => setShowFiltered((v) => !v)} className="text-[14px] text-fg-2 underline-offset-4 hover:underline">
            {showFiltered ? "Hide" : "Show"} {others.length} candidates not in this shortlist, with reasons
          </button>
          {showFiltered ? (
            <ul className="mt-3 divide-y divide-line border-y border-line text-[14px]">
              {others.map((m) => (
                <li key={m.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                  <span>{m.fullName}</span>
                  <span className="text-muted">{m.summary ?? "Not ranked yet"}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function CriteriaEditor({ c, onChange }: { c: Criteria; onChange: (c: Criteria) => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [newSkill, setNewSkill] = useState("");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Chip tone="solid">{c.role}</Chip>
      {c.skills.map((s, i) =>
        editing === i ? (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-brass px-2 py-1 text-[12px]">
            {s.name}
            <input type="number" min={0} max={30} value={s.minYears ?? 0} onChange={(e) => onChange({ ...c, skills: c.skills.map((x, j) => (j === i ? { ...x, minYears: Number(e.target.value) || undefined } : x)) })} className="num w-10 rounded border border-line bg-raised px-1 text-center" aria-label="Minimum years" />
            yrs
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={s.required} onChange={(e) => onChange({ ...c, skills: c.skills.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)) })} />
              required
            </label>
            <button onClick={() => onChange({ ...c, skills: c.skills.filter((_, j) => j !== i) })} className="text-signal-ink">remove</button>
            <button onClick={() => setEditing(null)} className="text-muted">done</button>
          </span>
        ) : (
          <button key={i} onClick={() => setEditing(i)}>
            <Chip tone="brass">
              {s.name}
              {s.minYears ? <span className="num">{` ${s.minYears}+ yrs`}</span> : null}
              {s.required ? "" : ", nice to have"}
            </Chip>
          </button>
        ),
      )}
      <form onSubmit={(e) => (e.preventDefault(), newSkill.trim() && (onChange({ ...c, skills: [...c.skills, { name: newSkill.trim().toLowerCase(), required: false }] }), setNewSkill("")))}>
        <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill" className="h-7 w-32 rounded-full text-[12px]" />
      </form>
      <span className="mx-1 h-5 w-px bg-line" aria-hidden />
      {AVAIL.map((a) => (
        <button key={a} onClick={() => onChange({ ...c, availability: c.availability.includes(a) ? c.availability.filter((x) => x !== a) : [...c.availability, a] })}>
          <Chip tone={c.availability.includes(a) ? "brass" : "neutral"} className={c.availability.includes(a) ? "" : "opacity-60"}>{a}</Chip>
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-line" aria-hidden />
      <span className="inline-flex items-center gap-1.5 text-[12px]">
        near
        <select value={c.near?.district ?? ""} onChange={(e) => onChange({ ...c, near: e.target.value ? { district: e.target.value, maxKm: c.near?.maxKm ?? 10 } : null })} className="h-7 rounded-full border border-line-strong bg-raised px-2 text-[12px]" aria-label="Near district">
          <option value="">anywhere</option>
          {DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        {c.near ? (
          <>
            within
            <input type="number" min={1} max={60} value={c.near.maxKm} onChange={(e) => onChange({ ...c, near: { ...c.near!, maxKm: Number(e.target.value) || 10 } })} className="num h-7 w-12 rounded-full border border-line-strong bg-raised text-center" aria-label="Kilometres" />
            km
          </>
        ) : null}
      </span>
      {c.languages.map((l) => (
        <button key={l} onClick={() => onChange({ ...c, languages: c.languages.filter((x) => x !== l) })} title="Remove">
          <Chip>speaks {l}</Chip>
        </button>
      ))}
    </div>
  );
}

function CandidateRow({ m, rank, onChange, botUsername }: { m: Match; rank: number; onChange: () => void; botUsername: string | null }) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  async function draft(action: "invite" | "reject", mode?: "onsite" | "video") {
    setBusy(action + (mode ?? ""));
    try {
      await send(`/api/hiring/matches/${m.id}`, "POST", { action, mode });
      onChange();
      toast(action === "invite" ? `Invite for ${m.fullName.split(" ")[0]} drafted. It waits in Approvals until you approve it.` : "Rejection drafted for approval.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }
  const score = m.score ?? 0;
  const pending = m.outreach && (m.outreach.status === "draft" || m.outreach.status === "approved");
  return (
    <li className="grid grid-cols-1 gap-5 py-6 lg:grid-cols-[88px_1fr_1.3fr_auto]">
      <div className="flex items-baseline gap-3 lg:block">
        <div className="num text-[13px] text-muted">#{rank}</div>
        <div className="num text-[40px] font-medium leading-none tracking-[-0.04em]">{score}</div>
        <div className="mt-2 h-1.5 w-20 rounded-full bg-line" aria-hidden>
          <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: "var(--brass-mark)" }} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-[17px] font-semibold">{m.fullName}</h3>
          {m.hasDocument ? (
            <a href={`/api/hiring/candidates/${m.candidateId}/document`} target="_blank" rel="noreferrer" className="text-[12px] text-brass-ink underline-offset-2 hover:underline">resume PDF</a>
          ) : null}
        </div>
        <p className="text-[14px] text-fg-2">{m.profile?.headline ?? "Profile not parsed yet"}</p>
        <p className="mt-1 text-[13px] text-muted">
          {[m.district, m.distanceKm != null ? `${m.distanceKm} km away` : null, m.totalYears != null ? `${m.totalYears} yrs experience` : null].filter(Boolean).join(", ")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.availability.map((a) => (
            <Chip key={a}>{a}</Chip>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted">{SOURCE_LABEL[m.source] ?? m.source}{m.sourceRef ? `: ${m.sourceRef}` : ""}</p>
      </div>
      <div>
        {m.summary ? <p className="text-[14px] text-fg">{m.summary}</p> : null}
        <ul className="mt-3 space-y-2.5">
          {m.evidence.map((e, i) => (
            <li key={i} className="border-l-2 border-brass/70 pl-3">
              <q className="accent-word text-[17px] leading-snug text-fg">{e.quote}</q>
              <div className="text-[12px] text-muted">{e.why}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col items-start gap-2 lg:items-end">
        <Chip tone={m.stage === "scheduled" ? "answered" : m.stage === "shortlisted" || m.stage === "invited" ? "brass" : "neutral"}>{STAGE_LABEL[m.stage] ?? m.stage}</Chip>
        {m.interview && m.interview.status === "scheduled" ? (
          <p className="num text-right text-[12px] text-fg-2">{new Date(m.interview.startsAt).toLocaleString("en-MY", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
        ) : null}
        {pending ? (
          <Link href="/app/hiring/approvals" className="text-[13px] text-brass-ink underline-offset-4 hover:underline">Waiting for your Approve</Link>
        ) : m.outreach?.status === "failed" ? (
          <p className="max-w-[220px] text-right text-[12px] text-signal-ink">{m.outreach.error}</p>
        ) : null}
        {!pending && (m.stage === "sourced" || m.stage === "shortlisted") ? (
          <>
            <Button size="sm" variant="primary" loading={busy === "inviteonsite"} onClick={() => draft("invite", "onsite")}>Draft invite</Button>
            <Button size="sm" variant="secondary" loading={busy === "invitevideo"} onClick={() => draft("invite", "video")}>Draft video invite</Button>
            <Button size="sm" variant="ghost" loading={busy === "reject"} onClick={() => draft("reject")}>Draft rejection</Button>
          </>
        ) : null}
        <p className="max-w-[220px] text-right text-[11px] text-muted">
          {m.botReachable ? "Reachable in the Telegram bot chat" : `Not reachable automatically yet${botUsername ? `: ask them to /apply via @${botUsername}` : ""}`}
        </p>
      </div>
    </li>
  );
}
