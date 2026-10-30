"use client";
import { useMemo, useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { BusinessDetails, businessName } from "@/lib/validation";

export type BusinessValues = {
  name: string;
  city: string;
  timezone: string;
  currency: string;
  business: { type: string; description: string; address: string; phone: string | null; website: string | null; languages: string[] };
};

const CURRENCIES = ["MYR", "SGD", "IDR", "THB", "PHP", "VND", "INR", "PKR", "BDT", "AED", "SAR", "QAR", "EGP", "NGN", "KES", "ZAR", "GBP", "EUR", "CHF", "TRY", "USD", "CAD", "AUD", "NZD", "JPY", "KRW", "CNY", "HKD", "BRL", "MXN"];

function timezones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}

/** Business basics, used by the setup wizard and by Settings. */
export function BusinessForm({ initial, onSave, saveLabel = "Save", withDescription = false }: { initial: BusinessValues; onSave: (v: BusinessValues) => Promise<void>; saveLabel?: string; withDescription?: boolean }) {
  const [v, setV] = useState(initial);
  const [langs, setLangs] = useState(initial.business.languages.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tzs = useMemo(timezones, []);
  const b = (k: keyof BusinessValues["business"]) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, business: { ...v.business, [k]: e.target.value } });
  return (
    <form
      className="grid max-w-[760px] gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const business = {
          ...v.business,
          phone: v.business.phone?.trim() || null,
          website: v.business.website?.trim() || null,
          languages: langs.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8),
        };
        const problem = businessName.safeParse(v.name).error ?? BusinessDetails.safeParse(business).error;
        setError(problem?.issues[0].message ?? null);
        if (problem) return;
        setBusy(true);
        try {
          await onSave({ ...v, business });
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <Label htmlFor="bf-name">Business name</Label>
        <Input id="bf-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required minLength={2} />
      </div>
      <div>
        <Label htmlFor="bf-type" hint="in a few words">What kind of business</Label>
        <Input id="bf-type" value={v.business.type} onChange={b("type")} placeholder="e.g. hair salon, bakery, phone repair shop" required />
      </div>
      {withDescription ? (
        <div className="sm:col-span-2">
          <Label htmlFor="bf-desc" hint="customers never see this">Short description</Label>
          <Textarea id="bf-desc" rows={3} value={v.business.description} onChange={b("description")} placeholder="What you do, who your customers are, anything that makes you different." />
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <Label htmlFor="bf-addr">Address</Label>
        <Input id="bf-addr" value={v.business.address} onChange={b("address")} placeholder="Street, area, postcode" />
      </div>
      <div>
        <Label htmlFor="bf-city">City</Label>
        <Input id="bf-city" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="bf-phone" hint="optional">Phone for customers</Label>
        <Input id="bf-phone" value={v.business.phone ?? ""} onChange={b("phone")} inputMode="tel" />
      </div>
      <div>
        <Label htmlFor="bf-tz">Time zone</Label>
        <Input id="bf-tz" list="bf-tzs" value={v.timezone} onChange={(e) => setV({ ...v, timezone: e.target.value })} required />
        <datalist id="bf-tzs">
          {tzs.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </div>
      <div>
        <Label htmlFor="bf-cur">Currency</Label>
        <Input id="bf-cur" list="bf-curs" value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value.toUpperCase().slice(0, 3) })} required pattern="[A-Za-z]{3}" />
        <datalist id="bf-curs">
          {CURRENCIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div>
        <Label htmlFor="bf-web" hint="optional">Website</Label>
        <Input id="bf-web" value={v.business.website ?? ""} onChange={b("website")} inputMode="url" placeholder="https://" />
      </div>
      <div>
        <Label htmlFor="bf-langs" hint="comma separated">Languages customers write in</Label>
        <Input id="bf-langs" value={langs} onChange={(e) => setLangs(e.target.value)} placeholder="English, Malay" />
      </div>
      <div className="sm:col-span-2">
        {error ? <p className="mb-3 text-[14px] text-signal-ink" role="alert">{error}</p> : null}
        <Button type="submit" variant="brass" loading={busy}>
          {saveLabel}
        </Button>
      </div>
    </form>
  );
}
