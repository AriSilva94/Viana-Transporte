import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { Button } from '@renderer/components/ui/button'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Client, ProjectWithClient } from '../../../shared/types'

export function ClientDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<ProjectWithClient[]>([])

  useEffect(() => {
    const numId = Number(id)
    api.clients.get(numId).then(setClient)
    api.projects.list({ clientId: numId }).then(setProjects)
  }, [id])

  if (!client) {
    return <div className="text-muted-foreground">Carregando...</div>
  }

  const projectColumns = [
    { key: 'name', label: 'Nome' },
    {
      key: 'status',
      label: 'Status',
      render: (row: ProjectWithClient) => <StatusBadge status={row.status} />,
    },
    {
      key: 'contractAmount',
      label: 'Valor Contratado',
      render: (row: ProjectWithClient) =>
        row.contractAmount != null
          ? `R$ ${row.contractAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '—',
    },
    {
      key: 'link',
      label: '',
      render: (row: ProjectWithClient) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/projects/${row.id}`)}
        >
          Ver
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={client.name}
        action={{
          label: 'Editar',
          onClick: () => navigate(`/clients/${id}/edit`),
        }}
      />
      <div className="grid grid-cols-2 gap-4 mb-8 rounded-lg border p-4">
        <div>
          <span className="text-sm text-muted-foreground">Documento</span>
          <p className="mt-1">{client.document ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Telefone</span>
          <p className="mt-1">{client.phone ?? '—'}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">E-mail</span>
          <p className="mt-1">{client.email ?? '—'}</p>
        </div>
        <div className="col-span-2">
          <span className="text-sm text-muted-foreground">Notas</span>
          <p className="mt-1">{client.notes ?? '—'}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Projetos</h2>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">Nenhum projeto vinculado.</p>
      ) : (
        <DataTable columns={projectColumns} data={projects} />
      )}
    </div>
  )
}
