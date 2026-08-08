-- Phase 2: append-only idempotency ledger for the email reminders engine
-- (appointment 24h/1h reminders + per-dose medication reminders). Reuses
-- public.is_admin() from 20260801110045_init_profiles.sql.

create type public.reminder_type as enum ('appointment_24h', 'appointment_1h', 'medication_dose');

create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  reminder_type public.reminder_type not null,
  -- Deliberately NOT a foreign key: depending on reminder_type this points
  -- at either appointments.id or prescription_medicines.id, and a single
  -- column can't target two tables. This table is an append-only
  -- idempotency ledger, not a source of truth — if the source row is ever
  -- hard-deleted, an orphaned reminder_log row is harmless history.
  reference_id uuid not null,
  patient_id uuid not null references public.patients (profile_id),
  -- The reminder's target fire instant (appointment_at minus 24h/1h, or the
  -- computed dose datetime) — deliberately NOT the appointment/dose's own
  -- raw timestamp. If an appointment is rescheduled, both target times
  -- change, so a fresh reminder naturally gets claimed/sent while the old
  -- row is left behind as harmless orphaned history instead of blocking it.
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  email_to text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Claim-then-send idempotency: a 'pending' or 'sent' row for the same
-- (reminder_type, reference_id, scheduled_for) blocks any concurrent
-- duplicate claim, so overlapping cron invocations can never double-send.
-- A 'failed' row deliberately falls outside this partial index so it can
-- be retried on a later cron tick.
create unique index reminder_log_claim_idx
  on public.reminder_log (reminder_type, reference_id, scheduled_for)
  where status in ('pending', 'sent');

create index idx_reminder_log_patient on public.reminder_log (patient_id);

-- Supports the medication-reminders cron's active-prescriptions query.
create index idx_prescription_medicines_start_date on public.prescription_medicines (start_date);

alter table public.reminder_log enable row level security;

create policy "reminder_log_select_admin" on public.reminder_log
  for select using (public.is_admin());

-- No insert/update policies for authenticated/anon on purpose: only the
-- service-role client (used from cron routes, which bypasses RLS) ever
-- writes this table.
