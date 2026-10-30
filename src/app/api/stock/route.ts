import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { apiSession, handle, HttpError } from "@/lib/auth";
import { ok } from "@/lib/api";
import { addLocalDays } from "@/lib/time";
import { businessDate, dailyBoard, lowStockList, stockSettings } from "@/lib/stock";

export const dynamic = "force-dynamic";

/** The Today page's stock card: daily items for a day (default today), the days that can be planned, and low tracked stock. */
export const GET = handle(async (req: Request) => {
  const s = await apiSession(["owner", "service"]);
  const [ws] = await db.select().from(t.workspaces).where(eq(t.workspaces.id, s.workspaceId));
  const settings = stockSettings(ws);
  const today = businessDate(ws);
  const date = new URL(req.url).searchParams.get("date") ?? today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "date must be YYYY-MM-DD");
  const days = Array.from({ length: settings.preorderDays + 1 }, (_, i) => addLocalDays(today, i));
  const low = (await lowStockList(ws)).map((a) => ({ itemId: a.itemId, itemTitle: a.itemTitle, variantId: a.variantId, name: a.name, left: a.left ?? 0, threshold: a.lowAt }));
  return ok({ date, today, days, settings, daily: await dailyBoard(ws, date), low });
});
