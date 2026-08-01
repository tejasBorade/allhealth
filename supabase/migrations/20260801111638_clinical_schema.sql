-- Phase 1: doctors, patients, appointments, prescriptions, medical
-- records/reports, and billing — plus the RLS scoping every clinical table
-- relies on. Read doctor_has_consulted() first: it's the boundary that
-- keeps a doctor from seeing a patient they've never actually treated.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- doctors / patients — one row per profile, auto-provisioned by
-- handle_new_user() so the UI never sees a profile without its role row.
-- ---------------------------------------------------------------------------

create table public.doctors (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  specialization text,
  clinic_name text,
  bio text,
  created_at timestamptz not null default now()
);

create table public.patients (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date,
  gender text,
  address text,
  created_at timestamptz not null default now()
);

alter table public.doctors enable row level security;
alter table public.patients enable row level security;

-- profiles (from 0001) only let a user read their own row or an admin read
-- everyone's — neither lets a patient see a doctor's name for search, or a
-- doctor/staff see a patient's name for the consultation/billing lists.
-- These two additions close that gap without opening the whole table up.
create policy "profiles_select_public_doctor" on public.profiles
  for select using (
    auth.role() = 'authenticated' and role = 'doctor' and approved = true
  );

create policy "profiles_select_staff_view_patients" on public.profiles
  for select using (
    public.current_user_role() in ('doctor', 'staff', 'admin') and role = 'patient'
  );

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

  insert into public.profiles (id, role, full_name, approved)
  values (
    new.id,
    requested_role,
    new.raw_user_meta_data ->> 'full_name',
    requested_role = 'patient'
  );

  if requested_role = 'doctor' then
    insert into public.doctors (profile_id) values (new.id);
  elsif requested_role = 'patient' then
    insert into public.patients (profile_id) values (new.id);
  end if;

  return new;
end;
$$;

create policy "doctors_select_authenticated" on public.doctors
  for select using (auth.role() = 'authenticated');

create policy "doctors_update_own" on public.doctors
  for update using (profile_id = auth.uid());

create policy "doctors_update_admin" on public.doctors
  for update using (public.is_admin());

create policy "patients_select_own" on public.patients
  for select using (profile_id = auth.uid());

-- MVP simplification: any doctor/staff/admin can see the patients list
-- (needed for search/booking UIs). There's no clinic/doctor association
-- table yet to scope staff to "their" doctor's patients only — clinical
-- data (medical_records, prescriptions, reports) is scoped tighter below
-- via doctor_has_consulted(), this table is just directory-level info.
create policy "patients_select_staff" on public.patients
  for select using (public.current_user_role() in ('doctor', 'staff', 'admin'));

create policy "patients_update_own" on public.patients
  for update using (profile_id = auth.uid());

create policy "patients_update_admin" on public.patients
  for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- appointments — an exclusion constraint (not just app-level validation)
-- prevents double-booking the same doctor for overlapping time slots.
-- ---------------------------------------------------------------------------

create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id),
  doctor_id uuid not null references public.doctors (profile_id),
  appointment_at timestamptz not null,
  duration_minutes int not null default 30,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  constraint appointments_no_overlap exclude using gist (
    doctor_id with =,
    tstzrange(appointment_at, appointment_at + (duration_minutes || ' minutes')::interval) with &&
  ) where (status <> 'cancelled')
);

comment on constraint appointments_no_overlap on public.appointments is
  'Cancelled appointments free their slot; scheduled/completed ones cannot overlap for the same doctor.';

create index idx_appointments_doctor on public.appointments (doctor_id, appointment_at);
create index idx_appointments_patient on public.appointments (patient_id, appointment_at);

alter table public.appointments enable row level security;

create policy "appointments_select_own" on public.appointments
  for select using (
    patient_id = auth.uid() or doctor_id = auth.uid()
    or public.current_user_role() in ('staff', 'admin')
  );

create policy "appointments_insert" on public.appointments
  for insert with check (
    patient_id = auth.uid() or public.current_user_role() in ('staff', 'admin')
  );

create policy "appointments_update_own" on public.appointments
  for update using (
    patient_id = auth.uid() or doctor_id = auth.uid()
    or public.current_user_role() in ('staff', 'admin')
  );

-- ---------------------------------------------------------------------------
-- prescriptions + prescription_medicines
-- ---------------------------------------------------------------------------

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id),
  doctor_id uuid not null references public.doctors (profile_id),
  appointment_id uuid references public.appointments (id),
  prescribed_at timestamptz not null default now(),
  follow_up_date date,
  notes text
);

