"use client";
import useSWR from "swr";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson, send } from "@/components/app/fetcher";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Label, Textarea } from "@/components/ui/field";
import { cx } from "@/components/ui/cx";
import { BusinessForm } from "@/components/app/business-form";
import { Channels } from "../settings/channels";
import type { Patch, SettingsData } from "../settings/types";
import { DraftEditor, cleanDraft } from "./draft-editor";
import { TestChat } from "./test-chat";
import { emptyDraft, type Draft, type SetupChecks, type SetupSelling } from "@/setup/types";
import { SellingStep } from "./selling";
import type { WorkspaceSettings } from "@/db/schema";

type SetupData = {
  workspace: { id: string; name: string; city: string; timezone: string; currency: string; settings: WorkspaceSettings };
  notes: string;
  website: string;
  files: { id: string; filename: string | null; mime: string | null; size: number; chars: number }[];
  draft: Draft | null;
  knowledgeCount: number;
  ai: boolean;
  selling: SetupSelling;
  checks: SetupChecks;
};

const STEPS = ["Basics", "Your business", "Review", "How you sell", "Channels", "Try it", "Go live"] as const;
const PROMPTS = ["What you sell or offer, with prices", "Opening hours", "How ordering works", "Delivery or pickup", "How people pay", "What customers always ask"];

export default function SetupPage() {
  const toast = useToast();
  const router = useRouter();
  const { data, mutate } = useSWR<SetupData>("/api/setup", getJson);
  const [step, setStep] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (!data || step !== null) return;
    setStep(Math.min(Math.max(data.workspace.settings.onboarding?.step ?? 1, 1), 7));
    setDraft(data.draft);
  }, [data, step]);

  async function advance(to: number) {
    await send("/api/workspace", "PATCH", { onboardingStep: to }).catch(() => {});
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!data || step === null) return <p className="text-muted">Loading…</p>;
  const ws = data.workspace;
  const canBook = data.checks.services > 0 && data.checks.bookers > 0 && Boolean(data.checks.firstService);
  const reached = Math.max(ws.settings.onboarding?.step ?? 1, step);

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-8 border-b border-line pb-6">
        <p className="text-[13px] text-muted">Setting up {ws.name}</p>
        <h1 className="font-display mt-1 text-[34px] font-extrabold leading-[1.02] sm:text-[42px]">{["Start with the basics", "Tell us about your business", "Check what we understood", "How you sell", "Connect your chats", "Try it as a customer", "Go live"][step - 1]}</h1>
        <ol className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-7" aria-label="Setup steps">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const can = n <= reached;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!can}
                  onClick={() => setStep(n)}
                  aria-current={n === step ? "step" : undefined}
                  className={cx("w-full border-t-2 pt-2 text-left transition-colors disabled:cursor-default", n === step ? "border-brass" : n < reached ? "border-fg" : "border-line")}
                >
                  <span className="num block text-[11.5px] text-muted">{String(n).padStart(2, "0")}</span>
                  <span className={cx("block text-[13px]", n === step ? "font-medium text-fg" : can ? "text-fg-2" : "text-muted")}>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {step === 1 ? (
        <div>
          <p className="mb-6 max-w-[62ch] text-[15px] text-fg-2">This is what the assistant says when customers ask where you are, when you&apos;re open and what you charge in. You can change all of it later.</p>
          <BusinessForm
            saveLabel="Continue"
            initial={{ name: ws.name, city: ws.city, timezone: ws.timezone, currency: ws.currency, business: { ...ws.settings.business, phone: ws.settings.business.phone ?? null, website: ws.settings.business.website ?? null } }}
            onSave={async (v) => {
              try {
                await send("/api/workspace", "PATCH", v);
                await mutate();
                router.refresh();
                await advance(2);
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <Describe
          data={data}
          onDraft={async (d) => {
            setDraft(d);
            await mutate();
            await advance(3);
          }}
          onSkip={async () => {
            await advance(4);
          }}
        />
      ) : null}

      {step === 3 ? (
        <Review
          draft={draft ?? emptyDraft()}
          currency={ws.currency}
          knowledgeCount={data.knowledgeCount}
          onChange={setDraft}
          onSaved={async () => {
            await mutate();
            await advance(4);
          }}
        />
      ) : null}

      {step === 4 ? <SellingWrap data={data} currency={ws.currency} onSaved={async () => void (await mutate())} onNext={() => advance(5)} onBackToReview={() => setStep(3)} /> : null}

      {step === 5 ? <ChannelsStep onNext={() => advance(6)} /> : null}

      {step === 6 ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="max-w-[56ch] space-y-4 text-[15px] text-fg-2">
            <p>This is your assistant, answering from what you just saved. Ask it like a customer would, in any of your languages.</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Ask for a price or whether something is available.</li>
              <li>Try to order something for tomorrow: it checks your menu, prices and hours.</li>
              {canBook ? <li>Try to book an appointment: it checks free times.</li> : null}
              <li>Ask for something you don&apos;t sell, or complain: it should hand that to you.</li>
            </ul>
            <p>
              Wrong answer? Fix it in{" "}
              <a href="/app/knowledge" target="_blank" className="font-medium underline decoration-brass underline-offset-4">
                Knowledge
              </a>{" "}
              and ask again: changes apply to the very next message.
            </p>
            <Button variant="brass" onClick={() => advance(7)}>
              Looks good, continue
            </Button>
          </div>
          <TestChat suggestions={[...(canBook ? [`Book a ${data.checks.firstService} tomorrow at 3pm`] : []), ...(draft?.faqs ?? []).slice(0, 5).map((f) => f.question)]} />
        </div>
      ) : null}

      {step === 7 ? <GoLive data={data} /> : null}
    </div>
  );
}

