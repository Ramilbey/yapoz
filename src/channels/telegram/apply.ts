// /apply: candidates apply through the bot, which is also how invites can reach them later
// (bots can only message people who started them).
import type { Message, CallbackQuery } from "grammy/types";
import { db, t } from "@/db";
import { and, eq } from "drizzle-orm";
import { tg, downloadTelegramFile } from "./api";
import { addCandidate } from "@/hiring/ingest";
import { extractPdfText } from "@/hiring/pdf";

type ApplyData = {
  name?: string;
  role?: string;
  experience?: string;
  availability?: string;
  district?: string;
  cv?: { fileId: string; filename: string } | null;
  username?: string | null;
};

const STEPS = ["name", "role", "experience", "availability", "district", "cv", "consent"] as const;
type Step = (typeof STEPS)[number];

async function session(workspaceId: string, chatId: string) {
  const [s] = await db.select().from(t.botSessions).where(and(eq(t.botSessions.workspaceId, workspaceId), eq(t.botSessions.channel, "telegram"), eq(t.botSessions.chatId, chatId)));
  return s;
}

async function save(workspaceId: string, chatId: string, step: Step, data: ApplyData) {
  await db
    .insert(t.botSessions)
    .values({ workspaceId, channel: "telegram", chatId, flow: "apply", step, data })
    .onConflictDoUpdate({ target: [t.botSessions.workspaceId, t.botSessions.channel, t.botSessions.chatId], set: { flow: "apply", step, data, updatedAt: new Date() } });
}

async function ask(chatId: number, step: Step, workspaceId: string) {
  const api = tg();
  switch (step) {
    case "name":
      return api.sendMessage(chatId, "Great, let's get your application in. It takes 2 minutes; send /cancel to stop.\n\nWhat's your full name?");
    case "role": {
      const reqs = await db.select({ id: t.requisitions.id, title: t.requisitions.title }).from(t.requisitions).where(and(eq(t.requisitions.workspaceId, workspaceId), eq(t.requisitions.status, "open")));
      return api.sendMessage(chatId, "Which role are you applying for?", {
        reply_markup: { inline_keyboard: [...reqs.map((r) => [{ text: r.title, callback_data: `apply:role:${r.title.slice(0, 40)}` }]), [{ text: "Something else", callback_data: "apply:role:Other" }]] },
      });
    }
    case "experience":
      return api.sendMessage(chatId, "Tell me about your kitchen experience: where you worked, what you did and for how long.\n(e.g. “4 years on a wood-fired oven at Casa Fumo, dough and service”)");
    case "availability":
      return api.sendMessage(chatId, "When can you work? (e.g. evenings, weekends, full-time, mornings)");
    case "district":
      return api.sendMessage(chatId, "Which area do you live in? (e.g. Brickfields, Cheras, PJ)");
    case "cv":
      return api.sendMessage(chatId, "Send your CV as a PDF if you have one, or type “skip”.");
    case "consent":
      return api.sendMessage(chatId, "Last step. We'll store your details and CV to consider you for jobs at Forno Sette, for up to 180 days. You can delete them any time with /delete_my_data. Do you agree?", {
        reply_markup: { inline_keyboard: [[{ text: "I agree", callback_data: "apply:consent:yes" }, { text: "No thanks", callback_data: "apply:consent:no" }]] },
      });
  }
}

export async function startApply(workspaceId: string, m: Message) {
  await save(workspaceId, String(m.chat.id), "name", { username: m.from?.username ?? null });
  await ask(m.chat.id, "name", workspaceId);
}

function next(step: Step): Step {
  return STEPS[STEPS.indexOf(step) + 1] ?? "consent";
}

