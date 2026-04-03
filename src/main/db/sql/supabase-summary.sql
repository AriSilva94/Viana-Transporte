create or replace function public.project_summary(p_project_id bigint)
returns table (
  total_costs numeric,
  total_revenues numeric,
  profit numeric,
  total_hours numeric
)
language sql
stable
as $$
  with cost_totals as (
    select coalesce(sum(amount), 0) as total_costs
    from project_costs
    where project_costs.project_id = p_project_id
  ),
  revenue_totals as (
    select coalesce(sum(amount), 0) as total_revenues
    from project_revenues
    where project_revenues.project_id = p_project_id
  ),
  hour_totals as (
    select coalesce(sum(hours_worked), 0) as total_hours
    from daily_logs
    where daily_logs.project_id = p_project_id
  )
  select
    cost_totals.total_costs,
    revenue_totals.total_revenues,
    revenue_totals.total_revenues - cost_totals.total_costs as profit,
    hour_totals.total_hours
  from cost_totals, revenue_totals, hour_totals;
$$;