function Describe({ data, onDraft, onSkip }: { data: SetupData; onDraft: (d: Draft) => Promise<void>; onSkip: () => Promise<void> }) {
  const toast = useToast();
  const [notes, setNotes] = useState(data.notes);
  const [website, setWebsite] = useState(data.website);
  const [files, setFiles] = useState(data.files);
  const [uploading, setUploading] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!drafting) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [drafting]);

  async function upload(list: FileList | null) {
    for (const f of Array.from(list ?? [])) {
      setUploading(f.name);
      const fd = new FormData();
      fd.append("file", f);
      try {
        const res = await fetch("/api/setup/sources", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error ?? `Upload failed (${res.status})`);
        setFiles((x) => [...x, j.file]);
      } catch (e) {
        toast((e as Error).message, "error");
      }
    }
    setUploading(null);
    if (input.current) input.current.value = "";
  }

  async function generate(manual = false) {
    setDrafting(true);
    try {
      if (manual) {
        await send("/api/setup/draft", "PATCH", { draft: emptyDraft() });
        await onDraft(emptyDraft());
        return;
      }
      const r = await send<{ draft: Draft; ai: boolean; warnings: string[] }>("/api/setup/draft", "POST", { notes, website });
      for (const w of r.warnings) toast(w);
      await onDraft(r.draft);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setDrafting(false);
    }
  }

  if (drafting) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-line bg-panel px-6 py-12 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-r-transparent" aria-hidden />
        <p className="font-display mt-5 text-[22px] font-bold">Reading everything you gave us</p>
        <p className="mt-2 max-w-[48ch] text-[14px] text-muted">
          Claude is going through your notes{files.length ? `, ${files.length} file${files.length > 1 ? "s" : ""}` : ""}
          {website ? " and your website" : ""} and drafting your products, prices, hours, policies and the questions customers ask. This usually takes under a minute.
        </p>
        <p className="num mt-4 text-[13px] text-fg-2">{elapsed}s</p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <Label htmlFor="notes" hint="the more the better">Explain your business like you would to a new staff member</Label>
        <Textarea
          id="notes"
          rows={14}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={"e.g. We're a small hair salon in Mont Kiara with 3 stylists. Women's cut and blow-dry is RM 85 for short hair, RM 110 for long. We're closed Mondays, open 10 to 7 the rest of the week. We take payment by DuitNow or cash…"}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROMPTS.map((p) => (
            <button key={p} type="button" onClick={() => setNotes((n) => `${n}${n && !n.endsWith("\n") ? "\n" : ""}${p}: `)} className="h-7 rounded-full border border-line px-3 text-[12.5px] text-fg-2 hover:border-line-strong hover:text-fg">
              + {p}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-muted">Any language is fine. Write it like a voice note; you&apos;ll check everything on the next screen.</p>
      </div>
      <div className="space-y-8">
        <div>
          <Label>Menus, price lists, flyers</Label>
          <div
            className="rounded-xl border border-dashed border-line-strong p-5 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void upload(e.dataTransfer.files);
            }}
          >
            <p className="text-[14px]">Drop files here, or</p>
            <Button type="button" size="sm" className="mt-2" loading={Boolean(uploading)} onClick={() => input.current?.click()}>
              Choose files
            </Button>
            <input ref={input} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.md" className="hidden" onChange={(e) => upload(e.target.files)} />
            <p className="mt-2 text-[12.5px] text-muted">PDF, photos of your menu or price board, or text. Up to 4 MB each.</p>
            {uploading ? <p className="mt-2 text-[12.5px] text-fg-2">Uploading {uploading}…</p> : null}
          </div>
          {files.length ? (
            <ul className="mt-3 space-y-1.5">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-[13px]">
                  <span className="min-w-0 truncate">{f.filename}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="num text-muted">{Math.max(1, Math.round(f.size / 1024))} KB</span>
                    <button
                      type="button"
                      className="text-muted hover:text-signal-ink"
                      onClick={async () => {
                        await send(`/api/setup/sources/${f.id}`, "DELETE").catch(() => {});
                        setFiles((x) => x.filter((y) => y.id !== f.id));
                      }}
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <Label htmlFor="site" hint="optional">Website</Label>
          <Input id="site" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourbusiness.com" inputMode="url" />
          <p className="mt-1.5 text-[12.5px] text-muted">We read the home page and pages like Menu, Prices, Services and FAQ.</p>
        </div>
        <div className="space-y-3 border-t border-line pt-6">
          {data.ai ? (
            <Button variant="brass" size="lg" className="w-full" disabled={!notes.trim() && !files.length && !website.trim()} onClick={() => generate()}>
              Draft my assistant
            </Button>
          ) : (
            <p className="rounded-lg border border-line bg-raised px-3 py-2 text-[13px] text-fg-2">Claude isn&apos;t connected on this server, so you&apos;ll fill in the details by hand on the next screen.</p>
          )}
          <button type="button" onClick={() => generate(!data.ai)} className={cx("w-full text-center text-[13.5px] underline-offset-4 hover:underline", data.ai ? "text-muted" : "font-medium text-fg")}>
            {data.ai ? "Skip this and fill everything in by hand" : "Continue to fill in by hand"}
          </button>
          {data.knowledgeCount > 0 ? (
            <button type="button" onClick={onSkip} className="w-full text-center text-[13px] text-muted underline-offset-4 hover:underline">
              Keep my current knowledge ({data.knowledgeCount} entries) and continue
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Review({ draft, currency, knowledgeCount, onChange, onSaved }: { draft: Draft; currency: string; knowledgeCount: number; onChange: (d: Draft) => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave edits so a reload doesn't lose them.
  const change = useCallback(
    (d: Draft) => {
      onChange(d);
      if (timer.current) clearTimeout(timer.current);
      setSaved("saving");
      timer.current = setTimeout(async () => {
        await send("/api/setup/draft", "PATCH", { draft: cleanDraft(d) }).catch(() => {});
        setSaved("saved");
      }, 1200);
    },
    [onChange],
  );

  const empty = !draft.items.length && !draft.faqs.length && !draft.policies.length && !draft.hours;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[62ch] text-[15px] text-fg-2">
          {empty ? "Add what you sell, your hours and the questions customers ask. The assistant only answers from what's here." : "Here's what we understood. Fix anything that's wrong, fill the gaps, and remove what you don't want the assistant to say."}
        </p>
        <span className="flex items-center gap-2 text-[12.5px] text-muted">
          {saved === "saving" ? "Saving…" : saved === "saved" ? "Draft saved" : null}
          <Chip>{draft.items.length} items</Chip>
          <Chip>{draft.faqs.length} questions</Chip>
        </span>
      </div>
      <DraftEditor draft={draft} onChange={change} currency={currency} />
      <div className="sticky bottom-0 z-10 -mx-4 mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bg/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <p className="text-[13px] text-muted">{knowledgeCount ? `This replaces the ${knowledgeCount} knowledge entries you have now.` : "You can edit all of this later in Knowledge."}</p>
        <Button
          variant="brass"
          size="lg"
          loading={busy}
          onClick={async () => {
            if (knowledgeCount && !window.confirm("Replace your current knowledge with this?")) return;
            setBusy(true);
            try {
              const r = await send<{ items: number; faqs: number; policies: number}>("/api/setup/import", "POST", { draft: cleanDraft(draft), replace: true });
              const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
              toast(`Saved ${n(r.items, "product or service", "products and services")}, ${n(r.faqs, "question", "questions")} and ${n(r.policies, "policy", "policies")}.`, "ok");
              await onSaved();
            } catch (e) {
              toast((e as Error).message, "error");
            } finally {
              setBusy(false);
            }
          }}
        >
          Save and continue
        </Button>
      </div>
    </div>
  );
}

function SellingWrap({ data, currency, onSaved, onNext, onBackToReview }: { data: SetupData; currency: string; onSaved: () => Promise<void>; onNext: () => void; onBackToReview: () => void }) {
  const toast = useToast();
  const patch: Patch = async (url, method, body, msg) => {
    try {
      const r = await send(url, method, body);
      await onSaved();
      if (msg) toast(msg);
      return r;
    } catch (e) {
      toast((e as Error).message, "error");
      throw e;
    }
  };
  return <SellingStep data={data.selling} currency={currency} onSaved={onSaved} onNext={onNext} onBackToReview={onBackToReview} patch={patch} />;
}

function ChannelsStep({ onNext }: { onNext: () => void }) {
  const toast = useToast();
  const { data, mutate } = useSWR<SettingsData>("/api/settings", getJson);
  const patch: Patch = async (url, method, body, msg) => {
    try {
      const r = await send(url, method, body);
      await mutate();
      if (msg) toast(msg);
      return r;
    } catch (e) {
      toast((e as Error).message, "error");
      throw e;
    }
  };
  if (!data) return <p className="text-muted">Loading…</p>;
  const any = data.channels.whatsapp.connected || Boolean(data.channels.telegram.ownBot) || data.channels.telegram.businessConnections.length > 0;
  return (
    <div>
      <p className="mb-6 max-w-[62ch] text-[15px] text-fg-2">
        Connect the apps your customers already use. Nothing is answered until you go live in the last step, so connect now and test safely. You can also do this later in Settings.
      </p>
      <Channels channels={data.channels} patch={patch} workspaceId={data.workspace.id} />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="brass" size="lg" onClick={onNext}>
          {any ? "Continue" : "Continue without connecting"}
        </Button>
        {!any ? <p className="text-[13px] text-muted">The website simulator works without any connection.</p> : null}
      </div>
    </div>
  );
}

function GoLive({ data }: { data: SetupData }) {
  const toast = useToast();
  const router = useRouter();
  const { data: s } = useSWR<SettingsData>("/api/settings", getJson);
  const [busy, setBusy] = useState<string | null>(null);
  const ch = s?.channels;
  const checks = [
    { ok: data.knowledgeCount > 0, label: `${data.knowledgeCount} knowledge entries saved`, fix: "Add what you sell in step 3" },
    { ok: Boolean(ch && (ch.whatsapp.connected || ch.telegram.ownBot || ch.telegram.businessConnections.length || ch.telegram.sharedBot)), label: ch ? [ch.telegram.ownBot ? `Telegram @${ch.telegram.ownBot.username}` : ch.telegram.businessConnections.length ? "Telegram Business" : ch.telegram.sharedBot ? "Telegram customer link" : null, ch.whatsapp.connected ? "WhatsApp" : null].filter(Boolean).join(", ") || "No channel connected" : "Checking channels…", fix: "Connect one in step 5" },
    { ok: Boolean(s?.ai.providers.length), label: s?.ai.providers.length ? `AI connected (${s.ai.providers.map((p) => p.name).join(", ")})` : "No AI provider: every message gets a holding reply and goes to Needs you", fix: "Set GROQ_API_KEY or GEMINI_API_KEY on the server" },
  ];
  const c = data.checks;
  const notes: { tone: "warn" | "info"; label: string; link?: [string, string] }[] = [];
  if (c.services > 0 && c.bookers === 0) notes.push({ tone: "warn", label: "Bookings go to you by hand until someone is switched on", link: ["/app/calendar", "Team availability"] });
  if (c.services > 0 && !c.hasHours) notes.push({ tone: "warn", label: "No times can be booked: add opening hours." });
  if (c.inPersonServices > 0 && !c.hasAddress) notes.push({ tone: "warn", label: "In-person services but no business address." });
  if (!c.paymentsOn) notes.push({ tone: "info", label: "Customers aren't asked to pay in chat.", link: ["/app/settings#payments", "Turn on in Settings → Payments"] });
  if (c.stockMode === "daily" && c.dailyWithoutQty > 0) notes.push({ tone: "warn", label: `${c.dailyWithoutQty} daily items have no usual quantity: these are treated as unlimited.` });
  async function finish(live: boolean) {
    setBusy(live ? "live" : "later");
    try {
      await send("/api/workspace", "PATCH", { completeOnboarding: true, ...(live ? { live: true } : {}) });
      toast(live ? "You're live. New messages get answered right away." : "Setup finished. Go live from Settings when you're ready.", "ok");
      router.replace("/app/today");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
      setBusy(null);
    }
  }
  return (
    <div className="max-w-[720px]">
      <ul className="divide-y divide-line border-y border-line">
        {checks.map((c) => (
          <li key={c.fix} className="flex items-center justify-between gap-4 py-3.5">
            <span className="flex items-center gap-3 text-[15px]">
              <span className={cx("h-2.5 w-2.5 rounded-full", c.ok ? "bg-answered-ink" : "bg-signal")} aria-hidden />
              {c.label}
            </span>
            {!c.ok ? <span className="text-[13px] text-muted">{c.fix}</span> : null}
          </li>
        ))}
        {notes.map((n) => (
          <li key={n.label} className="flex items-center justify-between gap-4 py-3.5">
            <span className="flex items-center gap-3 text-[15px]">
              <span className={cx("h-2.5 w-2.5 rounded-full", n.tone === "warn" ? "bg-brass" : "border border-line-strong bg-transparent")} aria-hidden />
              {n.label}
            </span>
            {n.link ? (
              <a href={n.link[0]} target="_blank" className="shrink-0 text-[13px] text-muted underline underline-offset-4 hover:text-fg">
                {n.link[1]}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[15px] text-fg-2">
        When you go live, Yapoz answers customers on your connected channels. Anything it isn&apos;t sure about, complaints and refunds go to <b>Needs you</b> instead of being guessed. You can switch any channel to Copilot (drafts for approval) or pause everything in Settings.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" size="lg" loading={busy === "live"} disabled={!checks[0].ok} onClick={() => finish(true)}>
          Go live
        </Button>
        <Button size="lg" loading={busy === "later"} disabled={!checks[0].ok} onClick={() => finish(false)}>
          Finish, go live later
        </Button>
      </div>
      {!checks[0].ok ? <p className="mt-3 text-[13.5px] text-muted">Setup can&apos;t finish until the assistant has something to answer from. Go back to step 3 and add what you sell or offer.</p> : null}
    </div>
  );
}
