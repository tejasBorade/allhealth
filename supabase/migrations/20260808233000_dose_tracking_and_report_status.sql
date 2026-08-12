-- Gap-fill (SymptoTrack parity pass): the doctor dashboard's adherence and
-- critical-alerts widgets need two things that didn't exist before —
-- (1) proof a dose was actually taken (reminder_log only proves a reminder
-- was *sent*, not that the patient took the medicine), and (2) a review
-- status on uploaded lab reports so a doctor can triage/flag them.

create type public.report_status as enum ('pending', 'reviewed', 'critical');

alter table public.medical_reports
  add column status public.report_status not null default 'pending';

create policy "medical_reports_update_reviewer" on public.medical_reports
  for update using (
    public.current_user_role() in ('staff', 'admin')
    or (public.current_user_role() = 'doctor' and public.doctor_has_consulted(auth.uid(), patient_id))
  );

-- ---------------------------------------------------------------------------
-- dose_logs — one row per dose the patient has confirmed taking. This is the
-- source of truth for adherence %; reminder_log is a delivery ledger, not an
-- intake record, and was never meant to answer "did they actually take it".
-- ---------------------------------------------------------------------------

create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  prescription_medicine_id uuid not null references public.prescription_medicines (id) on delete cascade,
  patient_id uuid not null references public.patients (profile_id),
  scheduled_for timestamptz not null,
  taken_at timestamptz not null default now(),
  constraint dose_logs_unique_dose unique (prescription_medicine_id, scheduled_for)
);

create index idx_dose_logs_patient on public.dose_logs (patient_id, scheduled_for);
create index idx_dose_logs_medicine on public.dose_logs (prescription_medicine_id, scheduled_for);

alter table public.dose_logs enable row level security;

create policy "dose_logs_select" on public.dose_logs
  for select using (
    patient_id = auth.uid()
    or public.current_user_role() in ('staff', 'admin')
    or (public.current_user_role() = 'doctor' and public.doctor_has_consulted(auth.uid(), patient_id))
  );

create policy "dose_logs_insert_own" on public.dose_logs
  for insert with check (patient_id = auth.uid());

create policy "dose_logs_delete_own" on public.dose_logs
  for delete using (patient_id = auth.uid());
