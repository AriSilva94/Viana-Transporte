import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { Button } from '@renderer/components/ui/button'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Operator } from '../../../shared/types'

export function OperatorsListPage(): JSX.Element {
  const navigate = useNavigate()
  const [operators, setOperators] = useState<Operator[]>([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function loadOperators(q?: string): Promise<void> {
    const data = await api.operators.list(q ? { search: q } : undefined)
    setOperators(data)
  }

  useEffect(() => {
    loadOperators()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.operators.delete(deleteId)
    setDeleteId(null)
    loadOperators(search)
  }

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'phone', label: 'Telefone', render: (row: Operator) => row.phone ?? '—' },
    { key: 'role', label: 'Função', render: (row: Operator) => row.role ?? '—' },
    {
      key: 'isActive',
      label: 'Ativo',
      render: (row: Operator) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (row: Operator) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/operators/${row.id}/edit`)}>Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteId(row.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Operadores"
        action={{ label: 'Novo Operador', onClick: () => navigate('/operators/new') }}
      />
      {operators.length === 0 && !search ? (
        <EmptyState
          message="Nenhum operador cadastrado"
          action={{ label: 'Cadastrar primeiro operador', onClick: () => navigate('/operators/new') }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={operators}
          onSearch={(q) => { setSearch(q); loadOperators(q) }}
          searchPlaceholder="Pesquisar por nome..."
        />
      )}
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Excluir Operador"
        description="Tem certeza que deseja excluir este operador? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
