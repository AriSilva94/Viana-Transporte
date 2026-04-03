import { createSupabaseRepository } from '../../data/supabase/repository'
import { createSourceSqliteRepository } from './runtime'
import { formatReconciliationResult, reconcileRecords } from './reconcile-core'

function hasDryRunFlag(argv: string[]): boolean {
  return argv.includes('--dry-run')
}

function hasSupabaseEnv(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
}

async function main(): Promise<void> {
  const dryRun = hasDryRunFlag(process.argv.slice(2))

  if (dryRun || !hasSupabaseEnv()) {
    console.log('[reconcile] dry run only. Re-run without --dry-run to compare SQLite and Supabase.')
    return
  }

  const source = await createSourceSqliteRepository()
  const target = await createSupabaseRepository()

  const comparisons = [
    reconcileRecords('clients', await source.clients.list(), await target.clients.list(), []),
    reconcileRecords('projects', await source.projects.list(), await target.projects.list(), ['contractAmount']),
    reconcileRecords('machines', await source.machines.list(), await target.machines.list(), []),
    reconcileRecords('operators', await source.operators.list(), await target.operators.list(), []),
    reconcileRecords('daily_logs', await source.dailylogs.list(), await target.dailylogs.list(), ['hoursWorked', 'fuelQuantity']),
    reconcileRecords('project_costs', await source.costs.list(), await target.costs.list(), ['amount']),
    reconcileRecords('project_revenues', await source.revenues.list(), await target.revenues.list(), ['amount']),
  ]

  for (const comparison of comparisons) {
    console.log(formatReconciliationResult(comparison))
  }

  const failed = comparisons.filter((comparison) => !comparison.ok)

  if (failed.length > 0) {
    console.error(`[reconcile] ${failed.length} table(s) mismatched`)
    process.exitCode = 1
    return
  }

  console.log('[reconcile] all tables match')
}

main().catch((error: unknown) => {
  console.error('[reconcile] failed:', error)
  process.exitCode = 1
})
