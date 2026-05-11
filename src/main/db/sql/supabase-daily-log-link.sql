-- Daily Log Link Migration
-- Adds optional daily_log_id FK to project_costs and project_revenues so that
-- cost/revenue records can be linked to a daily log entry. The linked log
-- carries the operational formula fields (tonnage × percentage × km + toll)
-- used to derive a computed reference value for the cost/revenue.

alter table public.project_costs
  add column if not exists daily_log_id bigint
  references public.daily_logs (id) on delete set null;

alter table public.project_revenues
  add column if not exists daily_log_id bigint
  references public.daily_logs (id) on delete set null;

create index if not exists idx_project_costs_daily_log_id
  on public.project_costs (daily_log_id);

create index if not exists idx_project_revenues_daily_log_id
  on public.project_revenues (daily_log_id);
