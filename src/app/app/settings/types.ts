import type { AppointmentSettings, WorkspaceSettings } from "@/db/schema";

export type Mode = "autopilot" | "copilot";
export type ChannelStatus = {
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
    /** Yapoz's Meta app is set up on the server, so a number can be connected. */
    available: boolean;
    embedded: { appId: string; configId: string; graphVersion: string } | null;
    registerIssue: string | null;
    source: "workspace" | "env" | null;
    displayPhone: string | null;
    verifiedName: string | null;
    wabaId: string | null;
    tokenExpiresAt: string | null;
    tokenChecked: boolean;
    wabaChecked: boolean;
    lastWebhookAt: string | null;
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
