import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdfText(bytes: Buffer): Promise<string> {
  try {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    return String(text).replace(/\u0000/g, "").trim().slice(0, 30_000);
  } catch (e) {
    console.error("[pdf] extract failed", e);
    return "";
  }
}
