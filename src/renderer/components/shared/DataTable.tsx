import * as React from 'react'
import { useState } from 'react'
import { Input } from '@renderer/components/ui/input'
import { useTranslation } from 'react-i18next'

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
  searchPlaceholder,
}: DataTableProps<T>): JSX.Element {
  const { t } = useTranslation('common')
  const [search, setSearch] = useState('')

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    setSearch(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <div className="space-y-4">
      {onSearch && (
        <Input
          placeholder={searchPlaceholder ?? t('search')}
          value={search}
          onChange={handleSearch}
          className="max-w-sm bg-white/80"
        />
      )}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-brand-sand/18">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-medium text-foreground/70"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-border/70 last:border-0 hover:bg-brand-sky/8">
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
