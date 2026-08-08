# FriendlyHealthy

Role-based healthcare app connecting patients, doctors, doctor staff, and
admins — doctor search, appointment booking with alerts, prescriptions with
dosage/frequency/duration-driven medication reminders, doctor-maintained
medical records, staff billing + report uploads.

Stack: Next.js (App Router, TypeScript) + Supabase (Postgres/Auth/Storage/RLS)
+ MUI + Redux Toolkit, deployed on Vercel with Vercel Cron driving alert
dispatch. Full build plan: see the project's saved plan file.

## Setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL
   and anon key (Project Settings → API in the Supabase dashboard).
2. Install deps: `npm install`.
3. Apply migrations to your Supabase project: `npx supabase link --project-ref <ref>`
   then `npx supabase db push` (or run against a local stack with
   `npx supabase start` if you have Docker installed).
4. `npm run dev` and open http://localhost:3000.

## Bootstrapping the first admin

Registration only offers patient/doctor/staff roles (admin accounts aren't
self-serve, by design). To create the first admin:

1. Register a normal account through `/register` (any role).
2. In the Supabase SQL editor, run:
   ```sql
   update public.profiles set role = 'admin', approved = true where id = '<user-uuid>';
   ```
   (find the uuid in Authentication → Users in the Supabase dashboard).
3. Sign out and back in — you'll land on `/admin`, where you can approve any
   subsequent doctor/staff signups from the UI.

## Project status

Phase 0 (auth, roles, RLS-backed approval flow) and Phase 1 (doctor search,
appointments, prescriptions, medical records, staff billing + report
uploads) are done. Phase 2 — email reminders for appointments (24h and 1h
before) and per-dose medication reminders, dispatched via Resend and driven
by Vercel Cron hitting `/api/cron/appointment-reminders` and
`/api/cron/medication-reminders` — is now also done.

Known limitations for whoever deploys this next:

- **Cron frequency vs. plan**: `vercel.json` schedules both cron routes at
  `*/15 * * * *`. Vercel's Hobby plan has historically restricted cron job
  frequency more than Pro — verify your current Vercel plan's cron limits
  before relying on a 15-minute cadence in production. If only a coarser
  schedule is available, the window/grace constants in
  `src/lib/reminders/constants.ts` (`DOSE_GRACE_MS`, `STALE_WINDOW_MS`) need
  to be widened to match — cron cadence and window width are coupled.
- **Orphaned claims are reaped, not retried indefinitely**: each cron route
  claims a reminder by inserting a `'pending'` `reminder_log` row before
  sending; if the invocation dies mid-send (e.g. hits `maxDuration = 60`),
  that row would otherwise be stuck forever, since `reminder_log_claim_idx`
  only excludes `'failed'` rows from its uniqueness check. Both routes call
  `reapStalePendingReminders()` first, which flips any `'pending'` row older
  than `PENDING_STALE_MS` (`src/lib/reminders/constants.ts`) to `'failed'` so
  it becomes eligible for re-claiming on that same or a later tick.
- **Single fixed timezone**: reminder times are computed in one clinic-wide
  `REMINDER_TIMEZONE` (defaulting to Asia/Kolkata) since there's no
  per-patient timezone column yet. A future phase should add one if patients
  end up meaningfully spread across timezones.
- **Web push remains unbuilt**: VAPID/service-worker push notifications are
  a future phase, not part of Phase 2's email-only reminders.
- **No automated test framework**: this repo doesn't have one configured, so
  Phase 2's pure helper functions (`parseFrequencyCode`, `zonedTimeToUtc`)
  were verified manually rather than with unit tests. Worth revisiting if
  the team wants that safety net later.
