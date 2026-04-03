import { createClient } from '@libsql/client/sqlite3'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import type { DB } from '../../db'
import * as schema from '../../db/schema'
import { dailyLogs, projectCosts, projectRevenues } from '../../db/schema'
import { createSqliteRepository, createSqliteRepositoryForTest } from '../sqlite/repository'

async function createSqliteRepositoryFixture() {
  const tempDir = await mkdtemp(join(tmpdir(), 'mightyrept-sqlite-projects-'))
  const client = createClient({ url: `file:${join(tempDir, 'test.db')}` })
  const db = drizzle(client, { schema })

  await migrate(db, {
    migrationsFolder: join(process.cwd(), 'src/main/db/migrations'),
  })

  const typedDb = db as DB
  const repo = createSqliteRepository(typedDb)
  return { db: typedDb, repo }
}

describe('createSqliteRepositoryForTest', () => {
  it('creates and lists clients through repository contract', async () => {
    const repo = await createSqliteRepositoryForTest()

    const created = await repo.clients.create({
      name: 'Cliente Alpha',
      document: null,
      phone: '(11) 99999-0000',
      email: 'alpha@example.com',
      notes: 'Cliente de teste',
    })

    const rows = await repo.clients.list()

    expect(Array.isArray(rows)).toBe(true)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: created.id,
      name: 'Cliente Alpha',
      email: 'alpha@example.com',
    })
  })

  it('filters clients by search term', async () => {
    const repo = await createSqliteRepositoryForTest()

    await repo.clients.create({
      name: 'Construtora Aurora',
      document: null,
      phone: null,
      email: null,
      notes: null,
    })
    await repo.clients.create({
      name: 'Mineradora Boreal',
      document: null,
      phone: null,
      email: null,
      notes: null,
    })

    const rows = await repo.clients.list({ search: 'Aurora' })

    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Construtora Aurora')
  })

  it('gets updates and deletes a client', async () => {
    const repo = await createSqliteRepositoryForTest()

    const created = await repo.clients.create({
      name: 'Cliente Base',
      document: null,
      phone: null,
      email: 'base@example.com',
      notes: null,
    })

    const loaded = await repo.clients.get(created.id)
    expect(loaded).not.toBeNull()
    expect(loaded).toMatchObject({
      id: created.id,
      name: 'Cliente Base',
      email: 'base@example.com',
    })

    const updated = await repo.clients.update(created.id, {
      name: 'Cliente Atualizado',
      email: 'updated@example.com',
    })

    expect(updated).toMatchObject({
      id: created.id,
      name: 'Cliente Atualizado',
      email: 'updated@example.com',
    })

    await repo.clients.delete(created.id)

    const afterDelete = await repo.clients.get(created.id)
    expect(afterDelete).toBeNull()
  })

  it('throws when updating a missing client', async () => {
    const repo = await createSqliteRepositoryForTest()

    await expect(
      repo.clients.update(999999, {
        name: 'Cliente Fantasma',
      })
    ).rejects.toThrow('Client not found')
  })

  it('handles projects CRUD and summary through repository contract', async () => {
    const { db, repo } = await createSqliteRepositoryFixture()

    const client = await repo.clients.create({
      name: 'Cliente Projeto',
      document: null,
      phone: null,
      email: null,
      notes: null,
    })

    const created = await repo.projects.create({
      clientId: client.id,
      name: 'Projeto Aurora',
      location: 'Obra 1',
      startDate: new Date('2026-04-03T00:00:00.000Z'),
      endDate: new Date('2026-04-10T00:00:00.000Z'),
      status: 'active',
      contractAmount: 1500,
      description: 'Projeto de teste',
    })

    const list = await repo.projects.list({ search: 'Aurora', status: 'active', clientId: client.id })
    const loaded = await repo.projects.get(created.id)
    const updated = await repo.projects.update(created.id, {
      name: 'Projeto Aurora Atualizado',
      contractAmount: 1750,
    })

    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({
      id: created.id,
      clientId: client.id,
      clientName: 'Cliente Projeto',
      name: 'Projeto Aurora',
      status: 'active',
    })
    expect(loaded).toMatchObject({
      id: created.id,
      clientName: 'Cliente Projeto',
      name: 'Projeto Aurora',
    })
    expect(updated).toMatchObject({
      id: created.id,
      name: 'Projeto Aurora Atualizado',
      contractAmount: 1750,
    })

    await db.insert(projectCosts).values({
      date: new Date('2026-04-04T00:00:00.000Z'),
      projectId: created.id,
      machineId: null,
      operatorId: null,
      category: 'fuel',
      description: 'Combustível',
      amount: 100,
      notes: null,
    })
    await db.insert(projectRevenues).values({
      date: new Date('2026-04-05T00:00:00.000Z'),
      projectId: created.id,
      description: 'Receita',
      amount: 250,
      status: 'billed',
      notes: null,
    })
    await db.insert(dailyLogs).values({
      date: new Date('2026-04-06T00:00:00.000Z'),
      projectId: created.id,
      machineId: null,
      operatorId: null,
      hoursWorked: 8,
      workDescription: 'Trabalho de teste',
      fuelQuantity: null,
      downtimeNotes: null,
      notes: null,
    })

    const summary = await repo.projects.summary(created.id)
    expect(summary).toMatchObject({
      totalCosts: 100,
      totalRevenues: 250,
      profit: 150,
      totalHours: 8,
    })
  })

  it('handles machines CRUD and filters through repository contract', async () => {
    const repo = await createSqliteRepositoryForTest()

    await repo.machines.create({
      name: 'Escavadeira Aurora',
      type: 'Escavadeira',
      identifier: 'M-100',
      brandModel: 'CAT 320',
      status: 'available',
      notes: 'Primeira máquina',
    })
    const created = await repo.machines.create({
      name: 'Retro Boreal',
      type: 'Retroescavadeira',
      identifier: 'M-200',
      brandModel: 'JCB 3CX',
      status: 'allocated',
      notes: null,
    })

    const filtered = await repo.machines.list({ search: 'Aurora', status: 'available' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]).toMatchObject({
      name: 'Escavadeira Aurora',
      type: 'Escavadeira',
      status: 'available',
    })

    const loaded = await repo.machines.get(created.id)
    expect(loaded).toMatchObject({
      id: created.id,
      name: 'Retro Boreal',
      type: 'Retroescavadeira',
      status: 'allocated',
    })

    const updated = await repo.machines.update(created.id, {
      status: 'inactive',
      notes: 'Atualizada',
    })
    expect(updated).toMatchObject({
      id: created.id,
      status: 'inactive',
      notes: 'Atualizada',
    })

    await repo.machines.delete(created.id)
    await expect(repo.machines.get(created.id)).resolves.toBeNull()
  })

  it('handles operators CRUD and filters through repository contract', async () => {
    const repo = await createSqliteRepositoryForTest()

    await repo.operators.create({
      name: 'Operador Aurora',
      phone: '(11) 99999-1000',
      role: 'Motorista',
      isActive: true,
      notes: 'Primeiro operador',
    })
    const created = await repo.operators.create({
      name: 'Operador Boreal',
      phone: null,
      role: 'Mecânico',
      isActive: false,
      notes: null,
    })

    const filtered = await repo.operators.list({ search: 'Boreal', isActive: false })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]).toMatchObject({
      name: 'Operador Boreal',
      role: 'Mecânico',
      isActive: false,
    })

    const loaded = await repo.operators.get(created.id)
    expect(loaded).toMatchObject({
      id: created.id,
      name: 'Operador Boreal',
      isActive: false,
    })

    const updated = await repo.operators.update(created.id, {
      isActive: true,
      notes: 'Ativado',
    })
    expect(updated).toMatchObject({
      id: created.id,
      isActive: true,
      notes: 'Ativado',
    })

    await repo.operators.delete(created.id)
    await expect(repo.operators.get(created.id)).resolves.toBeNull()
  })
})
