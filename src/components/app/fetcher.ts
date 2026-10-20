"use client";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function getJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (j as { error?: string }).error ?? `Request failed (${res.status})`);
  return j as T;
}

export async function send<T = unknown>(url: string, method: "POST" | "PATCH" | "DELETE", data?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: data !== undefined ? { "content-type": "application/json" } : undefined, body: data !== undefined ? JSON.stringify(data) : undefined });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (j as { error?: string }).error ?? `Request failed (${res.status})`);
  return j as T;
}
