import { promises as fs } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { count } from 'drizzle-orm'
import { db } from './index'
import { clients, projects, projectRevenues, projectCosts } from './schema'
import { shouldSeedInitialData } from '../../shared/seed'

interface RevenueSeedItem {
  dateIso: string
  description: string
  amount: number
  status: 'planned' | 'billed' | 'received'
  notes: string | null
}

interface CostSeedItem {
  dateIso: string
  category: 'fuel' | 'labor' | 'maintenance' | 'transport' | 'outsourced' | 'miscellaneous'
  description: string
  amount: number
  notes: string | null
}

interface FinancialSeed {
  sourceFile: string
  generatedAtIso: string
  client: {
    name: string
    notes: string | null
  }
  project: {
    name: string
    status: 'planned' | 'active' | 'completed' | 'canceled'
    description: string | null
  }
  revenues: RevenueSeedItem[]
  costs: CostSeedItem[]
}

async function readFinancialSeed(): Promise<FinancialSeed> {
  const seedPath = app.isPackaged
    ? join(process.resourcesPath, 'seeds', 'financial-seed.json')
    : join(app.getAppPath(), 'src', 'main', 'db', 'seeds', 'financial-seed.json')

  const raw = await fs.readFile(seedPath, 'utf-8')
  return JSON.parse(raw) as FinancialSeed
}

async function probeCounts() {
  const [clientsRow] = await db.select({ value: count() }).from(clients)
  const [projectsRow] = await db.select({ value: count() }).from(projects)
  const [revenuesRow] = await db.select({ value: count() }).from(projectRevenues)
  const [costsRow] = await db.select({ value: count() }).from(projectCosts)

  return {
    clientsCount: Number(clientsRow?.value ?? 0),
    projectsCount: Number(projectsRow?.value ?? 0),
    revenuesCount: Number(revenuesRow?.value ?? 0),
    costsCount: Number(costsRow?.value ?? 0),
  }
}

export async function ensureInitialFinancialSeed(): Promise<void> {
  if (process.env.MIGHTYREPT_SKIP_INITIAL_SEED === '1') {
    return
  }

  const counts = await probeCounts()
  if (!shouldSeedInitialData(counts)) {
    return
  }

  const seed = await readFinancialSeed()

  await db.transaction(async (tx) => {
    const [insertedClient] = await tx
      .insert(clients)
      .values({
        name: seed.client.name,
        notes: seed.client.notes,
      })
      .returning({ id: clients.id })

    const [insertedProject] = await tx
      .insert(projects)
      .values({
        clientId: insertedClient.id,
        name: seed.project.name,
        status: seed.project.status,
        description: seed.project.description,
      })
      .returning({ id: projects.id })

    if (seed.revenues.length > 0) {
      await tx.insert(projectRevenues).values(
        seed.revenues.map((item) => ({
          date: new Date(item.dateIso),
          projectId: insertedProject.id,
          description: item.description,
          amount: item.amount,
          status: item.status,
          notes: item.notes,
        }))
      )
    }

    if (seed.costs.length > 0) {
      await tx.insert(projectCosts).values(
        seed.costs.map((item) => ({
          date: new Date(item.dateIso),
          projectId: insertedProject.id,
          category: item.category,
          description: item.description,
          amount: item.amount,
          notes: item.notes,
        }))
      )
    }
  })
}
