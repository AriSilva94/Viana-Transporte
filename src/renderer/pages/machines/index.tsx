import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { Button } from '@renderer/components/ui/button'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Machine } from '../../../shared/types'

export function MachinesListPage(): JSX.Element {
  const navigate = useNavigate()
  const [machines, setMachines] = useState<Machine[]>([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadMachines(q?: string): Promise<void> {
    setIsLoading(true)
    try {
      const data = await api.machines.list(q ? { search: q } : undefined)
      setMachines(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMachines()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.machines.delete(deleteId)
    setDeleteId(null)
    loadMachines(search)
  }

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'type', label: 'Tipo' },
    { key: 'identifier', label: 'Identificador', render: (row: Machine) => row.identifier ?? '—' },
    { key: 'brandModel', label: 'Marca/Modelo', render: (row: Machine) => row.brandModel ?? '—' },
    { key: 'status', label: 'Status', render: (row: Machine) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Ações',
      render: (row: Machine) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/machines/${row.id}`)}>Ver</Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/machines/${row.id}/edit`)}>Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteId(row.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Máquinas"
        action={{ label: 'Nova Máquina', onClick: () => navigate('/machines/new') }}
      />
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : machines.length === 0 && !search ? (
        <EmptyState
          message="Nenhuma máquina cadastrada"
          action={{ label: 'Cadastrar primeira máquina', onClick: () => navigate('/machines/new') }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={machines}
          onSearch={(q) => { setSearch(q); loadMachines(q) }}
          searchPlaceholder="Pesquisar por nome ou tipo..."
        />
      )}
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Excluir Máquina"
        description="Tem certeza que deseja excluir esta máquina? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
