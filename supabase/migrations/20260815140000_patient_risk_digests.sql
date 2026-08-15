-- AI Patient Risk & Adherence Digest: a doctor-facing, proactive digest that
-- flags patients whose medication adherence is dropping or whose recent
-- vitals are trending the wrong way. The AI (called from application code,
-- not from this migration) never decides *who* is flagged — that's the
-- deterministic adherence_pct_recent/prior + vitals_flag columns below,
-- computed in src/lib/riskDigest/metrics.ts. The AI only turns an already
-- -flagged patient's numbers into summary_text/suggested_action, and both
-- of those may be null if the AI call fails or ANTHROPIC_API_KEY is unset —
-- the feature must degrade to numbers-only, never break.

create table public.patient_risk_digests (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (profile_id),
  patient_id uuid not null references public.patients (profile_id),
  computed_at timestamptz not null default now(),
  flagged boolean not null default false,
  adherence_pct_recent int,
  adherence_pct_prior int,
  vitals_flag boolean not null default false,
  vitals_note text,
  summary_text text,
  suggested_action text,
  dismissed_at timestamptz,
  constraint patient_risk_digests_unique unique (doctor_id, patient_id)
);

create index idx_patient_risk_digests_doctor on public.patient_risk_digests (doctor_id, flagged);

alter table public.patient_risk_digests enable row level security;

create policy "patient_risk_digests_select" on public.patient_risk_digests
  for select using (
    doctor_id = auth.uid() or public.current_user_role() in ('staff', 'admin')
  );

create policy "patient_risk_digests_insert_own" on public.patient_risk_digests
  for insert with check (doctor_id = auth.uid());

create policy "patient_risk_digests_update_own" on public.patient_risk_digests
  for update using (doctor_id = auth.uid());

-- Same pattern as handle_new_user / the notifications_and_messages triggers:
-- "who gets notified when" lives in the database, not scattered across
-- application code. Fires only on the transition into a flagged state (a
-- fresh row that's flagged, or an existing row moving from
-- not-flagged/dismissed to flagged) so a doctor isn't renotified for a
-- patient that's already showing as flagged and undismissed.
create or replace function public.notify_risk_digest_flagged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.flagged and (
    tg_op = 'INSERT'
    or not old.flagged
    or old.dismissed_at is not null
  ) then
    insert into public.notifications (user_id, type, title, body, link)
    select
      new.doctor_id,
      'risk_digest_flagged',
      'Patient risk flagged',
      coalesce(p.full_name, 'A patient') || ' may need a check-in — ' ||
        coalesce(new.summary_text, coalesce(new.vitals_note, 'see Patient Risk Radar for details')),
      '/doctor'
    from public.profiles p
    where p.id = new.patient_id;
  end if;
  return new;
end;
$$;

create trigger trg_notify_risk_digest_flagged
  after insert or update on public.patient_risk_digests
  for each row execute function public.notify_risk_digest_flagged();
