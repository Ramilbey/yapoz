import {
  pgTable,
  pgEnum,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  customType,
  uniqueIndex,
  index,
  serial,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// The database type still lists "hr" and "instagram" (removed modules); nothing writes them any more.
export const roleEnum = pgEnum("role", ["owner", "service"]);
export const channelTypeEnum = pgEnum("channel_type", ["telegram", "whatsapp", "simulator"]);
export const channelModeEnum = pgEnum("channel_mode", ["autopilot", "copilot"]);
export const threadStatusEnum = pgEnum("thread_status", ["open", "needs_human", "resolved"]);
export const directionEnum = pgEnum("direction", ["in", "out"]);
export const authorEnum = pgEnum("author", ["customer", "ai", "staff", "system"]);
export const messageStatusEnum = pgEnum("message_status", ["received", "pending_approval", "sent", "failed", "discarded"]);
export const outcomeEnum = pgEnum("run_outcome", ["auto_resolved", "ordered", "escalated", "drafted", "declined", "error"]);
export const priorityEnum = pgEnum("priority", ["low", "normal", "high", "urgent"]);
export const escalationStatusEnum = pgEnum("escalation_status", ["open", "resolved"]);
export const kbKindEnum = pgEnum("kb_kind", ["product", "service", "policy", "faq", "hours", "info"]);
/** pending = waiting for the owner's approval; nothing is promised to the customer until confirmed. */
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "ready", "completed", "cancelled", "expired"]);
/** none = made to order (on or off); daily = a fresh quantity every business day; tracked = an on-hand count. */
export const stockModeEnum = pgEnum("stock_mode", ["none", "daily", "tracked"]);
/** held = reserved by an order (may expire); firm = paid or kept by staff; consumed = the order was confirmed; released = given back. */
export const holdStatusEnum = pgEnum("hold_status", ["held", "firm", "consumed", "released"]);
export const fulfilmentEnum = pgEnum("fulfilment", ["pickup", "delivery"]);
/** What Jawab makes of a payment receipt next to its order. It is advice for the owner: Jawab can't see the bank. */
export const receiptVerdictEnum = pgEnum("receipt_verdict", ["consistent", "review", "mismatch", "unreadable"]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "running", "done", "failed"]);

export type BusinessProfile = {
  type: string;
  description: string;
  address: string;
  phone?: string | null;
  website?: string | null;
  languages: string[];
};

/** Where customers pay. Shown to them after they order, and what a receipt is checked against. */
export type PayAccount = { id: string; type: "bank_transfer" | "duitnow" | "ewallet"; provider: string; accountName: string; accountNumber: string };
export type PaymentSettings = {
  enabled: boolean;
  /** An order can't be confirmed until the customer has sent a receipt. */
  requireReceipt: boolean;
  accounts: PayAccount[];
  /** Free text after the account details, e.g. "Put your order code in the payment reference." */
  note?: string;
};

export type WorkspaceSettings = {
  confidenceThreshold: number;
  demoTraffic: boolean;
  business: BusinessProfile;
  /** Channels only get AI replies once the owner presses Go live. */
  live: boolean;
  /** version 2: the wizard has the "How you sell" step (4), so Channels is 5, Try it 6 and Go live 7. */
  onboarding: { step: number; completedAt?: string | null; version?: number };
  /** Shown publicly as a "try a sample business" demo on the site. */
  sample?: boolean;
  payments?: PaymentSettings;
  /** Conversations and receipt files older than this are deleted by the daily sweep; null keeps them. */
  privacy?: { retentionDays: number | null };
  stock?: StockSettings;
  appointments?: AppointmentSettings;
};

export type AppointmentSettings = {
  /** Offered start times are on this grid (30 = :00 and :30). A customer can still ask for any free time. */
  slotMinutes: number;
  /** anyone = every staff member who takes appointments does every service; specific = each person's own list. */
  assignment: "anyone" | "specific";
  /** How far ahead customers can book. */
  bookingDays: number;
  /** The earliest a customer can book, from now. */
  minNoticeMinutes: number;
  /** Customers can change or cancel up to this many hours before; closer than that, staff decide. */
  changeCutoffHours: number;
  /** The reminder goes this long before the start. */
  reminderMinutes: number;
  /** Kept free after each appointment. */
  bufferMinutes: number;
  /** Online appointments get a room on this Jitsi server. */
  meetBase: string;
  /** WhatsApp only allows approved templates more than 24 hours after the customer's last message: used for reminders then. Params: service, time, link or place. */
  whatsappTemplate?: { name: string; lang: string } | null;
};

