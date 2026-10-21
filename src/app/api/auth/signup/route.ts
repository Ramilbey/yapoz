import { z } from "zod";
import bcrypt from "bcryptjs";
import { handle } from "@/lib/auth";
import { body, clientIp, ok } from "@/lib/api";
import { hit } from "@/lib/ratelimit";
import { createWorkspace } from "@/lib/workspace";
import { startSession } from "@/lib/login";

const Body = z.object({
  businessName: z.string().trim().min(2, "Business name is too short").max(80),
  name: z.string().trim().min(1, "Your name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  password: z.string().min(8, "Use at least 8 characters").max(200),
  timezone: z.string().max(64).default("UTC"),
});

/** A new business: workspace + owner account, signed straight in and sent to setup. */
export const POST = handle(async (req: Request) => {
  if (!(await hit(`signup:${clientIp(req)}`, "hour", 8)).ok) return ok({ error: "Too many sign-ups from here. Try again later." }, { status: 429 });
  const b = await body(req, Body);
  const passwordHash = await bcrypt.hash(b.password, 10);
  const { workspaceId, user } = await createWorkspace({ name: b.businessName, timezone: b.timezone, owner: { name: b.name, email: b.email, passwordHash } });
  await startSession(user);
  return ok({ ok: true, workspaceId, home: "/app/setup" });
});
