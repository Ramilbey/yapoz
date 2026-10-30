// What the appointments API returns. Types only, so client pages can import them without pulling in the database.
import type { AppointmentSettings, Attendance, StaffSchedule } from "@/db/schema";
import type { HoursData } from "./hours";

export type { AppointmentSettings, Attendance, StaffSchedule };

/** A login that may take appointments. Everyone in the team is listed; takesAppointments says who is switched on. */
export type StaffView = {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "service";
  takesAppointments: boolean;
  /** null = the business's opening hours. */
  schedule: StaffSchedule | null;
  /** Used when assignment is "specific": the services (kb_items ids) this person does. */
  serviceIds: string[];
};

/** One booking on the calendar. */
export type AppointmentView = {
  id: string;
  orderId: string;
  refCode: string;
  /** The order's status: pending (waiting for approval), confirmed, ready, completed, cancelled, expired. */
  status: "pending" | "confirmed" | "ready" | "completed" | "cancelled" | "expired";
  /** Whether the time is still taken: confirmed or done, or pending with its payment timer still running. */
  taken: boolean;
  staffId: string | null;
  staffName: string | null;
  itemId: string | null;
  /** The booked option as the customer saw it: "Haircut, Long hair". */
  service: string;
  startsAt: string;
  endsAt: string;
  /** null for in-person services. */
  meetLink: string | null;
  inPerson: boolean;
  attendance: Attendance | null;
  attendanceByName: string | null;
  attendanceAt: string | null;
  remindedAt: string | null;
  customerName: string;
  phone: string | null;
  threadId: string | null;
  totalMinor: number;
  currency: string;
  paid: boolean;
  /** Pending with payments on: when the payment timer runs out. */
  holdExpiresAt: string | null;
};

/** GET /api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive local dates; default this week). */
export type CalendarResponse = {
  timezone: string;
  now: string;
  from: string;
  to: string;
  settings: AppointmentSettings;
  staff: StaffView[];
  appointments: AppointmentView[];
};

/** GET /api/staff */
export type StaffResponse = {
  timezone: string;
  assignment: AppointmentSettings["assignment"];
  /** The signed-in user: service staff may only edit themselves. */
  me: { userId: string; role: "owner" | "service" };
  staff: StaffView[];
  /** Services in Knowledge, for the "specific" assignment lists. */
  services: { id: string; title: string; inPerson: boolean; durationMinutes: number | null }[];
  /** Staff hours always sit inside these. null = no opening hours on file. */
  openingHours: HoursData | null;
};

/** PATCH /api/staff/[userId] body (every field optional). Returns { staff: StaffView }. */
export type StaffPatch = { takesAppointments?: boolean; schedule?: StaffSchedule | null; serviceIds?: string[] };

/** PATCH /api/appointments/[id] body. Marks attendance after the start time and completes the order. Returns { appointment: AppointmentView }. */
export type AttendancePatch = { attendance: Attendance };

/** On each order of kind "appointment" in GET /api/orders (OrderWithItems.appointment; null for ordinary orders). */
export type OrderAppointment = {
  id: string;
  service: string;
  staffId: string | null;
  staffName: string | null;
  startsAt: string;
  endsAt: string;
  meetLink: string | null;
  inPerson: boolean;
  attendance: Attendance | null;
};
