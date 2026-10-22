// "Typing…" while the AI works: shown at once, shown again for channels whose indicator expires (WhatsApp: 25 s),
// stopped when the reply is ready, and never kept up forever. No database or network needed.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { keepTyping } from "../src/agent/pipeline";
import { adapterFor, type ChannelAdapter } from "../src/channels";

const thread = { id: "t1", workspaceId: "W", channel: "whatsapp", routing: {} } as never;

function fake(typingEveryMs?: number) {
  const calls: (string | null | undefined)[] = [];
  const adapter: ChannelAdapter = { send: async () => ({}), typing: async (_t, inbound) => void calls.push(inbound?.externalMessageId), typingEveryMs };
  return { adapter, calls };
}

test("shown at once, again every 20 s while the AI works, and not after the reply is ready", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { adapter, calls } = fake(20_000);
    const stop = keepTyping(adapter, thread, { externalMessageId: "wamid.A" });
    assert.deepEqual(calls, ["wamid.A"], "shown as soon as the AI starts");
    mock.timers.tick(19_999);
    assert.equal(calls.length, 1);
    mock.timers.tick(1);
    assert.equal(calls.length, 2, "shown again before WhatsApp's 25 seconds run out");
    stop();
    mock.timers.tick(200_000);
    assert.equal(calls.length, 2, "nothing after the reply is ready");
  } finally {
    mock.timers.reset();
  }
});

test("a run that never finishes stops showing typing after a few repeats", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { adapter, calls } = fake(20_000);
    keepTyping(adapter, thread, { externalMessageId: "wamid.B" });
    for (let i = 0; i < 50; i++) mock.timers.tick(20_000);
    assert.equal(calls.length, 7, "once, plus at most 6 repeats (about two minutes)");
  } finally {
    mock.timers.reset();
  }
});

test("channels whose indicator doesn't expire are asked once; channels without one are left alone", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const once = fake(undefined);
    keepTyping(once.adapter, thread, { externalMessageId: "x" });
    mock.timers.tick(120_000);
    assert.equal(once.calls.length, 1);
    const none: ChannelAdapter = { send: async () => ({}) };
    assert.doesNotThrow(() => keepTyping(none, thread, {})());
  } finally {
    mock.timers.reset();
  }
});

test("WhatsApp is the channel that refreshes, every 20 s; Telegram and Instagram don't", () => {
  assert.equal(adapterFor("whatsapp").typingEveryMs, 20_000);
  assert.equal(adapterFor("telegram").typingEveryMs, undefined);
  assert.equal(adapterFor("simulator").typing, undefined);
});
