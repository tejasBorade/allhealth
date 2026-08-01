-- Phase 0: profiles table, role enum, and the RLS helper functions every
-- later migration (doctors/patients/appointments/...) will build on.

create type public.user_role as enum ('patient', 'doctor', 'staff', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'patient',
  full_name text,
  phone text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth.users id. Patients are auto-approved on signup; '
  'doctor/staff/admin roles require manual admin approval before they '
  'can use role-gated pages (enforced in the app, not just here).';

alter table public.profiles enable row level security;

-- Returns the caller's own role, bypassing RLS via security definer so
-- policies that check role never recurse into profiles' own RLS.
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_user_role() = 'admin';
$$;

-- New auth.users row -> matching profiles row. Role/full_name come from
-- signup metadata (supabase.auth.signUp({ options: { data: { role, full_name } } })).
-- Patients are auto-approved; every other role starts unapproved.
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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only an admin may change role/approved on an existing profile — prevents
-- a patient signup from self-promoting to doctor/admin via a client update.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.approved is distinct from old.approved then
      raise exception 'Only an admin can change role or approval status';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_prevent_self_role_change
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());
