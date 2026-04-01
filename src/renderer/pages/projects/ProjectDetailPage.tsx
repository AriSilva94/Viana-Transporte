import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { ProjectWithClient, ProjectSummary } from '../../../shared/types'

export function ProjectDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectWithClient | null>(null)
  const [summary, setSummary] = useState<ProjectSummary>({
    totalCosts: 0,
    totalRevenues: 0,
    profit: 0,
    totalHours: 0,
  })

  useEffect(() => {
    const numId = Number(id)
    api.projects.get(numId).then(setProject)
    api.projects.summary(numId).then(setSummary)
  }, [id])

  if (!project) {
    return <div className="text-muted-foreground">Carregando...</div>
  }

  function formatCurrency(val: number): string {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function formatDate(d: Date | null): string {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR')
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        action={{ label: 'Editar', onClick: () => navigate(`/projects/${id}/edit`) }}
      />
      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="logs">Registros</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <span className="text-sm text-muted-foreground">Cliente</span>
              <p className="mt-1">{project.clientName ?? '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="mt-1"><StatusBadge status={project.status} /></div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Localização</span>
              <p className="mt-1">{project.location ?? '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Valor Contratado</span>
              <p className="mt-1">{project.contractAmount != null ? formatCurrency(project.contractAmount) : '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Data Início</span>
              <p className="mt-1">{formatDate(project.startDate)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Data Fim</span>
              <p className="mt-1">{formatDate(project.endDate)}</p>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">Descrição</span>
              <p className="mt-1">{project.description ?? '—'}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <p className="text-muted-foreground">Registros diários disponíveis na Fase 3.</p>
        </TabsContent>

        <TabsContent value="custos">
          <p className="text-muted-foreground">Custos disponíveis na Fase 4.</p>
        </TabsContent>

        <TabsContent value="receitas">
          <p className="text-muted-foreground">Receitas disponíveis na Fase 4.</p>
        </TabsContent>

        <TabsContent value="resumo">
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <span className="text-sm text-muted-foreground">Total de Custos</span>
              <p className="text-lg font-semibold mt-1">{formatCurrency(summary.totalCosts)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total de Receitas</span>
              <p className="text-lg font-semibold mt-1">{formatCurrency(summary.totalRevenues)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Lucro / Prejuízo</span>
              <p className={`text-lg font-semibold mt-1 ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.profit)}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total de Horas</span>
              <p className="text-lg font-semibold mt-1">{summary.totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
