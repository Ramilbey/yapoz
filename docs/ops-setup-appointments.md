# Yapoz: server setup for the appointments release

**For:** whoever looks after Supabase, Vercel and scheduled jobs.
**Time needed:** about 20–30 minutes.
**What's new:** customers can now book appointments in WhatsApp/Telegram chat. The app needs:

1. a database update in Supabase,
2. a `CRON_SECRET` in Vercel,
3. something that calls one URL **every 5 minutes**, so reminders and payment expiry go out on time.

Do the steps in order. Nothing here needs code changes.

---

## Step 0. Back up the database

The update deletes some old, unused tables (see Step 1), so take a backup first.

- **Supabase dashboard:** Database → Backups. Check there is a recent backup, or make one if your plan allows it.
- **Or from a terminal** (use the *direct / session* connection string, port 5432):
  ```bash
  pg_dump "postgresql://postgres.<project>:<password>@<host>:5432/postgres" -Fc -f yapoz-before-appointments.dump
  ```

---

## Step 1. Update the Supabase database

Three SQL files in the repo, in the `drizzle/` folder, may need running. Each one is **safe to run more than once**: anything already applied is skipped.

| File | What it does | Deletes data? |
|---|---|---|
| `drizzle/0004_cleanup_and_orders.sql` | Removes the old booking, hiring and Instagram tables, and the rows that only belonged to them (HR logins, Instagram customers and their chats). Adds receipt re-requests, message delivery tracking and session sign-out. | **Yes**: the old booking, hiring and Instagram data |
| `drizzle/0005_stock.sql` | Adds stock modes, stock holds and the `expired` order status. | No |
| `drizzle/0006_appointments.sql` | Adds the `staff` and `appointments` tables, the "in person" setting on services and an order type (order or booking), plus live-update triggers and row-level security. | No |

### 1a. See which ones the database already has

In Supabase, open **SQL Editor → New query**, paste this and press **Run**:

```sql
select
  to_regclass('public.requisitions') is null
    and exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'receipt_request') as has_0004,
  to_regclass('public.stock_holds') is not null as has_0005,
  to_regclass('public.appointments') is not null as has_0006;
```

Any column that says `false` is a file you need to run.

### 1b. Run the missing files, in order

Do this **right before** the new code is deployed to Vercel. The new code needs these tables. Running the SQL first doesn't break the version that's live now.

For each missing file, **in order** (0004, then 0005, then 0006):

1. Open the file in the repo and copy **all** of it.
2. In Supabase, go to **SQL Editor → New query**, paste it and press **Run**.
3. It should finish with "Success. No rows returned". If it shows an error, stop and send the error text to the developer.

If you're unsure, it's fine to run all three in order: anything already applied is skipped. Remember that 0004 deletes the old booking, hiring and Instagram data, so check the backup from Step 0 first.

### 1c. Check it worked

Run the query from 1a again. All three columns should now be `true`.

> **Note for later:** these files were run by hand, so the app's own migration tracker doesn't know about them. If someone later runs `npm run db:migrate` against this database, the files will run again. That's harmless, because they're safe to re-run.

### Brand-new database

If you're setting up a brand-new, empty database instead, run `drizzle/supabase_setup.sql` once. It already includes all of the above.

---

## Step 2. Set `CRON_SECRET` in Vercel

The scheduled URL is protected by a shared secret. If `CRON_SECRET` is already set in Vercel, keep it and skip to Step 3.

1. Make a long random value, for example:
   ```bash
   openssl rand -hex 32
   ```
2. Go to **Vercel → the Yapoz project → Settings → Environment Variables**. Add `CRON_SECRET` with that value, for **Production** (and Preview, if you use it).
3. **Redeploy** (Deployments → latest → ⋯ → Redeploy), so the new value takes effect.
4. Keep the value somewhere safe (a password manager). You'll paste it in Step 3.

---

## Step 3. Call the sweep every 5 minutes

**Why:** the app has one housekeeping URL, `GET /api/jobs/sweep`. It sends appointment reminders (default: 1 hour before), expires unpaid orders and bookings after their 20-minute payment window and tells the customer, retries failed background jobs, and deletes old data per each business's privacy setting.

The Vercel cron in `vercel.json` only runs **once a day**, because that's all Vercel's Hobby plan allows. That's far too slow for 1-hour reminders. Leave it in place, and add **one** of the options below.

Running both A and B is harmless, but one is enough. Each reminder and each expiry is claimed exactly once, so overlapping calls never send anything twice.

You need two values:

- **URL:** `https://<your-app-domain>/api/jobs/sweep` (the production domain, e.g. `https://yapoz.vercel.app/api/jobs/sweep`)
- **Header:** `Authorization: Bearer <CRON_SECRET>`. That's the word `Bearer`, one space, then the secret.

### Option A: cron-job.org (free, simplest)

1. Sign up at **https://cron-job.org** and open the console.
2. Click **Create cronjob**.
3. Fill in:
   - **Title:** `Yapoz sweep`
   - **URL:** `https://<your-app-domain>/api/jobs/sweep`
   - **Execution schedule:** every **5 minutes**