/** Returns true if the update belonged to an active /apply flow. */
export async function handleApplyFlow(workspaceId: string, m: Message | null, q?: CallbackQuery): Promise<boolean> {
  const chat = m?.chat.id ?? (q?.message?.chat.id as number | undefined);
  if (chat === undefined) return false;
  const chatId = String(chat);
  const s = await session(workspaceId, chatId);
  if (!s || s.flow !== "apply") return false;
  const data = s.data as ApplyData;
  const step = s.step as Step;
  const text = (m?.text ?? m?.caption ?? "").trim();
  const cb = q?.data ?? "";

  switch (step) {
    case "name":
      if (!text) return true;
      data.name = text.slice(0, 80);
      break;
    case "role":
      if (cb.startsWith("apply:role:")) data.role = cb.slice("apply:role:".length);
      else if (text) data.role = text.slice(0, 80);
      else return true;
      break;
    case "experience":
      if (!text) return true;
      data.experience = text.slice(0, 2000);
      break;
    case "availability":
      if (!text) return true;
      data.availability = text.slice(0, 200);
      break;
    case "district":
      if (!text) return true;
      data.district = text.slice(0, 80);
      break;
    case "cv":
      if (m?.document) {
        const isPdf = m.document.mime_type === "application/pdf" || m.document.file_name?.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
          await tg().sendMessage(chat, "Please send the CV as a PDF, or type “skip”.");
          return true;
        }
        data.cv = { fileId: m.document.file_id, filename: m.document.file_name ?? "cv.pdf" };
      } else if (/^skip$/i.test(text)) data.cv = null;
      else {
        await tg().sendMessage(chat, "Send a PDF, or type “skip”.");
        return true;
      }
      break;
    case "consent": {
      if (!cb.startsWith("apply:consent:")) {
        await tg().sendMessage(chat, "Please tap “I agree” or “No thanks” above.");
        return true;
      }
      await db.delete(t.botSessions).where(eq(t.botSessions.id, s.id));
      if (cb.endsWith(":no")) {
        await tg().sendMessage(chat, "No problem, nothing was saved. Send /apply any time.");
        return true;
      }
      let doc: { filename: string; mime: string; bytes: Buffer; text: string } | undefined;
      if (data.cv) {
        const { bytes } = await downloadTelegramFile(data.cv.fileId);
        doc = { filename: data.cv.filename, mime: "application/pdf", bytes, text: await extractPdfText(bytes) };
      }
      const raw = [
        `Name: ${data.name}`,
        `Applying for: ${data.role}`,
        `Experience: ${data.experience}`,
        `Availability: ${data.availability}`,
        `Lives in: ${data.district}`,
        data.username ? `Telegram: @${data.username}` : "",
        doc?.text ? `\nCV:\n${doc.text}` : "",
      ].filter(Boolean).join("\n");
      await addCandidate({
        workspaceId, fullName: data.name ?? "Applicant", source: "bot_apply", sourceRef: "Telegram /apply",
        telegramChatId: chatId, telegramUsername: data.username ?? null, rawText: raw, doc, consent: true, roleInterest: data.role ?? null,
        district: data.district ?? null,
      });
      await tg().sendMessage(chat, `Thanks ${data.name?.split(" ")[0] ?? ""}! Your application is in. If it's a match, our team will invite you to an interview right here in this chat.`);
      return true;
    }
  }
  const n = next(step);
  await save(workspaceId, chatId, n, data);
  await ask(chat, n, workspaceId);
  return true;
}

export async function deleteMyData(workspaceId: string, m: Message) {
  const chatId = String(m.chat.id);
  const deleted = await db
    .delete(t.candidates)
    .where(and(eq(t.candidates.workspaceId, workspaceId), eq(t.candidates.telegramChatId, chatId)))
    .returning({ id: t.candidates.id });
  await db.delete(t.botSessions).where(and(eq(t.botSessions.workspaceId, workspaceId), eq(t.botSessions.chatId, chatId)));
  await db.insert(t.events).values({ workspaceId, type: "candidate.deleted_on_request", props: { count: deleted.length } });
  await tg().sendMessage(m.chat.id, deleted.length ? "Done. Your application, CV and interview details have been deleted." : "We don't have any application data for this chat.");
}
