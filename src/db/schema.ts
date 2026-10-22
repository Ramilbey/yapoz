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
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const roleEnum = pgEnum("role", ["owner", "service", "hr"]);
export const channelTypeEnum = pgEnum("channel_type", ["telegram", "whatsapp", "instagram", "simulator"]);
export const channelModeEnum = pgEnum("channel_mode", ["autopilot", "copilot"]);
export const threadStatusEnum = pgEnum("thread_status", ["open", "needs_human", "resolved"]);
export const directionEnum = pgEnum("direction", ["in", "out"]);
export const authorEnum = pgEnum("author", ["customer", "ai", "staff", "system"]);
export const messageStatusEnum = pgEnum("message_status", ["received", "pending_approval", "sent", "failed", "discarded"]);
export const outcomeEnum = pgEnum("run_outcome", ["auto_resolved", "booked", "ordered", "escalated", "drafted", "declined", "error"]);
export const priorityEnum = pgEnum("priority", ["low", "normal", "high", "urgent"]);
export const escalationStatusEnum = pgEnum("escalation_status", ["open", "resolved"]);
export const kbKindEnum = pgEnum("kb_kind", ["product", "service", "policy", "faq", "hours", "info"]);
export const bookingStatusEnum = pgEnum("booking_status", ["confirmed", "cancelled", "seated", "no_show"]);
/** pending = waiting for the owner's approval; nothing is promised to the customer until confirmed. */
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "ready", "completed", "cancelled"]);
export const fulfilmentEnum = pgEnum("fulfilment", ["pickup", "delivery"]);
export const stageEnum = pgEnum("stage", ["sourced", "shortlisted", "invited", "scheduled", "interviewed", "hired", "rejected"]);
export const outreachKindEnum = pgEnum("outreach_kind", ["invite", "rejection"]);
export const outreachStatusEnum = pgEnum("outreach_status", ["draft", "approved", "sent", "failed", "cancelled"]);
export const interviewStatusEnum = pgEnum("interview_status", ["offered", "scheduled", "done", "cancelled"]);
export const candidateSourceEnum = pgEnum("candidate_source", ["telegram_channel", "bot_apply", "upload"]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "running", "done", "failed"]);

export const bookingUnitEnum = pgEnum("booking_unit", ["party", "appointment", "day"]);

export type BusinessProfile = {
  type: string;
  description: string;
  address: string;
  phone?: string | null;
  website?: string | null;
  languages: string[];
};

export type WorkspaceSettings = {
  confidenceThreshold: number;
  demoTraffic: boolean;
  resumeRetentionDays: number;
  business: BusinessProfile;
  modules: { hiring: boolean };
  /** Channels only get AI replies once the owner presses Go live. */
  live: boolean;
  onboarding: { step: number; completedAt?: string | null };
  /** Shown publicly as a "try a sample business" demo on the site. */
  sample?: boolean;
  hr: { interviewMinutes: number; workdayStart: string; workdayEnd: string; location: string };
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
    /** Non-secret config: bot username, phone number id, IG account id, HR channel id. */
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
    /** Channel routing data: telegram chat id, business_connection_id, IG comment id, etc. */
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
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("messages_thread_created").on(t.threadId, t.createdAt), index("messages_ws_created").on(t.workspaceId, t.createdAt)],
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
    threadId: uuid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    agentRunId: uuid("agent_run_id"),
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
  (t) => [index("esc_ws_status").on(t.workspaceId, t.status)],
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
    /** For products: false = sold out today. */
    available: boolean("available").notNull().default(true),
    availabilityNote: text("availability_note"),
    sort: integer("sort").notNull().default(0),
    active: boolean("active").notNull().default(true),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("kb_ws_slug").on(t.workspaceId, t.slug), index("kb_ws_kind").on(t.workspaceId, t.kind)],
);

/**
 * What can be booked, defined by the owner (or drafted by Claude from their description):
 * party = tables/classes by headcount, appointment = one service at a time per staff/station,
 * day = whole days (rooms, rentals, tours).
 */
