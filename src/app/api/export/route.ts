import { apiSession, handle, HttpError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { EXPORT_TABLES, exportWorkspace, tableRows, toCsv, type ExportTable } from "@/lib/export";

// Owner only: this is every customer's name, phone and chat. Optional ?format=csv&table=orders for one table.
export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner"]);
  const q = new URL(req.url).searchParams;
  const csv = q.get("format") === "csv";
  const table = q.get("table") as ExportTable | null;
  if (csv && !EXPORT_TABLES.includes(table as ExportTable)) throw new HttpError(400, `CSV needs ?table= one of: ${EXPORT_TABLES.join(", ")}`);
  const data = await exportWorkspace(s.workspaceId);
  await audit(s, "data.exported", { format: csv ? "csv" : "json", table: csv ? table : "all" });
  const day = data.exportedAt.slice(0, 10);
  const headers = (type: string, name: string) => ({ "Content-Type": type, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" });
  if (csv) return new Response(toCsv(tableRows(data, table!)), { headers: headers("text/csv; charset=utf-8", `${s.workspaceId}-${table}-${day}.csv`) });
  return new Response(JSON.stringify(data, null, 2), { headers: headers("application/json; charset=utf-8", `${s.workspaceId}-export-${day}.json`) });
});
