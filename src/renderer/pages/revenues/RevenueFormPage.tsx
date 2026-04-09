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
import type { ProjectRevenue, ProjectRevenueWithRelations, ProjectWithClient } from '../../../shared/types'

type RevenueStatus = ProjectRevenue['status']

export function RevenueFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['revenues', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(formatLocalDate(new Date()))
  const [projectId, setProjectId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [status, setStatus] = useState<RevenueStatus>('planned')
  const [notes, setNotes] = useState('')

  const statusOptions: { value: RevenueStatus; label: string }[] = [
    { value: 'planned', label: t('revenues:statuses.planned') },
    { value: 'billed', label: t('revenues:statuses.billed') },
    { value: 'received', label: t('revenues:statuses.received') },
  ]

  useEffect(() => {
    api.projects.list().then(setProjects)

    if (!isEdit) return
    api.revenues.get(Number(id)).then((revenue: ProjectRevenueWithRelations | null) => {
      if (!revenue) return
      setDate(formatLocalDate(revenue.date))
      setProjectId(revenue.projectId)
      setDescription(revenue.description)
      setAmount(revenue.amount)
      setStatus(revenue.status)
      setNotes(revenue.notes ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!date) {
      setError(t('revenues:form.errors.requiredDate'))
      return
    }
    if (!projectId) {
      setError(t('revenues:form.errors.requiredProject'))
      return
    }
    if (!description.trim()) {
      setError(t('revenues:form.errors.requiredDescription'))
      return
    }
    if (amount === '' || Number(amount) <= 0) {
      setError(t('revenues:form.errors.requiredAmount'))
      return
    }
    if (!status) {
      setError(t('revenues:form.errors.requiredStatus'))
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        date: parseLocalDate(date),
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
      showToast(t('revenues:form.toasts.success'))
      navigate('/revenues')
    } catch {
      showToast(t('revenues:form.toasts.error'), 'error')
      setError(t('revenues:form.errors.save'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('revenues:form.editTitle') : t('revenues:form.newTitle')}
      description={t('revenues:form.description')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/revenues')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">{t('revenues:form.fields.date')}</Label>
          <DatePicker id="date" value={date} onChange={setDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">{t('revenues:form.fields.project')}</Label>
          <Select
            id="projectId"
            value={projectId === '' ? '' : String(projectId)}
            onChange={(e) => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">{t('revenues:form.placeholders.select')}</option>
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
          <Label htmlFor="description">{t('revenues:form.fields.description')}</Label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('revenues:form.placeholders.description')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">{t('revenues:form.fields.amount')}</Label>
          <Input
            id="amount"
            type="number"
            min={0}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={t('revenues:form.placeholders.amount')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">{t('revenues:form.fields.status')}</Label>
          <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as RevenueStatus)}>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t('revenues:form.fields.notes')}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('revenues:form.placeholders.notes')}
        />
      </div>
    </FormCard>
  )
}
