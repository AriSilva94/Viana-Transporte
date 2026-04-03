import { describe, expect, it } from 'vitest'
import { createSqliteRepositoryForTest } from '../sqlite/repository'

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
})
