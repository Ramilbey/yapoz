// Central access to configuration. Secrets never leave the server.
import { authSecret } from "./session";

export const env = {
  get appUrl() {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
    // Vercel sets this on every deployment (previews too), so webhooks always point at production.
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    return "http://localhost:3000";
  },
  get demoMode() {
    return (process.env.DEMO_MODE ?? "true") === "true";
  },
  get demoWorkspaceId() {
    return process.env.DEMO_WORKSPACE_ID ?? "FORNO7";
  },
  get fastModel() {
    return process.env.CLAUDE_FAST_MODEL ?? "claude-haiku-5-5";
  },
  get smartModel() {
    return process.env.CLAUDE_SMART_MODEL ?? "claude-sonnet-5-5";
  },
  get hasAnthropic() {
    return Boolean(
      (process.env.KRACKEDDEVS_API_KEY && process.env.KRACKEDDEVS_FAST_MODEL) ||
      process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OLLAMA_BASE_URL ||
      process.env.USE_OLLAMA === "true" ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY
    );
  },
  get authSecret() {
    return authSecret();
  },
  get telegramToken() {
    return process.env.TELEGRAM_BOT_TOKEN ?? "";
  },
  get telegramWebhookSecret() {
    return process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  },
  get telegramBotUsername() {
    return process.env.TELEGRAM_BOT_USERNAME ?? "";
  },
  /** Yapoz's own Meta app: Embedded Signup runs through it, and the demo workspace falls back to its number. Businesses can also save their own app in Settings → Channels. */
  get whatsapp() {
    return {
      /** Meta app ID: META_APP_ID. */
      appId: process.env.META_APP_ID ?? "",
      /** Meta app secret: META_APP_SECRET. */
      appSecret: process.env.META_APP_SECRET ?? "",
      /** Phone number ID: WHATSAPP_PHONE_NUMBER_ID. */
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
      /** WhatsApp Business Account ID: WHATSAPP_BUSINESS_ACCOUNT_ID. */
      wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "",
      /** Access token: WHATSAPP_TOKEN. */
      token: process.env.WHATSAPP_TOKEN ?? "",
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
      graphVersion: process.env.META_GRAPH_VERSION ?? "v26.0",
      /** Facebook Login for Business configuration for WhatsApp Embedded Signup: META_EMBEDDED_SIGNUP_CONFIG_ID. */
      embeddedConfigId: process.env.META_EMBEDDED_SIGNUP_CONFIG_ID ?? "",
    };
  },
  /** Cloudflare Turnstile, the human check on sign-up. */
  get turnstile() {
    return { siteKey: process.env.TURNSTILE_SITE_KEY ?? "", secretKey: process.env.TURNSTILE_SECRET_KEY ?? "" };
  },
  /** Keys for phone and desktop notifications. Generate a pair with: npx web-push generate-vapid-keys */
  get push() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY ?? "", privateKey: process.env.VAPID_PRIVATE_KEY ?? "", subject: process.env.VAPID_SUBJECT || "mailto:hello@yapoz.live" };
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
};
