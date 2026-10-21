# Integrations: versions and assumptions

Checked against the official docs on 20–21 Oct 2026. These APIs change often; re-check before demo day.

Every business connects its own accounts (Settings → Channels). `src/channels/connections.ts` resolves a business's
credentials (encrypted on its `channels` row) and maps incoming webhooks to the right business. The env credentials
below are only used by the shared Telegram bot, Jawab's Instagram app, and as a fallback for the demo workspace.

## Telegram Bot API (via grammY 1.46, types for Bot API 10.x)

- Docs: https://core.telegram.org/bots/api (Recent changes showed **Bot API 10.3, 24 Aug 2026**).
- Webhook: `setWebhook(url, { secret_token })`. Telegram sends the secret in the
  `X-Telegram-Bot-Api-Secret-Token` header; `/api/webhooks/telegram` rejects anything else with 401.
  The route enqueues the update and returns 200 at once (Telegram retries non-2xx responses).
- `allowed_updates` is set explicitly in `scripts/telegram-set-webhook.ts` and `scripts/telegram-poll.ts`:
  `message, edited_message, channel_post, callback_query, my_chat_member, business_connection, business_message, edited_business_message, deleted_business_messages`.
- **Shared bot vs own bot.** The shared Jawab bot (`TELEGRAM_BOT_TOKEN`) serves every business: a customer opening
  `t.me/<bot>?start=<WORKSPACE>` is bound to that business (`telegram_chat_bindings`); `?start=apply_<WORKSPACE>` starts
  a job application; an unbound chat is pointed to the business's link or sign-up. A business can instead paste its own
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
- Bots can only DM people who started them, so candidates apply with `/apply` in the bot and invites are sent there.
  `/delete_my_data` deletes the candidate, documents, matches and interviews.
- Candidate sources: channel posts and group messages **only** from chats where the bot was made admin
  (captured from `my_chat_member`) or listed in `TELEGRAM_HR_CHANNEL_ID`. Nothing else is read.
- Files: `getFile` then `https://api.telegram.org/file/bot<token>/<file_path>` (we cap PDFs at 15 MB).

## WhatsApp Business Platform (Cloud API)

- Docs: https://developers.facebook.com/docs/whatsapp/cloud-api (examples use **Graph API v26.0**; set `META_GRAPH_VERSION`).
- Send: `POST https://graph.facebook.com/{version}/{phone_number_id}/messages` with
  `{ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body, preview_url } }`.
  Text body ≤ 4096 chars.
- Reply buttons: `type: "interactive", interactive: { type: "button", body: { text }, action: { buttons: [{ type: "reply", reply: { id, title } }] } }`,
  max **3** buttons, title ≤ **20** chars, id ≤ 256. Taps arrive as `messages[].interactive.button_reply.{id,title}`.
  Interview slots use ids `slot:<outreachId>:<index>`.
