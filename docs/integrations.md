# Integrations: versions and assumptions

Checked against the official docs on 20–21 Oct 2026. These APIs change often; re-check before demo day.

Every business connects its own accounts (Settings → Channels). `src/channels/connections.ts` resolves a business's
credentials (encrypted on its `channels` row) and maps incoming webhooks to the right business. The env credentials
below are only used by the shared Telegram bot, Jawab's own Meta app, and as a fallback for the demo workspace.

## Telegram Bot API (via grammY 1.46, types for Bot API 10.x)

- Docs: https://core.telegram.org/bots/api (Recent changes showed **Bot API 10.3, 24 Aug 2026**).
- Webhook: `setWebhook(url, { secret_token })`. Telegram sends the secret in the
  `X-Telegram-Bot-Api-Secret-Token` header; `/api/webhooks/telegram` rejects anything else with 401.
  The route enqueues the update and returns 200 at once (Telegram retries non-2xx responses).
- `allowed_updates` is set explicitly in `scripts/telegram-set-webhook.ts` and `scripts/telegram-poll.ts`:
  `message, edited_message, channel_post, callback_query, my_chat_member, business_connection, business_message, edited_business_message, deleted_business_messages`.
- **Shared bot vs own bot.** The shared Jawab bot (`TELEGRAM_BOT_TOKEN`) serves every business: a customer opening
  `t.me/<bot>?start=<WORKSPACE>` is bound to that business (`telegram_chat_bindings`); an unbound chat is pointed to the
  business's link or sign-up. A business can instead paste its own
  @BotFather token: we `getMe`, store `{token, secret}` encrypted and `setWebhook` to `/api/webhooks/telegram/<channelId>`
  with that bot's own `secret_token`. Everything an own bot receives belongs to that business.
- **Mode A (bot chats):** private `message` updates → `chat:<bot>:<chat_id>` threads.
- **Mode B (Telegram Business):**
  - Proving ownership on the shared bot: the owner taps "Link my Telegram" (a one-time `link_<code>`, 15 minutes).
    `/start link_<code>` ties their Telegram user id to the business; a business connection from that user (before or
    after the link) is assigned to it. Connections from unknown users wait unassigned.
  - `business_connection` → `BusinessConnection { id, user, user_chat_id, date, rights?: BusinessBotRights, is_enabled }`.
    Rights are an object now (not the old `can_reply` boolean on the connection); we store `rights.can_reply`.
  - `BusinessBotRights.can_reply` is documented as "can send and edit messages in the private chats that had incoming
    messages in the last 24 hours": that is the 24-hour recent-chat limit. If the right is missing, messages are still
    logged in the inbox but the agent doesn't reply.
  - `business_message` → `biz:<connection_id>:<chat_id>` threads. Replies use `sendMessage(..., { business_connection_id })`
    so they appear from the shop's own account.
  - Messages with `sender_business_bot` set, or whose `from.id` equals the connection owner, are ignored (the owner typing
    themselves, or our own messages echoed back).
- Files: `getFile` then `https://api.telegram.org/file/bot<token>/<file_path>` (we cap PDFs at 15 MB).

## WhatsApp Business Platform (Cloud API)

- Docs: https://developers.facebook.com/docs/whatsapp/cloud-api (examples use **Graph API v26.0**; set `META_GRAPH_VERSION`).
- Send: `POST https://graph.facebook.com/{version}/{phone_number_id}/messages` with
  `{ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body, preview_url } }`.
  Text body ≤ 4096 chars.
- Reply buttons: `type: "interactive", interactive: { type: "button", body: { text }, action: { buttons: [{ type: "reply", reply: { id, title } }] } }`,
  max **3** buttons, title ≤ **20** chars, id ≤ 256. Taps arrive as `messages[].interactive.button_reply.{id,title}`.
- **Connecting a business, option 1: Connect with Facebook (Embedded Signup).** The business clicks "Connect with Facebook"
  in Settings → Channels and completes Meta's Embedded Signup flow. It runs on Jawab's own Meta app (`META_APP_ID`,
  `META_APP_SECRET`) with the Login configuration in `META_EMBEDDED_SIGNUP_CONFIG_ID`. Numbers connected this way arrive at
  `/api/webhooks/whatsapp`, which routes each event by `metadata.phone_number_id` to the right business. Jawab also reads
  delivery status callbacks, so the app's webhook must subscribe to the `messages` field.
  Setup for the platform owner (once):
  1. At developers.facebook.com, create a Meta app of type Business.
  2. Add the WhatsApp product and Facebook Login for Business.
  3. Create a Login configuration for WhatsApp Embedded Signup, and copy its Configuration ID into
     `META_EMBEDDED_SIGNUP_CONFIG_ID`.
  4. Put the app's App ID and App secret into `META_APP_ID` and `META_APP_SECRET`.
  5. In the app's webhook settings, set the callback URL to `<APP_URL>/api/webhooks/whatsapp` with the verify token
     (`WHATSAPP_VERIFY_TOKEN`), and subscribe to `messages`.
