import { db, t } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { extractPdfText } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One file per request: serverless hosts cap request bodies at about 4.5 MB.
const MAX_FILE = 4 * 1024 * 1024;
const MAX_FILES = 10;
const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
};

export const POST = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file received.");
  if (file.size > MAX_FILE) throw new HttpError(413, `${file.name} is over 4 MB. Try a smaller photo or split the PDF.`);
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const mime = TYPES[ext] ?? (Object.values(TYPES).includes(file.type) ? file.type : null);
  if (!mime) throw new HttpError(415, `${file.name}: use PDF, JPG, PNG, WEBP, TXT or CSV. (iPhone HEIC photos: share them as JPG.)`);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(t.setupSources).where(and(eq(t.setupSources.workspaceId, s.workspaceId), eq(t.setupSources.kind, "file")));
  if (n >= MAX_FILES) throw new HttpError(400, `Up to ${MAX_FILES} files. Remove one first.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const text = mime === "application/pdf" ? await extractPdfText(bytes) : mime.startsWith("text/") ? bytes.toString("utf8").slice(0, 60_000) : "";
  const [row] = await db
    .insert(t.setupSources)
    .values({ workspaceId: s.workspaceId, kind: "file", filename: file.name.slice(0, 120), mime, bytes, text })
    .returning({ id: t.setupSources.id, filename: t.setupSources.filename, mime: t.setupSources.mime, createdAt: t.setupSources.createdAt });
  return ok({ file: { ...row, size: bytes.length, chars: text.length } });
});