- **Connecting a business (what's built):** the owner pastes the Phone number ID, a System User access token
  (`whatsapp_business_messaging`, `whatsapp_business_management`), their app secret and optionally the WABA ID from
  their own Meta app. We check them with `GET /{version}/{phone_number_id}?fields=display_phone_number,verified_name`,
  call `POST /{waba_id}/subscribed_apps` when a WABA ID is given, store everything encrypted, and show a per-business
  callback URL `/api/webhooks/whatsapp/<channelId>` plus a generated verify token to paste into the app's webhook
  settings (field `messages`).
- **Not built yet: Embedded Signup.** One-click onboarding needs Jawab's own Meta app to be an approved Tech Provider
  (business verification + App Review). The platform route `/api/webhooks/whatsapp` already routes by
  `metadata.phone_number_id`, so numbers onboarded that way will land in the right business.
- Webhook: `GET` verification with `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`; `POST` bodies are verified with
  `X-Hub-Signature-256 = "sha256=" + HMAC_SHA256(raw body, app secret)` before parsing (the business's own app secret on
  its per-channel URL, `META_APP_SECRET` on the platform URL).
- **24-hour customer-service window:** free-form messages only within 24 h of the customer's last message (we check
  `threads.last_inbound_at`). Outside it, only approved templates. Create two templates in WhatsApp Manager:
  Each business creates them in its own WhatsApp Manager, with its own name in the text:
  - `interview_invite` (Utility, English), body: `Hi {{1}}, thanks for applying to <Business>. We'd like to invite you to an interview. Reply to this message and we'll send you some times.`
    The candidate's reply opens the window; Jawab then sends the three times as reply buttons.
  - `booking_reminder` (Utility, English), body: `Hi {{1}}, a reminder of your booking at <Business> on {{2}} for {{3}}. Reply here if anything changes.`
    (Helper `sendWhatsAppTemplate` exists; reminders aren't scheduled automatically yet.)
- **Policy (per the brief):** since 15 Jan 2026 Meta doesn't allow general-purpose AI assistants on the Business API;
  AI that serves the business's own support, bookings and sales is allowed. The agent is locked to the business's
  topics and declines everything else in one line ("Business-scoped by design"). Confirm the current wording in Meta's
  WhatsApp Business Solution Terms before going live.
- **WhatsApp groups are not a candidate source.** The Cloud API doesn't expose group messages to read, and we wouldn't
  scrape them anyway.
- Development: use Meta's test phone number and add teammates as test recipients.

## Instagram (Instagram API with Instagram Login)

- Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
  (host **graph.instagram.com**, examples use **v26.0**; set `INSTAGRAM_GRAPH_VERSION`).
- Permissions: `instagram_business_basic`, `instagram_business_manage_messages`, and for comment replies
  `instagram_business_manage_comments`. App in development mode with tester accounts (no App Review for the demo).
- **Connecting a business (Instagram Login on Jawab's app, `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`):**
  `https://www.instagram.com/oauth/authorize?client_id&redirect_uri={APP_URL}/api/channels/instagram/callback&response_type=code&scope=…&state=<signed>`
  → `POST https://api.instagram.com/oauth/access_token` (short-lived token) → `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token`
  (long-lived, about 60 days) → `GET /{version}/me?fields=user_id,username` (the `user_id` is the professional account id
  that webhooks use as `entry.id`) → `POST /{version}/me/subscribed_apps?subscribed_fields=messages,comments`.
  The daily sweep refreshes tokens with `GET /refresh_access_token?grant_type=ig_refresh_token` once they're 24 h old
  and within 20 days of expiry. Add the redirect URI in the app's Instagram Login settings.
- Webhooks for every business arrive at `/api/webhooks/instagram` and are routed by `entry.id`.
- DM: `POST https://graph.instagram.com/{version}/{IG_ID}/messages` with `{ recipient: { id: IGSID }, message: { text } }`.
  Text ≤ 1000 bytes (we trim). Only after the user messages first; window is 24 h.
- **Comment → private reply:** `{ recipient: { comment_id }, message: { text } }`, within **7 days** of the comment,
  **one** message per comment; a follow-up is allowed only if the person replies (then it's a normal DM within 24 h).
  Implemented by giving each comment its own thread (`igc:<comment_id>`): the first answer goes out as the private reply.
- Webhook fields: `messages` and `comments`, same `X-Hub-Signature-256` check (app secret: `INSTAGRAM_APP_SECRET`).
- Payloads: the webhook examples page shows comments as
  `entry[].changes[] { field: "comments", value: { id, text, from: { id, username }, media: { id, media_product_type } } }`
  with `entry.id` = the app user's professional account id; some versions send the comment id as `comment_id`, so we
  accept either. DMs: `entry[].messaging[] { sender.id, recipient.id, timestamp, message: { mid, text, is_echo } }`.
  Check one real payload from the app dashboard's test button before demo day.

## Claude (Anthropic API)

- Models from env: `CLAUDE_FAST_MODEL=claude-haiku-5-5` (classification, routine replies, resume parsing),
  `CLAUDE_SMART_MODEL=claude-sonnet-5-5` (long or multi-question messages, criteria extraction, ranking, outreach drafts).
- Prompt caching: two `cache_control: { type: "ephemeral" }` breakpoints, on the rules block and on the knowledge block
  (order: tools → rules → knowledge, then the uncached context block with the date and calendar). Minimum cacheable
  length for Haiku 5.5 / Sonnet 5.5 is 512 tokens. Cache reads/writes are logged per message in `agent_runs`.
- The SDK client gets `baseURL` explicitly (`https://api.anthropic.com` unless `JAWAB_ANTHROPIC_BASE_URL` is set) so a
  stray `ANTHROPIC_BASE_URL` in a shell never reroutes traffic.

## Google Calendar (optional)

- OAuth 2.0 web client; redirect URI `{APP_URL}/api/integrations/google/callback`; scopes
  `calendar.events` and `calendar.freebusy`; `access_type=offline` so we get a refresh token (stored AES-256-GCM encrypted).
- Free/busy: `POST https://www.googleapis.com/calendar/v3/freeBusy`. Events: `POST .../calendars/primary/events?conferenceDataVersion=1`
  with `conferenceData.createRequest` (`hangoutsMeet`) for video interviews.
- Without Google credentials the built-in calendar is used and video interviews get a Jitsi Meet link (free, no account).
- Zoom Server-to-Server OAuth is not implemented (it was optional).
