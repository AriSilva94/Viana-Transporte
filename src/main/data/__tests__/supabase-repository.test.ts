import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatLocalDate } from '../../../shared/date'

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
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
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

    const repo = await createSupabaseRepository({ client: supabase as never, getCurrentUserId: async () => 'user-1' })

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

    const repo = await createSupabaseRepository({ client: supabase as never, getCurrentUserId: async () => 'user-1' })

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

    const repo = await createSupabaseRepository({ client: supabase as never, getCurrentUserId: async () => 'user-1' })

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

    const repo = await createSupabaseRepository({ client: supabase as never, getCurrentUserId: async () => 'user-1' })

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
      start_date: '2026-04-03',
      end_date: '2026-04-10',
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
    const projectInsertValues = vi.fn()
    const projectUpdateValues = vi.fn()

    const clientSelect = vi
      .fn()
      .mockReturnValueOnce(clientListSelect)
      .mockReturnValueOnce(clientGetSelect)

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'projects') {
          return {
            select: projectSelect,
            insert: vi.fn((values: unknown) => {
              projectInsertValues(values)
              return projectInsert
            }),
            update: vi.fn((values: unknown) => {
              projectUpdateValues(values)
              return projectUpdate
            }),
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

    const repo = await createSupabaseRepository({ client: supabase as never, getCurrentUserId: async () => 'user-1' })

    const list = await repo.projects.list({ search: 'Aurora', status: 'active', clientId: 5 })
    const created = await repo.projects.create({
      clientId: 5,
      name: 'Projeto Aurora',
      location: 'Obra 1',
      startDate: new Date('2026-04-03T12:00:00.000Z'),
      endDate: new Date('2026-04-10T12:00:00.000Z'),
      status: 'active',
      contractAmount: 1500,
      description: 'Projeto de teste',
    })
    const loaded = await repo.projects.get(21)
    const updated = await repo.projects.update(21, {
      name: 'Projeto Aurora Atualizado',
      startDate: new Date('2026-04-03T12:00:00.000Z'),
      endDate: new Date('2026-04-10T12:00:00.000Z'),
    })
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
    expect(projectInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: '2026-04-03',
        end_date: '2026-04-10',
      })
    )
    expect(projectUpdateValues).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: '2026-04-03',
        end_date: '2026-04-10',
      })
    )
    expect(summary).toMatchObject({ totalCosts: 100, totalRevenues: 250, profit: 150, totalHours: 8 })
    expect(summaryRpc).toHaveBeenCalledWith('project_summary', { project_id: 21, p_user_id: 'user-1' })
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

    const repo = await createSupabaseRepository({ client: supabase as never, getCurrentUserId: async () => 'user-1' })

    await expect(repo.projects.summary(21)).resolves.toMatchObject({
      totalCosts: 100,
      totalRevenues: 250,
      profit: 150,
      totalHours: 8,
    })
    expect(supabase.rpc).toHaveBeenCalledWith('project_summary', { project_id: 21, p_user_id: 'user-1' })
    expect(supabase.from).toHaveBeenCalledWith('project_costs')
    expect(supabase.from).toHaveBeenCalledWith('project_revenues')
    expect(supabase.from).toHaveBeenCalledWith('daily_logs')
  })

  it('implements dailylogs costs and revenues CRUD through Supabase client', async () => {
    const projectRow = {
      id: 21,
      client_id: 5,
      name: 'Projeto Relacionado',
      location: null,
      start_date: null,
      end_date: null,
      status: 'active',
      contract_amount: null,
      description: null,
      created_at: '2026-04-03T12:00:00.000Z',
      updated_at: '2026-04-03T12:10:00.000Z',
    }
    const machineRow = {
      id: 7,
      name: 'Máquina Relacionada',
      type: 'Escavadeira',
      identifier: null,
      brand_model: null,
      status: 'available',
      notes: null,
      created_at: '2026-04-03T12:00:00.000Z',
      updated_at: '2026-04-03T12:10:00.000Z',
    }
    const operatorRow = {
      id: 11,
      name: 'Operador Relacionado',
      phone: null,
      role: null,
      is_active: true,
      notes: null,
      created_at: '2026-04-03T12:00:00.000Z',
      updated_at: '2026-04-03T12:10:00.000Z',
    }
    const dailyLogRow = {
      id: 31,
      date: '2026-04-03',
      project_id: 21,
      machine_id: 7,
      operator_id: 11,
      hours_worked: 7.5,
      work_description: 'Descrição diária',
      fuel_quantity: 12,
      downtime_notes: 'Sem paradas',
      notes: 'Observação',
      created_at: '2026-04-03T12:00:00.000Z',
      updated_at: '2026-04-03T12:10:00.000Z',
    }
    const dailyLogUpdatedRow = { ...dailyLogRow, notes: 'Atualizado', hours_worked: 8 }
    const costRow = {
      id: 41,
      date: '2026-04-04',
      project_id: 21,
      machine_id: 7,
      operator_id: 11,
      category: 'fuel',
      description: 'Combustível',
      amount: 100,
      notes: 'Nota',
      created_at: '2026-04-04T12:00:00.000Z',
      updated_at: '2026-04-04T12:10:00.000Z',
    }
    const costUpdatedRow = { ...costRow, description: 'Combustível atualizado', amount: 125 }
    const revenueRow = {
      id: 51,
      date: '2026-04-05',
      project_id: 21,
      description: 'Faturamento',
      amount: 250,
      status: 'billed',
      notes: 'Nota fiscal',
      created_at: '2026-04-05T12:00:00.000Z',
      updated_at: '2026-04-05T12:10:00.000Z',
    }
    const revenueUpdatedRow = {
      ...revenueRow,
      description: 'Faturamento atualizado',
      amount: 275,
      notes: 'Atualizado',
    }

    const projectSelect = createQueryMock({ data: [projectRow], error: null })
    const machineSelect = createQueryMock({ data: [machineRow], error: null })
    const operatorSelect = createQueryMock({ data: [operatorRow], error: null })

    const dailyLogListSelect = createQueryMock({ data: [dailyLogRow], error: null })
    const dailyLogGetSelect = createQueryMock({ data: [dailyLogRow], error: null })
    const dailyLogInsert = createQueryMock({ data: [dailyLogRow], error: null })
    const dailyLogUpdate = createQueryMock({ data: [dailyLogUpdatedRow], error: null })
    const dailyLogDelete = createQueryMock({ data: null, error: null })
    const dailyLogInsertValues = vi.fn()
    const dailyLogUpdateValues = vi.fn()

    const costListSelect = createQueryMock({ data: [costRow], error: null })
    const costGetSelect = createQueryMock({ data: [costRow], error: null })
    const costInsert = createQueryMock({ data: [costRow], error: null })
    const costUpdate = createQueryMock({ data: [costUpdatedRow], error: null })
    const costDelete = createQueryMock({ data: null, error: null })
    const costInsertValues = vi.fn()
    const costUpdateValues = vi.fn()

    const revenueSelect = createQueryMock({ data: [revenueRow], error: null })
    const revenueInsert = createQueryMock({ data: [revenueRow], error: null })
    const revenueUpdate = createQueryMock({ data: [revenueUpdatedRow], error: null })
    const revenueDelete = createQueryMock({ data: null, error: null })
    const revenueInsertValues = vi.fn()
    const revenueUpdateValues = vi.fn()

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => projectSelect),
            or: projectSelect.or,
            eq: projectSelect.eq,
          }
        }

        if (table === 'machines') {
          return {
            select: vi.fn(() => machineSelect),
            or: machineSelect.or,
            eq: machineSelect.eq,
          }
        }

        if (table === 'operators') {
          return {
            select: vi.fn(() => operatorSelect),
            or: operatorSelect.or,
            eq: operatorSelect.eq,
          }
        }

        if (table === 'daily_logs') {
          return {
            select: vi.fn(() => dailyLogListSelect),
            insert: vi.fn((values: unknown) => {
              dailyLogInsertValues(values)
              return dailyLogInsert
            }),
            update: vi.fn((values: unknown) => {
              dailyLogUpdateValues(values)
              return dailyLogUpdate
            }),
            delete: vi.fn(() => dailyLogDelete),
            or: dailyLogListSelect.or,
            eq: dailyLogListSelect.eq,
            gte: dailyLogListSelect.gte,
            lte: dailyLogListSelect.lte,
          }
        }

        if (table === 'project_costs') {
          return {
            select: vi.fn(() => costListSelect),
            insert: vi.fn((values: unknown) => {
              costInsertValues(values)
              return costInsert
            }),
            update: vi.fn((values: unknown) => {
              costUpdateValues(values)
              return costUpdate
            }),
            delete: vi.fn(() => costDelete),
            or: costListSelect.or,
            eq: costListSelect.eq,
            gte: costListSelect.gte,
            lte: costListSelect.lte,
          }
        }

        if (table === 'project_revenues') {
          return {
            select: vi.fn(() => revenueSelect),
            insert: vi.fn((values: unknown) => {
              revenueInsertValues(values)
              return revenueInsert
            }),
            update: vi.fn((values: unknown) => {
              revenueUpdateValues(values)
              return revenueUpdate
            }),
            delete: vi.fn(() => revenueDelete),
            or: revenueSelect.or,
            eq: revenueSelect.eq,
            gte: revenueSelect.gte,
            lte: revenueSelect.lte,
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createSupabaseClientFromEnvMock.mockResolvedValue(supabase)

    const repo = await createSupabaseRepository({ client: supabase as never, getCurrentUserId: async () => 'user-1' })

    const dailyLogsList = await repo.dailylogs.list({
      projectId: 21,
      machineId: 7,
      operatorId: 11,
      dateFrom: '2026-04-03',
      dateTo: '2026-04-03',
    })
    const createdDailyLog = await repo.dailylogs.create({
      date: new Date('2026-04-03T03:00:00.000Z'),
      projectId: 21,
      machineId: 7,
      operatorId: 11,
      hoursWorked: 7.5,
      workDescription: 'Descrição diária',
      fuelQuantity: 12,
      downtimeNotes: 'Sem paradas',
      notes: 'Observação',
    })
    const loadedDailyLog = await repo.dailylogs.get(31)
    const updatedDailyLog = await repo.dailylogs.update(31, {
      notes: 'Atualizado',
      date: new Date('2026-04-03T03:00:00.000Z'),
    })
    await repo.dailylogs.delete(31)

    const costsList = await repo.costs.list({
      projectId: 21,
      category: 'fuel',
      dateFrom: '2026-04-04',
      dateTo: '2026-04-04',
    })
    const createdCost = await repo.costs.create({
      date: new Date('2026-04-04T03:00:00.000Z'),
      projectId: 21,
      machineId: 7,
      operatorId: 11,
      category: 'fuel',
      description: 'Combustível',
      amount: 100,
      notes: 'Nota',
    })
    const loadedCost = await repo.costs.get(41)
    const updatedCost = await repo.costs.update(41, {
      amount: 125,
      date: new Date('2026-04-04T03:00:00.000Z'),
    })
    await repo.costs.delete(41)

    const revenuesList = await repo.revenues.list({
      projectId: 21,
      status: 'billed',
      dateFrom: '2026-04-05',
      dateTo: '2026-04-05',
    })
    const createdRevenue = await repo.revenues.create({
      date: new Date('2026-04-05T03:00:00.000Z'),
      projectId: 21,
      description: 'Faturamento',
      amount: 250,
      status: 'billed',
      notes: 'Nota fiscal',
    })
    const loadedRevenue = await repo.revenues.get(51)
    const updatedRevenue = await repo.revenues.update(51, {
      notes: 'Atualizado',
      date: new Date('2026-04-05T03:00:00.000Z'),
    })
    await repo.revenues.delete(51)

    expect(dailyLogsList[0]).toMatchObject({
      id: 31,
      projectId: 21,
      machineId: 7,
      operatorId: 11,
      projectName: 'Projeto Relacionado',
      machineName: 'Máquina Relacionada',
      operatorName: 'Operador Relacionado',
      workDescription: 'Descrição diária',
    })
    expect(createdDailyLog).toMatchObject({ id: 31, notes: 'Observação' })
    expect(loadedDailyLog).toMatchObject({
      id: 31,
      projectName: 'Projeto Relacionado',
      machineName: 'Máquina Relacionada',
      operatorName: 'Operador Relacionado',
    })
    expect(updatedDailyLog).toMatchObject({ id: 31, notes: 'Atualizado', hoursWorked: 8 })
    expect(dailyLogInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-04-03',
      })
    )
    expect(dailyLogUpdateValues).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-04-03',
      })
    )
    expect(dailyLogListSelect.gte).toHaveBeenCalledWith('date', formatLocalDate('2026-04-03'))
    expect(dailyLogListSelect.lte).toHaveBeenCalledWith('date', formatLocalDate('2026-04-03'))
    expect(dailyLogListSelect.eq).toHaveBeenCalledWith('project_id', 21)
    expect(dailyLogListSelect.eq).toHaveBeenCalledWith('machine_id', 7)
    expect(dailyLogListSelect.eq).toHaveBeenCalledWith('operator_id', 11)

    expect(costsList[0]).toMatchObject({
      id: 41,
      projectId: 21,
      machineId: 7,
      operatorId: 11,
      projectName: 'Projeto Relacionado',
      machineName: 'Máquina Relacionada',
      operatorName: 'Operador Relacionado',
      category: 'fuel',
      description: 'Combustível',
    })
    expect(createdCost).toMatchObject({ id: 41, amount: 100 })
    expect(loadedCost).toMatchObject({
      id: 41,
      projectName: 'Projeto Relacionado',
      machineName: 'Máquina Relacionada',
      operatorName: 'Operador Relacionado',
    })
    expect(updatedCost).toMatchObject({ id: 41, amount: 125 })
    expect(costInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-04-04',
      })
    )
    expect(costUpdateValues).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-04-04',
      })
    )
    expect(costListSelect.gte).toHaveBeenCalledWith('date', formatLocalDate('2026-04-04'))
    expect(costListSelect.lte).toHaveBeenCalledWith('date', formatLocalDate('2026-04-04'))
    expect(costListSelect.eq).toHaveBeenCalledWith('project_id', 21)
    expect(costListSelect.eq).toHaveBeenCalledWith('category', 'fuel')

    expect(revenuesList[0]).toMatchObject({
      id: 51,
      projectId: 21,
      projectName: 'Projeto Relacionado',
      description: 'Faturamento',
      amount: 250,
      status: 'billed',
    })
    expect(createdRevenue).toMatchObject({ id: 51, status: 'billed' })
    expect(loadedRevenue).toMatchObject({
      id: 51,
      projectName: 'Projeto Relacionado',
      description: 'Faturamento',
    })
    expect(updatedRevenue).toMatchObject({ id: 51, notes: 'Atualizado' })
    expect(revenueInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-04-05',
      })
    )
    expect(revenueUpdateValues).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-04-05',
      })
    )
    expect(revenueSelect.gte).toHaveBeenCalledWith('date', formatLocalDate('2026-04-05'))
    expect(revenueSelect.lte).toHaveBeenCalledWith('date', formatLocalDate('2026-04-05'))
    expect(revenueSelect.eq).toHaveBeenCalledWith('project_id', 21)
    expect(revenueSelect.eq).toHaveBeenCalledWith('status', 'billed')
  })
})
