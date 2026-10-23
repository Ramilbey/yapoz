"use client";
import { useEffect, useRef, useState } from "react";
import { cx } from "../ui/cx";

/** Where each scene of the film starts (seconds). Keep in step with film/lines.json. */
export const FILM_CHAPTERS = [
  { at: 0, t: "11:48 pm" },
  { at: 8, t: "The cost of waiting" },
  { at: 16, t: "Meet Yapoz" },
  { at: 25, t: "Teach it once" },
  { at: 33, t: "It answers" },
  { at: 43, t: "Orders wait for you" },
  { at: 50, t: "It knows when to stop" },
  { at: 57, t: "Open your desk" },
];
const DURATION = 60;

const stamp = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const Icon = ({ d, label }: { d: string; label?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden={!label} role={label ? "img" : undefined} aria-label={label}>
    <path d={d} />
  </svg>
);

/** The 60-second film with a player built to be navigated: big play button, chaptered timeline, chapter chips, captions toggle. */
export function FilmPlayer({ className }: { className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cc, setCc] = useState(true);
  const [duration, setDuration] = useState(DURATION);

  const chapterIndex = FILM_CHAPTERS.reduce((a, c, i) => (time >= c.at ? i : a), 0);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const sync = () => {
      for (const tr of Array.from(v.textTracks)) tr.mode = cc ? "showing" : "hidden";
    };
    sync();
    v.textTracks.addEventListener?.("addtrack", sync);
    return () => v.textTracks.removeEventListener?.("addtrack", sync);
  }, [cc]);

  function seek(to: number, andPlay = true) {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration - 0.05, to));
    setTime(v.currentTime);
    if (andPlay) {
      setStarted(true);
      void v.play().catch(() => {});
    }
  }
  function toggle() {
    const v = video.current;
    if (!v) return;
    setStarted(true);
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }
  function fullscreen() {
    const el = frame.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }
  function onTimeline(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * duration, started || playing);
  }

  return (
    <div className={cx("flex flex-col gap-5", className)}>
      <div ref={frame} className="group relative aspect-video overflow-hidden rounded-[inherit] bg-yp-panel">
        <video
          ref={video}
          className="absolute inset-0 h-full w-full bg-yp-ink object-cover"
          src="/film/yapoz-60s.mp4"
          poster="/film/yapoz-60s.jpg"
          preload="metadata"
          playsInline
          muted={muted}
          onPlay={() => {
            setPlaying(true);
            setStarted(true);
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || DURATION)}
          onClick={toggle}
          aria-label="Yapoz in 60 seconds"
        >
          <track kind="captions" src="/film/yapoz-60s.en.vtt" srcLang="en" label="English" default />
        </video>

        {!started ? (
          <button onClick={toggle} className="absolute inset-0 grid place-items-center bg-yp-ink/20 text-yp-frost transition hover:bg-yp-ink/5" aria-label="Play the film, 60 seconds, captions on">
            <span className="relative grid h-[84px] w-[84px] place-items-center rounded-full bg-yp-mint text-yp-ink shadow-[0_0_0_10px_rgba(44,245,187,0.18),0_30px_80px_rgba(0,0,0,0.6)] transition group-hover:scale-105 sm:h-[104px] sm:w-[104px]">
              <svg width="30" height="30" viewBox="0 0 28 28" aria-hidden>
                <path d="M9 5 L23 14 L9 23 Z" fill="currentColor" />
              </svg>
            </span>
            <span className="yp-mono absolute bottom-24 right-5 hidden rounded-md bg-yp-ink/70 px-2 py-1 text-[11px] uppercase text-yp-fog sm:block">1:00 · captions on</span>
          </button>
        ) : null}

        <div className={cx("absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-yp-ink/90 via-yp-ink/50 to-transparent px-3 pb-3 pt-10 transition-opacity sm:px-5", started ? "opacity-100" : "opacity-0 focus-within:opacity-100")}>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Timeline"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${stamp(time)} of ${stamp(duration)}, chapter: ${FILM_CHAPTERS[chapterIndex].t}`}
            onPointerDown={onTimeline}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") seek(time + 5, playing);
              if (e.key === "ArrowLeft") seek(time - 5, playing);
              if (e.key === "Home") seek(0, playing);
              if (e.key === "End") seek(duration - 1, playing);
            }}
            className="relative flex h-6 cursor-pointer items-center"
          >
            <div className="relative h-1 w-full rounded-full bg-yp-frost/25">
              <div className="absolute inset-y-0 left-0 rounded-full bg-yp-mint" style={{ width: `${(time / duration) * 100}%` }} />
              {FILM_CHAPTERS.slice(1).map((c) => (
                <span key={c.at} className="absolute -top-1 h-3 w-[3px] rounded-full bg-yp-ink" style={{ left: `${(c.at / duration) * 100}%` }} aria-hidden />
              ))}
              <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yp-frost shadow" style={{ left: `${(time / duration) * 100}%` }} aria-hidden />
            </div>
          </div>
          <div className="flex items-center gap-1 text-yp-frost sm:gap-2">
            <button onClick={toggle} className="grid h-10 w-10 place-items-center rounded-full hover:bg-yp-frost/15" aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Icon d="M6.5 4v12M13.5 4v12" /> : <Icon d="M6 3.8v12.4L16 10z" />}
            </button>
            <span className="yp-mono text-[12px] text-yp-fog">
              {stamp(time)} / {stamp(duration)}
            </span>
            <span className="hidden min-w-0 flex-1 truncate pl-3 text-[13px] text-yp-fog sm:block">{FILM_CHAPTERS[chapterIndex].t}</span>
            <span className="flex-1 sm:hidden" />
            <button onClick={() => setCc((v) => !v)} aria-pressed={cc} className={cx("yp-mono grid h-9 min-w-9 place-items-center rounded-md px-1.5 text-[11px] hover:bg-yp-frost/15", cc ? "text-yp-mint" : "text-yp-fog")} aria-label="Captions">
              CC
            </button>
            <button onClick={() => setMuted((v) => !v)} aria-pressed={muted} className="grid h-10 w-10 place-items-center rounded-full hover:bg-yp-frost/15" aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <Icon d="M3 7.5h3l4-3.5v12l-4-3.5H3zM13 7.5l4 5M17 7.5l-4 5" /> : <Icon d="M3 7.5h3l4-3.5v12l-4-3.5H3zM13 7a4 4 0 0 1 0 6M15.5 4.8a7.2 7.2 0 0 1 0 10.4" />}
            </button>
            <button onClick={fullscreen} className="grid h-10 w-10 place-items-center rounded-full hover:bg-yp-frost/15" aria-label="Full screen">
              <Icon d="M3.5 7V3.5H7M13 3.5h3.5V7M16.5 13v3.5H13M7 16.5H3.5V13" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <button onClick={() => seek(FILM_CHAPTERS[Math.max(0, chapterIndex - 1)].at)} className="hidden w-11 shrink-0 place-items-center rounded-2xl border border-yp-line2 text-yp-fog transition hover:border-yp-ice hover:text-yp-frost sm:grid" aria-label="Previous chapter">
          <Icon d="M12 4l-6 6 6 6" />
        </button>
        <ol className="yp-no-scrollbar -mx-4 flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILM_CHAPTERS.map((c, i) => (
            <li key={c.at} className="snap-start">
              <button onClick={() => seek(c.at)} aria-current={i === chapterIndex ? "true" : undefined} className={cx("flex h-full min-w-[132px] flex-col gap-1 rounded-2xl border px-3.5 py-2.5 text-left transition", i === chapterIndex ? "border-yp-mint bg-yp-mint/10" : "border-yp-line2 hover:border-yp-ice")}>
                <span className={cx("yp-mono text-[11px]", i === chapterIndex ? "text-yp-mint" : "text-yp-smoke")}>{stamp(c.at)}</span>
                <span className="text-[13.5px] leading-tight text-yp-frost">{c.t}</span>
              </button>
            </li>
          ))}
        </ol>
        <button onClick={() => seek(FILM_CHAPTERS[Math.min(FILM_CHAPTERS.length - 1, chapterIndex + 1)].at)} className="hidden w-11 shrink-0 place-items-center rounded-2xl border border-yp-line2 text-yp-fog transition hover:border-yp-ice hover:text-yp-frost sm:grid" aria-label="Next chapter">
          <Icon d="M8 4l6 6-6 6" />
        </button>
      </div>
    </div>
  );
}
