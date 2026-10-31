// WhatsApp Business Platform (Cloud API). Graph API version is configurable (META_GRAPH_VERSION, default v26.0).
import type { ChannelAdapter } from ".";
import { env } from "@/lib/env";
import { whatsappCreds } from "./connections";
import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { ingest, respond } from "@/agent/pipeline";
import type { Attachment } from "@/db/schema";

const WINDOW_MS = 24 * 60 * 60 * 1000;

async function post(workspaceId: string, body: Record<string, unknown>): Promise<string> {
  const c = await whatsappCreds(workspaceId);
  if (!c) throw new Error("WhatsApp isn't connected for this business yet (Settings → Channels → WhatsApp).");
  const res = await fetch(`https://graph.facebook.com/${c.graphVersion}/${c.phoneNumberId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...body }),
  });
  const j = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };
  if (!res.ok) {
    const message = `WhatsApp send failed (${res.status}): ${j.error?.message ?? "unknown error"}${j.error?.code ? ` (#${j.error.code})` : ""}`;
    if (c.source === "workspace") await noteSend(workspaceId, message);
    throw new Error(message);
  }
  if (c.source === "workspace") await noteSend(workspaceId, null);
  return j.messages?.[0]?.id ?? "";
}

/** Keeps the last failed send on the channel row so Settings → Channels can say why replies aren't arriving. */
async function noteSend(workspaceId: string, error: string | null) {
  const where = and(eq(t.channels.workspaceId, workspaceId), eq(t.channels.type, "whatsapp"));
  const q = error
    ? db.update(t.channels).set({ config: sql`${t.channels.config} || ${JSON.stringify({ lastSendError: error, lastSendErrorAt: new Date().toISOString() })}::jsonb` }).where(where)
    : db.update(t.channels).set({ config: sql`${t.channels.config} - 'lastSendError' - 'lastSendErrorAt'` }).where(and(where, sql`${t.channels.config} ? 'lastSendError'`));
  await q.catch((e) => console.error("[whatsapp] couldn't record send status", e));
}

export const digits = (s: string) => s.replace(/\D/g, "");

export async function sendWhatsAppText(workspaceId: string, to: string, text: string) {
  return post(workspaceId, { to: digits(to), type: "text", text: { body: text.slice(0, 4096), preview_url: false } });
}

export async function sendWhatsAppButtons(workspaceId: string, to: string, body: string, buttons: { id: string; title: string }[]) {
  return post(workspaceId, {
    to: digits(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body.slice(0, 1024) },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id.slice(0, 256), title: b.title.slice(0, 20) } })) },
    },
  });
}

/** Approved templates only. Required outside the 24-hour window. */
export async function sendWhatsAppTemplate(workspaceId: string, to: string, name: string, lang: string, params: string[]) {
  return post(workspaceId, {
    to: digits(to),
    type: "template",
    template: { name, language: { code: lang }, components: params.length ? [{ type: "body", parameters: params.map((p) => ({ type: "text", text: p })) }] : [] },
  });
}

/**
 * "Typing…" in the customer's WhatsApp while the AI works. Meta ties it to the customer's message (which it also marks as
 * read, so the blue ticks appear) and clears it when the reply arrives, or after 25 seconds. A failure here never stops the reply.
 */
export async function sendWhatsAppTyping(workspaceId: string, messageId: string) {
  const c = await whatsappCreds(workspaceId);
  if (!c) return;
  const res = await fetch(`https://graph.facebook.com/${c.graphVersion}/${c.phoneNumberId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId, typing_indicator: { type: "text" } }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    console.warn(`[whatsapp] typing indicator refused (${res.status}): ${j.error?.message ?? "unknown error"}`);
  }
}

export const whatsappAdapter: ChannelAdapter = {
  async typing(thread, inbound) {
    if (inbound?.externalMessageId) await sendWhatsAppTyping(thread.workspaceId, inbound.externalMessageId);
  },
  async send(thread, text, extra) {
    const to = String(thread.routing.waId ?? "");
    if (!to) throw new Error("Thread has no WhatsApp number");
    const last = thread.lastInboundAt?.getTime() ?? 0;
    if (Date.now() - last > WINDOW_MS) {
      throw new Error("Outside WhatsApp's 24-hour customer service window: only approved templates can be sent now.");
    }
    if (extra?.buttons?.length) {
      const flat = extra.buttons.flat().slice(0, 3);
      return { externalMessageId: await sendWhatsAppButtons(thread.workspaceId, to, text, flat.map((b) => ({ id: b.data, title: b.text }))) };
    }
    return { externalMessageId: await sendWhatsAppText(thread.workspaceId, to, text) };
  },
};

type WaMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: { type: string; button_reply?: { id: string; title: string } };
  button?: { payload?: string; text?: string };
  image?: { id: string; mime_type?: string; caption?: string };
  document?: { id: string; filename?: string; mime_type?: string; caption?: string };
  audio?: { id: string; mime_type?: string };
};
type WaStatus = { id: string; status: "sent" | "delivered" | "read" | "failed" | string; timestamp?: string; errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[] };
type WaPayload = {
  object?: string;
  entry?: { id: string; changes?: { field: string; value: { metadata?: { phone_number_id?: string }; contacts?: { profile?: { name?: string }; wa_id: string }[]; messages?: WaMessage[]; statuses?: WaStatus[] } }[] }[];
};

