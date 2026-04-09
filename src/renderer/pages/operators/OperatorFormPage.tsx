import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { useToast } from '@renderer/context/ToastContext'
import type { Operator } from '../../../shared/types'

export function OperatorFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['operators', 'common'])
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.operators.get(Number(id)).then((operator: Operator | null) => {
      if (!operator) return
      setName(operator.name)
      setPhone(operator.phone ?? '')
      setRole(operator.role ?? '')
      setIsActive(operator.isActive)
      setNotes(operator.notes ?? '')
    })
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('operators:form.errors.requiredName'))
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim() || null,
        role: role.trim() || null,
        isActive,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await api.operators.update(Number(id), data)
      } else {
        await api.operators.create(data)
      }
      showToast(t('operators:form.toasts.success'))
      navigate('/operators')
    } catch {
      showToast(t('operators:form.toasts.error'), 'error')
      setError(t('operators:form.errors.save'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? t('operators:form.editTitle') : t('operators:form.newTitle')}
      description={t('operators:form.description')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/operators')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">{t('operators:form.fields.name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('operators:form.placeholders.name')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t('operators:form.fields.phone')}</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('operators:form.placeholders.phone')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">{t('operators:form.fields.role')}</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder={t('operators:form.placeholders.role')}
        />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-brand-sand/12 px-4 py-3">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
        />
        <Label htmlFor="isActive">{t('operators:form.fields.isActive')}</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t('operators:form.fields.notes')}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('operators:form.placeholders.notes')}
        />
      </div>
    </FormCard>
  )
}
