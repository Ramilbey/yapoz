import { z } from "zod";

export const BookingTypeFields = z.object({
  name: z.string().trim().min(1).max(60),
  unit: z.enum(["party", "appointment", "day"]),
  capacity: z.number().int().min(1).max(10_000),
  durationMinutes: z.number().int().min(5).max(24 * 60),
  slotMinutes: z.number().int().min(5).max(24 * 60),
  maxPerBooking: z.number().int().min(1).max(1000),
  leadMinutes: z.number().int().min(0).max(60 * 24 * 30),
  notes: z.string().trim().max(500),
  active: z.boolean(),
});
