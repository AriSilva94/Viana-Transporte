import type { AuthRole } from '../../../shared/types'

const TABLES = [
  'clients',
  'projects',
  'machines',
  'operators',
  'daily_logs',
  'project_costs',
  'project_revenues',
] as const

export type OperationalTable = (typeof TABLES)[number]

export interface BootstrapDependencies {
  listUsers: () => Promise<Array<{ id: string; email: string | null }>>
  upsertProfile: (input: { id: string; email: string; role: AuthRole }) => Promise<void>
  backfillTable: (table: OperationalTable, userId: string) => Promise<void>
  setNotNull: (table: OperationalTable) => Promise<void>
  countNulls: (table: OperationalTable) => Promise<number>
}

export interface BootstrapInput {
  adminEmail: string
  adminRole: AuthRole
}

export function createBootstrapAdminOwnership(deps: BootstrapDependencies) {
  return {
    async run(input: BootstrapInput): Promise<{ adminId: string; tablesUpdated: OperationalTable[] }> {
      const users = await deps.listUsers()
      const admin = users.find((user) => user.email === input.adminEmail)
      if (!admin) {
        throw new Error(`Admin user ${input.adminEmail} was not found in auth.users`)
      }

      await deps.upsertProfile({
        id: admin.id,
        email: input.adminEmail,
        role: input.adminRole,
      })

      const tablesUpdated: OperationalTable[] = []

      for (const table of TABLES) {
        await deps.backfillTable(table, admin.id)
        const remaining = await deps.countNulls(table)
        if (remaining > 0) {
          throw new Error(`Backfill incomplete: ${table} still has ${remaining} rows with null user_id`)
        }
        await deps.setNotNull(table)
        tablesUpdated.push(table)
      }

      return { adminId: admin.id, tablesUpdated }
    },
  }
}
