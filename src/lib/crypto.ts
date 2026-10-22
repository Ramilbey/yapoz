import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { requiredSecret } from "./session";

function key(): Buffer {
  // Accept any string; derive a 32-byte key so a base64 or passphrase both work.
  const raw = requiredSecret("APP_ENCRYPTION_KEY", 1, "default-fallback-encryption-key-32chars");
  return createHash("sha256").update(raw).digest();
}

/** AES-256-GCM. Output: base64(iv | tag | ciphertext). */
export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptJson<T = unknown>(blob: string): T {
  const buf = Buffer.from(blob, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  const pt = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
  return JSON.parse(pt.toString("utf8")) as T;
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Meta's X-Hub-Signature-256: "sha256=" + HMAC-SHA256(rawBody, appSecret). */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !appSecret) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  return safeEqual(expected, header);
}

export function shortCode(prefix: string, len = 4): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(len);
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `${prefix}-${s}`;
}
