import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import { Label } from '@renderer/components/ui/label'
import type { ProjectCostWithRelations, ProjectWithClient, Machine, Operator, ProjectCost } from '../../../shared/types'

type CostCategory = ProjectCost['category']

const CATEGORY_OPTIONS: { value: CostCategory; label: string }[] = [
  { value: 'fuel', label: 'Combustível' },
  { value: 'labor', label: 'Mão de obra' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'transport', label: 'Transporte' },
  { value: 'outsourced', label: 'Serviço terceirizado' },
  { value: 'miscellaneous', label: 'Diversos' },
]

export function CostFormPage(): JSX.Element {
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
  const [category, setCategory] = useState<CostCategory | ''>('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [machineId, setMachineId] = useState<number | ''>('')
  const [operatorId, setOperatorId] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    api.projects.list().then(setProjects)
    api.machines.list().then(setMachines)
    api.operators.list().then(setOperators)

    if (!isEdit) return
    api.costs.get(Number(id)).then((cost: ProjectCostWithRelations | null) => {
      if (!cost) return
      setDate(new Date(cost.date).toISOString().split('T')[0])
      setProjectId(cost.projectId)
      setCategory(cost.category)
      setDescription(cost.description)
      setAmount(cost.amount)
      setMachineId(cost.machineId ?? '')
      setOperatorId(cost.operatorId ?? '')
      setNotes(cost.notes ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!date) { setError('Data é obrigatória'); return }
    if (!projectId) { setError('Projeto é obrigatório'); return }
    if (!category) { setError('Categoria é obrigatória'); return }
    if (!description.trim()) { setError('Descrição é obrigatória'); return }
    if (amount === '' || Number(amount) <= 0) {
      setError('Valor deve ser maior que zero')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        date: new Date(date),
        projectId: Number(projectId),
        category: category as CostCategory,
        description: description.trim(),
        amount: Number(amount),
        machineId: machineId !== '' ? Number(machineId) : null,
        operatorId: operatorId !== '' ? Number(operatorId) : null,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await api.costs.update(Number(id), data)
      } else {
        await api.costs.create(data)
      }
      navigate('/costs')
    } catch {
      setError('Erro ao salvar custo. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? 'Editar Custo' : 'Novo Custo'}
      description="Registre despesas com contexto suficiente para leitura financeira e rastreabilidade operacional."
      onSubmit={handleSubmit}
      onCancel={() => navigate('/costs')}
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

      {/* Row 2: Categoria, Descrição */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as CostCategory | '')}
          >
            <option value="">Selecionar...</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o custo..."
          />
        </div>
      </div>

      {/* Row 3: Valor, Máquina */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$) *</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="machineId">Máquina</Label>
          <Select
            id="machineId"
            value={machineId === '' ? '' : String(machineId)}
            onChange={(e) => setMachineId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Nenhuma</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Row 4: Operador */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      {/* Row 5: Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações adicionais..."
        />
      </div>
    </FormCard>
  )
}
