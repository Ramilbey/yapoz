// What each person wants to be alerted about. Stored per user, so the owner and each staff member choose for themselves.
// Pure: the settings page, the bell and the server all read these rules.

export type QuietHours = { start: string; end: string };
/** `emailTo` is where alert emails go instead of the sign-in email. */
export type AlertPrefs = { sound: boolean; volume: number; orders: boolean; needsYou: boolean; email: boolean; emailTo: string | null; quietHours: QuietHours | null };

/** Email is the backup for when Yapoz is closed, so it starts on for owners only. */
export function alertPrefs(stored: Partial<AlertPrefs> | null | undefined, role: "owner" | "service"): AlertPrefs {
  return { sound: true, volume: 0.6, orders: true, needsYou: true, email: role === "owner", emailTo: null, quietHours: null, ...stored };
}

/** `time` is HH:MM in the business's time zone. Hours can cross midnight (22:00 to 07:00). */
export function inQuietHours(q: QuietHours | null, time: string) {
  if (!q || q.start === q.end) return false;
  return q.start < q.end ? time >= q.start && time < q.end : time >= q.start || time < q.end;
}

/** Only the browser vendors' push services: the server posts to this address, so it can't be just any URL. */
export function isPushEndpoint(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && /(^|\.)(fcm\.googleapis\.com|push\.apple\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/.test(u.hostname);
  } catch {
    return false;
  }
}
