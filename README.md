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

Phase 0 (auth, roles, RLS-backed approval flow) is done. Doctor
search/appointments/prescriptions/medical records/billing, the alerts engine,
and file uploads are still to be built — see the saved plan for the full
phase breakdown.
