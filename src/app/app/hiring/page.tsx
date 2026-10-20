"use client";
import useSWR from "swr";
import Link from "next/link";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";

type Req = { id: string; title: string; description: string; status: string; candidates: number; shortlisted: number; in_progress: number; hired: number; ranked_at: string | null };
type Cand = { id: string; fullName: string; source: string; sourceRef: string | null; district: string | null; totalYears: number | null; availability: string[]; consent: boolean; parsedAt: string | null; parsedBy: string | null; createdAt: string; botReachable: boolean; headline: string | null; hasDocument: boolean };

const SOURCE_LABEL: Record<string, string> = { telegram_channel: "Jobs channel", bot_apply: "Applied via bot", upload: "Upload" };

export default function HiringHome() {
  const toast = useToast();
  const { data: reqs, mutate: mReqs } = useSWR<{ requisitions: Req[] }>("/api/hiring/requisitions", getJson);
  const { data: cands, mutate: mCands } = useSWR<{ candidates: Cand[] }>("/api/hiring/candidates", getJson);
  useLive(["candidates", "matches", "requisitions"], () => (mReqs(), mCands()), 500);
  const [newRole, setNewRole] = useState(false);
  const [upload, setUpload] = useState(false);

  async function remove(c: Cand) {
    if (!window.confirm(`Delete ${c.fullName} and their documents? This can't be undone.`)) return;
    try {
      await send(`/api/hiring/candidates/${c.id}`, "DELETE");
      await mCands();
      toast(`${c.fullName} deleted.`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Hiring"
        description="Describe the role in plain words; Jawab ranks candidates from sources you control and drafts the outreach. Nothing reaches a candidate until you press Approve."
        actions={
          <>
            <Button variant="secondary" onClick={() => setUpload(true)}>Upload resumes</Button>
            <Button variant="primary" onClick={() => setNewRole(true)}>New role</Button>
          </>
        }
      />
      <section>
        <h2 className="font-display mb-3 text-[20px] font-bold">Open roles</h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(reqs?.requisitions ?? []).map((r) => (
            <li key={r.id}>
              <Link href={`/app/hiring/${r.id}`} className="block rounded-2xl border border-line p-5 transition-colors hover:border-brass/60 hover:bg-raised">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-[22px] font-bold leading-tight">{r.title}</h3>
                  <Chip>{r.status}</Chip>
                </div>
                <p className="mt-2 line-clamp-2 text-[14px] text-muted">{r.description}</p>
                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3">
                  <div><dt className="text-[12px] text-muted">Candidates</dt><dd className="num text-[22px]">{r.candidates}</dd></div>
                  <div><dt className="text-[12px] text-muted">Shortlisted</dt><dd className="num text-[22px]">{r.shortlisted}</dd></div>
                  <div><dt className="text-[12px] text-muted">In progress</dt><dd className="num text-[22px]">{r.in_progress}</dd></div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-[20px] font-bold">Candidate pool{cands ? `, ${cands.candidates.length}` : ""}</h2>
          <p className="text-[13px] text-muted">Sources: your Telegram jobs channel, /apply in the bot, and uploads. Never groups you don&apos;t run.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-muted">
                <th className="py-2 font-normal">Name</th>
                <th className="py-2 font-normal">Most recent role</th>
                <th className="py-2 font-normal">Area</th>
                <th className="py-2 text-right font-normal">Years</th>
                <th className="py-2 font-normal pl-4">Source</th>
                <th className="py-2 font-normal">Profile</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(cands?.candidates ?? []).map((c) => (
                <tr key={c.id} className="border-b border-line/70">
                  <td className="py-2.5 pr-3 font-medium">{c.fullName}</td>
                  <td className="py-2.5 pr-3 text-fg-2">{c.headline ?? "–"}</td>
                  <td className="py-2.5 pr-3">{c.district ?? "–"}</td>
                  <td className="num py-2.5 text-right">{c.totalYears ?? "–"}</td>
                  <td className="py-2.5 pl-4 text-fg-2">{SOURCE_LABEL[c.source] ?? c.source}{c.botReachable ? <span className="text-muted">, reachable</span> : null}</td>
                  <td className="py-2.5 text-[12px] text-muted">{c.parsedAt ? (c.parsedBy === "seed" ? "seeded" : "parsed by Claude") : "parsing…"}</td>
                  <td className="py-2.5 text-right">
                    {c.hasDocument ? <a href={`/api/hiring/candidates/${c.id}/document`} target="_blank" rel="noreferrer" className="mr-3 text-[12px] text-brass-ink hover:underline">PDF</a> : null}
                    <button onClick={() => remove(c)} className="text-[12px] text-muted hover:text-signal-ink">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <NewRole open={newRole} onClose={() => setNewRole(false)} onCreated={() => (setNewRole(false), mReqs())} />
      <Upload open={upload} onClose={() => setUpload(false)} onDone={() => (setUpload(false), mCands())} />
    </div>
  );
}

function NewRole({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="New role" description="Every consented candidate in your pool is considered automatically.">
      <div className="space-y-4">
        <div><Label htmlFor="rt">Title</Label><Input id="rt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekend dishwasher" /></div>
        <div><Label htmlFor="rd">What the job is</Label><Textarea id="rd" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} disabled={title.trim().length < 2} onClick={async () => {
            setBusy(true);
            try { await send("/api/hiring/requisitions", "POST", { title, description }); onCreated(); toast("Role created."); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(false); }
          }}>Create role</Button>
        </div>
      </div>
    </Dialog>
  );
}

function Upload({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  async function submit() {
    setBusy(true);
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("consent", consent ? "yes" : "no");
    try {
      const res = await fetch("/api/hiring/candidates/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Upload failed");
      toast(`${j.added} candidate${j.added === 1 ? "" : "s"} added. Claude is reading the resumes now.`);
      setFiles([]);
      onDone();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Upload resumes" description="PDF resumes, or a CSV with columns like name, phone, email, telegram, district, availability, experience.">
      <div className="space-y-4">
        <input ref={ref} type="file" multiple accept=".pdf,.csv,application/pdf,text/csv" onChange={(e) => setFiles([...(e.target.files ?? [])])} className="block w-full text-[14px] file:mr-3 file:h-9 file:rounded-lg file:border file:border-line-strong file:bg-raised file:px-3 file:text-fg" />
        {files.length ? <p className="text-[13px] text-muted">{files.length} file{files.length === 1 ? "" : "s"} selected</p> : null}
        <label className="flex items-start gap-2.5 text-[14px]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          These people applied to us or agreed to be considered for jobs.
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} disabled={!files.length || !consent} onClick={submit}>Upload</Button>
        </div>
      </div>
    </Dialog>
  );
}
