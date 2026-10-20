"use client";
import useSWR from "swr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { getJson, send } from "@/components/app/fetcher";
import { useLive } from "@/components/app/live";
import { useToast } from "@/components/app/toast";

type Req = { id: string; title: string };
type M = { id: string; fullName: string; score: number | null; stage: string; district: string | null; outreach: { status: string } | null };

const STAGES = [
  { key: "sourced", label: "Sourced" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "invited", label: "Invited" },
  { key: "scheduled", label: "Interview booked" },
  { key: "interviewed", label: "Interviewed" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
];

export default function Pipeline() {
  const toast = useToast();
  const { data: reqs } = useSWR<{ requisitions: Req[] }>("/api/hiring/requisitions", getJson);
  const [reqId, setReqId] = useState<string | null>(null);
  useEffect(() => {
    if (!reqId && reqs?.requisitions[0]) setReqId(reqs.requisitions[0].id);
  }, [reqs, reqId]);
  const { data, mutate } = useSWR<{ matches: M[] }>(reqId ? `/api/hiring/requisitions/${reqId}` : null, getJson);
  useLive(["matches", "outreach", "interviews"], () => mutate(), 300);

  async function move(m: M, stage: string) {
    try {
      const r = await send<{ outreach?: unknown }>(`/api/hiring/matches/${m.id}`, "POST", { action: "stage", stage });
      if (r.outreach) toast(`Rejection for ${m.fullName.split(" ")[0]} drafted. It waits in Approvals.`);
      await mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Where every candidate stands. Moving someone to Rejected drafts a polite message for approval; it never sends on its own."
        actions={
          <select value={reqId ?? ""} onChange={(e) => setReqId(e.target.value)} className="h-10 rounded-[10px] border border-line bg-raised px-3 text-[14px]" aria-label="Role">
            {(reqs?.requisitions ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        }
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
        <div className="grid min-w-[1180px] grid-cols-7 gap-3">
          {STAGES.map((s) => {
            const list = (data?.matches ?? []).filter((m) => m.stage === s.key).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
            return (
              <section key={s.key} className="min-h-[360px] rounded-2xl border border-line bg-panel p-2.5">
                <header className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-[14px] font-medium">{s.label}</h2>
                  <span className="num text-[12px] text-muted">{list.length}</span>
                </header>
                <ul className="space-y-2">
                  {list.slice(0, s.key === "sourced" ? 12 : 50).map((m) => (
                    <li key={m.id} className="rounded-xl border border-line bg-raised p-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13px] font-medium">{m.fullName}</span>
                        {m.score != null ? <span className="num text-[12px] text-brass-ink">{m.score}</span> : null}
                      </div>
                      <div className="text-[11px] text-muted">{m.district ?? ""}{m.outreach?.status === "draft" ? ", draft waiting" : ""}</div>
                      <select value={m.stage} onChange={(e) => move(m, e.target.value)} className="mt-2 h-7 w-full rounded-md border border-line bg-bg px-1.5 text-[12px]" aria-label={`Move ${m.fullName}`}>
                        {STAGES.map((x) => (
                          <option key={x.key} value={x.key}>{x.key === m.stage ? x.label : `Move to ${x.label}`}</option>
                        ))}
                      </select>
                    </li>
                  ))}
                  {s.key === "sourced" && list.length > 12 ? <li className="px-1 text-[12px] text-muted">and {list.length - 12} more. <Link href={reqId ? `/app/hiring/${reqId}` : "/app/hiring"} className="underline">Rank them</Link></li> : null}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
