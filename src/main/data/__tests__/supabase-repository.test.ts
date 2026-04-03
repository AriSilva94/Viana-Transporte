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
    const machineInsert = createQueryMock({ data: machineRow, error: null })
    const machineUpdate = createQueryMock({ data: machineRow, error: null })
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
    const operatorInsert = createQueryMock({ data: operatorRow, error: null })
    const operatorUpdate = createQueryMock({ data: operatorRow, error: null })
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
})
