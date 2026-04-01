import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { ConfirmDialog } from '@renderer/components/shared/ConfirmDialog'
import { FilterPanel } from '@renderer/components/shared/FilterPanel'
import { Button } from '@renderer/components/ui/button'
import { Select } from '@renderer/components/ui/select'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Project, ProjectWithClient } from '../../../shared/types'

export function ProjectsListPage(): JSX.Element {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Project['status'] | ''>('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadProjects(q?: string, s?: Project['status'] | ''): Promise<void> {
    setIsLoading(true)
    try {
      const filters: Record<string, unknown> = {}
      if (q) filters.search = q
      if (s) filters.status = s
      const data = await api.projects.list(
        Object.keys(filters).length ? (filters as Parameters<typeof api.projects.list>[0]) : undefined
      )
      setProjects(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function handleDelete(): Promise<void> {
    if (deleteId === null) return
    await api.projects.delete(deleteId)
    setDeleteId(null)
    loadProjects(search, status)
  }

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'clientName', label: 'Cliente', render: (row: ProjectWithClient) => row.clientName ?? '—' },
    { key: 'location', label: 'Localização', render: (row: ProjectWithClient) => row.location ?? '—' },
    { key: 'status', label: 'Status', render: (row: ProjectWithClient) => <StatusBadge status={row.status} /> },
    {
      key: 'contractAmount',
      label: 'Valor Contratado',
      render: (row: ProjectWithClient) =>
        row.contractAmount != null
          ? `R$ ${row.contractAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '—',
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (row: ProjectWithClient) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${row.id}`)}>Ver</Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${row.id}/edit`)}>Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteId(row.id)}>Excluir</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Projetos"
        action={{ label: 'Novo Projeto', onClick: () => navigate('/projects/new') }}
      />
      <FilterPanel>
        <Select
          value={status}
          onChange={(e) => {
            const val = e.target.value as Project['status'] | ''
            setStatus(val)
            loadProjects(search, val)
          }}
          className="w-48"
        >
          <option value="">Todos os status</option>
          <option value="planned">Planejado</option>
          <option value="active">Ativo</option>
          <option value="completed">Concluído</option>
          <option value="canceled">Cancelado</option>
        </Select>
      </FilterPanel>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : projects.length === 0 ? (
        <EmptyState
          message="Nenhum projeto cadastrado"
          action={{ label: 'Criar primeiro projeto', onClick: () => navigate('/projects/new') }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          onSearch={(q) => { setSearch(q); loadProjects(q, status) }}
          searchPlaceholder="Pesquisar por nome..."
        />
      )}
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Excluir Projeto"
        description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita."
      />
    </div>
  )
}
