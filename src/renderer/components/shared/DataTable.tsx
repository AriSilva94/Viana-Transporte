import * as React from 'react'
import { useState } from 'react'
import { Input } from '@renderer/components/ui/input'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onSearch?: (query: string) => void
  searchPlaceholder?: string
}

function DataTable<T extends object>({
  columns,
  data,
  onSearch,
  searchPlaceholder = 'Pesquisar...',
}: DataTableProps<T>): JSX.Element {
  const [search, setSearch] = useState('')

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    setSearch(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <div className="space-y-4">
      {onSearch && (
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={handleSearch}
          className="max-w-sm"
        />
      )}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/25">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { DataTable, type Column }
