"use client";
import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { CopyField } from "@/components/ui/copy";
import { cx } from "@/components/ui/cx";
import type { ChannelStatus, Mode, Patch } from "./types";

function ModeToggle({ type, mode, patch }: { type: string; mode: Mode; patch: Patch }) {
  return (
    <div className="flex shrink-0 rounded-lg border border-line p-0.5" role="radiogroup" aria-label={`${type} mode`}>
      {(["autopilot", "copilot"] as const).map((m) => (
        <button
          key={m}
          role="radio"
          aria-checked={mode === m}
          onClick={() => patch("/api/settings", "PATCH", { channelModes: { [type]: m } }, `${type[0].toUpperCase()}${type.slice(1)} set to ${m}.`)}
          className={cx("h-8 rounded-md px-3 text-[13px] capitalize", mode === m ? "bg-fg text-bg" : "text-fg-2 hover:text-fg")}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function Card({ title, status, mode, type, patch, children }: { title: string; status: React.ReactNode; mode: Mode; type: string; patch: Patch; children: React.ReactNode }) {
  return (
    <li className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[17px] font-semibold">{title}</h3>
          {status}
        </div>
        <ModeToggle type={type} mode={mode} patch={patch} />
      </div>
      <div className="mt-3">{children}</div>
    </li>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-2 space-y-1.5 text-[13.5px] text-fg-2">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="num mt-[1px] text-[12px] text-brass-ink">{i + 1}</span>
          <span>{x}</span>
        </li>
      ))}
    </ol>
  );
}

const linkBtn = "text-[13px] text-muted underline-offset-4 hover:text-fg hover:underline";

function Telegram({ s, patch, workspaceId }: { s: ChannelStatus["telegram"]; patch: Patch; workspaceId: string }) {
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const active = s.businessConnections.filter((c) => c.isEnabled);
  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    try {
      await fn();
    } catch {
      // patch() already showed the error
    } finally {
      setBusy(null);
    }
  }
  return (
    <Card
      title="Telegram"
      type="telegram"
      mode={s.mode}
      patch={patch}
      status={
        s.ownBot ? <Chip tone="answered">@{s.ownBot.username}</Chip> : active.length ? <Chip tone="answered">Business account linked</Chip> : s.sharedBot ? <Chip tone="brass">Customer link ready</Chip> : <Chip>Not connected</Chip>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-[14px] font-medium">Reply from your own Telegram account</p>
          <p className="mt-0.5 text-[13px] text-muted">Needs Telegram Business (part of Telegram Premium). Customers message you as usual and Yapoz answers for you.</p>
          {s.sharedBot ? (
            <>
              <Steps
                items={[
                  <>Tap below, open the link on the phone with your business Telegram, and press Start.</>,
                  <>
                    In Telegram: Settings → Telegram Business → Chatbots → add <span className="num">@{s.sharedBot}</span>.
                  </>,
                  <>Allow it to reply to messages. The connection shows up here.</>,
                ]}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button size="sm" variant="brass" loading={busy === "link"} onClick={() => run("link", async () => setLink((await patch("/api/channels/telegram/link", "POST")) as { url: string; expiresAt: string }))}>
                  Link my Telegram
                </Button>
                {link ? (
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-[13px] font-medium underline decoration-brass underline-offset-4">
                    Open in Telegram (valid 15 min)
                  </a>
                ) : null}
              </div>
              {link ? <CopyField className="mt-2" value={link.url} label="Telegram link" /> : null}
            </>
          ) : (
            <p className="mt-2 text-[13px] text-muted">The shared Yapoz bot isn&apos;t set up on this server. Connect your own bot instead.</p>
          )}
          {s.businessConnections.length ? (
            <ul className="mt-3 space-y-1.5">
              {s.businessConnections.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="num text-fg-2">{b.id.slice(0, 10)}…</span>
                  {b.isEnabled ? <Chip tone="answered">Active</Chip> : <Chip>Turned off in Telegram</Chip>}
                  {b.canReply ? null : <Chip tone="signal">Allow “Reply to messages”</Chip>}
                  <button className={linkBtn} onClick={() => patch(`/api/channels/telegram?connection=${encodeURIComponent(b.id)}`, "DELETE", undefined, "Telegram Business unlinked.")}>
                    Unlink
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-6">
          {s.customerLink ? (
            <div>
              <p className="text-[14px] font-medium">Your customer link</p>
              <p className="mt-0.5 text-[13px] text-muted">Put it in your social bios, on the menu, or print the QR for the counter. Anyone who opens it chats with your assistant.</p>
              <div className="mt-2 flex items-center gap-3">
                <CopyField className="flex-1" value={s.customerLink} label="Customer link" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.ownBot ? `/api/qr?bot=${s.ownBot.username}&theme=light` : `/api/qr?start=${workspaceId}&theme=light`}
                  alt="QR code for your customer link"
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-md border border-line bg-paper p-1"
                />
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-[14px] font-medium">{s.ownBot ? "Your own bot" : "Or use your own bot"}</p>
            {s.ownBot ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px]">
                <span>
                  Everything sent to <span className="num">@{s.ownBot.username}</span> is answered for this business.
                </span>
                <button className={linkBtn} onClick={() => window.confirm(`Disconnect @${s.ownBot!.username}? It stops answering.`) && patch("/api/channels/telegram", "DELETE", undefined, "Bot disconnected.")}>
                  Disconnect
                </button>
              </div>
            ) : (
              <form
                className="mt-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run("bot", async () => {
                    await patch("/api/channels/telegram", "POST", { token }, "Bot connected.");
                    setToken("");
                  });
                }}
              >
                <p className="text-[13px] text-muted">Create one with @BotFather (/newbot) and paste its token. Your customers will see your bot&apos;s name and photo.</p>
                <div className="mt-2 flex gap-2">
                  <Input value={token} onChange={(e) => setToken(e.target.value.trim())} placeholder="123456789:AA…" aria-label="Bot token" autoComplete="off" spellCheck={false} className="font-mono text-[13px]" />
                  <Button type="submit" loading={busy === "bot"} disabled={token.length < 20}>
                    Connect
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Meta's usual send errors, in the owner's terms. */
function sendHint(message: string) {
  if (/131030|allowed list/i.test(message)) return "Meta's test number only messages numbers on its list: WhatsApp → API Setup → To → Manage phone number list.";
  if (/access token|session has expired|OAuthException|#190/i.test(message)) return "The access token was rejected or expired. Use a permanent System User token, then disconnect and connect again.";
  if (/131047|24 hours|re-engagement/i.test(message)) return "More than 24 hours since the customer last wrote: only approved templates can be sent.";
  return null;
}

/** Where the Meta → Yapoz → customer chain breaks, from what the webhook and sender recorded. */
function WhatsAppHealth({ s }: { s: ChannelStatus["whatsapp"] }) {
  const err = s.lastSendError;
  return (
    <div className="space-y-1.5 pt-1 text-[13px]">
      {!s.lastWebhookAt ? (
        <>
          <p className="text-fg-2">Nothing has arrived from Meta yet. If you&apos;ve sent a message and nothing shows here:</p>
          <Steps
            items={[
              <>Message your number from a phone. If it&apos;s Meta&apos;s test number, the phone has to be on its list (WhatsApp → API Setup → To).</>,
              <>Still nothing: ask whoever runs Yapoz to check that the Meta app&apos;s webhook is subscribed to <span className="num">messages</span> and that the app is live.</>,
            ]}
          />
        </>
      ) : (
        <p className="text-fg-2">Last message from WhatsApp: {when(s.lastWebhookAt)}.</p>
      )}
      {err ? (
        <p className="text-signal-ink">
          Last reply failed on {when(err.at)}: {err.message}
          {sendHint(err.message) ? <span className="block text-fg-2">{sendHint(err.message)}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

const soon = (iso: string) => new Date(iso).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

function WhatsApp({ s, patch }: { s: ChannelStatus["whatsapp"]; patch: Patch }) {
  const [how, setHow] = useState<"embedded" | "manual">(s.embedded ? "embedded" : "manual");
  return (
    <Card title="WhatsApp" type="whatsapp" mode={s.mode} patch={patch} status={s.connected ? <Chip tone="answered">{s.displayPhone ?? "Connected"}</Chip> : <Chip>Not connected</Chip>}>
      {s.connected ? (
        <WhatsAppConnected s={s} patch={patch} />
      ) : (
        <div className="max-w-[760px]">
          <div className="flex rounded-lg border border-line p-0.5 text-[13px]" role="tablist" aria-label="How to connect WhatsApp">
            {(
              [
                ["embedded", "Connect with Facebook"],
                ["manual", "Enter credentials manually"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={how === k} onClick={() => setHow(k)} className={cx("h-8 flex-1 rounded-md px-3", how === k ? "bg-fg text-bg" : "text-fg-2 hover:text-fg")}>
                {label}
                {k === "embedded" ? <span className="ml-1.5 opacity-70">(recommended)</span> : null}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {how === "embedded" ? (
              <EmbeddedSignup cfg={s.embedded} patch={patch} />
            ) : (
              <ManualNumber available={s.available} patch={patch} />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

type FbLoginResponse = { authResponse?: { code?: string } | null };
type FbSdk = { init: (o: Record<string, unknown>) => void; login: (cb: (r: FbLoginResponse) => void, o: Record<string, unknown>) => void };
declare global {
  interface Window {
    FB?: FbSdk;
    fbAsyncInit?: () => void;
  }
}

/** Meta's JavaScript SDK, loaded once and only when the owner chooses to connect. */
function loadFacebook(appId: string, version: string): Promise<FbSdk> {
  if (window.FB) return Promise.resolve(window.FB);
  return new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, autoLogAppEvents: true, xfbml: false, version });
      resolve(window.FB!);
    };
    const el = document.createElement("script");
    el.src = "https://connect.facebook.net/en_US/sdk.js";
    el.async = true;
    el.crossOrigin = "anonymous";
    el.onerror = () => reject(new Error("Couldn't load Facebook's sign-in. Check your connection or ad blocker, then try again."));
    document.body.appendChild(el);
  });
}

/**
 * Meta's Embedded Signup popup: the owner signs in with Facebook and picks or creates their WhatsApp Business Account and number.
 * The popup posts the account and number IDs to this window and returns a one-time code; both go to the server, which swaps the
 * code for the business's token. No IDs or tokens to copy, and no webhook to set up.
 */
function EmbeddedSignup({ cfg, patch }: { cfg: ChannelStatus["whatsapp"]["embedded"]; patch: Patch }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const ids = useRef<{ phoneNumberId?: string; wabaId?: string }>({});
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!/(^|\.)facebook\.com$/.test(new URL(e.origin).hostname)) return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.type !== "WA_EMBEDDED_SIGNUP") return;
        if (d.event === "FINISH" || d.event === "FINISH_ONLY_WABA") ids.current = { phoneNumberId: d.data?.phone_number_id, wabaId: d.data?.waba_id };
        else if (d.event === "CANCEL") setNote(d.data?.current_step ? `Stopped at “${d.data.current_step}”. Start again when you're ready.` : "Cancelled.");
        else if (d.event === "ERROR") setNote(d.data?.error_message ?? "Meta reported an error in the popup.");
      } catch {
        // not one of Meta's messages
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!cfg) {
    return (
      <p className="max-w-[72ch] text-[13.5px] text-fg-2">
        Connecting with Facebook isn&apos;t set up on this server yet: it needs <span className="num">META_APP_ID</span>, <span className="num">META_APP_SECRET</span> and <span className="num">META_EMBEDDED_SIGNUP_CONFIG_ID</span>. Use “Enter credentials manually” meanwhile.
      </p>
    );
  }

  async function start() {
    setBusy(true);
    setNote(null);
    ids.current = {};
    try {
      const FB = await loadFacebook(cfg!.appId, cfg!.graphVersion);
      const code = await new Promise<string | null>((resolve) =>
        FB.login((r) => resolve(r.authResponse?.code ?? null), {
          config_id: cfg!.configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
        }),
      );
      if (!code) {
        setNote((n) => n ?? "The Facebook window closed before you finished.");
        return;
      }
      // Meta posts the IDs just before the popup closes; give the message a moment to land.
      for (let i = 0; i < 20 && !ids.current.phoneNumberId; i++) await new Promise((r) => setTimeout(r, 150));
      if (!ids.current.phoneNumberId || !ids.current.wabaId) {
        setNote("Meta didn't share which number you picked. Run the steps again and choose a phone number at the end.");
        return;
      }
      const r = (await patch("/api/channels/whatsapp/embedded", "POST", { code, ...ids.current }, "WhatsApp connected. Customers can message your number now.")) as { registerIssue?: string | null };
      if (r?.registerIssue) setNote(r.registerIssue);
    } catch (e) {
      if (!(e instanceof Error && e.name === "ApiError")) setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Steps
        items={[
          <>Press the button and sign in with the Facebook account that manages your business.</>,
          <>Pick your business, then choose an existing WhatsApp Business number or add a new one (Meta texts it a code).</>,
          <>That&apos;s all: Yapoz checks the number with Meta and starts receiving its messages. Nothing to copy or paste.</>,
        ]}
      />
      <Button className="mt-3" variant="brass" loading={busy} onClick={start}>
        Connect with Facebook
      </Button>
      {note ? <p className="mt-2 text-[13px] text-signal-ink">{note}</p> : null}
    </div>
  );
}

function ManualNumber({ available, patch }: { available: boolean; patch: Patch }) {
  const [f, setF] = useState({ phoneNumberId: "", wabaId: "", accessToken: "" });
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  return !available ? (
    <p className="max-w-[72ch] text-[13.5px] text-fg-2">
      WhatsApp isn&apos;t set up on this server yet: it needs <span className="num">META_APP_ID</span> and <span className="num">META_APP_SECRET</span> in its environment.
    </p>
  ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await patch("/api/channels/whatsapp", "POST", f, "WhatsApp connected. Customers can message your number now.");
            } catch {
              // shown by patch()
            } finally {
              setBusy(false);
            }
          }}
          className="max-w-[720px]"
        >
          <p className="text-[13.5px] text-fg-2">
            The number you want customers to message. Yapoz asks Meta whether the token may use WhatsApp through Yapoz&apos;s Meta app and whether the number is on that Business Account, before saving anything.
          </p>
          <button type="button" onClick={() => setHelp((v) => !v)} className="mt-1 text-[13px] font-medium underline decoration-brass underline-offset-4" aria-expanded={help}>
            {help ? "Hide the steps" : "Where do I find these?"}
          </button>
          {help ? (
            <Steps
              items={[
                <>
                  WhatsApp → API Setup shows the <b>Phone number ID</b> and the <b>WhatsApp Business Account ID</b> next to the number. Neither is the phone number itself.
                </>,
                <>
                  Business Settings → <b>System users</b>: create one, assign it Yapoz&apos;s Meta app and your WhatsApp account, and generate a token for Yapoz's Meta app with <span className="num">whatsapp_business_messaging</span> and <span className="num">whatsapp_business_management</span>. Choose <b>Never</b> for expiry. That&apos;s the <b>access token</b>.
                </>,
                <>
                  The temporary token on the API Setup page stops working after 24 hours. Yapoz accepts it but tells you when it will expire.
                </>,
              ]}
            />
          ) : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="wa-pn">Phone number ID</Label>
              <Input id="wa-pn" inputMode="numeric" autoComplete="off" value={f.phoneNumberId} onChange={(e) => setF({ ...f, phoneNumberId: e.target.value.trim() })} placeholder="e.g. 106540352242922" required />
            </div>
            <div>
              <Label htmlFor="wa-waba">WhatsApp Business Account ID</Label>
              <Input id="wa-waba" inputMode="numeric" autoComplete="off" value={f.wabaId} onChange={(e) => setF({ ...f, wabaId: e.target.value.trim() })} required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="wa-token">Access token</Label>
              <Input id="wa-token" type="password" autoComplete="off" value={f.accessToken} onChange={(e) => setF({ ...f, accessToken: e.target.value.trim() })} required />
            </div>
          </div>
          <Button type="submit" className="mt-3" variant="brass" loading={busy}>
            Check with Meta and connect
          </Button>
        </form>
  );
}

function WhatsAppConnected({ s, patch }: { s: ChannelStatus["whatsapp"]; patch: Patch }) {
  return (
        <div className="space-y-3">
          <p className="text-[13.5px] text-fg-2">
            {s.verifiedName ? <>{s.verifiedName} · </> : null}
            Free-form replies within 24 hours of a customer&apos;s last message; after that only approved templates can be sent.
            {s.source === "env" ? " Using this server's demo number." : null}
          </p>
          {s.registerIssue ? <p className="max-w-[72ch] text-[13px] text-signal-ink">{s.registerIssue} Replies may fail until the number is registered in WhatsApp Manager.</p> : null}
          {s.source === "workspace" ? (
            <dl className="grid max-w-[640px] grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13.5px]">
              <dt className="text-muted">Connected</dt>
              <dd>{s.method === "embedded" ? "with Facebook (Embedded Signup)" : "manually, with your own credentials"}</dd>
              <dt className="text-muted">Business Account</dt>
              <dd>
                {s.wabaId ? <span className="num">{s.wabaId}</span> : <span className="text-signal-ink">not saved: disconnect and connect again</span>}
                {s.wabaId && !s.wabaChecked ? <span className="block text-[12.5px] text-muted">Meta doesn&apos;t show this account to the token, which is normal for Meta&apos;s test number. The number itself was confirmed; make sure <span className="num">messages</span> is subscribed under WhatsApp → Configuration.</span> : null}
              </dd>
              <dt className="text-muted">Access token</dt>
              <dd className={cx((s.tokenExpiresAt && soon(s.tokenExpiresAt)) || !s.tokenChecked ? "text-signal-ink" : null)}>
                {!s.tokenChecked
                  ? "not checked with Meta yet: disconnect and connect again to check it"
                  : s.tokenExpiresAt
                  ? `${new Date(s.tokenExpiresAt).getTime() < Date.now() ? "expired" : "expires"} ${new Date(s.tokenExpiresAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}${soon(s.tokenExpiresAt) ? ": make a System User token that doesn't expire" : ""}`
                  : "doesn't expire"}
              </dd>
            </dl>
          ) : null}
          <div className="max-w-[640px]">
            <WhatsAppHealth s={s} />
          </div>
          {s.source === "workspace" ? (
            <button className={linkBtn} onClick={() => window.confirm("Disconnect WhatsApp? Customer messages stop being answered.") && patch("/api/channels/whatsapp", "DELETE", undefined, "WhatsApp disconnected.")}>
              Disconnect
            </button>
          ) : null}
        </div>
  );
}

export function Channels({ channels, patch, workspaceId }: { channels: ChannelStatus; patch: Patch; workspaceId: string }) {
  return (
    <section id="channels" className="scroll-mt-6">
      <h2 className="font-display text-[22px] font-bold">Channels</h2>
      <p className="mt-1 max-w-[70ch] text-[14px] text-muted">Where customers reach you. Autopilot sends replies on its own; Copilot drafts them for your team to approve in the inbox.</p>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        <Telegram s={channels.telegram} patch={patch} workspaceId={workspaceId} />
        <WhatsApp s={channels.whatsapp} patch={patch} />
        <Card title="Website simulator" type="simulator" mode={channels.simulator.mode} patch={patch} status={<Chip tone="answered">Always on</Chip>}>
          <p className="text-[13.5px] text-fg-2">A phone on screen that talks to the same assistant. Test answers before going live, or use it as the fallback on stage.</p>
        </Card>
      </ul>
    </section>
  );
}
