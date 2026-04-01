import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import { Label } from '@renderer/components/ui/label'
import type { ProjectRevenueWithRelations, ProjectWithClient, ProjectRevenue } from '../../../shared/types'

type RevenueStatus = ProjectRevenue['status']

const STATUS_OPTIONS: { value: RevenueStatus; label: string }[] = [
  { value: 'planned', label: 'Previsto' },
  { value: 'billed', label: 'Faturado' },
  { value: 'received', label: 'Recebido' },
]

export function RevenueFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined

  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [projectId, setProjectId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [status, setStatus] = useState<RevenueStatus>('planned')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    api.projects.list().then(setProjects)

    if (!isEdit) return
    api.revenues.get(Number(id)).then((revenue: ProjectRevenueWithRelations | null) => {
      if (!revenue) return
      setDate(new Date(revenue.date).toISOString().split('T')[0])
      setProjectId(revenue.projectId)
      setDescription(revenue.description)
      setAmount(revenue.amount)
      setStatus(revenue.status)
      setNotes(revenue.notes ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!date) { setError('Data é obrigatória'); return }
    if (!projectId) { setError('Projeto é obrigatório'); return }
    if (!description.trim()) { setError('Descrição é obrigatória'); return }
    if (amount === '' || Number(amount) <= 0) {
      setError('Valor deve ser maior que zero')
      return
    }
    if (!status) { setError('Status é obrigatório'); return }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        date: new Date(date),
        projectId: Number(projectId),
        description: description.trim(),
        amount: Number(amount),
        status,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await api.revenues.update(Number(id), data)
      } else {
        await api.revenues.create(data)
      }
      navigate('/revenues')
    } catch {
      setError('Erro ao salvar receita. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? 'Editar Receita' : 'Nova Receita'}
      description="Cadastre medições e entradas com status financeiro claro para facilitar o acompanhamento."
      onSubmit={handleSubmit}
      onCancel={() => navigate('/revenues')}
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

      {/* Row 2: Descrição, Valor */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a receita ou medição..."
          />
        </div>
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
      </div>

      {/* Row 3: Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RevenueStatus)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Row 4: Observações */}
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