export const bookingTypes = pgTable(
  "booking_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    unit: bookingUnitEnum("unit").notNull(),
    /** party: seats per slot; appointment: parallel staff/stations; day: units per day. */
    capacity: integer("capacity").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(60),
    slotMinutes: integer("slot_minutes").notNull().default(30),
    maxPerBooking: integer("max_per_booking").notNull().default(1),
    leadMinutes: integer("lead_minutes").notNull().default(60),
    notes: text("notes").notNull().default(""),
    active: boolean("active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("booking_types_ws_key").on(t.workspaceId, t.key)],
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
    /** null = made to order (no stock count). */
    stock: integer("stock"),
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

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").references(() => threads.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone"),
    kind: text("kind").notNull().default("booking"),
    bookingTypeId: uuid("booking_type_id").references(() => bookingTypes.id, { onDelete: "set null" }),
    serviceItemId: uuid("service_item_id"),
    serviceName: text("service_name"),
    /** Headcount for party bookings, units for day bookings, 1 for appointments. */
    partySize: integer("party_size").notNull(),
    startsAt: ts("starts_at").notNull(),
    endsAt: ts("ends_at").notNull(),
    notes: text("notes"),
    refCode: text("ref_code").notNull(),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    channel: channelTypeEnum("channel"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("bookings_ref").on(t.refCode), index("bookings_ws_start").on(t.workspaceId, t.startsAt)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").references(() => threads.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    refCode: text("ref_code").notNull(),
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
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").defaultNow().notNull(),
    confirmedAt: ts("confirmed_at"),
    readyAt: ts("ready_at"),
    completedAt: ts("completed_at"),
    cancelledAt: ts("cancelled_at"),
  },
  (t) => [uniqueIndex("orders_ws_ref").on(t.workspaceId, t.refCode), index("orders_ws_status_created").on(t.workspaceId, t.status, t.createdAt)],
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

export type Criteria = {
  role: string;
  skills: { name: string; minYears?: number; required: boolean }[];
  availability: string[];
  near?: { district: string; maxKm: number } | null;
  languages: string[];
  minTotalYears?: number | null;
  ignored: string[];
};

export const requisitions = pgTable("requisitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  rawRequest: text("raw_request"),
  criteria: jsonb("criteria").$type<Criteria>(),
  fairnessNotice: boolean("fairness_notice").notNull().default(false),
  status: text("status").notNull().default("open"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  rankedAt: ts("ranked_at"),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export type CandidateProfile = {
  headline: string;
  skills: { name: string; years: number }[];
  pastRoles: { title: string; place: string; years: number }[];
  availability: string[];
  district: string | null;
  languages: string[];
  totalYears: number;
  contact: { channel: string; value: string | null };
  summary: string;
};

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    source: candidateSourceEnum("source").notNull(),
    sourceRef: text("source_ref"),
    roleInterest: text("role_interest"),
    telegramChatId: text("telegram_chat_id"),
    /** Which bot can message them: "platform" (shared Jawab bot) or the business's own bot channel id. */
    telegramBot: text("telegram_bot"),
    telegramUsername: text("telegram_username"),
    phone: text("phone"),
    email: text("email"),
    language: text("language").notNull().default("en"),
    district: text("district"),
    totalYears: numeric("total_years", { mode: "number" }),
    availability: text("availability").array().notNull().default([]),
    profile: jsonb("profile").$type<CandidateProfile>(),
    rawText: text("raw_text").notNull(),
    consent: boolean("consent").notNull().default(false),
    consentAt: ts("consent_at"),
    parsedBy: text("parsed_by"),
    parsedAt: ts("parsed_at"),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("cand_ws").on(t.workspaceId)],
);

export const candidateDocuments = pgTable("candidate_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  bytes: bytea("bytes").notNull(),
  text: text("text").notNull().default(""),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export type Evidence = { quote: string; why: string };

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    requisitionId: uuid("requisition_id").notNull().references(() => requisitions.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
    score: integer("score"),
    evidence: jsonb("evidence").$type<Evidence[]>().notNull().default([]),
    summary: text("summary"),
    distanceKm: numeric("distance_km", { mode: "number" }),
    stage: stageEnum("stage").notNull().default("sourced"),
    updatedAt: ts("updated_at").defaultNow().notNull(),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("matches_req_cand").on(t.requisitionId, t.candidateId)],
);

export type SlotOffer = { start: string; end: string };

export const outreach = pgTable("outreach", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  kind: outreachKindEnum("kind").notNull(),
  channel: text("channel").notNull(),
  language: text("language").notNull().default("en"),
  interviewMode: text("interview_mode"),
  slots: jsonb("slots").$type<SlotOffer[]>().notNull().default([]),
  draft: text("draft").notNull(),
  finalText: text("final_text"),
  status: outreachStatusEnum("status").notNull().default("draft"),
  approverId: uuid("approver_id").references(() => users.id, { onDelete: "set null" }),
  approvedAt: ts("approved_at"),
  sentAt: ts("sent_at"),
  error: text("error"),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  candidateId: uuid("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  requisitionId: uuid("requisition_id").notNull().references(() => requisitions.id, { onDelete: "cascade" }),
  outreachId: uuid("outreach_id"),
  startsAt: ts("starts_at").notNull(),
  endsAt: ts("ends_at").notNull(),
  mode: text("mode").notNull().default("onsite"),
  location: text("location"),
  meetUrl: text("meet_url"),
  provider: text("provider").notNull().default("builtin"),
  externalEventId: text("external_event_id"),
  status: interviewStatusEnum("status").notNull().default("scheduled"),
  createdAt: ts("created_at").defaultNow().notNull(),
});

/** Built-in calendar: HR busy blocks + interviews mirror. */
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("busy"),
    interviewId: uuid("interview_id"),
    startsAt: ts("starts_at").notNull(),
    endsAt: ts("ends_at").notNull(),
  },
  (t) => [index("cal_ws_start").on(t.workspaceId, t.startsAt)],
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

/** Conversational state for bot flows such as /apply. */
export const botSessions = pgTable(
  "bot_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    channel: channelTypeEnum("channel").notNull(),
    chatId: text("chat_id").notNull(),
    flow: text("flow").notNull(),
    step: text("step").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("bot_sessions_chat").on(t.workspaceId, t.channel, t.chatId)],
);

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
  (t) => [index("events_ws_type_created").on(t.workspaceId, t.type, t.createdAt)],
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
