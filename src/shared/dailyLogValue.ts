export interface DailyLogFormulaInput {
  tonnage: number | null
  percentage: number | null
  km: number | null
  toll: number | null
}

export function computeDailyLogValue(input: DailyLogFormulaInput): number {
  const tonnage = Number(input.tonnage ?? 0)
  const percentage = Number(input.percentage ?? 0)
  const km = Number(input.km ?? 0)
  const toll = Number(input.toll ?? 0)
  return tonnage * percentage * km + toll
}
