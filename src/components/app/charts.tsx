"use client";
import { useMemo, useRef, useState } from "react";
import { cx } from "../ui/cx";

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

type Tip = { x: number; y: number; lines: React.ReactNode[] } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-raised px-3 py-2 text-[12px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      {tip.lines.map((l, i) => (
        <div key={i} className={i === 0 ? "mb-0.5 font-medium text-fg" : "text-fg-2"}>
          {l}
        </div>
      ))}
    </div>
  );
}

/** Single-series columns (e.g. messages per hour). Brass marks, recessive axes, hover tooltip. */
export function Columns({ values, labels, height = 180, format = (v: number) => String(v), tipLabel }: { values: number[]; labels: string[]; height?: number; format?: (v: number) => string; tipLabel: (i: number) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip>(null);
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...values));
  const ticks = [0, max / 2, max];
  const padL = 30;
  const padB = 22;
  const w = 1000;
  const slot = (w - padL) / values.length;
  const bw = Math.min(24, slot * 0.62);
  const h = height;
  const y = (v: number) => (h - padB) * (1 - v / max);
  return (
    <div ref={ref} className="relative" onMouseLeave={() => (setTip(null), setHover(null))}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block h-[180px] w-full" role="img" aria-label="Column chart">
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={padL} x2={w} y1={y(tk)} y2={y(tk)} stroke="var(--line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {values.map((v, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          const top = y(v);
          const bh = h - padB - top;
          const r = Math.min(4, bh);
          return (
            <g key={i}>
              {v > 0 ? (
                <path
                  d={`M${x},${h - padB} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${h - padB} Z`}
                  fill="var(--brass-mark)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              ) : null}
              <rect
                x={padL + i * slot}
                y={0}
                width={slot}
                height={h - padB}
                fill="transparent"
                onMouseMove={(e) => {
                  const box = ref.current!.getBoundingClientRect();
                  setHover(i);
                  setTip({ x: e.clientX - box.left, y: (top / h) * box.height, lines: [tipLabel(i), format(v)] });
                }}
              />
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0">
        {ticks.map((tk) => (
          <span key={tk} className="num absolute left-0 -translate-y-1/2 text-[11px] text-muted" style={{ top: `${(y(tk) / h) * 100}%` }}>
            {tk}
          </span>
        ))}
        {labels.map((l, i) =>
          l ? (
            <span key={i} className="num absolute bottom-0 -translate-x-1/2 text-[11px] text-muted" style={{ left: `${((padL + i * slot + slot / 2) / w) * 100}%` }}>
              {l}
            </span>
          ) : null,
        )}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

export type StackSeries = { key: string; label: string; color: string };

/** Stacked columns for polarity (sentiment): two poles + neutral midpoint, 2px surface gaps, legend + table. */
export function StackedColumns({ rows, series, labelOf, height = 200 }: { rows: Record<string, number | string>[]; series: StackSeries[]; labelOf: (r: Record<string, number | string>) => string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip>(null);
  const [table, setTable] = useState(false);
  const totals = rows.map((r) => series.reduce((s, k) => s + Number(r[k.key] ?? 0), 0));
  const max = niceMax(Math.max(1, ...totals));
  const w = 1000;
  const padB = 22;
  const padL = 30;
  const h = height;
  const slot = (w - padL) / rows.length;
  const bw = Math.min(24 * 2.2, slot * 0.5);
  const y = (v: number) => (h - padB) * (1 - v / max);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-[12px] text-fg-2">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
              {s.label}
            </span>
          ))}
        </div>
        <button onClick={() => setTable((v) => !v)} className="text-[12px] text-muted underline-offset-2 hover:text-fg hover:underline">
          {table ? "Show chart" : "Show table"}
        </button>
      </div>
      {table ? (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-1.5 font-normal">Day</th>
              {series.map((s) => (
                <th key={s.key} className="py-1.5 text-right font-normal">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5">{labelOf(r)}</td>
                {series.map((s) => (
                  <td key={s.key} className="num py-1.5 text-right">{Number(r[s.key] ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div ref={ref} className="relative" onMouseLeave={() => setTip(null)}>
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block w-full" style={{ height }} role="img" aria-label="Stacked column chart">
            {[0, max / 2, max].map((tk) => (
              <line key={tk} x1={padL} x2={w} y1={y(tk)} y2={y(tk)} stroke="var(--line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {rows.map((r, i) => {
              const x = padL + i * slot + (slot - bw) / 2;
              let acc = 0;
              const segs = series.map((s) => {
                const v = Number(r[s.key] ?? 0);
                const y0 = y(acc);
                acc += v;
                const y1 = y(acc);
                return { s, v, y0, y1 };
              });
              const topIdx = segs.map((sg) => sg.v > 0).lastIndexOf(true);
              return (
                <g key={i}>
                  {segs.map((sg, j) => {
                    if (sg.v <= 0) return null;
                    const gap = j > 0 ? 2 : 0;
                    const top = sg.y1;
                    const bottom = sg.y0 - gap;
                    if (bottom - top <= 0) return null;
                    const r4 = j === topIdx ? Math.min(4, bottom - top) : 0;
                    return (
                      <path
                        key={sg.s.key}
                        d={`M${x},${bottom} V${top + r4} Q${x},${top} ${x + r4},${top} H${x + bw - r4} Q${x + bw},${top} ${x + bw},${top + r4} V${bottom} Z`}
                        fill={sg.s.color}
                      />
                    );
                  })}
                  <rect
                    x={padL + i * slot}
                    y={0}
                    width={slot}
                    height={h - padB}
                    fill="transparent"
                    onMouseMove={(e) => {
                      const box = ref.current!.getBoundingClientRect();
                      setTip({ x: e.clientX - box.left, y: (y(totals[i]) / h) * box.height, lines: [labelOf(r), ...series.map((s) => `${s.label}: ${Number(r[s.key] ?? 0)}`)] });
                    }}
                  />
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0">
            {[0, max / 2, max].map((tk) => (
              <span key={tk} className="num absolute left-0 -translate-y-1/2 text-[11px] text-muted" style={{ top: `${(y(tk) / h) * 100}%` }}>
                {tk}
              </span>
            ))}
            {rows.map((r, i) => (
              <span key={i} className="absolute bottom-0 -translate-x-1/2 text-[11px] text-muted" style={{ left: `${((padL + i * slot + slot / 2) / w) * 100}%` }}>
                {labelOf(r)}
              </span>
            ))}
          </div>
          <Tooltip tip={tip} />
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars, value at the tip. Single hue: identity comes from the row label. */
export function BarList({ items, total, format = (n: number) => String(n), empty }: { items: { label: React.ReactNode; value: number; note?: React.ReactNode }[]; total?: number; format?: (n: number) => string; empty: React.ReactNode }) {
  const max = useMemo(() => Math.max(1, ...items.map((i) => i.value)), [items]);
  if (!items.length) return <p className="text-[14px] text-muted">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-fg">{it.label}</span>
            <span className="num shrink-0 text-fg-2">
              {format(it.value)}
              {total ? <span className="text-muted"> · {Math.round((it.value / total) * 100)}%</span> : null}
              {it.note ? <span className="ml-2 text-muted">{it.note}</span> : null}
            </span>
          </div>
          <div className="h-2 w-full">
            <div className={cx("h-2 rounded-r-[4px] transition-[width] duration-500")} style={{ width: `${Math.max(2, (it.value / max) * 100)}%`, background: "var(--brass-mark)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
