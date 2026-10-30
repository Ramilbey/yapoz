"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import type { AppointmentSettings } from "@/db/schema";
import type { Patch } from "./types";

const SELECT = "h-10 w-full rounded-[10px] border border-line bg-raised px-2 text-[14px] sm:max-w-[320px]";
const SLOT_OPTIONS = [15, 30, 45, 60, 90, 120];
const NOTICE_OPTIONS: [number, string][] = [[0, "no notice"], [30, "30 minutes"], [60, "1 hour"], [120, "2 hours"], [240, "4 hours"], [720, "12 hours"], [1440, "24 hours"], [2880, "48 hours"]];
const CUTOFF_OPTIONS = [0, 2, 6, 12, 24, 48, 72];
const REMINDER_OPTIONS: [number, string][] = [[0, "Off"], [15, "15 minutes"], [30, "30 minutes"], [60, "1 hour"], [120, "2 hours"], [1440, "24 hours"]];

/** Adds the saved value to a list of choices, so a number set some other way still shows up. */
function withCurrent(options: [number, string][], value: number, label: (n: number) => string): [number, string][] {
  return options.some(([n]) => n === value) ? options : [...options, [value, label(value)]].sort((a, b) => Number(a[0]) - Number(b[0])) as [number, string][];
}

/**
 * How appointments work: the time grid, who does which service, how far ahead customers can book, what they can
 * change in chat, and reminders. Staff and their hours live on the Calendar page.
 */
export function Appointments({ initial, patch }: { initial: AppointmentSettings; patch: Patch }) {
  const [slotMinutes, setSlotMinutes] = useState(initial.slotMinutes);
  const [assignment, setAssignment] = useState(initial.assignment);
  const [bookingDays, setBookingDays] = useState(String(initial.bookingDays));
  const [minNotice, setMinNotice] = useState(initial.minNoticeMinutes);
  const [cutoff, setCutoff] = useState(initial.changeCutoffHours);
  const [buffer, setBuffer] = useState(String(initial.bufferMinutes));
  const [reminder, setReminder] = useState(initial.reminderMinutes);
  const [meetBase, setMeetBase] = useState(initial.meetBase);
  const [tplName, setTplName] = useState(initial.whatsappTemplate?.name ?? "");
  const [tplLang, setTplLang] = useState(initial.whatsappTemplate?.lang ?? "en");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const name = tplName.trim();
      await patch(
        "/api/settings",
        "PATCH",
        {
          appointments: {
            slotMinutes,
            assignment,
            bookingDays: Number(bookingDays),
            minNoticeMinutes: minNotice,
            changeCutoffHours: cutoff,
            reminderMinutes: reminder,
            bufferMinutes: Number(buffer),
            meetBase: meetBase.trim(),
            whatsappTemplate: name ? { name, lang: tplLang.trim() } : null,
          },
        },
        "Appointment settings saved.",
      );
    } catch {
      // shown by patch()
    } finally {
      setBusy(false);
    }
  }

  const minutesLabel = (n: number) => `${n} minutes`;
  const hoursLabel = (n: number) => `${n} hours`;

  return (
    <section id="appointments" className="scroll-mt-6">
      <h2 className="font-display text-[22px] font-bold">Appointments</h2>
      <p className="mt-1 max-w-[70ch] text-[14px] text-muted">How customers book, change and are reminded of appointments in chat.</p>
      <div className="mt-4 max-w-[760px] space-y-5">
        <div>
          <Label htmlFor="appt-slot">Offer start times every</Label>
          <select id="appt-slot" value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} className={SELECT}>
            {withCurrent(SLOT_OPTIONS.map((n) => [n, minutesLabel(n)]), slotMinutes, minutesLabel).map(([n, label]) => (
              <option key={n} value={n}>
                {label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[12.5px] text-muted">A customer can still ask for any free time.</p>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">Who does what</legend>
          <div className="space-y-2 text-[14px]">
            <label className="flex items-start gap-2">
              <input type="radio" name="appt-assignment" className="mt-1" checked={assignment === "anyone"} onChange={() => setAssignment("anyone")} />
              Anyone who takes appointments does every service
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="appt-assignment" className="mt-1" checked={assignment === "specific"} onChange={() => setAssignment("specific")} />
              Each person does only the services I pick
            </label>
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted">
            Switch staff on and set their hours on the{" "}
            <Link href="/app/calendar" className="underline decoration-brass underline-offset-4">
              Calendar page
            </Link>
            .
          </p>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="appt-days" hint="days">Customers can book up to</Label>
            <Input id="appt-days" type="number" min={1} max={365} value={bookingDays} onChange={(e) => setBookingDays(e.target.value)} />
            <p className="mt-1.5 text-[12.5px] text-muted">days ahead.</p>
          </div>
          <div>
            <Label htmlFor="appt-notice">At least</Label>
            <select id="appt-notice" value={minNotice} onChange={(e) => setMinNotice(Number(e.target.value))} className={SELECT}>
              {withCurrent(NOTICE_OPTIONS, minNotice, minutesLabel).map(([n, label]) => (
                <option key={n} value={n}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[12.5px] text-muted">notice before the appointment.</p>
          </div>
          <div>
            <Label htmlFor="appt-cutoff">Reschedule or cancel in chat up to</Label>
            <select id="appt-cutoff" value={cutoff} onChange={(e) => setCutoff(Number(e.target.value))} className={SELECT}>
              {withCurrent(CUTOFF_OPTIONS.map((n) => [n, hoursLabel(n)]), cutoff, hoursLabel).map(([n, label]) => (
                <option key={n} value={n}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[12.5px] text-muted">before. Closer than that, it comes to you.</p>
          </div>
          <div>
            <Label htmlFor="appt-buffer" hint="minutes">Keep free after each appointment</Label>
            <Input id="appt-buffer" type="number" min={0} max={240} value={buffer} onChange={(e) => setBuffer(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="appt-reminder">Send a reminder</Label>
            <select id="appt-reminder" value={reminder} onChange={(e) => setReminder(Number(e.target.value))} className={SELECT}>
              {withCurrent(REMINDER_OPTIONS, reminder, minutesLabel).map(([n, label]) => (
                <option key={n} value={n}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[12.5px] text-muted">before. Reminders go out when the scheduled sweep runs. Ask whoever runs your hosting to call it every 5 minutes.</p>
          </div>
        </div>

        <div>
          <Label htmlFor="appt-meet">Meeting link server</Label>
          <Input id="appt-meet" type="url" value={meetBase} onChange={(e) => setMeetBase(e.target.value)} placeholder="https://meet.jit.si" />
          <p className="mt-1.5 text-[12.5px] text-muted">Services ticked &lsquo;In person&rsquo; in Knowledge get your address instead of a link.</p>
        </div>

        <div>
          <Label hint="optional">WhatsApp reminder template</Label>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Input aria-label="Template name" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="appointment_reminder" />
            <Input aria-label="Language code" value={tplLang} onChange={(e) => setTplLang(e.target.value)} placeholder="en" />
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted">
            WhatsApp only lets businesses message a customer more than 24 hours after their last message using a template Meta approved. Create a utility template with three variables: service, time, and link or place. Leave empty to
            skip reminders in that case.
          </p>
        </div>

        <Button variant="primary" loading={busy} onClick={save}>
          Save appointment settings
        </Button>
      </div>
    </section>
  );
}