/**
 * Meta's delivery receipts for messages we sent: delivered (on the customer's phone), read, or failed after it left us
 * (number not on WhatsApp, blocked, outside the 24-hour window). This is what tells "sent" apart from "customer got it".
 */
export async function applyWhatsAppStatuses(workspaceId: string, payload: WaPayload): Promise<number> {
  let n = 0;
  for (const entry of payload.entry ?? []) {
    for (const ch of entry.changes ?? []) {
      for (const st of ch.value?.statuses ?? []) {
        if (!st.id) continue;
        // Raw SQL params must be strings: the driver doesn't serialize Date objects here.
        const at = (st.timestamp ? new Date(Number(st.timestamp) * 1000) : new Date()).toISOString();
        const where = and(eq(t.messages.workspaceId, workspaceId), eq(t.messages.externalMessageId, st.id), eq(t.messages.direction, "out"));
        if (st.status === "delivered") await db.update(t.messages).set({ deliveredAt: sql`coalesce(${t.messages.deliveredAt}, ${at}::timestamptz)` }).where(where);
        else if (st.status === "read") await db.update(t.messages).set({ readAt: sql`coalesce(${t.messages.readAt}, ${at}::timestamptz)`, deliveredAt: sql`coalesce(${t.messages.deliveredAt}, ${at}::timestamptz)` }).where(where);
        else if (st.status === "failed") {
          const e = st.errors?.[0];
          const error = `WhatsApp couldn't deliver it${e?.code ? ` (#${e.code})` : ""}: ${e?.error_data?.details ?? e?.message ?? e?.title ?? "unknown reason"}`;
          await db.update(t.messages).set({ status: "failed", error: error.slice(0, 500) }).where(where);
        } else continue;
        n++;
      }
    }
  }
  return n;
}

export function normalizeWhatsApp(workspaceId: string, payload: WaPayload) {
  const out: { event: Parameters<typeof ingest>[0]; buttonId: string | null }[] = [];
  for (const entry of payload.entry ?? []) {
    for (const ch of entry.changes ?? []) {
      if (ch.field !== "messages") continue;
      const v = ch.value;
      for (const m of v.messages ?? []) {
        const contact = v.contacts?.find((c) => c.wa_id === m.from);
        const attachments: Attachment[] = [];
        if (m.image) attachments.push({ kind: "image", mime: m.image.mime_type, ref: m.image.id });
        if (m.document) attachments.push({ kind: "document", name: m.document.filename, mime: m.document.mime_type, ref: m.document.id });
        if (m.audio) attachments.push({ kind: "voice", mime: m.audio.mime_type, ref: m.audio.id });
        const buttonId = m.interactive?.button_reply?.id ?? m.button?.payload ?? null;
        const text = m.text?.body ?? m.interactive?.button_reply?.title ?? m.button?.text ?? m.image?.caption ?? m.document?.caption ?? "";
        out.push({
          buttonId,
          event: {
            workspaceId, channel: "whatsapp", externalThreadId: `wa:${m.from}`,
            customer: { externalId: m.from, displayName: contact?.profile?.name ?? null, phone: `+${m.from}` },
            text, attachments, receivedAt: new Date(Number(m.timestamp) * 1000), externalMessageId: m.id,
            routing: { waId: m.from, phoneNumberId: v.metadata?.phone_number_id ?? null },
          },
        });
      }
    }
  }
  return out;
}

/**
 * Starts "typing…" the moment a message arrives, in parallel with saving it, instead of after the reply pipeline has loaded
 * everything. Only when the AI is going to answer on its own: live, in autopilot and not taken over by a person.
 */
async function typingNow(workspaceId: string, externalThreadId: string, messageId: string | null | undefined) {
  if (!messageId) return;
  const [ws, ch, th] = await Promise.all([
    db.select({ settings: t.workspaces.settings }).from(t.workspaces).where(eq(t.workspaces.id, workspaceId)),
    db.select({ mode: t.channels.mode }).from(t.channels).where(and(eq(t.channels.workspaceId, workspaceId), eq(t.channels.type, "whatsapp"))),
    db.select({ paused: t.threads.aiPaused }).from(t.threads).where(and(eq(t.threads.workspaceId, workspaceId), eq(t.threads.channel, "whatsapp"), eq(t.threads.externalThreadId, externalThreadId))),
  ]);
  if (!ws[0]?.settings.live || (ch[0]?.mode ?? "autopilot") !== "autopilot" || th[0]?.paused) return;
  await sendWhatsAppTyping(workspaceId, messageId);
}

export async function handleWhatsAppJob(payload: Record<string, unknown>) {
  const workspaceId = String(payload.workspaceId);
  for (const { event } of normalizeWhatsApp(workspaceId, payload.body as WaPayload)) {
    void typingNow(workspaceId, event.externalThreadId, event.externalMessageId).catch(() => {});
    const r = await ingest(event);
    if (!r.duplicate) await respond(r.thread.id, r.messageId);
  }
}
