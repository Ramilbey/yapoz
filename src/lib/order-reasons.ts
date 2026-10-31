// Why an order was turned down or called off. The codes are what get counted; the free-text reason is still what the customer is told.
export const REASON_CODES = ["wrong_item", "out_of_stock", "customer_cancelled", "other"] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export const REASON_LABELS: Record<ReasonCode, string> = {
  wrong_item: "Wrong item",
  out_of_stock: "Out of stock",
  customer_cancelled: "Customer cancelled",
  other: "Other",
};

export const isReasonCode = (v: unknown): v is ReasonCode => REASON_CODES.includes(v as ReasonCode);
