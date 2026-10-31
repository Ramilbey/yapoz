"use client";
import { send } from "./fetcher";

export type PushState = "unsupported" | "home-screen" | "blocked" | "off" | "on";

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const installed = () => matchMedia("(display-mode: standalone)").matches;

const currentSub = async () => (await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription()) ?? null;

export async function pushState(): Promise<PushState> {
  if (isIos() && !installed()) return "home-screen";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return (await currentSub()) ? "on" : "off";
}

const keyBytes = (key: string) => Uint8Array.from(atob(key.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(key.length / 4) * 4, "=")), (c) => c.charCodeAt(0));

/** Call from a click: browsers refuse the permission prompt otherwise. */
export async function turnOnPush(key: string): Promise<PushState> {
  if ((await Notification.requestPermission()) !== "granted") return pushState();
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
  await send("/api/alerts/push", "POST", sub.toJSON());
  return "on";
}

/** Also runs on sign-out, so a device stops showing a business's orders once its owner has left it. */
export async function turnOffPush(): Promise<PushState> {
  if (!("serviceWorker" in navigator)) return "unsupported";
  const sub = await currentSub();
  if (sub) {
    await send("/api/alerts/push", "DELETE", { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
  return pushState();
}
