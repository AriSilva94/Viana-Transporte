import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { Button } from '@renderer/components/ui/button'
import type { Client } from '../../../shared/types'

export function ClientsListPage(): JSX.Element {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function loadClients(q?: string): Promise<void> {
    const data = await api.clients.list(q ? { search: q } : undefined)
    setClients(data)
  }

  useEffect(() => {
    loadClients()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.clients.delete(deleteId)
    setDeleteId(null)
    loadClients(search)
  }

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'document', label: 'Documento', render: (row: Client) => row.document ?? '—' },
    { key: 'phone', label: 'Telefone', render: (row: Client) => row.phone ?? '—' },
    { key: 'email', label: 'E-mail', render: (row: Client) => row.email ?? '—' },
    {
      key: 'actions',
      label: 'Ações',
      render: (row: Client) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/clients/${row.id}`)}
          >
            Ver
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/clients/${row.id}/edit`)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteId(row.id)}
          >
            Excluir
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Clientes"
        action={{ label: 'Novo Cliente', onClick: () => navigate('/clients/new') }}
      />
      {clients.length === 0 && !search ? (
        <EmptyState
          message="Nenhum cliente cadastrado"
          action={{
            label: 'Criar primeiro cliente',
            onClick: () => navigate('/clients/new'),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={clients}
          onSearch={(q) => {
            setSearch(q)
            loadClients(q)
          }}
          searchPlaceholder="Pesquisar por nome..."
        />
      )}
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
