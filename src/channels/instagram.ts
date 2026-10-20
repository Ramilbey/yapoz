// Instagram API with Instagram Login (graph.instagram.com). Reply-only:
// a DM opens a 24-hour window; a comment allows one private reply within 7 days.
import type { ChannelAdapter } from ".";
import { env } from "@/lib/env";
import { ingest, respond } from "@/agent/pipeline";
import type { Attachment } from "@/db/schema";
import { db, t } from "@/db";
import { eq } from "drizzle-orm";

const DM_WINDOW_MS = 24 * 60 * 60 * 1000;
const COMMENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function send(recipient: Record<string, string>, text: string) {
  const ig = env.instagram;
  if (!ig.token || !ig.accountId) throw new Error("Instagram is not configured (INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID)");
  // Instagram caps DM text at 1000 bytes.
  let body = text;
  while (Buffer.byteLength(body, "utf8") > 1000) body = body.slice(0, -10);
  const res = await fetch(`https://graph.instagram.com/${ig.graphVersion}/${ig.accountId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${ig.token}`, "content-type": "application/json" },
    body: JSON.stringify({ recipient, message: { text: body } }),
  });
  const j = (await res.json().catch(() => ({}))) as { message_id?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(`Instagram send failed (${res.status}): ${j.error?.message ?? "unknown error"}`);
  return j.message_id ?? "";
}

export const instagramAdapter: ChannelAdapter = {
  async send(thread, text) {
    const r = thread.routing;
    // First answer to a comment goes out as the single allowed private reply.
    if (r.commentId && !r.privateReplySent) {
      const commentAt = Number(r.commentAt ?? 0);
      if (commentAt && Date.now() - commentAt > COMMENT_WINDOW_MS) throw new Error("Comment is older than 7 days: private reply window closed.");
      const id = await send({ comment_id: String(r.commentId) }, text);
      await db
        .update(t.threads)
        .set({ routing: { ...r, privateReplySent: 1 } })
        .where(eq(t.threads.id, thread.id));
      return { externalMessageId: id };
    }
    if (!r.igsid) throw new Error("Thread has no Instagram recipient");
    const last = thread.lastInboundAt?.getTime() ?? 0;
    if (Date.now() - last > DM_WINDOW_MS) throw new Error("Outside Instagram's 24-hour messaging window.");
    return { externalMessageId: await send({ id: String(r.igsid) }, text) };
  },
};

type IgPayload = {
  object?: string;
  entry?: {
    id: string;
    time?: number;
    messaging?: { sender: { id: string }; recipient: { id: string }; timestamp: number; message?: { mid: string; text?: string; is_echo?: boolean; attachments?: { type: string; payload?: { url?: string } }[] } }[];
    changes?: { field: string; value: { id: string; text?: string; from?: { id: string; username?: string }; media?: { id: string } } }[];
  }[];
};

export function normalizeInstagram(workspaceId: string, payload: IgPayload) {
  const out: Parameters<typeof ingest>[0][] = [];
  for (const entry of payload.entry ?? []) {
    for (const m of entry.messaging ?? []) {
      if (!m.message || m.message.is_echo) continue; // our own outgoing messages echo back
      if (m.sender.id === entry.id) continue;
      const attachments: Attachment[] = (m.message.attachments ?? []).map((a) => ({ kind: a.type === "image" ? "image" : a.type === "audio" ? "voice" : "other", ref: a.payload?.url }));
      out.push({
        workspaceId, channel: "instagram", externalThreadId: `ig:${m.sender.id}`,
        customer: { externalId: m.sender.id },
        text: m.message.text ?? "", attachments, receivedAt: new Date(m.timestamp), externalMessageId: m.message.mid,
        routing: { igsid: m.sender.id },
      });
    }
    for (const c of entry.changes ?? []) {
      if (c.field !== "comments" || !c.value.from || c.value.from.id === entry.id) continue;
      out.push({
        workspaceId, channel: "instagram", externalThreadId: `igc:${c.value.id}`,
        customer: { externalId: c.value.from.id, username: c.value.from.username ?? null, displayName: c.value.from.username ? `@${c.value.from.username}` : null },
        text: c.value.text ?? "", attachments: [], receivedAt: new Date((entry.time ?? Date.now() / 1000) * (entry.time && entry.time < 1e12 ? 1000 : 1)), externalMessageId: c.value.id,
        routing: { commentId: c.value.id, mediaId: c.value.media?.id ?? null, commentAt: Date.now(), source: "comment" },
      });
    }
  }
  return out;
}

export async function handleInstagramJob(payload: Record<string, unknown>) {
  const workspaceId = String(payload.workspaceId);
  for (const e of normalizeInstagram(workspaceId, payload.body as IgPayload)) {
    const r = await ingest(e);
    if (!r.duplicate) await respond(r.thread.id, r.messageId);
  }
}
