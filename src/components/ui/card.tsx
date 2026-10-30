import { cx } from "./cx";

/** A bordered panel. `hot` fills it with the accent (the one tile that needs a person). */
export function Card({
  as: Tag = "section",
  hot,
  className,
  ...p
}: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "aside"; hot?: boolean }) {
  return <Tag className={cx("panel p-6", hot && "panel-hot", className)} {...p} />;
}

/** Title block for a Card: display heading, a muted sub line, and an optional trailing slot (a Chip or a link). */
export function CardHeader({ title, sub, aside, className }: { title: string; sub?: string; aside?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("mb-4 flex items-start justify-between gap-3", className)}>
      <div>
        <h2 className="font-display text-[20px] font-bold leading-tight">{title}</h2>
        {sub ? <p className="text-[13px] text-muted">{sub}</p> : null}
      </div>
      {aside}
    </div>
  );
}
