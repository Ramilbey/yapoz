import type { AppointmentSettings, WorkspaceSettings } from "@/db/schema";

export type Mode = "autopilot" | "copilot";
export type ChannelStatus = {
  /** The business's own Meta app, for a manually connected WhatsApp number. The secret never leaves the server. */
  metaApp: { connected: boolean; appId: string | null; appName: string | null; source: "workspace" | "env" | null };
  telegram: {
    mode: Mode;
    sharedBot: string | null;
    customerLink: string | null;
    ownBot: { username: string } | null;
    businessConnections: { id: string; canReply: boolean; isEnabled: boolean; updatedAt: string }[];
    connected: boolean;
  };
  whatsapp: {
    mode: Mode;
    connected: boolean;
    method: "embedded" | "manual" | "env" | null;
    embedded: { appId: string; configId: string; graphVersion: string } | null;
    registerIssue: string | null;
    source: "workspace" | "env" | null;
    displayPhone: string | null;
    verifiedName: string | null;
    webhookUrl: string | null;
    verifyToken: string | null;
    wabaId: string | null;
    tokenExpiresAt: string | null;
    tokenChecked: boolean;
    wabaChecked: boolean;
    needsMetaApp: boolean;
    lastWebhookAt: string | null;
    lastWebhookIssue: "signature" | null;
    lastWebhookTest: boolean;
    lastSendError: { at: string; message: string } | null;
  };
  simulator: { mode: Mode; connected: boolean };
};

export type SettingsData = {
  workspace: { id: string; name: string; city: string; timezone: string; currency: string; settings: WorkspaceSettings };
  channels: ChannelStatus;
  ai: { providers: { name: string; vision: boolean }[]; recent: { model: string; n: number; failed: number }[] };
  appointments: AppointmentSettings;
  demoMode: boolean;
  appUrl: string;
};

export type Patch = (url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown, msg?: string) => Promise<unknown>;
