create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('owner', 'manager', 'staff');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.recording_status as enum ('contracted', 'lost', 'follow_up');
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  full_name text not null,
  role public.user_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  patient_label text,
  original_file_name text,
  storage_path text,
  transcript text,
  edited_transcript text,
  status public.recording_status not null default 'follow_up',
  lost_reason text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  model text not null,
  overall_score integer not null check (overall_score between 0 and 100),
  contract_probability integer not null check (contract_probability between 0 and 100),
  improved_probability integer not null check (improved_probability between 0 and 100),
  patient_type text,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_learning_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  total_analyses integer not null default 0,
  average_score numeric(5,2) not null default 0,
  average_contract_probability numeric(5,2) not null default 0,
  repeated_weaknesses jsonb not null default '[]'::jsonb,
  last_next_focus jsonb not null default '[]'::jsonb,
  summary text,
  updated_at timestamptz not null default now(),
  unique (staff_id)
);

create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  email text not null,
  full_name text not null,
  role public.user_role not null default 'staff',
  invited_by uuid not null references public.profiles(id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public
as $$ select organization_id from public.profiles where id = auth.uid() and is_active = true $$;

create or replace function public.current_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and is_active = true $$;

alter table public.organizations enable row level security;
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.recordings enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.staff_learning_profiles enable row level security;
alter table public.staff_invitations enable row level security;

drop policy if exists "organizations readable by members" on public.organizations;
create policy "organizations readable by members" on public.organizations for select
using (id = public.current_org_id());

drop policy if exists "clinics readable in organization" on public.clinics;
create policy "clinics readable in organization" on public.clinics for select
using (organization_id = public.current_org_id());

drop policy if exists "owners and managers manage clinics" on public.clinics;
create policy "owners and managers manage clinics" on public.clinics for all
using (organization_id = public.current_org_id() and public.current_role() in ('owner','manager'))
with check (organization_id = public.current_org_id() and public.current_role() in ('owner','manager'));

drop policy if exists "profiles can read same organization" on public.profiles;
create policy "profiles can read same organization" on public.profiles for select
using (organization_id = public.current_org_id());

drop policy if exists "owners and managers can manage profiles" on public.profiles;
create policy "owners and managers can manage profiles" on public.profiles for update
using (organization_id = public.current_org_id() and public.current_role() in ('owner','manager'))
with check (organization_id = public.current_org_id() and public.current_role() in ('owner','manager'));

drop policy if exists "recordings readable by role" on public.recordings;
create policy "recordings readable by role" on public.recordings for select
using (organization_id = public.current_org_id() and (public.current_role() in ('owner','manager') or staff_id = auth.uid()));

drop policy if exists "staff can insert own recordings" on public.recordings;
create policy "staff can insert own recordings" on public.recordings for insert
with check (organization_id = public.current_org_id() and staff_id = auth.uid());

drop policy if exists "recordings editable by role" on public.recordings;
create policy "recordings editable by role" on public.recordings for update
using (organization_id = public.current_org_id() and (public.current_role() in ('owner','manager') or staff_id = auth.uid()))
with check (organization_id = public.current_org_id() and (public.current_role() in ('owner','manager') or staff_id = auth.uid()));

drop policy if exists "recordings deletable by managers" on public.recordings;
create policy "recordings deletable by managers" on public.recordings for delete
using (organization_id = public.current_org_id() and public.current_role() in ('owner','manager'));

drop policy if exists "analyses readable by role" on public.ai_analyses;
create policy "analyses readable by role" on public.ai_analyses for select
using (
  organization_id = public.current_org_id()
  and exists (
    select 1 from public.recordings r
    where r.id = recording_id
      and (public.current_role() in ('owner','manager') or r.staff_id = auth.uid())
  )
);

drop policy if exists "analyses insert same organization" on public.ai_analyses;
create policy "analyses insert same organization" on public.ai_analyses for insert
with check (organization_id = public.current_org_id());

drop policy if exists "analyses deletable by managers" on public.ai_analyses;
create policy "analyses deletable by managers" on public.ai_analyses for delete
using (organization_id = public.current_org_id() and public.current_role() in ('owner','manager'));

drop policy if exists "learning profiles readable by role" on public.staff_learning_profiles;
create policy "learning profiles readable by role" on public.staff_learning_profiles for select
using (organization_id = public.current_org_id() and (public.current_role() in ('owner','manager') or staff_id = auth.uid()));

drop policy if exists "learning profiles upsert by role" on public.staff_learning_profiles;
create policy "learning profiles upsert by role" on public.staff_learning_profiles for all
using (organization_id = public.current_org_id() and (public.current_role() in ('owner','manager') or staff_id = auth.uid()))
with check (organization_id = public.current_org_id() and (public.current_role() in ('owner','manager') or staff_id = auth.uid()));

drop policy if exists "managers manage invitations" on public.staff_invitations;
create policy "managers manage invitations" on public.staff_invitations for all
using (organization_id = public.current_org_id() and public.current_role() in ('owner','manager'))
with check (organization_id = public.current_org_id() and public.current_role() in ('owner','manager'));

create index if not exists recordings_org_created_idx on public.recordings(organization_id, created_at desc);
create index if not exists recordings_staff_created_idx on public.recordings(staff_id, created_at desc);
create index if not exists ai_analyses_recording_idx on public.ai_analyses(recording_id);
create index if not exists ai_analyses_org_created_idx on public.ai_analyses(organization_id, created_at desc);
create index if not exists staff_learning_profiles_org_idx on public.staff_learning_profiles(organization_id, updated_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recordings',
  'recordings',
  false,
  104857600,
  array['audio/mp4','audio/mpeg','audio/wav','audio/x-m4a','audio/aac']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members upload own recordings" on storage.objects;
create policy "members upload own recordings" on storage.objects for insert to authenticated
with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = public.current_org_id()::text);

drop policy if exists "members read organization recordings" on storage.objects;
create policy "members read organization recordings" on storage.objects for select to authenticated
using (bucket_id = 'recordings' and (storage.foldername(name))[1] = public.current_org_id()::text);

drop policy if exists "managers delete organization recordings" on storage.objects;
create policy "managers delete organization recordings" on storage.objects for delete to authenticated
using (
  bucket_id = 'recordings'
  and (storage.foldername(name))[1] = public.current_org_id()::text
  and public.current_role() in ('owner','manager')
);

create or replace function public.handle_invited_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_org_id uuid;
  invited_clinic_id uuid;
  invited_role public.user_role;
begin
  if new.raw_user_meta_data ->> 'organization_id' is null then
    return new;
  end if;

  invited_org_id := (new.raw_user_meta_data ->> 'organization_id')::uuid;
  invited_clinic_id := (new.raw_user_meta_data ->> 'clinic_id')::uuid;
  invited_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'staff');

  insert into public.profiles (id, organization_id, clinic_id, full_name, role, is_active)
  values (
    new.id,
    invited_org_id,
    invited_clinic_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    invited_role,
    true
  )
  on conflict (id) do update set
    organization_id = excluded.organization_id,
    clinic_id = excluded.clinic_id,
    full_name = excluded.full_name,
    role = excluded.role,
    is_active = true,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_invited_user_created on auth.users;
create trigger on_invited_user_created
after insert on auth.users
for each row execute function public.handle_invited_user();
