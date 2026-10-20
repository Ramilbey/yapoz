// WhatsApp Business Platform (Cloud API). Graph API version is configurable (META_GRAPH_VERSION, default v26.0).
import type { ChannelAdapter } from ".";
import { env } from "@/lib/env";
import { db, t } from "@/db";
import { and, eq, desc } from "drizzle-orm";
import { ingest, respond } from "@/agent/pipeline";
import type { Attachment } from "@/db/schema";

const WINDOW_MS = 24 * 60 * 60 * 1000;

function base() {
  const w = env.whatsapp;
  if (!w.token || !w.phoneNumberId) throw new Error("WhatsApp is not configured (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID)");
  return `https://graph.facebook.com/${w.graphVersion}/${w.phoneNumberId}/messages`;
}

async function post(body: Record<string, unknown>): Promise<string> {
  const res = await fetch(base(), {
    method: "POST",
    headers: { authorization: `Bearer ${env.whatsapp.token}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...body }),
  });
  const j = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };
  if (!res.ok) throw new Error(`WhatsApp send failed (${res.status}): ${j.error?.message ?? "unknown error"}`);
  return j.messages?.[0]?.id ?? "";
}

export const digits = (s: string) => s.replace(/\D/g, "");

export async function sendWhatsAppText(to: string, text: string) {
  return post({ to: digits(to), type: "text", text: { body: text.slice(0, 4096), preview_url: false } });
}

export async function sendWhatsAppButtons(to: string, body: string, buttons: { id: string; title: string }[]) {
  return post({
    to: digits(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body.slice(0, 1024) },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id.slice(0, 256), title: b.title.slice(0, 20) } })) },
    },
  });
}

/** Approved templates only (interview_invite, booking_reminder). Required outside the 24-hour window. */
export async function sendWhatsAppTemplate(to: string, name: string, lang: string, params: string[]) {
  return post({
    to: digits(to),
    type: "template",
    template: { name, language: { code: lang }, components: params.length ? [{ type: "body", parameters: params.map((p) => ({ type: "text", text: p })) }] : [] },
  });
}

export const whatsappAdapter: ChannelAdapter = {
  async send(thread, text, extra) {
    const to = String(thread.routing.waId ?? "");
    if (!to) throw new Error("Thread has no WhatsApp number");
    const last = thread.lastInboundAt?.getTime() ?? 0;
    if (Date.now() - last > WINDOW_MS) {
      throw new Error("Outside WhatsApp's 24-hour customer service window: only approved templates can be sent now.");
    }
    if (extra?.buttons?.length) {
      const flat = extra.buttons.flat().slice(0, 3);
      return { externalMessageId: await sendWhatsAppButtons(to, text, flat.map((b) => ({ id: b.data, title: b.text }))) };
    }
    return { externalMessageId: await sendWhatsAppText(to, text) };
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
type WaPayload = {
  object?: string;
  entry?: { id: string; changes?: { field: string; value: { metadata?: { phone_number_id?: string }; contacts?: { profile?: { name?: string }; wa_id: string }[]; messages?: WaMessage[] } }[] }[];
};

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

export async function handleWhatsAppJob(payload: Record<string, unknown>) {
  const workspaceId = String(payload.workspaceId);
  for (const { event, buttonId } of normalizeWhatsApp(workspaceId, payload.body as WaPayload)) {
    // Interview slot buttons go to the scheduler, not the inbox agent.
    if (buttonId?.startsWith("slot:")) {
      const [, outreachId, idx] = buttonId.split(":");
      const { pickSlot } = await import("@/hiring/schedule");
      const r = await pickSlot(workspaceId, outreachId, Number(idx), event.customer.externalId);
      if (!r.ok) await sendWhatsAppText(event.customer.externalId, r.toast).catch(() => {});
      continue;
    }
    // A candidate replying to the interview_invite template: their reply opens the window, so offer the times.
    const [cand] = await db.select().from(t.candidates).where(and(eq(t.candidates.workspaceId, workspaceId), eq(t.candidates.phone, `+${event.customer.externalId}`)));
    if (cand) {
      const [o] = await db
        .select()
        .from(t.outreach)
        .where(and(eq(t.outreach.candidateId, cand.id), eq(t.outreach.kind, "invite"), eq(t.outreach.status, "sent"), eq(t.outreach.channel, "whatsapp")))
        .orderBy(desc(t.outreach.createdAt))
        .limit(1);
      const [booked] = o ? await db.select({ id: t.interviews.id }).from(t.interviews).where(eq(t.interviews.outreachId, o.id)) : [];
      if (o && !booked) {
        const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, workspaceId));
        const { slotLabel } = await import("@/hiring/schedule");
        await sendWhatsAppButtons(event.customer.externalId, "Thanks! Please pick an interview time:", o.slots.slice(0, 3).map((s, i) => ({ id: `slot:${o.id}:${i}`, title: slotLabel(ws, s).slice(0, 20) })));
        continue;
      }
    }
    const r = await ingest(event);
    if (!r.duplicate) await respond(r.thread.id, r.messageId);
  }
}
