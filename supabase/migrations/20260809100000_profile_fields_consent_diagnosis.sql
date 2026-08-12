-- Gap-fill (SymptoTrack parity, batch 2): no role had any way to edit their
-- own name/phone, patients had no clinical fields beyond DOB/gender/address
-- (no allergies, blood group, emergency contact, or ABHA health ID), there
-- was no DPDP Act 2023 consent capture at signup, and prescriptions had no
-- diagnosis field.

alter table public.patients
  add column allergies text,
  add column blood_group text,
  add column chronic_conditions text,
  add column emergency_contact_name text,
  add column emergency_contact_phone text,
  add column abha_number text;

alter table public.profiles
  add column data_consent_at timestamptz;

alter table public.prescriptions
  add column diagnosis text;

-- handle_new_user must capture DPDP consent at signup time (not as a
-- follow-up authenticated update) because there's no session yet
-- immediately after signUp() when email confirmation is required.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'patient'
  );

  insert into public.profiles (id, role, full_name, approved, data_consent_at)
  values (
    new.id,
    requested_role,
    new.raw_user_meta_data ->> 'full_name',
    requested_role = 'patient',
    case when (new.raw_user_meta_data ->> 'data_consent') = 'true' then now() else null end
  );

  if requested_role = 'doctor' then
    insert into public.doctors (profile_id) values (new.id);
  elsif requested_role = 'patient' then
    insert into public.patients (profile_id) values (new.id);
  end if;

  return new;
end;
$$;
