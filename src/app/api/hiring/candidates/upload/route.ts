import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { addCandidate } from "@/hiring/ingest";
import { extractPdfText } from "@/hiring/pdf";

export const maxDuration = 120;

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { cur.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      cur.push(field); field = "";
      if (cur.some((c) => c.trim())) rows.push(cur);
      cur = [];
    } else field += ch;
  }
  cur.push(field);
  if (cur.some((c) => c.trim())) rows.push(cur);
  const [head, ...data] = rows;
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase());
  return data.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** CSV or PDF upload. HR must confirm the candidates applied or consented. */
export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner", "hr"]);
  const form = await req.formData();
  if (form.get("consent") !== "yes") throw new HttpError(400, "Confirm these candidates applied to you or agreed to be considered.");
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) throw new HttpError(400, "No files");
  const added: string[] = [];
  for (const f of files.slice(0, 40)) {
    if (f.size > 10 * 1024 * 1024) continue;
    const bytes = Buffer.from(await f.arrayBuffer());
    if (f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf") {
      const text = await extractPdfText(bytes);
      const name = text.split("\n").map((l) => l.trim()).find((l) => l.length > 2 && l.length < 60) ?? f.name.replace(/\.pdf$/i, "");
      const c = await addCandidate({ workspaceId: s.workspaceId, fullName: name.replace(/\b([A-Z])([A-Z]+)\b/g, (_m, a, b) => a + b.toLowerCase()), source: "upload", sourceRef: `Upload: ${f.name}`, rawText: text || f.name, doc: { filename: f.name, mime: "application/pdf", bytes, text }, consent: true });
      added.push(c.id);
    } else if (f.name.toLowerCase().endsWith(".csv")) {
      for (const row of parseCsv(bytes.toString("utf8")).slice(0, 200)) {
        const name = row.name || row["full name"] || row.full_name;
        if (!name) continue;
        const raw = Object.entries(row).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
        const c = await addCandidate({
          workspaceId: s.workspaceId, fullName: name, source: "upload", sourceRef: `CSV: ${f.name}`, rawText: raw, consent: true,
          email: row.email || null, phone: row.phone || row.whatsapp || null, telegramUsername: (row.telegram || "").replace(/^@/, "") || null, district: row.district || row.area || null,
        });
        added.push(c.id);
      }
    }
  }
  return ok({ added: added.length });
});
