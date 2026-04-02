import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { Label } from '@renderer/components/ui/label'
import { useToast } from '@renderer/context/ToastContext'
import type { Machine } from '../../../shared/types'

export function MachineFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['machines', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [brandModel, setBrandModel] = useState('')
  const [status, setStatus] = useState<Machine['status']>('available')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.machines.get(Number(id)).then((machine: Machine | null) => {
      if (!machine) return
      setName(machine.name)
      setType(machine.type)
      setIdentifier(machine.identifier ?? '')
      setBrandModel(machine.brandModel ?? '')
      setStatus(machine.status)
      setNotes(machine.notes ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('machines:form.errors.requiredName'))
      return
    }
    if (!type.trim()) {
      setError(t('machines:form.errors.requiredType'))
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        name: name.trim(),
        type: type.trim(),
        identifier: identifier.trim() || null,
        brandModel: brandModel.trim() || null,
        status,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await api.machines.update(Number(id), data)
      } else {
        await api.machines.create(data)
      }
      showToast(t('machines:form.toasts.success'))
      navigate('/machines')
    } catch {
      showToast(t('machines:form.toasts.error'), 'error')
      setError(t('machines:form.errors.save'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('machines:form.editTitle') : t('machines:form.newTitle')}
      description={t('machines:form.description')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/machines')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">{t('machines:form.fields.name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('machines:form.placeholders.name')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">{t('machines:form.fields.type')}</Label>
        <Input
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder={t('machines:form.placeholders.type')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="identifier">{t('machines:form.fields.identifier')}</Label>
        <Input
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={t('machines:form.placeholders.identifier')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brandModel">{t('machines:form.fields.brandModel')}</Label>
        <Input
          id="brandModel"
          value={brandModel}
          onChange={(e) => setBrandModel(e.target.value)}
          placeholder={t('machines:form.placeholders.brandModel')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">{t('machines:form.fields.status')}</Label>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as Machine['status'])}>
          <option value="available">{t('common:status.available')}</option>
          <option value="allocated">{t('common:status.allocated')}</option>
          <option value="under_maintenance">{t('common:status.under_maintenance')}</option>
          <option value="inactive">{t('common:status.inactive')}</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t('machines:form.fields.notes')}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('machines:form.placeholders.notes')}
        />
      </div>
    </FormCard>
  )
}
