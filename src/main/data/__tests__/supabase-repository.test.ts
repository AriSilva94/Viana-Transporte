import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createSupabaseClientFromEnvMock } = vi.hoisted(() => ({
  createSupabaseClientFromEnvMock: vi.fn(),
}))

vi.mock('../supabase/client', () => ({
  createSupabaseClientFromEnv: createSupabaseClientFromEnvMock,
}))

import { createSupabaseRepository } from '../supabase/repository'

function createQueryMock<T>(result: { data: T[] | T | null; error: null }) {
  const query = {
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (value: typeof result) => unknown) => Promise.resolve(resolve(result))),
  }

  return query
}

describe('createSupabaseRepository', () => {
  beforeEach(() => {
    createSupabaseClientFromEnvMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('implements machines CRUD through Supabase client', async () => {
    const machineRow = {
      id: 7,
      name: 'Escavadeira A',
      type: 'Escavadeira',
      identifier: 'EQ-7',
      brand_model: 'CAT 320',
      status: 'available',
      notes: 'Pronta',
      created_at: '2026-04-03T10:00:00.000Z',
      updated_at: '2026-04-03T10:10:00.000Z',
    }

    const machineSelect = createQueryMock({ data: [machineRow], error: null })
    const machineInsert = createQueryMock({ data: [machineRow], error: null })
    const machineUpdate = createQueryMock({ data: [machineRow], error: null })
    const machineDelete = createQueryMock({ data: null, error: null })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'machines') {
          return {
            select: vi.fn(() => machineSelect),
            insert: vi.fn(() => machineInsert),
            update: vi.fn(() => machineUpdate),
            delete: vi.fn(() => machineDelete),
            or: machineSelect.or,
            eq: machineSelect.eq,
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createSupabaseClientFromEnvMock.mockResolvedValue(supabase)

    const repo = await createSupabaseRepository()

    const list = await repo.machines.list({ search: 'Escavadeira', status: 'available' })
    const created = await repo.machines.create({
      name: 'Escavadeira A',
      type: 'Escavadeira',
      identifier: 'EQ-7',
      brandModel: 'CAT 320',
      status: 'available',
      notes: 'Pronta',
    })
    const loaded = await repo.machines.get(7)
    const updated = await repo.machines.update(7, { notes: 'Atualizada' })
    await repo.machines.delete(7)

    expect(list[0]).toMatchObject({
      id: 7,
      name: 'Escavadeira A',
      type: 'Escavadeira',
      identifier: 'EQ-7',
      brandModel: 'CAT 320',
    })
    expect(created).toMatchObject({ id: 7, name: 'Escavadeira A' })
    expect(loaded).toMatchObject({ id: 7, name: 'Escavadeira A' })
    expect(updated).toMatchObject({ id: 7, notes: 'Pronta' })
    expect(supabase.from).toHaveBeenCalledWith('machines')
    expect(machineSelect.or).toHaveBeenCalledWith('name.ilike.%Escavadeira%,type.ilike.%Escavadeira%')
    expect(machineSelect.eq).toHaveBeenCalledWith('status', 'available')
  })

  it('throws when a machines create returns an empty array', async () => {
    const machineInsert = createQueryMock({ data: [], error: null })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'machines') {
          return {
            select: vi.fn(() => machineInsert),
            insert: vi.fn(() => machineInsert),
            update: vi.fn(() => machineInsert),
            delete: vi.fn(() => machineInsert),
            or: machineInsert.or,
            eq: machineInsert.eq,
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createSupabaseClientFromEnvMock.mockResolvedValue(supabase)

    const repo = await createSupabaseRepository()

    await expect(
      repo.machines.create({
        name: 'Escavadeira Vazia',
        type: 'Escavadeira',
        identifier: null,
        brandModel: null,
        status: 'available',
        notes: null,
      })
    ).rejects.toThrow('Supabase returned no rows')
  })

  it('implements operators CRUD through Supabase client', async () => {
    const operatorRow = {
      id: 11,
      name: 'Operador B',
      phone: '(11) 99999-0011',
      role: 'Motorista',
      is_active: true,
      notes: 'Ativo',
      created_at: '2026-04-03T11:00:00.000Z',
      updated_at: '2026-04-03T11:10:00.000Z',
    }

    const operatorSelect = createQueryMock({ data: [operatorRow], error: null })
    const operatorInsert = createQueryMock({ data: [operatorRow], error: null })
    const operatorUpdate = createQueryMock({ data: [operatorRow], error: null })
    const operatorDelete = createQueryMock({ data: null, error: null })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'operators') {
          return {
            select: vi.fn(() => operatorSelect),
            insert: vi.fn(() => operatorInsert),
            update: vi.fn(() => operatorUpdate),
            delete: vi.fn(() => operatorDelete),
            or: operatorSelect.or,
            eq: operatorSelect.eq,
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createSupabaseClientFromEnvMock.mockResolvedValue(supabase)

    const repo = await createSupabaseRepository()

    const list = await repo.operators.list({ search: 'Operador', isActive: true })
    const created = await repo.operators.create({
      name: 'Operador B',
      phone: '(11) 99999-0011',
      role: 'Motorista',
      isActive: true,
      notes: 'Ativo',
    })
    const loaded = await repo.operators.get(11)
    const updated = await repo.operators.update(11, { notes: 'Atualizado' })
    await repo.operators.delete(11)

    expect(list[0]).toMatchObject({
      id: 11,
      name: 'Operador B',
      phone: '(11) 99999-0011',
      role: 'Motorista',
    })
    expect(created).toMatchObject({ id: 11, name: 'Operador B' })
    expect(loaded).toMatchObject({ id: 11, name: 'Operador B' })
    expect(updated).toMatchObject({ id: 11, notes: 'Ativo' })
    expect(supabase.from).toHaveBeenCalledWith('operators')
    expect(operatorSelect.or).toHaveBeenCalledWith('name.ilike.%Operador%')
    expect(operatorSelect.eq).toHaveBeenCalledWith('is_active', true)
  })

  it('throws when an operators update returns an empty array', async () => {
    const operatorUpdate = createQueryMock({ data: [], error: null })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'operators') {
          return {
            select: vi.fn(() => operatorUpdate),
            insert: vi.fn(() => operatorUpdate),
            update: vi.fn(() => operatorUpdate),
            delete: vi.fn(() => operatorUpdate),
            or: operatorUpdate.or,
            eq: operatorUpdate.eq,
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createSupabaseClientFromEnvMock.mockResolvedValue(supabase)

    const repo = await createSupabaseRepository()

    await expect(
      repo.operators.update(99, {
        notes: 'Falha esperada',
      })
    ).rejects.toThrow('Supabase returned no rows')
  })

  it('implements projects CRUD and summary through Supabase client', async () => {
    const projectRow = {
      id: 21,
      client_id: 5,
      name: 'Projeto Aurora',
      location: 'Obra 1',
      start_date: '2026-04-03T00:00:00.000Z',
      end_date: '2026-04-10T00:00:00.000Z',
      status: 'active',
      contract_amount: 1500,
      description: 'Projeto de teste',
      created_at: '2026-04-03T12:00:00.000Z',
      updated_at: '2026-04-03T12:10:00.000Z',
    }

    const clientRow = {
      id: 5,
      name: 'Cliente Projeto',
      document: null,
      phone: null,
      email: null,
      notes: null,
      created_at: '2026-04-03T10:00:00.000Z',
      updated_at: '2026-04-03T10:10:00.000Z',
    }

    const projectListSelect = createQueryMock({ data: [projectRow], error: null })
    const projectGetSelect = createQueryMock({ data: [projectRow], error: null })
    const projectInsert = createQueryMock({ data: [projectRow], error: null })
    const projectUpdate = createQueryMock({ data: [projectRow], error: null })
    const projectDelete = createQueryMock({ data: null, error: null })
    const clientListSelect = createQueryMock({ data: [clientRow], error: null })
    const clientGetSelect = createQueryMock({ data: [clientRow], error: null })
    const summaryRpc = vi.fn().mockResolvedValue({
      data: [{ total_costs: 100, total_revenues: 250, profit: 150, total_hours: 8 }],
      error: null,
    })

    const projectSelect = vi
      .fn()
      .mockReturnValueOnce(projectListSelect)
      .mockReturnValueOnce(projectGetSelect)

    const clientSelect = vi
      .fn()
      .mockReturnValueOnce(clientListSelect)
      .mockReturnValueOnce(clientGetSelect)

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'projects') {
          return {
            select: projectSelect,
            insert: vi.fn(() => projectInsert),
            update: vi.fn(() => projectUpdate),
            delete: vi.fn(() => projectDelete),
            or: projectListSelect.or,
            eq: projectListSelect.eq,
          }
        }

        if (table === 'clients') {
          return {
            select: clientSelect,
            or: clientListSelect.or,
            eq: clientListSelect.eq,
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
      rpc: summaryRpc,
    }

    createSupabaseClientFromEnvMock.mockResolvedValue(supabase)

    const repo = await createSupabaseRepository()

    const list = await repo.projects.list({ search: 'Aurora', status: 'active', clientId: 5 })
    const created = await repo.projects.create({
      clientId: 5,
      name: 'Projeto Aurora',
      location: 'Obra 1',
      startDate: new Date('2026-04-03T00:00:00.000Z'),
      endDate: new Date('2026-04-10T00:00:00.000Z'),
      status: 'active',
      contractAmount: 1500,
      description: 'Projeto de teste',
    })
    const loaded = await repo.projects.get(21)
    const updated = await repo.projects.update(21, { name: 'Projeto Aurora Atualizado' })
    const summary = await repo.projects.summary(21)

    expect(list[0]).toMatchObject({
      id: 21,
      clientId: 5,
      clientName: 'Cliente Projeto',
      name: 'Projeto Aurora',
    })
    expect(created).toMatchObject({ id: 21, name: 'Projeto Aurora' })
    expect(loaded).toMatchObject({ id: 21, clientName: 'Cliente Projeto' })
    expect(updated).toMatchObject({ id: 21, name: 'Projeto Aurora' })
    expect(summary).toMatchObject({ totalCosts: 100, totalRevenues: 250, profit: 150, totalHours: 8 })
    expect(summaryRpc).toHaveBeenCalledWith('project_summary', { project_id: 21 })
    expect(projectListSelect.eq).toHaveBeenCalledWith('status', 'active')
    expect(projectListSelect.eq).toHaveBeenCalledWith('client_id', 5)
    expect(projectGetSelect.eq).toHaveBeenCalledWith('id', 21)
    expect(clientGetSelect.eq).toHaveBeenCalledWith('id', 5)
  })

  it('falls back to direct table queries when project summary rpc fails', async () => {
    const costRows = [{ amount: 40 }, { amount: '60' }]
    const revenueRows = [{ amount: 200 }, { amount: '50' }]
    const hoursRows = [{ hours_worked: 3 }, { hours_worked: '5' }]

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'project_costs') {
          return {
            select: vi.fn(() => createQueryMock({ data: costRows, error: null })),
          }
        }

        if (table === 'project_revenues') {
          return {
            select: vi.fn(() => createQueryMock({ data: revenueRows, error: null })),
          }
        }

        if (table === 'daily_logs') {
          return {
            select: vi.fn(() => createQueryMock({ data: hoursRows, error: null })),
          }
        }

        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          then: vi.fn(),
        }
      }),
      rpc: vi.fn().mockRejectedValue(new Error('project_summary unavailable')),
    }

    createSupabaseClientFromEnvMock.mockResolvedValue(supabase)

    const repo = await createSupabaseRepository()

    await expect(repo.projects.summary(21)).resolves.toMatchObject({
      totalCosts: 100,
      totalRevenues: 250,
      profit: 150,
      totalHours: 8,
    })
    expect(supabase.rpc).toHaveBeenCalledWith('project_summary', { project_id: 21 })
    expect(supabase.from).toHaveBeenCalledWith('project_costs')
    expect(supabase.from).toHaveBeenCalledWith('project_revenues')
    expect(supabase.from).toHaveBeenCalledWith('daily_logs')
  })
})
