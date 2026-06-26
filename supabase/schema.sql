create type public.user_role as enum ('owner', 'manager', 'staff');
create type public.recording_status as enum ('contracted', 'lost', 'follow_up');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  full_name text not null,
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now()
);

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  patient_label text,
  storage_path text,
  transcript text,
  edited_transcript text,
  status public.recording_status not null default 'follow_up',
  lost_reason text,
  created_at timestamptz not null default now()
);

create table public.ai_analyses (
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

create table public.staff_learning_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  total_analyses integer not null default 0,
  average_score numeric(5, 2) not null default 0,
  average_contract_probability numeric(5, 2) not null default 0,
  repeated_weaknesses jsonb not null default '[]'::jsonb,
  last_next_focus jsonb not null default '[]'::jsonb,
  summary text,
  updated_at timestamptz not null default now(),
  unique (staff_id)
);

alter table public.organizations enable row level security;
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.recordings enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.staff_learning_profiles enable row level security;

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "profiles can read same organization"
on public.profiles for select
using (organization_id = public.current_org_id());

create policy "owners and managers can manage profiles"
on public.profiles for update
using (organization_id = public.current_org_id() and public.current_role() in ('owner', 'manager'))
with check (organization_id = public.current_org_id() and public.current_role() in ('owner', 'manager'));

create policy "clinics readable in organization"
on public.clinics for select
using (organization_id = public.current_org_id());

create policy "owners and managers manage clinics"
on public.clinics for all
using (organization_id = public.current_org_id() and public.current_role() in ('owner', 'manager'))
with check (organization_id = public.current_org_id() and public.current_role() in ('owner', 'manager'));

create policy "recordings readable by role"
on public.recordings for select
using (
  organization_id = public.current_org_id()
  and (
    public.current_role() in ('owner', 'manager')
    or staff_id = auth.uid()
  )
);

create policy "staff can insert own recordings"
on public.recordings for insert
with check (organization_id = public.current_org_id() and staff_id = auth.uid());

create policy "recordings editable by role"
on public.recordings for update
using (
  organization_id = public.current_org_id()
  and (public.current_role() in ('owner', 'manager') or staff_id = auth.uid())
)
with check (
  organization_id = public.current_org_id()
  and (public.current_role() in ('owner', 'manager') or staff_id = auth.uid())
);

create policy "analyses readable by role"
on public.ai_analyses for select
using (
  organization_id = public.current_org_id()
  and exists (
    select 1 from public.recordings r
    where r.id = recording_id
    and (public.current_role() in ('owner', 'manager') or r.staff_id = auth.uid())
  )
);

create policy "analyses insert same organization"
on public.ai_analyses for insert
with check (organization_id = public.current_org_id());

create policy "learning profiles readable by role"
on public.staff_learning_profiles for select
using (
  organization_id = public.current_org_id()
  and (public.current_role() in ('owner', 'manager') or staff_id = auth.uid())
);

create policy "learning profiles upsert by role"
on public.staff_learning_profiles for all
using (
  organization_id = public.current_org_id()
  and (public.current_role() in ('owner', 'manager') or staff_id = auth.uid())
)
with check (
  organization_id = public.current_org_id()
  and (public.current_role() in ('owner', 'manager') or staff_id = auth.uid())
);

create index recordings_org_created_idx on public.recordings(organization_id, created_at desc);
create index recordings_staff_created_idx on public.recordings(staff_id, created_at desc);
create index ai_analyses_recording_idx on public.ai_analyses(recording_id);
create index staff_learning_profiles_org_idx on public.staff_learning_profiles(organization_id, updated_at desc);
