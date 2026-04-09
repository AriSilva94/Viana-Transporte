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
import type { Client, Project, ProjectWithClient } from '../../../shared/types'

export function ProjectFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['projects', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<Project['status']>('planned')
  const [contractAmount, setContractAmount] = useState('')
  const [description, setDescription] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.clients.list().then(setClients)
    if (!isEdit) return
    api.projects.get(Number(id)).then((project: ProjectWithClient | null) => {
      if (!project) return
      setName(project.name)
      setClientId(String(project.clientId))
      setLocation(project.location ?? '')
      setStartDate(project.startDate ? formatLocalDate(project.startDate) : '')
      setEndDate(project.endDate ? formatLocalDate(project.endDate) : '')
      setStatus(project.status)
      setContractAmount(project.contractAmount != null ? String(project.contractAmount) : '')
      setDescription(project.description ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('projects:form.errors.requiredName'))
      return
    }
    if (!clientId) {
      setError(t('projects:form.errors.requiredClient'))
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        name: name.trim(),
        clientId: Number(clientId),
        location: location.trim() || null,
        startDate: startDate ? parseLocalDate(startDate) : null,
        endDate: endDate ? parseLocalDate(endDate) : null,
        status,
        contractAmount: contractAmount ? Number(contractAmount) : null,
        description: description.trim() || null,
      }
      if (isEdit) {
        await api.projects.update(Number(id), data)
      } else {
        await api.projects.create(data)
      }
      showToast(t('projects:form.toasts.success'))
      navigate('/projects')
    } catch {
      showToast(t('projects:form.toasts.error'), 'error')
      setError(t('projects:form.errors.save'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('projects:form.editTitle') : t('projects:form.newTitle')}
      description={t('projects:form.description')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/projects')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">{t('projects:form.fields.name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('projects:form.placeholders.name')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientId">{t('projects:form.fields.client')}</Label>
        <Select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">{t('projects:form.placeholders.client')}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">{t('projects:form.fields.location')}</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('projects:form.placeholders.location')}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t('projects:form.fields.startDate')}</Label>
          <DatePicker id="startDate" value={startDate} onChange={setStartDate} allowClear />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t('projects:form.fields.endDate')}</Label>
          <DatePicker id="endDate" value={endDate} onChange={setEndDate} allowClear />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">{t('projects:form.fields.status')}</Label>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as Project['status'])}>
          <option value="planned">{t('common:status.planned')}</option>
          <option value="active">{t('common:status.active')}</option>
          <option value="completed">{t('common:status.completed')}</option>
          <option value="canceled">{t('common:status.canceled')}</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contractAmount">{t('projects:form.fields.contractAmount')}</Label>
        <Input
          id="contractAmount"
          type="number"
          step="0.01"
          min="0"
          value={contractAmount}
          onChange={(e) => setContractAmount(e.target.value)}
          placeholder={t('projects:form.placeholders.contractAmount')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t('projects:form.fields.description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('projects:form.placeholders.description')}
        />
      </div>
    </FormCard>
  )
}
