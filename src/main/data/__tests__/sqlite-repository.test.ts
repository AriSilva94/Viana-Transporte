import { describe, expect, it } from 'vitest'
import { createSqliteRepositoryForTest } from '../sqlite/repository'

describe('createSqliteRepositoryForTest', () => {
  it('lists clients through repository contract', async () => {
    const repo = await createSqliteRepositoryForTest()
    const rows = await repo.clients.list()

    expect(Array.isArray(rows)).toBe(true)
  })
})