/** A person's working hours for appointments, like opening hours: a weekly pattern and per-date changes ([] = off that day). */
export type StaffSchedule = {
  weekly: Record<string, [string, string][]>;
  exceptions: { date: string; hours: [string, string][]; note: string }[];
};

export type StockMode = "none" | "daily" | "tracked";
export type StockSettings = {
  /** Items without their own mode use this. */
  defaultMode: StockMode;
  /** Local time the business day starts ("00:00"); daily quantities and "sold out today" roll over then. */
  dayStartsAt: string;
  /** With payments on, an order's stock is held this long for a passing receipt. */
  holdMinutes: number;
  /** How many days ahead customers can order daily items. */
  preorderDays: number;
  /** Options without their own threshold alert below this many left. */
  lowStockDefault: number;
};

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  timezone: text("timezone").notNull(),
  currency: text("currency").notNull(),
  settings: jsonb("settings").$type<WorkspaceSettings>().notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull(),
    /** Bumped on password change, role change and "sign out everywhere": older sessions stop working. */
    sessionVersion: integer("session_version").notNull().default(0),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_ws_email").on(t.workspaceId, t.email)],
);

export const channels = pgTable(
  "channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    type: channelTypeEnum("type").notNull(),
    mode: channelModeEnum("mode").notNull().default("autopilot"),
    /** Non-secret config: bot username, phone number id, connection health. */
    config: jsonb("config").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
    /** AES-256-GCM encrypted JSON of secrets (tokens). Env vars are used when null. */
    credentialsEnc: text("credentials_enc"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("channels_ws_type").on(t.workspaceId, t.type)],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    channel: channelTypeEnum("channel").notNull(),
    externalId: text("external_id").notNull(),
    displayName: text("display_name"),
    username: text("username"),
    phone: text("phone"),
    language: text("language"),
    createdAt: ts("created_at").defaultNow().notNull(),
    lastSeenAt: ts("last_seen_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("customers_ws_ch_ext").on(t.workspaceId, t.channel, t.externalId)],
);

export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    channel: channelTypeEnum("channel").notNull(),
    externalThreadId: text("external_thread_id").notNull(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    status: threadStatusEnum("status").notNull().default("open"),
    aiPaused: boolean("ai_paused").notNull().default(false),
    takenOverBy: uuid("taken_over_by").references(() => users.id, { onDelete: "set null" }),
    /** Channel routing data: telegram chat id, business_connection_id, WhatsApp number, etc. */
    routing: jsonb("routing").$type<Record<string, string | number | null>>().notNull().default({}),
    accent: text("accent"),
    isDemo: boolean("is_demo").notNull().default(false),
    lastMessageAt: ts("last_message_at").defaultNow().notNull(),
    lastInboundAt: ts("last_inbound_at"),
    lastPreview: text("last_preview"),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("threads_ws_ch_ext").on(t.workspaceId, t.channel, t.externalThreadId),
    index("threads_ws_last").on(t.workspaceId, t.lastMessageAt),
  ],
);

export type Attachment = { kind: "image" | "document" | "voice" | "other"; name?: string; mime?: string; ref?: string };

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    direction: directionEnum("direction").notNull(),
    author: authorEnum("author").notNull(),
    authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
    text: text("text").notNull(),
    attachments: jsonb("attachments").$type<Attachment[]>().notNull().default([]),
    status: messageStatusEnum("status").notNull(),
    externalMessageId: text("external_message_id"),
    agentRunId: uuid("agent_run_id"),
    error: text("error"),
    /** From the channel's delivery receipts (WhatsApp status webhooks): the customer's phone got it / opened it. */
    deliveredAt: ts("delivered_at"),
    readAt: ts("read_at"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("messages_thread_created").on(t.threadId, t.createdAt),
    index("messages_ws_created").on(t.workspaceId, t.createdAt),
    // A channel retrying a webhook must not create the same customer message twice.
    uniqueIndex("messages_inbound_ext").on(t.threadId, t.externalMessageId).where(sql`direction = 'in' and external_message_id is not null`),
    index("messages_ws_ext").on(t.workspaceId, t.externalMessageId).where(sql`external_message_id is not null`),
    index("messages_drafts").on(t.threadId).where(sql`status = 'pending_approval'`),
  ],
);

