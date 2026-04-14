import { readFile } from 'fs/promises'
import { join } from 'path'
import { describe, expect, it, vi } from 'vitest'
import { createBootstrapAdminOwnership } from '../bootstrap-admin-ownership'

describe('SQL schema contract', () => {
  it('contains profiles table, allowed roles, and user_id columns', async () => {
    const sql = await readFile(
      join(__dirname, '../../sql/supabase-user-ownership.sql'),
      'utf8'
    )
    expect(sql).toContain('create table if not exists public.profiles')
    expect(sql).toContain("check (role in ('admin', 'owner', 'employee'))")
    expect(sql).toContain('alter table public.clients add column if not exists user_id uuid')
    expect(sql).toContain('alter table public.projects add column if not exists user_id uuid')
    expect(sql).toContain('alter table public.machines add column if not exists user_id uuid')
    expect(sql).toContain('alter table public.operators add column if not exists user_id uuid')
    expect(sql).toContain('alter table public.daily_logs add column if not exists user_id uuid')
    expect(sql).toContain('alter table public.project_costs add column if not exists user_id uuid')
    expect(sql).toContain('alter table public.project_revenues add column if not exists user_id uuid')
    expect(sql).toContain('alter table public.profiles enable row level security')
    expect(sql).toContain('enable row level security')
  })

  it('allows authenticated users to read shared operational data while keeping writes owned', async () => {
    const sql = await readFile(
      join(__dirname, '../../sql/supabase-user-ownership.sql'),
      'utf8'
    )

    expect(sql).toContain('select_authenticated')
    expect(sql).toContain("auth.role() = ''authenticated''")
    expect(sql).toContain('for insert with check (auth.uid() = user_id)')
    expect(sql).toContain('for update using (auth.uid() = user_id)')
    expect(sql).toContain('for delete using (auth.uid() = user_id)')
  })

  it('provides an incremental SQL patch for existing environments', async () => {
    const sql = await readFile(
      join(__dirname, '../../sql/supabase-shared-read-access.sql'),
      'utf8'
    )

    expect(sql).toContain('drop policy if exists')
    expect(sql).toContain('create policy "%1$s_select_authenticated"')
    expect(sql).toContain("auth.role() = ''authenticated''")
  })
})

describe('createBootstrapAdminOwnership', () => {
  it('fails clearly when the configured admin user does not exist', async () => {
    const script = createBootstrapAdminOwnership({
      listUsers: vi.fn().mockResolvedValue([]),
      upsertProfile: vi.fn(),
      backfillTable: vi.fn(),
      setNotNull: vi.fn(),
      countNulls: vi.fn().mockResolvedValue(0),
    })

    await expect(
      script.run({
        adminEmail: 'admin@test.com',
        adminRole: 'admin',
      })
    ).rejects.toThrow('Admin user admin@test.com was not found in auth.users')
  })

  it('upserts the admin profile and backfills all operational tables', async () => {
    const upsertProfile = vi.fn()
    const backfillTable = vi.fn()
    const setNotNull = vi.fn()
    const countNulls = vi.fn().mockResolvedValue(0)

    const script = createBootstrapAdminOwnership({
      listUsers: vi.fn().mockResolvedValue([
        { id: 'uuid-1', email: 'admin@test.com' },
        { id: 'uuid-2', email: 'other@test.com' },
      ]),
      upsertProfile,
      backfillTable,
      setNotNull,
      countNulls,
    })

    const result = await script.run({
      adminEmail: 'admin@test.com',
      adminRole: 'admin',
    })

    expect(result.adminId).toBe('uuid-1')
    expect(upsertProfile).toHaveBeenCalledWith({
      id: 'uuid-1',
      email: 'admin@test.com',
      role: 'admin',
    })

    expect(backfillTable).toHaveBeenCalledTimes(7)
    expect(backfillTable).toHaveBeenCalledWith('clients', 'uuid-1')
    expect(backfillTable).toHaveBeenCalledWith('projects', 'uuid-1')
    expect(backfillTable).toHaveBeenCalledWith('machines', 'uuid-1')
    expect(backfillTable).toHaveBeenCalledWith('operators', 'uuid-1')
    expect(backfillTable).toHaveBeenCalledWith('daily_logs', 'uuid-1')
    expect(backfillTable).toHaveBeenCalledWith('project_costs', 'uuid-1')
    expect(backfillTable).toHaveBeenCalledWith('project_revenues', 'uuid-1')

    expect(setNotNull).toHaveBeenCalledTimes(7)
    expect(result.tablesUpdated).toHaveLength(7)
  })

  it('fails when backfill leaves null rows', async () => {
    const script = createBootstrapAdminOwnership({
      listUsers: vi.fn().mockResolvedValue([{ id: 'uuid-1', email: 'admin@test.com' }]),
      upsertProfile: vi.fn(),
      backfillTable: vi.fn(),
      setNotNull: vi.fn(),
      countNulls: vi.fn().mockResolvedValue(3),
    })

    await expect(
      script.run({ adminEmail: 'admin@test.com', adminRole: 'admin' })
    ).rejects.toThrow('Backfill incomplete: clients still has 3 rows with null user_id')
  })
})