- **Connecting a business, option 2: manual credentials.** The business enters its own credentials in Settings → Channels.
  Two steps, because the Meta app and the WhatsApp number are saved separately.
  1. *Meta app*: App ID + App secret. Checked with `GET /{app_id}?fields=name` using the app access token `{app_id}|{app_secret}`
     (Meta rejects a wrong pair); saved in `integrations` (provider `meta_app`), the secret encrypted.
  2. *WhatsApp number*: Phone number ID, WhatsApp Business Account ID, access token. Checked with
     `GET /debug_token?input_token=…` (valid, `app_id` equals the saved App ID, scopes include `whatsapp_business_messaging` and
     `whatsapp_business_management`, `expires_at` shown to the owner), `GET /{waba_id}/phone_numbers` (the Phone number ID
     must be on that account) and `POST /{waba_id}/subscribed_apps`. Only then is the token saved (encrypted).
     Meta's own **test numbers** sit on an account no System User can be assigned to: the token can read the number
     (`GET /{phone_number_id}`) but not the account. Then the number alone is confirmed, the account is flagged as not
     confirmed in Settings, and no subscription is attempted (Meta's app-level webhook delivers). A number that isn't on an
     account the token *can* see is still refused.
  We then show a per-business callback URL `/api/webhooks/whatsapp/<channelId>` plus a verify token to paste into the app's
  webhook settings (field `messages`). The verify token is generated on the first connect and then kept: reconnecting, or
  disconnecting and connecting again, reuses it, so Meta's webhook settings never go stale. While disconnected the handshake
  still passes but deliveries are ignored (answered 200 so Meta doesn't keep retrying). Env fallbacks for the demo workspace: `META_APP_ID`, `META_APP_SECRET`,
  `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_TOKEN`.
- Webhook: `GET` verification with `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`; `POST` bodies are verified with
  `X-Hub-Signature-256 = "sha256=" + HMAC_SHA256(raw body, app secret)` before parsing (the business's saved Meta app secret
  on its per-channel URL, falling back to the secret stored with an older connection; `META_APP_SECRET` on the platform URL).
- **24-hour customer-service window:** free-form messages only within 24 h of the customer's last message (we check
  `threads.last_inbound_at`). Outside it, only approved templates (helper `sendWhatsAppTemplate`); a staff message that
  can't be sent shows as "Customer NOT told" on the order, with the reason and a Retry.
- **Delivery receipts:** Meta's `statuses` callbacks (delivered, read, failed) update the message, so the Orders page can
  tell "sent" from "on the customer's phone" and show failures that happen after sending.
- **Policy (per the brief):** since 15 Jan 2026 Meta doesn't allow general-purpose AI assistants on the Business API;
  AI that serves the business's own support, orders and sales is allowed. The agent is locked to the business's
  topics and declines everything else in one line ("Business-scoped by design"). Confirm the current wording in Meta's
  WhatsApp Business Solution Terms before going live.
- Development: use Meta's test phone number and add teammates as test recipients.

## Claude (Anthropic API)

- Models from env: `CLAUDE_FAST_MODEL=claude-haiku-5-5` (classification, routine replies),
  `CLAUDE_SMART_MODEL=claude-sonnet-5-5` (long or multi-question messages, receipts, setup drafts).
- Prompt caching: two `cache_control: { type: "ephemeral" }` breakpoints, on the rules block and on the knowledge block
  (order: tools → rules → knowledge, then the uncached context block with the date and calendar). Minimum cacheable
  length for Haiku 5.5 / Sonnet 5.5 is 512 tokens. Cache reads/writes are logged per message in `agent_runs`.
- The SDK client gets `baseURL` explicitly (`https://api.anthropic.com` unless `JAWAB_ANTHROPIC_BASE_URL` is set) so a
  stray `ANTHROPIC_BASE_URL` in a shell never reroutes traffic.
