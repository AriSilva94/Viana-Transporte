import type { Client } from '../../shared/types'

export interface SupabaseClientRow {
  id: number
  name: string
  document: string | null
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function mapSupabaseClientRow(row: SupabaseClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function mapClientToSupabaseInsert(
  client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
): Omit<SupabaseClientRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: client.name,
    document: client.document,
    phone: client.phone,
    email: client.email,
    notes: client.notes,
  }
}
