import {
  mapClientToSupabaseInsert,
  mapDailyLogToSupabaseInsert,
  mapMachineToSupabaseInsert,
  mapProjectCostToSupabaseInsert,
  mapProjectRevenueToSupabaseInsert,
  mapOperatorToSupabaseInsert,
  mapProjectToSupabaseInsert,
} from '../../data/mappers'
import { createSourceSqliteRepository, chunkArray, parseCliFlags } from './runtime'

type RowWithAudit = {
  id: number
  createdAt: Date
  updatedAt: Date
}

function withAuditColumns<T extends RowWithAudit, P extends Record<string, unknown>>(
  row: T,
  payload: P
): P & { id: number; created_at: string; updated_at: string } {
  return {
    id: row.id,
    ...payload,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

async function main(): Promise<void> {
  const flags = parseCliFlags(process.argv.slice(2))
  const source = await createSourceSqliteRepository()

  const clients = await source.clients.list()
  const projects = await source.projects.list()
  const machines = await source.machines.list()
  const operators = await source.operators.list()
  const dailylogs = await source.dailylogs.list()
  const costs = await source.costs.list()
  const revenues = await source.revenues.list()

  console.log(flags.apply ? '[migrate] applying SQLite rows to Supabase' : '[migrate] dry run only')

  if (flags.dryRun) {
    console.log(`[migrate] clients=${clients.length} projects=${projects.length} machines=${machines.length} operators=${operators.length}`)
    console.log(`[migrate] daily_logs=${dailylogs.length} project_costs=${costs.length} project_revenues=${revenues.length}`)
    console.log('[migrate] dry run complete: rerun with --apply to write to Supabase')
    return
  }

  const { createSupabaseClientFromEnv } = await import('../../data/supabase/client')
  const supabase = (await createSupabaseClientFromEnv()) as unknown as {
    from: (table: string) => {
      upsert: (values: unknown[], options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>
    }
  }

  const upsertTable = async (table: string, rows: Array<Record<string, unknown>>): Promise<void> => {
    console.log(`[migrate] ${table}: ${rows.length} rows`)

    if (rows.length === 0) {
      return
    }

    for (const chunk of chunkArray(rows, 100)) {
      const result = await supabase.from(table).upsert(chunk, { onConflict: 'id' })

      if (result.error) {
        throw new Error(`Failed to upsert ${table}: ${result.error.message}`)
      }
    }
  }

  await upsertTable('clients', clients.map((row) => withAuditColumns(row, mapClientToSupabaseInsert(row))))

  await upsertTable('projects', projects.map((row) => {
    const { clientName: _clientName, ...project } = row
    return withAuditColumns(row, mapProjectToSupabaseInsert(project))
  }))

  await upsertTable('machines', machines.map((row) => withAuditColumns(row, mapMachineToSupabaseInsert(row))))

  await upsertTable('operators', operators.map((row) => withAuditColumns(row, mapOperatorToSupabaseInsert(row))))

  await upsertTable('daily_logs', dailylogs.map((row) => {
    const { projectName: _projectName, machineName: _machineName, operatorName: _operatorName, ...dailyLog } = row
    return withAuditColumns(row, mapDailyLogToSupabaseInsert(dailyLog))
  }))

  await upsertTable('project_costs', costs.map((row) => {
    const { projectName: _projectName, machineName: _machineName, operatorName: _operatorName, ...cost } = row
    return withAuditColumns(row, mapProjectCostToSupabaseInsert(cost))
  }))

  await upsertTable('project_revenues', revenues.map((row) => {
    const { projectName: _projectName, ...revenue } = row
    return withAuditColumns(row, mapProjectRevenueToSupabaseInsert(revenue))
  }))

  console.log(
    flags.apply
      ? '[migrate] complete: rows were upserted into Supabase'
      : '[migrate] dry run complete: rerun with --apply to write to Supabase'
  )
}

main().catch((error: unknown) => {
  console.error('[migrate] failed:', error)
  process.exitCode = 1
})
