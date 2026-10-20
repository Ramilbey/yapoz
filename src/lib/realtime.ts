import { listenClient } from "@/db";

export type LiveEvent = { t: string; op: string; id: string | null; thread: string | null; demo: boolean };

type Sub = (e: LiveEvent) => void;
const g = globalThis as unknown as { __live?: Map<string, { subs: Set<Sub>; ready: Promise<{ unlisten: () => Promise<void> }> }> };
const channels = (g.__live ??= new Map());

/** Subscribe to a workspace's change feed (Postgres LISTEN/NOTIFY). One LISTEN per channel per process. */
export function subscribe(workspaceId: string, fn: Sub): () => void {
  const name = `ws_${workspaceId.toLowerCase()}`;
  let entry = channels.get(name);
  if (!entry) {
    const subs = new Set<Sub>();
    const ready = listenClient().listen(name, (payload) => {
      let e: LiveEvent;
      try {
        e = JSON.parse(payload);
      } catch {
        return;
      }
      for (const s of subs) s(e);
    });
    entry = { subs, ready };
    channels.set(name, entry);
  }
  entry.subs.add(fn);
  return () => {
    entry!.subs.delete(fn);
  };
}
