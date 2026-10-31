// Structured logging: one JSON line per event, secrets redacted. Plain TypeScript, no Node-only imports,
// so it is safe anywhere. Call setLogSink() once at startup to forward entries (e.g. to Sentry) without a dependency here.
export type LogLevel = "info" | "warn" | "error";
export type LogFields = { workspaceId?: string; threadId?: string; orderId?: string; err?: unknown; [key: string]: unknown };
export type LogEntry = { ts: string; level: LogLevel; event: string; [key: string]: unknown };
export type LogSink = (entry: LogEntry) => void;

let sink: LogSink | null = null;
/** Forward every entry to another system. Pass null to remove it. A throwing sink never breaks the caller. */
export function setLogSink(fn: LogSink | null) {
  sink = fn;
}

const REDACTED = "[redacted]";
const SECRET_KEY = /(api[-_]?key|token|secret|password|passwd|authorization|cookie|credential|private[-_]?key)/i;
// Values that look like keys: sk-..., gsk_..., AIza..., Bearer xyz, JWTs, long hex/base64 blobs.
const SECRET_VALUE: RegExp[] = [
  /\bBearer\s+[A-Za-z0-9._~+\/=-]{8,}/gi,
  /\b(?:sk|gsk|pk|rk|xox[abps]|ghp|gho)[-_][A-Za-z0-9_-]{12,}/g,
  /\bAIza[0-9A-Za-z_-]{20,}/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}\b/g,
  /((?:api[-_]?key|token|secret|password|access_token)=)[^\s&"']+/gi,
];

export function redactString(s: string): string {
  let out = s;
  for (const re of SECRET_VALUE) out = out.replace(re, (m, p1) => (typeof p1 === "string" && /=$/.test(p1) ? p1 + REDACTED : REDACTED));
  return out;
}

export function serialiseError(e: unknown): { message: string; stack?: string; name?: string } {
  if (e instanceof Error) return { name: e.name, message: redactString(e.message), stack: e.stack ? redactString(e.stack) : undefined };
  return { message: redactString(typeof e === "string" ? e : safeStringify(e)) };
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
}

function clean(v: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (typeof v === "string") return redactString(v);
  if (typeof v === "bigint") return v.toString();
  if (v === null || typeof v !== "object") return typeof v === "function" || typeof v === "symbol" ? String(v) : v;
  if (v instanceof Error) return serialiseError(v);
  if (v instanceof Date) return v.toISOString();
  if (seen.has(v)) return "[circular]";
  if (depth > 5) return "[deep]";
  seen.add(v);
  if (Array.isArray(v)) return v.map((x) => clean(x, depth + 1, seen));
  const o: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) o[k] = SECRET_KEY.test(k) ? REDACTED : clean(val, depth + 1, seen);
  return o;
}

function emit(level: LogLevel, event: string, fields: LogFields = {}) {
  const { err, ...rest } = fields;
  const body = clean(rest, 0, new WeakSet()) as Record<string, unknown>;
  const entry: LogEntry = { ts: new Date().toISOString(), level, event: redactString(event), ...body };
  if (err !== undefined) entry.err = serialiseError(err);
  const line = safeStringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  if (sink) {
    try {
      sink(entry);
    } catch {
      /* a broken sink must not break the request */
    }
  }
}

export const log = {
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields),
};
