import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import { Label } from '@renderer/components/ui/label'
import type { DailyLogWithRelations, ProjectWithClient, Machine, Operator } from '../../../shared/types'

export function DailyLogFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined

  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [projectId, setProjectId] = useState<number | ''>('')
  const [machineId, setMachineId] = useState<number | ''>('')
  const [operatorId, setOperatorId] = useState<number | ''>('')
  const [hoursWorked, setHoursWorked] = useState<number | ''>('')
  const [workDescription, setWorkDescription] = useState('')
  const [fuelQuantity, setFuelQuantity] = useState<number | ''>('')
  const [downtimeNotes, setDowntimeNotes] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    api.projects.list().then(setProjects)
    api.machines.list().then(setMachines)
    api.operators.list().then(setOperators)

    if (!isEdit) return
    api.dailylogs.get(Number(id)).then((log: DailyLogWithRelations | null) => {
      if (!log) return
      setDate(new Date(log.date).toISOString().split('T')[0])
      setProjectId(log.projectId)
      setMachineId(log.machineId ?? '')
      setOperatorId(log.operatorId ?? '')
      setHoursWorked(log.hoursWorked)
      setWorkDescription(log.workDescription ?? '')
      setFuelQuantity(log.fuelQuantity ?? '')
      setDowntimeNotes(log.downtimeNotes ?? '')
      setNotes(log.notes ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!date) { setError('Data é obrigatória'); return }
    if (!projectId) { setError('Projeto é obrigatório'); return }
    if (hoursWorked === '' || Number(hoursWorked) <= 0) {
      setError('Horas trabalhadas devem ser maiores que zero')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        date: new Date(date),
        projectId: Number(projectId),
        machineId: machineId !== '' ? Number(machineId) : null,
        operatorId: operatorId !== '' ? Number(operatorId) : null,
        hoursWorked: Number(hoursWorked),
        workDescription: workDescription.trim() || null,
        fuelQuantity: fuelQuantity !== '' ? Number(fuelQuantity) : null,
        downtimeNotes: downtimeNotes.trim() || null,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await api.dailylogs.update(Number(id), data)
      } else {
        await api.dailylogs.create(data)
      }
      navigate('/daily-logs')
    } catch {
      setError('Erro ao salvar diário. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? 'Editar Diário de Operação' : 'Novo Diário de Operação'}
      description="Registre a rotina do dia com horas, máquina, operador e ocorrências de forma clara e auditável."
      onSubmit={handleSubmit}
      onCancel={() => navigate('/daily-logs')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Row 1: Data, Projeto */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Data *</Label>
          <DatePicker id="date" value={date} onChange={setDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">Projeto *</Label>
          <Select
            id="projectId"
            value={projectId === '' ? '' : String(projectId)}
            onChange={(e) => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Selecionar...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.clientName ?? ''}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Row 2: Máquina, Operador */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="machineId">Máquina</Label>
          <Select
            id="machineId"
            value={machineId === '' ? '' : String(machineId)}
            onChange={(e) => setMachineId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Nenhum</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="operatorId">Operador</Label>
          <Select
            id="operatorId"
            value={operatorId === '' ? '' : String(operatorId)}
            onChange={(e) => setOperatorId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Nenhum</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Row 3: Horas Trabalhadas, Combustível */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hoursWorked">Horas Trabalhadas *</Label>
          <Input
            id="hoursWorked"
            type="number"
            min={0}
            step={0.5}
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0.0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelQuantity">Combustível (L)</Label>
          <Input
            id="fuelQuantity"
            type="number"
            min={0}
            step={0.1}
            value={fuelQuantity}
            onChange={(e) => setFuelQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0.0"
          />
        </div>
      </div>

      {/* Row 4: Descrição do Serviço (full width) */}
      <div className="space-y-2">
        <Label htmlFor="workDescription">Descrição do Serviço</Label>
        <Textarea
          id="workDescription"
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          placeholder="Descreva o serviço realizado..."
        />
      </div>

      {/* Row 5: Observações de Parada, Observações Gerais */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="downtimeNotes">Observações de Parada</Label>
          <Textarea
            id="downtimeNotes"
            value={downtimeNotes}
            onChange={(e) => setDowntimeNotes(e.target.value)}
            placeholder="Registre ocorrências ou paradas..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações Gerais</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações adicionais..."
          />
        </div>
      </div>
    </FormCard>
  )
}
