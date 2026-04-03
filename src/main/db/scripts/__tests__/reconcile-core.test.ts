import { describe, expect, it } from 'vitest'
import { reconcileRecords } from '../reconcile-core'

describe('reconcileRecords', () => {
  it('reports ok for matching counts and sums', () => {
    const result = reconcileRecords(
      'project_costs',
      [{ amount: 10 }, { amount: '15' }],
      [{ amount: 10 }, { amount: 15 }],
      ['amount']
    )

    expect(result.ok).toBe(true)
    expect(result.leftCount).toBe(2)
    expect(result.rightCount).toBe(2)
    expect(result.sumDiffs).toEqual([{ key: 'amount', left: 25, right: 25, delta: 0 }])
  })

  it('reports mismatch when counts or sums differ', () => {
    const result = reconcileRecords(
      'daily_logs',
      [{ hoursWorked: 8 }, { hoursWorked: 4 }],
      [{ hoursWorked: 8 }],
      ['hoursWorked']
    )

    expect(result.ok).toBe(false)
    expect(result.leftCount).toBe(2)
    expect(result.rightCount).toBe(1)
    expect(result.sumDiffs).toEqual([{ key: 'hoursWorked', left: 12, right: 8, delta: 4 }])
  })
})
