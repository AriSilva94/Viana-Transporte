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

  it('throws when updating a missing client', async () => {
    const repo = await createSqliteRepositoryForTest()

    await expect(
      repo.clients.update(999999, {
        name: 'Cliente Fantasma',
      })
    ).rejects.toThrow('Client not found')
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
