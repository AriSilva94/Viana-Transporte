import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { DataTable } from '@renderer/components/shared/DataTable'
import { SurfaceSection } from '@renderer/components/shared/SurfaceSection'
import { StatusBadge } from '@renderer/components/ui/badge'
import type { Machine, DailyLogWithRelations } from '../../../shared/types'

export function MachineDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [logs, setLogs] = useState<DailyLogWithRelations[]>([])

  useEffect(() => {
    const numId = Number(id)
    api.machines.get(numId).then(setMachine)
    api.dailylogs.list({ machineId: numId }).then(setLogs)
  }, [id])

  if (!machine) {
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
      key: 'operatorName',
      label: 'Operador',
      render: (row: DailyLogWithRelations) => row.operatorName ?? '—',
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
        title={machine.name}
        action={{
          label: 'Editar',
          onClick: () => navigate(`/machines/${id}/edit`),
        }}
      />
      <div className="space-y-6">
        <SurfaceSection
          eyebrow="Equipamento"
          title="Dados da Máquina"
          description="Informações técnicas e operacionais do equipamento."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-brand-sand/12 p-4">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <p className="mt-1 font-medium">{machine.type}</p>
            </div>
            <div className="rounded-2xl bg-brand-sky/10 p-4">
              <span className="text-sm text-muted-foreground">Identificador</span>
              <p className="mt-1 font-medium">{machine.identifier ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <span className="text-sm text-muted-foreground">Marca / Modelo</span>
              <p className="mt-1 font-medium">{machine.brandModel ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <span className="text-sm text-muted-foreground">Status</span>
              <p className="mt-1 font-medium">
                <StatusBadge status={machine.status} />
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 md:col-span-2">
              <span className="text-sm text-muted-foreground">Notas</span>
              <p className="mt-1 font-medium">{machine.notes ?? '—'}</p>
            </div>
          </div>
        </SurfaceSection>

        <SurfaceSection
          eyebrow="Histórico"
          title="Registros de Uso"
          description="Diários de operação vinculados a este equipamento."
        >
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro de uso encontrado.</p>
          ) : (
            <DataTable columns={logColumns} data={logs} />
          )}
        </SurfaceSection>
      </div>
    </div>
  )
}
