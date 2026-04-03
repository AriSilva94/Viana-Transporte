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
import { formatLocalDate } from '../../../shared/date'

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

  it('handles dailylogs CRUD and filters through repository contract', async () => {
    const { db, repo } = await createSqliteRepositoryFixture()

    const client = await repo.clients.create({
      name: 'Cliente Diário',
      document: null,
      phone: null,
      email: null,
      notes: null,
    })
    const project = await repo.projects.create({
      clientId: client.id,
      name: 'Projeto Diário',
      location: null,
      startDate: null,
      endDate: null,
      status: 'active',
      contractAmount: null,
      description: null,
    })
    const machine = await repo.machines.create({
      name: 'Máquina Diário',
      type: 'Escavadeira',
      identifier: null,
      brandModel: null,
      status: 'available',
      notes: null,
    })
    const operator = await repo.operators.create({
      name: 'Operador Diário',
      phone: null,
      role: null,
      isActive: true,
      notes: null,
    })

    const created = await repo.dailylogs.create({
      date: new Date('2026-04-03T12:00:00.000Z'),
      projectId: project.id,
      machineId: machine.id,
      operatorId: operator.id,
      hoursWorked: 7.5,
      workDescription: 'Descrição diária',
      fuelQuantity: 12,
      downtimeNotes: 'Sem paradas',
      notes: 'Observação',
    })

    await db.insert(dailyLogs).values({
      date: new Date('2026-04-06T12:00:00.000Z'),
      projectId: project.id,
      machineId: machine.id,
      operatorId: operator.id,
      hoursWorked: 4,
      workDescription: 'Fora do filtro',
      fuelQuantity: null,
      downtimeNotes: null,
      notes: null,
    })

    const rows = await repo.dailylogs.list({
      projectId: project.id,
      machineId: machine.id,
      operatorId: operator.id,
      dateFrom: '2026-04-03',
      dateTo: '2026-04-03',
    })
    const loaded = await repo.dailylogs.get(created.id)
    const updated = await repo.dailylogs.update(created.id, {
      notes: 'Atualizado',
      hoursWorked: 8,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: created.id,
      projectId: project.id,
      machineId: machine.id,
      operatorId: operator.id,
      projectName: 'Projeto Diário',
      machineName: 'Máquina Diário',
      operatorName: 'Operador Diário',
      workDescription: 'Descrição diária',
    })
    expect(formatLocalDate(rows[0].date)).toBe('2026-04-03')
    expect(loaded).toMatchObject({
      id: created.id,
      projectName: 'Projeto Diário',
      machineName: 'Máquina Diário',
      operatorName: 'Operador Diário',
    })
    expect(updated).toMatchObject({
      id: created.id,
      notes: 'Atualizado',
      hoursWorked: 8,
    })

    await repo.dailylogs.delete(created.id)
    await expect(repo.dailylogs.get(created.id)).resolves.toBeNull()
  })

  it('handles costs CRUD and filters through repository contract', async () => {
    const { db, repo } = await createSqliteRepositoryFixture()

    const client = await repo.clients.create({
      name: 'Cliente Custo',
      document: null,
      phone: null,
      email: null,
      notes: null,
    })
    const project = await repo.projects.create({
      clientId: client.id,
      name: 'Projeto Custo',
      location: null,
      startDate: null,
      endDate: null,
      status: 'active',
      contractAmount: null,
      description: null,
    })
    const machine = await repo.machines.create({
      name: 'Máquina Custo',
      type: 'Escavadeira',
      identifier: null,
      brandModel: null,
      status: 'available',
      notes: null,
    })
    const operator = await repo.operators.create({
      name: 'Operador Custo',
      phone: null,
      role: null,
      isActive: true,
      notes: null,
    })

    const created = await repo.costs.create({
      date: new Date('2026-04-04T12:00:00.000Z'),
      projectId: project.id,
      machineId: machine.id,
      operatorId: operator.id,
      category: 'fuel',
      description: 'Combustível',
      amount: 100,
      notes: 'Nota',
    })

    await db.insert(projectCosts).values({
      date: new Date('2026-04-06T12:00:00.000Z'),
      projectId: project.id,
      machineId: machine.id,
      operatorId: operator.id,
      category: 'maintenance',
      description: 'Fora do filtro',
      amount: 50,
      notes: null,
    })

    const rows = await repo.costs.list({
      projectId: project.id,
      category: 'fuel',
      dateFrom: '2026-04-04',
      dateTo: '2026-04-04',
    })
    const loaded = await repo.costs.get(created.id)
    const updated = await repo.costs.update(created.id, {
      description: 'Combustível atualizado',
      amount: 125,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: created.id,
      projectId: project.id,
      machineId: machine.id,
      operatorId: operator.id,
      projectName: 'Projeto Custo',
      machineName: 'Máquina Custo',
      operatorName: 'Operador Custo',
      category: 'fuel',
      description: 'Combustível',
    })
    expect(formatLocalDate(rows[0].date)).toBe('2026-04-04')
    expect(loaded).toMatchObject({
      id: created.id,
      projectName: 'Projeto Custo',
      machineName: 'Máquina Custo',
      operatorName: 'Operador Custo',
    })
    expect(updated).toMatchObject({
      id: created.id,
      description: 'Combustível atualizado',
      amount: 125,
    })

    await repo.costs.delete(created.id)
    await expect(repo.costs.get(created.id)).resolves.toBeNull()
  })

  it('handles revenues CRUD and filters through repository contract', async () => {
    const { db, repo } = await createSqliteRepositoryFixture()

    const client = await repo.clients.create({
      name: 'Cliente Receita',
      document: null,
      phone: null,
      email: null,
      notes: null,
    })
    const project = await repo.projects.create({
      clientId: client.id,
      name: 'Projeto Receita',
      location: null,
      startDate: null,
      endDate: null,
      status: 'active',
      contractAmount: null,
      description: null,
    })

    const created = await repo.revenues.create({
      date: new Date('2026-04-05T12:00:00.000Z'),
      projectId: project.id,
      description: 'Faturamento',
      amount: 250,
      status: 'billed',
      notes: 'Nota fiscal',
    })

    await db.insert(projectRevenues).values({
      date: new Date('2026-04-07T12:00:00.000Z'),
      projectId: project.id,
      description: 'Fora do filtro',
      amount: 300,
      status: 'received',
      notes: null,
    })

    const rows = await repo.revenues.list({
      projectId: project.id,
      status: 'billed',
      dateFrom: '2026-04-05',
      dateTo: '2026-04-05',
    })
    const loaded = await repo.revenues.get(created.id)
    const updated = await repo.revenues.update(created.id, {
      description: 'Faturamento atualizado',
      amount: 275,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: created.id,
      projectId: project.id,
      projectName: 'Projeto Receita',
      description: 'Faturamento',
      amount: 250,
      status: 'billed',
    })
    expect(formatLocalDate(rows[0].date)).toBe('2026-04-05')
    expect(loaded).toMatchObject({
      id: created.id,
      projectName: 'Projeto Receita',
      description: 'Faturamento',
    })
    expect(updated).toMatchObject({
      id: created.id,
      description: 'Faturamento atualizado',
      amount: 275,
    })

    await repo.revenues.delete(created.id)
    await expect(repo.revenues.get(created.id)).resolves.toBeNull()
  })
})
