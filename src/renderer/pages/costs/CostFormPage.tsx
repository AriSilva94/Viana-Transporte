import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { DatePicker } from '@renderer/components/ui/date-picker'
import { Label } from '@renderer/components/ui/label'
import { useToast } from '@renderer/context/ToastContext'
import { formatLocalDate, parseLocalDate } from '../../../shared/date'
import type { Machine, Operator, ProjectCost, ProjectCostWithRelations, ProjectWithClient } from '../../../shared/types'

type CostCategory = ProjectCost['category']

export function CostFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['costs', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(formatLocalDate(new Date()))
  const [projectId, setProjectId] = useState<number | ''>('')
  const [category, setCategory] = useState<CostCategory | ''>('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [machineId, setMachineId] = useState<number | ''>('')
  const [operatorId, setOperatorId] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const categoryOptions: { value: CostCategory; label: string }[] = [
    { value: 'fuel', label: t('costs:categories.fuel') },
    { value: 'labor', label: t('costs:categories.labor') },
    { value: 'maintenance', label: t('costs:categories.maintenance') },
    { value: 'transport', label: t('costs:categories.transport') },
    { value: 'outsourced', label: t('costs:categories.outsourced') },
    { value: 'miscellaneous', label: t('costs:categories.miscellaneous') },
  ]

  useEffect(() => {
    api.projects.list().then(setProjects)
    api.machines.list().then(setMachines)
    api.operators.list().then(setOperators)

    if (!isEdit) return
    api.costs.get(Number(id)).then((cost: ProjectCostWithRelations | null) => {
      if (!cost) return
      setDate(formatLocalDate(cost.date))
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
    if (!date) {
      setError(t('costs:form.errors.requiredDate'))
      return
    }
    if (!projectId) {
      setError(t('costs:form.errors.requiredProject'))
      return
    }
    if (!category) {
      setError(t('costs:form.errors.requiredCategory'))
      return
    }
    if (!description.trim()) {
      setError(t('costs:form.errors.requiredDescription'))
      return
    }
    if (amount === '' || Number(amount) <= 0) {
      setError(t('costs:form.errors.requiredAmount'))
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        date: parseLocalDate(date),
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
      showToast(t('costs:form.toasts.success'))
      navigate('/costs')
    } catch {
      showToast(t('costs:form.toasts.error'), 'error')
      setError(t('costs:form.errors.save'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('costs:form.editTitle') : t('costs:form.newTitle')}
      description={t('costs:form.description')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/costs')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">{t('costs:form.fields.date')}</Label>
          <DatePicker id="date" value={date} onChange={setDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">{t('costs:form.fields.project')}</Label>
          <Select
            id="projectId"
            value={projectId === '' ? '' : String(projectId)}
            onChange={(e) => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">{t('costs:form.placeholders.select')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.clientName ?? t('common:emptyValue')}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">{t('costs:form.fields.category')}</Label>
          <Select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as CostCategory | '')}
          >
            <option value="">{t('costs:form.placeholders.select')}</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('costs:form.fields.description')}</Label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('costs:form.placeholders.description')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">{t('costs:form.fields.amount')}</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={t('costs:form.placeholders.amount')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="machineId">{t('costs:form.fields.machine')}</Label>
          <Select
            id="machineId"
            value={machineId === '' ? '' : String(machineId)}
            onChange={(e) => setMachineId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">{t('costs:form.placeholders.none')}</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="operatorId">{t('costs:form.fields.operator')}</Label>
          <Select
            id="operatorId"
            value={operatorId === '' ? '' : String(operatorId)}
            onChange={(e) => setOperatorId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">{t('costs:form.placeholders.none')}</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('costs:form.fields.notes')}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('costs:form.placeholders.notes')}
        />
      </div>
    </FormCard>
  )
}
