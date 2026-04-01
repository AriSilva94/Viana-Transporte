import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import type { Operator } from '../../../shared/types'

export function OperatorFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined

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
    if (!name.trim()) { setError('Nome é obrigatório'); return }
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
      navigate('/operators')
    } catch {
      setError('Erro ao salvar operador. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? 'Editar Operador' : 'Novo Operador'}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/operators')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do operador" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Função</Label>
        <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Operador de Escavadeira" />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="isActive">Operador Ativo</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." />
      </div>
    </FormCard>
  )
}
