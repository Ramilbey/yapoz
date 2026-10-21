import type { WorkspaceSettings } from "@/db/schema";

export type Mode = "autopilot" | "copilot";
export type ChannelStatus = {
  telegram: {
    mode: Mode;
    sharedBot: string | null;
    customerLink: string | null;
    applyLink: string | null;
    ownBot: { username: string } | null;
    businessConnections: { id: string; canReply: boolean; isEnabled: boolean; updatedAt: string }[];
    connected: boolean;
  };
  whatsapp: { mode: Mode; connected: boolean; source: "workspace" | "env" | null; displayPhone: string | null; verifiedName: string | null; webhookUrl: string | null; verifyToken: string | null };
  instagram: { mode: Mode; connected: boolean; source: "workspace" | "env" | null; username: string | null; expiresAt: string | null; canConnect: boolean };
  simulator: { mode: Mode; connected: boolean };
};

export type SettingsData = {
  workspace: { id: string; name: string; city: string; timezone: string; currency: string; settings: WorkspaceSettings };
  channels: ChannelStatus;
  ai: { configured: boolean; fast: string; smart: string };
  google: { configured: boolean; connected: boolean };
  demoMode: boolean;
  appUrl: string;
};

export type Patch = (url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown, msg?: string) => Promise<unknown>;
