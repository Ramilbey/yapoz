"use client";
import { useState } from "react";
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
          <p className="mt-0.5 text-[13px] text-muted">Needs Telegram Business (part of Telegram Premium). Customers message you as usual and Jawab answers for you.</p>
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
            <p className="mt-2 text-[13px] text-muted">The shared Jawab bot isn&apos;t set up on this server. Connect your own bot instead.</p>
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
              <p className="mt-0.5 text-[13px] text-muted">Put it in your Instagram bio, on the menu, or print the QR for the counter. Anyone who opens it chats with your assistant.</p>
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

/** Where the Meta → Jawab → customer chain breaks, from what the webhook and sender recorded. */
function WhatsAppHealth({ s }: { s: ChannelStatus["whatsapp"] }) {
  const err = s.lastSendError;
  return (
    <div className="space-y-1.5 pt-1 text-[13px]">
      {!s.lastWebhookAt ? (
        <>
          <p className="text-fg-2">Nothing has arrived from Meta yet. If you&apos;ve sent a message and nothing shows here:</p>
          <Steps
            items={[
              <>In WhatsApp → Configuration → Webhook fields, press Subscribe next to <span className="num">messages</span>, then press Test: this line should change.</>,
              <>While the Meta app is unpublished, Meta only delivers its Test button&apos;s sample, not real messages. Publish the app (App settings → Basic needs a privacy policy URL: <span className="num">{(s.webhookUrl ?? "").split("/api/")[0]}/privacy</span>).</>,
              <>Message your test number from a phone on its list (WhatsApp → API Setup → To).</>,
            ]}
          />
        </>
      ) : s.lastWebhookIssue === "signature" ? (
        <p className="text-signal-ink">
          Meta reached Jawab on {when(s.lastWebhookAt)}, but the delivery was rejected: its signature doesn&apos;t match the App secret you saved. Copy the App secret from App settings → Basic of the
          same app, then disconnect and connect again.
        </p>
      ) : s.lastWebhookTest ? (
        <p className="text-fg-2">
          Meta&apos;s test webhook arrived on {when(s.lastWebhookAt)}, so the connection works. Real messages appear in Inbox once the app is published and a customer writes to your number.
        </p>
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

function WhatsApp({ s, patch }: { s: ChannelStatus["whatsapp"]; patch: Patch }) {
  const [f, setF] = useState({ phoneNumberId: "", accessToken: "", appSecret: "", wabaId: "" });
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  return (
    <Card title="WhatsApp" type="whatsapp" mode={s.mode} patch={patch} status={s.connected ? <Chip tone="answered">{s.displayPhone ?? "Connected"}</Chip> : <Chip>Not connected</Chip>}>
      {s.connected ? (
        <div className="space-y-3">
          <p className="text-[13.5px] text-fg-2">
            {s.verifiedName ? <>{s.verifiedName} · </> : null}
            Free-form replies within 24 hours of a customer&apos;s last message; after that only approved templates can be sent.
            {s.source === "env" ? " Using this server's demo number." : null}
          </p>
          {s.webhookUrl && s.source === "workspace" ? (
            <div className="max-w-[640px] space-y-2">
              <p className="text-[13px] text-muted">
                Last step: in your Meta app → WhatsApp → Configuration, paste this callback URL and verify token, then subscribe to <span className="num">messages</span>.
              </p>
              <CopyField value={s.webhookUrl} label="Callback URL" />
              {s.verifyToken ? <CopyField value={s.verifyToken} label="Verify token" /> : null}
              <WhatsAppHealth s={s} />
            </div>
          ) : null}
          {s.source === "workspace" ? (
            <button className={linkBtn} onClick={() => window.confirm("Disconnect WhatsApp? Customer messages stop being answered.") && patch("/api/channels/whatsapp", "DELETE", undefined, "WhatsApp disconnected.")}>
              Disconnect
            </button>
          ) : null}
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await patch("/api/channels/whatsapp", "POST", f, "WhatsApp connected. Now set the webhook below.");
            } catch {
              // shown by patch()
            } finally {
              setBusy(false);
            }
          }}
          className="max-w-[720px]"
        >
          <p className="text-[13.5px] text-fg-2">
            Uses the official WhatsApp Business Platform through your own Meta app. Paste the details from Meta; Jawab checks them with Meta before saving and stores them encrypted.
          </p>
          <button type="button" onClick={() => setHelp((v) => !v)} className="mt-1 text-[13px] font-medium underline decoration-brass underline-offset-4" aria-expanded={help}>
            {help ? "Hide the steps" : "Where do I find these?"}
          </button>
          {help ? (
            <Steps
              items={[
                <>At developers.facebook.com create an app (type Business) and add the WhatsApp product.</>,
                <>
                  WhatsApp → API Setup shows the <b>Phone number ID</b> and the <b>WhatsApp Business Account ID</b>. Add your real business number there when you&apos;re ready.
                </>,
                <>
                  Business Settings → System users: create one, assign it the app and your WhatsApp account, and generate a token with whatsapp_business_messaging and whatsapp_business_management. That&apos;s the{" "}
                  <b>access token</b>, and it doesn&apos;t expire.
                </>,
                <>
                  App settings → Basic → <b>App secret</b>. Jawab uses it to check that messages really come from Meta.
                </>,
              ]}
            />
          ) : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="wa-pn">Phone number ID</Label>
              <Input id="wa-pn" inputMode="numeric" value={f.phoneNumberId} onChange={(e) => setF({ ...f, phoneNumberId: e.target.value.trim() })} placeholder="e.g. 106540352242922" required />
            </div>
            <div>
              <Label htmlFor="wa-waba" hint="optional">
                WhatsApp Business Account ID
              </Label>
              <Input id="wa-waba" inputMode="numeric" value={f.wabaId} onChange={(e) => setF({ ...f, wabaId: e.target.value.trim() })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="wa-token">Access token</Label>
              <Input id="wa-token" type="password" autoComplete="off" value={f.accessToken} onChange={(e) => setF({ ...f, accessToken: e.target.value.trim() })} required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="wa-secret">App secret</Label>
              <Input id="wa-secret" type="password" autoComplete="off" value={f.appSecret} onChange={(e) => setF({ ...f, appSecret: e.target.value.trim() })} required />
            </div>
          </div>
          <Button type="submit" className="mt-3" variant="brass" loading={busy}>
            Check and connect
          </Button>
        </form>
      )}
    </Card>
  );
}

function Instagram({ s, patch }: { s: ChannelStatus["instagram"]; patch: Patch }) {
  return (
    <Card title="Instagram" type="instagram" mode={s.mode} patch={patch} status={s.connected ? <Chip tone="answered">{s.username ? `@${s.username}` : "Connected"}</Chip> : <Chip>Not connected</Chip>}>
      <p className="text-[13.5px] text-fg-2">Answers DMs (within 24 hours) and sends one private reply to each comment on your posts (within 7 days). Needs an Instagram professional account (Business or Creator).</p>
      {s.connected ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
          {s.expiresAt ? <span className="text-muted">Access renews automatically (current token valid until {new Date(s.expiresAt).toLocaleDateString()}).</span> : null}
          {s.source === "workspace" ? (
            <>
              <a href="/api/channels/instagram/start" className={linkBtn}>
                Reconnect
              </a>
              <button className={linkBtn} onClick={() => window.confirm("Disconnect Instagram?") && patch("/api/channels/instagram", "DELETE", undefined, "Instagram disconnected.")}>
                Disconnect
              </button>
            </>
          ) : (
            <span className="text-muted">Using this server&apos;s demo account.</span>
          )}
        </div>
      ) : s.canConnect ? (
        <div className="mt-3">
          <a href="/api/channels/instagram/start" className="inline-flex h-10 items-center rounded-[10px] bg-brass px-4 text-sm font-medium text-ink hover:brightness-105">
            Connect Instagram
          </a>
          <p className="mt-2 text-[12.5px] text-muted">Until Jawab&apos;s Meta app passes review, only accounts added as Instagram testers on the app can connect.</p>
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-muted">Instagram isn&apos;t set up on this server yet (INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET).</p>
      )}
    </Card>
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
        <Instagram s={channels.instagram} patch={patch} />
        <Card title="Website simulator" type="simulator" mode={channels.simulator.mode} patch={patch} status={<Chip tone="answered">Always on</Chip>}>
          <p className="text-[13.5px] text-fg-2">A phone on screen that talks to the same assistant. Test answers before going live, or use it as the fallback on stage.</p>
        </Card>
      </ul>
    </section>
  );
}
