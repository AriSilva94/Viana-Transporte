-- Shared read access for operational data.
-- Apply this to existing environments that already ran supabase-user-ownership.sql.

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'clients','projects','machines','operators',
    'daily_logs','project_costs','project_revenues'
  ])
  loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_select_authenticated" on public.%1$I', t);
    execute format(
      'create policy "%1$s_select_authenticated" on public.%1$I for select using (auth.role() = ''authenticated'')',
      t
    );
  end loop;
end $$;