export type ToolCallLog = { name: string; input: unknown; output: unknown; ms: number; ok: boolean; label: string };

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    inboundMessageId: uuid("inbound_message_id"),
    channel: channelTypeEnum("channel").notNull(),
    model: text("model").notNull(),
    intent: text("intent"),
    topic: text("topic"),
    language: text("language"),
    sentiment: text("sentiment"),
    confidence: numeric("confidence", { mode: "number" }),
    toolCalls: jsonb("tool_calls").$type<ToolCallLog[]>().notNull().default([]),
    latencyMs: integer("latency_ms"),
    firstResponseMs: integer("first_response_ms"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    outcome: outcomeEnum("outcome").notNull(),
    error: text("error"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("runs_ws_created").on(t.workspaceId, t.createdAt)],
);

export const escalations = pgTable(
  "escalations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    /** null for cards about the business rather than a chat (low stock). */
    threadId: uuid("thread_id").references(() => threads.id, { onDelete: "cascade" }),
    agentRunId: uuid("agent_run_id"),
    /** At most one open card per key, e.g. "low_stock:<variant>". */
    dedupeKey: text("dedupe_key"),
    reason: text("reason").notNull(),
    category: text("category").notNull(),
    priority: priorityEnum("priority").notNull().default("normal"),
    summary: text("summary").notNull(),
    status: escalationStatusEnum("status").notNull().default("open"),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: ts("resolved_at"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("esc_ws_status").on(t.workspaceId, t.status),
    index("esc_thread_open").on(t.threadId).where(sql`status = 'open'`),
    uniqueIndex("esc_dedupe_open").on(t.workspaceId, t.dedupeKey).where(sql`status = 'open' and dedupe_key is not null`),
  ],
);

export const kbItems = pgTable(
  "kb_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    kind: kbKindEnum("kind").notNull(),
    category: text("category").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    tags: text("tags").array().notNull().default([]),
    /** false = off until the owner turns it back on. */
    available: boolean("available").notNull().default(true),
    /** Sold out until this business day (YYYY-MM-DD): it switches itself back on then. */
    unavailableUntil: date("unavailable_until", { mode: "string" }),
    /** null = the business's default (Settings → Stock). */
    stockMode: stockModeEnum("stock_mode"),
    /** Services: in person, so no meeting link. Otherwise an appointment gets an online meeting room. */
    inPerson: boolean("in_person").notNull().default(false),
    availabilityNote: text("availability_note"),
    sort: integer("sort").notNull().default(0),
    active: boolean("active").notNull().default(true),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("kb_ws_slug").on(t.workspaceId, t.slug), index("kb_ws_kind").on(t.workspaceId, t.kind)],
);

export const kbVariants = pgTable(
  "kb_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").notNull().references(() => kbItems.id, { onDelete: "cascade" }),
    size: text("size"),
    color: text("color"),
    /** Any other option label: "Long hair", "1 hour", "Double room". */
    option: text("option"),
    /** Price in minor units (sen for MYR). */
    priceMinor: integer("price_minor").notNull(),
    /** Tracked mode: on hand. null = not counted. */
    stock: integer("stock"),
    /** Daily mode: the usual quantity each business day. null = not counted. */
    dailyQty: integer("daily_qty"),
    /** Tracked mode: alert when fewer than this are left. null = the business's default; 0 = never. */
    lowStockAt: integer("low_stock_at"),
    sku: text("sku"),
  },
  (t) => [index("variants_item").on(t.itemId)],
);

