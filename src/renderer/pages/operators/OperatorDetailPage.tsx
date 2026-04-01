import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { SurfaceSection } from '@renderer/components/shared/SurfaceSection'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Operator, DailyLogWithRelations } from '../../../shared/types'

export function OperatorDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [operator, setOperator] = useState<Operator | null>(null)
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([])

  useEffect(() => {
    const numId = Number(id)
    api.operators.get(numId).then(setOperator)
    api.dailylogs.list({ operatorId: numId }).then(setLogs)
  }, [id])

  if (!operator) {
    return <div className="text-muted-foreground">Carregando...</div>
  }

  const logColumns = [
    {
      key: 'date',
      label: 'Data',
      render: (row: DailyLogWithRelations) =>
        new Date(row.date).toLocaleDateString('pt-BR'),
    },
    {
      key: 'projectName',
      label: 'Projeto',
      render: (row: DailyLogWithRelations) => row.projectName ?? '—',
    },
    {
      key: 'machineName',
      label: 'Máquina',
      render: (row: DailyLogWithRelations) => row.machineName ?? '—',
    },
    {
      key: 'hoursWorked',
      label: 'Horas',
      render: (row: DailyLogWithRelations) => String(row.hoursWorked),
    },
    {
      key: 'workDescription',
      label: 'Serviço',
      render: (row: DailyLogWithRelations) => row.workDescription ?? '—',
    },
  ]

  return (
    <div>
      <PageHeader
        title={operator.name}
        action={{
          label: 'Editar',
          onClick: () => navigate(`/operators/${id}/edit`),
        }}
      />
      <div className="space-y-6">
        <SurfaceSection
          eyebrow="Colaborador"
          title="Dados do Operador"
          description="Informações de contato e função operacional."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-brand-sand/12 p-4">
              <span className="text-sm text-muted-foreground">Telefone</span>
              <p className="mt-1 font-medium">{operator.phone ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-brand-sky/10 p-4">
              <span className="text-sm text-muted-foreground">Função</span>
              <p className="mt-1 font-medium">{operator.role ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <span className="text-sm text-muted-foreground">Status</span>
              <p className="mt-1 font-medium">
                <StatusBadge status={operator.isActive ? 'active' : 'inactive'} />
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 md:col-span-2">
              <span className="text-sm text-muted-foreground">Notas</span>
              <p className="mt-1 font-medium">{operator.notes ?? '—'}</p>
            </div>
          </div>
        </SurfaceSection>

        <SurfaceSection
          eyebrow="Histórico"
          title="Registros Diários"
          description="Diários de operação vinculados a este operador."
        >
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro encontrado para este operador.</p>
          ) : (
            <DataTable columns={logColumns} data={logs} />
          )}
        </SurfaceSection>
      </div>
    </div>
  )
}
