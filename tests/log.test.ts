// Structured logger: one JSON line, secrets redacted, errors serialised, and an optional sink.
import { test, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { log, setLogSink, redactString, type LogEntry } from "../src/lib/log";

afterEach(() => {
  setLogSink(null);
  mock.restoreAll();
});

function capture(method: "log" | "warn" | "error") {
  const lines: string[] = [];
  mock.method(console, method, (l: string) => void lines.push(l));
  return lines;
}

test("prints one JSON line with ts, level, event and the fields", () => {
  const lines = capture("log");
  log.info("order.created", { workspaceId: "w1", threadId: "t1", orderId: "o1", total: 5 });
  assert.equal(lines.length, 1);
  const e = JSON.parse(lines[0]);
  assert.equal(e.level, "info");
  assert.equal(e.event, "order.created");
  assert.equal(e.workspaceId, "w1");
  assert.equal(e.threadId, "t1");
  assert.equal(e.orderId, "o1");
  assert.equal(e.total, 5);
  assert.ok(!Number.isNaN(Date.parse(e.ts)));
});

test("errors go to message and stack; warn and error use their own console streams", () => {
  const lines = capture("error");
  const warns = capture("warn");
  log.error("boom", { err: new Error("it broke") });
  log.warn("hmm");
  const e = JSON.parse(lines[0]);
  assert.equal(e.err.message, "it broke");
  assert.match(e.err.stack, /Error: it broke/);
  assert.equal(JSON.parse(warns[0]).level, "warn");
});

test("keys and values that look like secrets are redacted, at any depth and inside error text", () => {
  const lines = capture("error");
  const key = "sk-abcdefghijklmnopqrstuvwxyz123456";
  log.error("leak", {
    apiKey: "plain-value",
    nested: { Authorization: "Bearer abcdefghijklmnop", ok: "fine", note: `used ${key} here` },
    err: new Error(`request failed with token=hunter2hunter2 and ${key}`),
  });
  const out = lines[0];
  for (const s of ["plain-value", "abcdefghijklmnop", key, "hunter2hunter2"]) assert.ok(!out.includes(s), `leaked ${s}`);
  const e = JSON.parse(out);
  assert.equal(e.apiKey, "[redacted]");
  assert.equal(e.nested.ok, "fine");
  assert.equal(redactString("gsk_abcdefghijklmnopqrstuvwx"), "[redacted]");
  assert.equal(redactString("ordinary sentence about orders"), "ordinary sentence about orders");
});

test("circular fields don't throw", () => {
  const lines = capture("log");
  const a: Record<string, unknown> = { n: 1 };
  a.self = a;
  log.info("circ", { a });
  assert.equal(JSON.parse(lines[0]).a.self, "[circular]");
});

test("a sink receives each entry; a throwing sink doesn't break logging", () => {
  capture("log");
  const seen: LogEntry[] = [];
  setLogSink((e) => seen.push(e));
  log.info("one", { workspaceId: "w" });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].event, "one");
  assert.equal(seen[0].workspaceId, "w");
  setLogSink(() => {
    throw new Error("sink down");
  });
  assert.doesNotThrow(() => log.info("two"));
});
