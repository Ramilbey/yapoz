import { getSession } from "@/lib/auth";
import { subscribe } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Server-sent events fed by Postgres LISTEN/NOTIFY. EventSource reconnects on its own. */
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return new Response("unauthorized", { status: 401 });
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          cleanup();
        }
      };
      send(`retry: 2000\ndata: ${JSON.stringify({ t: "hello" })}\n\n`);
      const unsub = subscribe(s.workspaceId, (e) => send(`data: ${JSON.stringify(e)}\n\n`));
      const hb = setInterval(() => send(`: ping\n\n`), 20_000);
      // Close before the platform's max duration; the browser reconnects.
      const ttl = setTimeout(() => cleanup(), 270_000);
      cleanup = () => {
        clearInterval(hb);
        clearTimeout(ttl);
        unsub();
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", () => cleanup());
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" } });
}
