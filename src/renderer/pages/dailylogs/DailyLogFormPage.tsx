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
import type { DailyLogWithRelations, Machine, Operator, ProjectWithClient } from '../../../shared/types'

export function DailyLogFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['dailylogs', 'common'])
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
      setDate(formatLocalDate(log.date))
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
    if (!date) {
      setError(t('dailylogs:form.errors.requiredDate'))
      return
    }
    if (!projectId) {
      setError(t('dailylogs:form.errors.requiredProject'))
      return
    }
    if (hoursWorked === '' || Number(hoursWorked) <= 0) {
      setError(t('dailylogs:form.errors.requiredHours'))
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        date: parseLocalDate(date),
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
      showToast(t('dailylogs:form.toasts.success'))
      navigate('/daily-logs')
    } catch {
      showToast(t('dailylogs:form.toasts.error'), 'error')
      setError(t('dailylogs:form.errors.save'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('dailylogs:form.editTitle') : t('dailylogs:form.newTitle')}
      description={t('dailylogs:form.description')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/daily-logs')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">{t('dailylogs:form.fields.date')}</Label>
          <DatePicker id="date" value={date} onChange={setDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">{t('dailylogs:form.fields.project')}</Label>
          <Select
            id="projectId"
            value={projectId === '' ? '' : String(projectId)}
            onChange={(e) => setProjectId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">{t('dailylogs:form.placeholders.select')}</option>
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
          <Label htmlFor="machineId">{t('dailylogs:form.fields.machine')}</Label>
          <Select
            id="machineId"
            value={machineId === '' ? '' : String(machineId)}
            onChange={(e) => setMachineId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">{t('dailylogs:form.placeholders.none')}</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="operatorId">{t('dailylogs:form.fields.operator')}</Label>
          <Select
            id="operatorId"
            value={operatorId === '' ? '' : String(operatorId)}
            onChange={(e) => setOperatorId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">{t('dailylogs:form.placeholders.none')}</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hoursWorked">{t('dailylogs:form.fields.hoursWorked')}</Label>
          <Input
            id="hoursWorked"
            type="number"
            min={0}
            step={0.5}
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={t('dailylogs:form.placeholders.hoursWorked')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelQuantity">{t('dailylogs:form.fields.fuelQuantity')}</Label>
          <Input
            id="fuelQuantity"
            type="number"
            min={0}
            step={0.1}
            value={fuelQuantity}
            onChange={(e) => setFuelQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={t('dailylogs:form.placeholders.fuelQuantity')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workDescription">{t('dailylogs:form.fields.workDescription')}</Label>
        <Textarea
          id="workDescription"
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          placeholder={t('dailylogs:form.placeholders.workDescription')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="downtimeNotes">{t('dailylogs:form.fields.downtimeNotes')}</Label>
          <Textarea
            id="downtimeNotes"
            value={downtimeNotes}
            onChange={(e) => setDowntimeNotes(e.target.value)}
            placeholder={t('dailylogs:form.placeholders.downtimeNotes')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">{t('dailylogs:form.fields.notes')}</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('dailylogs:form.placeholders.notes')}
          />
        </div>
      </div>
    </FormCard>
  )
}