4. Open the **Advanced** tab (exact labels may differ slightly):
   - **Request method:** `GET`
   - **Headers:** add one header with key `Authorization` and value `Bearer <CRON_SECRET>`
   - **Timeout:** the highest value allowed (the free plan allows about 30 seconds; the sweep normally takes a few seconds)
5. Under **Notifications**, turn on **notify on failure**, so you hear if it stops working.
6. **Save**, then use **Test run** (or wait 5 minutes) and check the job's history.
   - **Working:** HTTP status **200**.
   - **Wrong or missing header:** HTTP **401** "unauthorized". Check the header value and that Vercel was redeployed after setting `CRON_SECRET`.

### Option B: Supabase's built-in scheduler (pg_cron + pg_net)

Use this if you'd rather keep everything inside Supabase.

1. In Supabase, go to **SQL Editor → New query**.
2. Replace the two placeholders below, then **Run** it:
   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;

   select cron.schedule(
     'yapoz-sweep',
     '*/5 * * * *',
     $$
     select net.http_get(
       url := 'https://<your-app-domain>/api/jobs/sweep',
       headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>'),
       timeout_milliseconds := 30000
     );
     $$
   );
   ```
   (You can also enable the two extensions under **Database → Extensions**.)
3. After 5–10 minutes, check it ran and got a 200 back:
   ```sql
   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
   select status_code, content, created from net._http_response order by created desc limit 5;
   ```
4. **To change or stop it:** `select cron.unschedule('yapoz-sweep');`, then schedule it again.

The secret is stored in the `cron.job` table, so anyone with SQL access to this database can read it. If you change `CRON_SECRET` in Vercel, unschedule and schedule again with the new value.

---

## Step 4. Test the sweep by hand

From any terminal:

```bash
curl -s -H "Authorization: Bearer <CRON_SECRET>" https://<your-app-domain>/api/jobs/sweep
```

**Expected:** JSON with counts, for example:

```json
{"due":0,"ran":0,"expired":0,"reminded":0,"purged":{"threads":0,"receipts":0}}
```

The exact fields depend on what there was to do. `expired` and `reminded` count what that one call handled, so 0 is normal.

**Without the header**, the same URL must answer `unauthorized` (HTTP 401). If it answers with JSON instead, `CRON_SECRET` isn't set. Go back to Step 2.

---

## Step 5 (optional). WhatsApp reminder template

**Why it's needed:** WhatsApp only lets a business send free text within **24 hours** of the customer's last message. After that, only **templates approved by Meta** can be sent. A booking made days ahead usually falls outside that window, so its reminder needs a template. Without one, that reminder fails and the order shows "customer not told". Telegram doesn't have this limit.

1. Go to **Meta Business Suite → WhatsApp Manager → Message templates → Create template**.
2. Set the **Category** to **Utility**, give it a **Name** such as `booking_reminder`, and pick a **Language**, e.g. English (`en`).
3. **Body:** three variables, in this order: service, time, then the link or place. For example:
   > Reminder: your {{1}} booking is at {{2}}. Join or find us here: {{3}}. Reply if you can't make it.
4. Submit it and wait for approval (usually minutes to a day).
5. Once approved, the business owner enters the exact template **name** and **language code** in Yapoz under **Settings → Appointments → WhatsApp reminder template**.

---

## Step 6. Hand over to the business owner

This is done inside the app, not on the servers. A business that signs up now is asked most of this in setup (step 4, "How you sell": where appointments happen, who takes bookings, the time grid, notice and durations). For a business that finished setup before this update, or to change things later, tell the owner:

- **Settings → Appointments:** time grid, how far ahead people can book, minimum notice, change/cancel cutoff, reminder time, gap between appointments, meeting server.
- **Calendar → Team availability:** switch on each person who takes appointments, set their hours and days off, and (if chosen) which services they do.
- **Knowledge:** for each service, tick "In person" if it isn't online, and set its duration.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Orders or Calendar page errors with `relation "appointments" does not exist` or `column "kind" does not exist` | Step 1 not done (0006 missing) | Run `drizzle/0006_appointments.sql` in the SQL Editor |
| `column ... does not exist` or an unknown `expired` status | 0005 missing | Run `drizzle/0005_stock.sql`, then 0006 |
| cron-job.org shows **401** | Header wrong, or Vercel not redeployed after setting `CRON_SECRET` | Header must be exactly `Authorization: Bearer <secret>`; redeploy |
| cron-job.org shows **404** | Wrong domain or path | Use the production domain plus `/api/jobs/sweep` |
| Reminders arrive late or not at all | Sweep isn't running every 5 minutes | Check the cron history (Step 3) and run the manual test (Step 4) |
| WhatsApp reminders fail with "Outside WhatsApp's 24-hour customer service window" | No approved template set | Step 5 |
| Supabase `cron.job_run_details` shows success but no `net._http_response` row, or status 401 | Wrong URL or secret inside the scheduled SQL | Unschedule and schedule again with the right values |

## Good to know

- **Meeting links:** online bookings get a link on the public Jitsi server `https://meet.jit.si`. Jitsi now asks the first person who opens a room (the host) to sign in, e.g. with Google. Staff should open the link a minute early. A business can point to its own Jitsi server in Settings → Appointments.
- **Nothing is double-booked if the sweep is late.** Free times are always worked out live, so a late or missed sweep only delays reminder and expiry *messages*. It never lets two customers book the same slot.
