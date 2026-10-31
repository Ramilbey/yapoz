// PDPA notice: the first reply the assistant sends in a chat tells the customer what happens to what they write.
import { env } from "@/lib/env";

export const privacyNotice = () =>
  `I'm an automated assistant. This shop keeps your messages and order details to handle your request, and an AI service reads them to reply. Ask the shop to see or delete your data. More: ${env.appUrl}/privacy`;

/** First assistant reply in a chat gets the notice on its own line; later replies and drafts are untouched. */
export function withPrivacyNotice(text: string, firstReply: boolean) {
  return firstReply ? `${text}\n\n${privacyNotice()}` : text;
}
