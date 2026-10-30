"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { PayAccount, PaymentSettings } from "@/db/schema";
import type { Patch } from "./types";

type Draft = Omit<PayAccount, "id">;
const TYPES: Record<Draft["type"], string> = { bank_transfer: "Bank transfer", duitnow: "DuitNow", ewallet: "E-wallet" };
const blank = (): Draft => ({ type: "bank_transfer", provider: "", accountName: "", accountNumber: "" });

/** Made-up numbers under this business's own name, for trying receipts without anyone's real account. */
const sample = (name: string): Draft[] => [
  { type: "bank_transfer", provider: "Sample Bank", accountName: name, accountNumber: "1234 5678 9012" },
  { type: "duitnow", provider: "DuitNow", accountName: name, accountNumber: "012-345 6789" },
];

/**
 * Where customers pay. After an order, the assistant gives them these details and asks for the receipt; each receipt
 * is read and compared with the order and with these accounts, so the owner sees at a glance whether it adds up.
 */
export function Payments({ initial, businessName, patch }: { initial: PaymentSettings | undefined; businessName: string; patch: Patch }) {
  const [enabled, setEnabled] = useState(Boolean(initial?.enabled));
  const [requireReceipt, setRequireReceipt] = useState(initial?.requireReceipt !== false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [accounts, setAccounts] = useState<Draft[]>(initial?.accounts.map(({ id: _id, ...a }) => a) ?? []);
  const [busy, setBusy] = useState(false);
  const set = (i: number, v: Partial<Draft>) => setAccounts((all) => all.map((a, j) => (j === i ? { ...a, ...v } : a)));

  async function save() {
    setBusy(true);
    try {
      await patch("/api/settings", "PATCH", { payments: { enabled, requireReceipt, note, accounts } }, "Payment details saved.");
    } catch {
      // shown by patch()
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="payments" className="scroll-mt-6">
      <h2 className="font-display text-[22px] font-bold">Payments</h2>
      <p className="mt-1 max-w-[70ch] text-[14px] text-muted">
        Where customers pay for orders. After they order, the assistant gives them these details and asks for the payment receipt. Yapoz reads each receipt and checks it against the order and these accounts. It can&apos;t see your bank,
        so it only advises: you decide whether to confirm.
      </p>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line p-5">
        <div className="max-w-[60ch]">
          <span className="text-[16px] font-semibold">{enabled ? "Asking customers to pay" : "Not asking for payment"}</span>
          <p className="mt-1 text-[13.5px] text-fg-2">Turn on once at least one account is filled in.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} label="Payments" />
      </div>

      <div className="mt-6 max-w-[760px] space-y-5">
        {accounts.map((a, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`pay-type-${i}`}>Type</Label>
              <select id={`pay-type-${i}`} value={a.type} onChange={(e) => set(i, { type: e.target.value as Draft["type"] })} className="h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px]">
                {Object.entries(TYPES).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor={`pay-provider-${i}`}>Bank or wallet</Label>
              <Input id={`pay-provider-${i}`} value={a.provider} onChange={(e) => set(i, { provider: e.target.value })} placeholder="e.g. Maybank, Touch 'n Go" />
            </div>
            <div>
              <Label htmlFor={`pay-name-${i}`}>Account name</Label>
              <Input id={`pay-name-${i}`} value={a.accountName} onChange={(e) => set(i, { accountName: e.target.value })} placeholder="As the bank shows it" />
            </div>
            <div>
              <Label htmlFor={`pay-number-${i}`} hint="account number, DuitNow ID or phone">
                Number
              </Label>
              <Input id={`pay-number-${i}`} value={a.accountNumber} onChange={(e) => set(i, { accountNumber: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <button type="button" className="text-[13px] text-fg-2 underline decoration-brass underline-offset-4" onClick={() => setAccounts((all) => all.filter((_, j) => j !== i))}>
                Remove this account
              </button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          {accounts.length < 5 ? (
            <Button variant="secondary" size="sm" onClick={() => setAccounts((all) => [...all, blank()])}>
              Add an account
            </Button>
          ) : null}
          {!accounts.length ? (
            <button type="button" className="text-[13px] text-fg-2 underline decoration-brass underline-offset-4" onClick={() => setAccounts(sample(businessName))}>
              Fill in made-up sample details
            </button>
          ) : null}
        </div>

        <div>
          <Label htmlFor="pay-note" hint="optional">
            Message after the account details
          </Label>
          <Textarea id="pay-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Put your order code in the payment reference." />
        </div>
        <label className="flex items-start gap-3 text-[14px]">
          <Switch checked={requireReceipt} onCheckedChange={setRequireReceipt} label="Receipt required" />
          <span>
            Receipt required before I can confirm an order
            <span className="block text-[12.5px] text-muted">Confirm stays locked until the customer has sent a receipt in chat.</span>
          </span>
        </label>
        <Button variant="primary" loading={busy} onClick={save}>
          Save payment details
        </Button>
      </div>
    </section>
  );
}
