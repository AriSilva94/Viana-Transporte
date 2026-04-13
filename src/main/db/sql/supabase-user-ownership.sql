-- User Roles and Data Ownership Migration
-- Creates profiles table, adds user_id to all operational tables,
-- backfills existing data to the initial admin user, and closes constraints.

-- 1. Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'owner', 'employee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Add user_id column to all operational tables
alter table public.clients add column if not exists user_id uuid;
alter table public.projects add column if not exists user_id uuid;
alter table public.machines add column if not exists user_id uuid;
alter table public.operators add column if not exists user_id uuid;
alter table public.daily_logs add column if not exists user_id uuid;
alter table public.project_costs add column if not exists user_id uuid;
alter table public.project_revenues add column if not exists user_id uuid;

-- 3. Backfill: assign all existing data to the initial admin user
-- The admin user UUID is resolved at runtime by the bootstrap script.
-- The script calls this via parameterized queries, not inline SQL.

-- 4. Close constraints after backfill (run after bootstrap script confirms no nulls)
-- alter table public.clients alter column user_id set not null;
-- alter table public.clients add constraint clients_user_id_fk foreign key (user_id) references auth.users (id);
-- (repeat for all tables — executed by the bootstrap script after validation)
