export interface DailyLogFormulaInput {
  tonnage?: number | null
  percentage?: number | null
  km?: number | null
  toll?: number | null
  valuePerTon?: number | null
}

export type DailyLogCalculationError =
  | 'calculation_fields_must_be_positive'
  | 'incomplete_calculation_fields'
  | 'mixed_calculation_fields'
  | 'invalid_calculation_fields'

export type DailyLogCalculationResult =
  | { mode: 'legacy'; value: number }
  | { mode: 'perTon'; value: number }
  | { mode: 'none'; value: 0 }
  | { mode: 'invalid'; error: DailyLogCalculationError }

function toNumber(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value)
}

export function resolveDailyLogCalculation(input: DailyLogFormulaInput): DailyLogCalculationResult {
  const values = {
    tonnage: toNumber(input.tonnage),
    percentage: toNumber(input.percentage),
    km: toNumber(input.km),
    toll: toNumber(input.toll),
    valuePerTon: toNumber(input.valuePerTon),
  }
  const provided = Object.values(values).filter((value): value is number => value !== null)

  if (provided.length === 0) {
    return { mode: 'none', value: 0 }
  }

  if (provided.some((value) => !Number.isFinite(value))) {
    return { mode: 'invalid', error: 'invalid_calculation_fields' }
  }

  const hasLegacyFields = [values.percentage, values.km, values.toll].some(
    (value) => value !== null,
  )
  if (values.valuePerTon !== null && hasLegacyFields) {
    return { mode: 'invalid', error: 'mixed_calculation_fields' }
  }

  if (provided.some((value) => value <= 0)) {
    return { mode: 'invalid', error: 'calculation_fields_must_be_positive' }
  }

  if (values.tonnage !== null && values.valuePerTon !== null) {
    return { mode: 'perTon', value: values.tonnage * values.valuePerTon }
  }

  if (
    values.tonnage !== null &&
    values.percentage !== null &&
    values.km !== null &&
    values.toll !== null
  ) {
    return {
      mode: 'legacy',
      value: values.tonnage * values.percentage * values.km + values.toll,
    }
  }

  return { mode: 'invalid', error: 'incomplete_calculation_fields' }
}

export function computeDailyLogValue(input: DailyLogFormulaInput): number {
  const result = resolveDailyLogCalculation(input)
  return result.mode === 'invalid' ? 0 : result.value
}
