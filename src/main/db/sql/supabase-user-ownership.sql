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

-- 3. Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin can manage all profiles"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Enable RLS on operational tables (user_id scoping)
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'clients','projects','machines','operators',
    'daily_logs','project_costs','project_revenues'
  ])
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "%1$s_select_own" on public.%1$I for select using (auth.uid() = user_id)', t
    );
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I for insert with check (auth.uid() = user_id)', t
    );
    execute format(
      'create policy "%1$s_update_own" on public.%1$I for update using (auth.uid() = user_id)', t
    );
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I for delete using (auth.uid() = user_id)', t
    );
  end loop;
end $$;

-- 5. Backfill: assign all existing data to the initial admin user
-- The admin user UUID is resolved at runtime by the bootstrap script.
-- The script calls this via parameterized queries, not inline SQL.

-- 6. Close constraints after backfill (run after bootstrap script confirms no nulls)
-- alter table public.clients alter column user_id set not null;
-- alter table public.clients add constraint clients_user_id_fk foreign key (user_id) references auth.users (id);
-- (repeat for all tables — executed by the bootstrap script after validation)
