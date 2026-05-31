-- ══════════════════════════════════════════════════════════
-- CRUMLEY OS — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ══════════════════════════════════════════════════════════

-- ─── PROFILES (owner account) ───
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  business_name text default 'All In One Luxury Designs',
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- ALL IN ONE LUXURY — Staging & Moving
-- ══════════════════════════════════════════════════════════

-- ─── STAGING / MOVING JOBS ───
create table if not exists luxury_jobs (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  address text not null,
  client_name text,
  agent_name text,
  client_phone text,
  client_email text,
  job_type text default 'install' check (job_type in ('install','transfer','moving')),
  install_date date,
  end_date date,
  value numeric default 2750,
  status text default 'active' check (status in ('active','expiring','overdue','pickup','completed')),
  rooms text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── INVOICES ───
create table if not exists luxury_invoices (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  job_id uuid references luxury_jobs on delete set null,
  amount numeric not null,
  status text default 'unpaid' check (status in ('unpaid','paid','overdue')),
  due_date date,
  paid_date date,
  payment_method text,
  created_at timestamptz default now()
);

-- ─── CLIENTS / CRM ───
create table if not exists luxury_clients (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text default 'agent' check (type in ('agent','builder','developer','homeowner')),
  phone text,
  email text,
  company text,
  notes text,
  total_jobs int default 0,
  created_at timestamptz default now()
);

-- ─── TEAM / STAFF ───
create table if not exists luxury_staff (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  role text default 'helper',
  phone text,
  pay_rate numeric,
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- COACH T — Training
-- ══════════════════════════════════════════════════════════

-- ─── ATHLETES ───
create table if not exists coach_athletes (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  sport text default 'General',
  position text,
  age int,
  weight int,
  height text,
  goal text,
  injuries text,
  frequency int default 2,
  sessions_left int default 0,
  package_value numeric default 0,
  status text default 'active' check (status in ('active','urgent','inactive')),
  parent_name text,
  parent_phone text,
  parent_email text,
  notes text,
  maxes jsonb default '{}',
  created_at timestamptz default now()
);

-- ─── PROGRESS LOG ───
create table if not exists coach_progress (
  id uuid default gen_random_uuid() primary key,
  athlete_id uuid references coach_athletes on delete cascade not null,
  owner_id uuid references auth.users on delete cascade not null,
  note text not null,
  log_date date default current_date,
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- SHARED — Master Scheduling Engine
-- ══════════════════════════════════════════════════════════

-- ─── UNIFIED CALENDAR EVENTS ───
create table if not exists schedule_events (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  title text not null,
  business text not null check (business in ('luxury','coach','personal')),
  event_type text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_locked boolean default false,    -- D1 commitments are locked
  priority int default 3,             -- 1=urgent staging, 5=admin
  location text,
  related_job_id uuid references luxury_jobs on delete set null,
  related_athlete_id uuid references coach_athletes on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — owner sees only their own data
-- ══════════════════════════════════════════════════════════
alter table profiles enable row level security;
alter table luxury_jobs enable row level security;
alter table luxury_invoices enable row level security;
alter table luxury_clients enable row level security;
alter table luxury_staff enable row level security;
alter table coach_athletes enable row level security;
alter table coach_progress enable row level security;
alter table schedule_events enable row level security;

-- Policies: each table — owner can do everything with their own rows
create policy "own_profile" on profiles for all using (auth.uid() = id);
create policy "own_jobs" on luxury_jobs for all using (auth.uid() = owner_id);
create policy "own_invoices" on luxury_invoices for all using (auth.uid() = owner_id);
create policy "own_clients" on luxury_clients for all using (auth.uid() = owner_id);
create policy "own_staff" on luxury_staff for all using (auth.uid() = owner_id);
create policy "own_athletes" on coach_athletes for all using (auth.uid() = owner_id);
create policy "own_progress" on coach_progress for all using (auth.uid() = owner_id);
create policy "own_events" on schedule_events for all using (auth.uid() = owner_id);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
