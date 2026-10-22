// Central access to configuration. Secrets never leave the server.
export const env = {
  get appUrl() {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
    if (process.env.VERCEL) return "https://yapoz.vercel.app";
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
    const s = process.env.AUTH_SECRET;
    if (!s || s.length < 32) return "default-fallback-secret-for-build-and-demo-32chars";
    return s;
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
  get telegramHrChannelId() {
    return process.env.TELEGRAM_HR_CHANNEL_ID ?? "";
  },
  get whatsapp() {
    return {
      token: process.env.WHATSAPP_TOKEN ?? "",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
      appSecret: process.env.META_APP_SECRET ?? "",
      graphVersion: process.env.META_GRAPH_VERSION ?? "v26.0",
    };
  },
  get instagram() {
    return {
      /** Jawab's own Meta app with the "Instagram API with Instagram Login" product: businesses connect through it. */
      appId: process.env.INSTAGRAM_APP_ID ?? "",
      token: process.env.INSTAGRAM_ACCESS_TOKEN ?? "",
      accountId: process.env.INSTAGRAM_ACCOUNT_ID ?? "",
      appSecret: process.env.INSTAGRAM_APP_SECRET ?? process.env.META_APP_SECRET ?? "",
      verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN ?? "",
      graphVersion: process.env.INSTAGRAM_GRAPH_VERSION ?? "v26.0",
    };
  },
  get google() {
    return { clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" };
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
};
