export interface ReconciliationDifference {
  key: string
  left: number
  right: number
  delta: number
}

export interface ReconciliationResult {
  label: string
  leftCount: number
  rightCount: number
  countDelta: number
  sumDiffs: ReconciliationDifference[]
  ok: boolean
}

function normalizeNumeric(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }

  return Number(value)
}

function normalizeDelta(value: number): number {
  return Math.abs(value) < 1e-9 ? 0 : value
}

export function reconcileRecords<T extends object>(
  label: string,
  left: T[],
  right: T[],
  sumKeys: Array<keyof T>
): ReconciliationResult {
  const sumDiffs = sumKeys.map((key) => {
    const leftTotal = left.reduce((total, row) => total + normalizeNumeric((row as Record<string, unknown>)[String(key)]), 0)
    const rightTotal = right.reduce((total, row) => total + normalizeNumeric((row as Record<string, unknown>)[String(key)]), 0)
    const delta = normalizeDelta(leftTotal - rightTotal)

    return {
      key: String(key),
      left: leftTotal,
      right: rightTotal,
      delta,
    }
  })

  return {
    label,
    leftCount: left.length,
    rightCount: right.length,
    countDelta: left.length - right.length,
    sumDiffs,
    ok: left.length === right.length && sumDiffs.every((diff) => diff.delta === 0),
  }
}

export function formatReconciliationResult(result: ReconciliationResult): string {
  const lines = [
    `${result.label}: ${result.ok ? 'OK' : 'MISMATCH'}`,
    `  count: left=${result.leftCount} right=${result.rightCount} delta=${result.countDelta}`,
  ]

  for (const diff of result.sumDiffs) {
    lines.push(`  ${diff.key}: left=${diff.left} right=${diff.right} delta=${diff.delta}`)
  }

  return lines.join('\n')
}