export const knowledgeGaps = pgTable(
  "knowledge_gaps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    question: text("question").notNull(),
    count: integer("count").notNull().default(1),
    status: text("status").notNull().default("open"),
    kbItemId: uuid("kb_item_id"),
    isDemo: boolean("is_demo").notNull().default(false),
    firstAskedAt: ts("first_asked_at").defaultNow().notNull(),
    lastAskedAt: ts("last_asked_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("gaps_ws_key").on(t.workspaceId, t.key)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").references(() => threads.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    refCode: text("ref_code").notNull(),
    /** appointment = a booked service; its time and staff are in appointments. Same approval and payment flow. */
    kind: text("kind").$type<"order" | "appointment">().notNull().default("order"),
    customerName: text("customer_name").notNull(),
    phone: text("phone"),
    fulfilment: fulfilmentEnum("fulfilment").notNull().default("pickup"),
    /** Delivery address as the customer wrote it. */
    address: text("address"),
    /** When the customer wants it, in their words ("7pm", "tomorrow lunch"). */
    wanted: text("wanted"),
    notes: text("notes"),
    status: orderStatusEnum("status").notNull().default("pending"),
    /** Set by staff after they check the payment; Jawab never takes payments. */
    paid: boolean("paid").notNull().default(false),
    /** Items only, in minor units. The delivery fee is agreed by the team. */
    totalMinor: integer("total_minor").notNull(),
    currency: text("currency").notNull(),
    /** Stock was taken off the variants when the order was confirmed (so cancelling gives it back). */
    stockTaken: boolean("stock_taken").notNull().default(false),
    channel: channelTypeEnum("channel"),
    handledBy: uuid("handled_by").references(() => users.id, { onDelete: "set null" }),
    cancelReason: text("cancel_reason"),
    receiptRequest: jsonb("receipt_request").$type<ReceiptRequest | null>(),
    /** The business day a daily-stock order is for (YYYY-MM-DD). */
    wantedDate: date("wanted_date", { mode: "string" }),
    /** Payments on: the order expires (and its stock goes back) at this time unless a passing receipt or staff firm it. null = no timer. */
    holdExpiresAt: ts("hold_expires_at"),
    /** What stopped the timer: a receipt that passed the checks, or staff pressing Keep reserved. */
    firmedBy: text("firmed_by").$type<"receipt" | "staff" | null>(),
    expiredAt: ts("expired_at"),
    notifications: jsonb("notifications").$type<OrderNotification[]>().notNull().default([]),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
    confirmedAt: ts("confirmed_at"),
    readyAt: ts("ready_at"),
    completedAt: ts("completed_at"),
    cancelledAt: ts("cancelled_at"),
  },
  (t) => [
    uniqueIndex("orders_ws_ref").on(t.workspaceId, t.refCode),
    index("orders_ws_status_created").on(t.workspaceId, t.status, t.createdAt),
    index("orders_thread").on(t.threadId),
    index("orders_hold_due").on(t.holdExpiresAt).where(sql`status = 'pending' and hold_expires_at is not null`),
  ],
);

/** Staff who take appointments: everyone with a login can, once switched on. */
export const staff = pgTable("staff", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  takesAppointments: boolean("takes_appointments").notNull().default(false),
  /** null = the business's opening hours. */
  schedule: jsonb("schedule").$type<StaffSchedule | null>(),
  /** The services this person does, when the business assigns services to specific staff. */
  serviceIds: uuid("service_ids").array().notNull().default([]),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

export type Attendance = "present" | "late" | "no_show";

/**
 * A booked service: who, when, and the meeting room. Its order carries the approval, payment and status. The time is
 * taken while the order is confirmed (or done), or pending and its payment timer hasn't run out.
 */
export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id").references(() => users.id, { onDelete: "set null" }),
    itemId: uuid("item_id").references(() => kbItems.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => kbVariants.id, { onDelete: "set null" }),
    startsAt: ts("starts_at").notNull(),
    endsAt: ts("ends_at").notNull(),
    /** null for in-person services. */
    meetLink: text("meet_link"),
    attendance: text("attendance").$type<Attendance | null>(),
    attendanceBy: uuid("attendance_by").references(() => users.id, { onDelete: "set null" }),
    attendanceAt: ts("attendance_at"),
    remindedAt: ts("reminded_at"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("appointments_order").on(t.orderId), index("appointments_staff_start").on(t.staffId, t.startsAt), index("appointments_ws_start").on(t.workspaceId, t.startsAt)],
);

/** Daily mode: the quantity for one day when it differs from the usual. Rows never need resetting: the date is the reset. */
export const dailyStock = pgTable(
  "daily_stock",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").notNull().references(() => kbVariants.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    qty: integer("qty").notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("daily_stock_variant_date").on(t.variantId, t.date)],
);

/**
 * Stock an order reserves when it is placed. Daily holds carry the day (date); tracked holds don't (date null).
 * Available = base minus firm holds and held ones not yet expired (and, for a day, the consumed ones).
 */
export const stockHolds = pgTable(
  "stock_holds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").notNull().references(() => kbVariants.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }),
    qty: integer("qty").notNull(),
    status: holdStatusEnum("status").notNull().default("held"),
    expiresAt: ts("expires_at"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("holds_variant_status").on(t.variantId, t.status), index("holds_order").on(t.orderId)],
);

/** Staff asked the customer for another receipt: why, and what the next one should show. Cleared (fulfilledAt) when it arrives. */
export type ReceiptRequest = {
  reason: string;
  /** replace: send a correct receipt for the full amount; top_up: pay the difference and send that receipt. */
  kind: "replace" | "top_up";
  expectedMinor: number;
  requestedAt: string;
  requestedBy: string | null;
  fulfilledAt?: string | null;
};
/** Every message staff actions sent the customer about this order, and whether it reached them. */
export type OrderNotification = { kind: string; messageId: string | null; status: "sent" | "failed" | "no_chat" | "draft"; error?: string | null; at: string };

