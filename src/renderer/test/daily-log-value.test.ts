import { describe, expect, it } from 'vitest'
import { resolveDailyLogCalculation } from '../../shared/dailyLogValue'

describe('resolveDailyLogCalculation', () => {
  it('calcula o modo existente', () => {
    expect(resolveDailyLogCalculation({ tonnage: 10, percentage: 0.5, km: 100, toll: 15 })).toEqual({
      mode: 'legacy',
      value: 515,
    })
  })

  it('calcula o modo por tonelada com casas decimais', () => {
    expect(resolveDailyLogCalculation({ tonnage: 10.5, valuePerTon: 25.5 })).toEqual({
      mode: 'perTon',
      value: 267.75,
    })
  })

  it('rejeita zero e combinações incompletas', () => {
    expect(resolveDailyLogCalculation({ tonnage: 10, valuePerTon: 0 })).toEqual({
      mode: 'invalid',
      error: 'calculation_fields_must_be_positive',
    })
    expect(resolveDailyLogCalculation({ tonnage: 10, km: 100 })).toEqual({
      mode: 'invalid',
      error: 'incomplete_calculation_fields',
    })
  })

  it('permite um diário sem campos de cálculo', () => {
    expect(resolveDailyLogCalculation({})).toEqual({ mode: 'none', value: 0 })
  })

  it('rejeita mistura dos dois modos', () => {
    expect(
      resolveDailyLogCalculation({ tonnage: 10, valuePerTon: 25, percentage: 0.5, km: 100, toll: 15 }),
    ).toEqual({ mode: 'invalid', error: 'mixed_calculation_fields' })
  })
})