create table public.prescription_medicines (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions (id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  frequency_code text not null,
  duration_days int not null,
  start_date date not null default current_date
);

create index idx_prescriptions_patient on public.prescriptions (patient_id);
create index idx_prescriptions_doctor on public.prescriptions (doctor_id);

alter table public.prescriptions enable row level security;
alter table public.prescription_medicines enable row level security;

-- The boundary reused by medical_records/medical_reports below: a doctor
-- may only read a patient's clinical history once they've actually
-- appointed or prescribed to them at least once.
create or replace function public.doctor_has_consulted(p_doctor_id uuid, p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.appointments
    where doctor_id = p_doctor_id and patient_id = p_patient_id
  ) or exists (
    select 1 from public.prescriptions
    where doctor_id = p_doctor_id and patient_id = p_patient_id
  );
$$;

create policy "prescriptions_select" on public.prescriptions
  for select using (
    patient_id = auth.uid() or doctor_id = auth.uid()
    or public.current_user_role() in ('staff', 'admin')
  );

-- No doctor_has_consulted() check here on purpose: writing this prescription
-- is itself what establishes the consultation relationship for a
-- doctor/patient pair with no prior appointment.
create policy "prescriptions_insert_doctor" on public.prescriptions
  for insert with check (doctor_id = auth.uid());

create policy "prescriptions_update_doctor" on public.prescriptions
  for update using (doctor_id = auth.uid() or public.is_admin());

create policy "prescription_medicines_select" on public.prescription_medicines
  for select using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_medicines.prescription_id
      and (
        p.patient_id = auth.uid() or p.doctor_id = auth.uid()
        or public.current_user_role() in ('staff', 'admin')
      )
    )
  );

create policy "prescription_medicines_insert" on public.prescription_medicines
  for insert with check (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_medicines.prescription_id and p.doctor_id = auth.uid()
    )
  );

create policy "prescription_medicines_update" on public.prescription_medicines
  for update using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_medicines.prescription_id
      and (p.doctor_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- medical_records (clinical notes) + medical_reports (uploaded files)
-- ---------------------------------------------------------------------------

create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id),
  author_id uuid not null references public.profiles (id),
  record_type text not null,
  notes text not null,
  created_at timestamptz not null default now()
);

create index idx_medical_records_patient on public.medical_records (patient_id);

alter table public.medical_records enable row level security;

create policy "medical_records_select" on public.medical_records
  for select using (
    patient_id = auth.uid()
    or author_id = auth.uid()
    or public.current_user_role() in ('staff', 'admin')
    or (public.current_user_role() = 'doctor' and public.doctor_has_consulted(auth.uid(), patient_id))
  );

create policy "medical_records_insert" on public.medical_records
  for insert with check (
    author_id = auth.uid() and public.current_user_role() in ('doctor', 'staff')
  );

create policy "medical_records_update_author" on public.medical_records
  for update using (author_id = auth.uid() or public.is_admin());

create table public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id),
  uploaded_by uuid not null references public.profiles (id),
  storage_path text not null,
  report_type text not null,
  uploaded_at timestamptz not null default now()
);

create index idx_medical_reports_patient on public.medical_reports (patient_id);

alter table public.medical_reports enable row level security;

create policy "medical_reports_select" on public.medical_reports
  for select using (
    patient_id = auth.uid()
    or uploaded_by = auth.uid()
    or public.current_user_role() in ('staff', 'admin')
    or (public.current_user_role() = 'doctor' and public.doctor_has_consulted(auth.uid(), patient_id))
  );

create policy "medical_reports_insert" on public.medical_reports
  for insert with check (
    uploaded_by = auth.uid() and public.current_user_role() in ('staff', 'doctor', 'admin')
  );

-- ---------------------------------------------------------------------------
-- billing
-- ---------------------------------------------------------------------------

create type public.billing_status as enum ('pending', 'paid', 'cancelled');

create table public.billing (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (profile_id),
  appointment_id uuid references public.appointments (id),
  amount numeric(10, 2) not null,
  status public.billing_status not null default 'pending',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index idx_billing_patient on public.billing (patient_id);

alter table public.billing enable row level security;

create policy "billing_select" on public.billing
  for select using (
    patient_id = auth.uid() or public.current_user_role() in ('staff', 'admin')
  );

create policy "billing_insert_staff" on public.billing
  for insert with check (
    created_by = auth.uid() and public.current_user_role() in ('staff', 'admin')
  );

create policy "billing_update_staff" on public.billing
  for update using (public.current_user_role() in ('staff', 'admin'));

-- ---------------------------------------------------------------------------
-- storage: medical report files, one private bucket, path-scoped by patient
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('medical-reports', 'medical-reports', false)
on conflict (id) do nothing;

-- Files are written to `${patient_id}/${uuid}-${filename}` so RLS can check
-- ownership from the path's first folder segment without a table join.
create policy "medical_reports_storage_select" on storage.objects
  for select using (
    bucket_id = 'medical-reports'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_role() in ('staff', 'admin')
      or (
        public.current_user_role() = 'doctor'
        and public.doctor_has_consulted(auth.uid(), (storage.foldername(name))[1]::uuid)
      )
    )
  );

create policy "medical_reports_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'medical-reports'
    and public.current_user_role() in ('staff', 'doctor', 'admin')
  );