/** What the AI read off a receipt. Every field is null when it wasn't visible: nothing here is a guess. */
export type ReceiptReading = {
  looksLikeReceipt: boolean;
  amount: number | null;
  currency: string | null;
  paidAt: string | null;
  payeeName: string | null;
  payeeAccount: string | null;
  payerName: string | null;
  reference: string | null;
  method: string | null;
  status: "successful" | "pending" | "failed" | "unknown";
  legibility: "clear" | "partial" | "poor";
  /** Visual oddities a careful person would also notice (mismatched fonts, edited-looking digits, cropped edges). */
  oddities: string[];
};
export type ReceiptCheck = { code: string; level: "pass" | "warn" | "fail"; message: string };

export const orderReceipts = pgTable(
  "order_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").references(() => threads.id, { onDelete: "set null" }),
    mime: text("mime").notNull(),
    sha256: text("sha256").notNull(),
    bytes: bytea("bytes").notNull(),
    reading: jsonb("reading").$type<ReceiptReading | null>(),
    checks: jsonb("checks").$type<ReceiptCheck[]>().notNull().default([]),
    verdict: receiptVerdictEnum("verdict").notNull(),
    /** The reading's model, e.g. "Google Gemini: gemini-3.8-flash". */
    model: text("model"),
    /** Staff turned this receipt down and asked for another; it no longer counts towards the order. */
    rejectedAt: ts("rejected_at"),
    rejectedReason: text("rejected_reason"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("receipts_order").on(t.orderId), index("receipts_ws_hash").on(t.workspaceId, t.sha256)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").references(() => kbItems.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => kbVariants.id, { onDelete: "set null" }),
    /** What was ordered as the customer saw it, e.g. "Large New York Classic Pepperoni". Kept if the menu changes. */
    name: text("name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    note: text("note"),
  },
  (t) => [index("order_items_order").on(t.orderId)],
);

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    dataEnc: text("data_enc").notNull(),
    meta: jsonb("meta").$type<Record<string, string>>().notNull().default({}),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("integrations_ws_provider").on(t.workspaceId, t.provider)],
);

export const telegramBusinessConnections = pgTable("telegram_business_connections", {
  id: text("id").primaryKey(),
  /** Null until the owner proves which business it belongs to with a link code. */
  workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  botId: text("bot_id"),
  ownerUserId: text("owner_user_id").notNull(),
  ownerChatId: text("owner_chat_id"),
  canReply: boolean("can_reply").notNull().default(false),
  rights: jsonb("rights").$type<Record<string, boolean>>().notNull().default({}),
  isEnabled: boolean("is_enabled").notNull().default(true),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>().notNull().default({}),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("events_ws_type_created").on(t.workspaceId, t.type, t.createdAt), index("events_ws_created").on(t.workspaceId, t.createdAt)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id"),
    type: text("type").notNull(),
    dedupeKey: text("dedupe_key"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: jobStatusEnum("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    runAfter: ts("run_after").defaultNow().notNull(),
    lastError: text("last_error"),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("jobs_dedupe").on(t.dedupeKey), index("jobs_status_run").on(t.status, t.runAfter)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: ts("window_start").notNull(),
  count: integer("count").notNull().default(0),
});

export const invites = pgTable("invites", {
  token: text("token").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: roleEnum("role").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: ts("expires_at").notNull(),
  acceptedAt: ts("accepted_at"),
  createdAt: ts("created_at").defaultNow().notNull(),
});

/** One-time codes that tie a Telegram account (and its Business connection) to a workspace. */
export const telegramLinks = pgTable("telegram_links", {
  code: text("code").primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  telegramUserId: text("telegram_user_id"),
  createdAt: ts("created_at").defaultNow().notNull(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
});

/** Which business a private chat with a shared bot belongs to (set by t.me/<bot>?start=<code>). */
export const telegramChatBindings = pgTable(
  "telegram_chat_bindings",
  {
    botId: text("bot_id").notNull(),
    chatId: text("chat_id").notNull(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("tg_bind_bot_chat").on(t.botId, t.chatId)],
);

/** Files and links the owner gave during onboarding (menus, price lists, website text). */
export const setupSources = pgTable("setup_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  filename: text("filename"),
  mime: text("mime"),
  bytes: bytea("bytes"),
  text: text("text").notNull().default(""),
  createdAt: ts("created_at").defaultNow().notNull(),
});
