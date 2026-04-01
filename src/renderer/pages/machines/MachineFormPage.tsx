import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@renderer/lib/api'
import { FormCard } from '@renderer/components/shared/FormCard'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Select } from '@renderer/components/ui/select'
import { Label } from '@renderer/components/ui/label'
import type { Machine } from '../../../shared/types'

export function MachineFormPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined

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
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    if (!type.trim()) { setError('Tipo é obrigatório'); return }
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
      navigate('/machines')
    } catch {
      setError('Erro ao salvar máquina. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormCard
      title={isEdit ? 'Editar Máquina' : 'Nova Máquina'}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/machines')}
      isLoading={isLoading}
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Escavadeira John Deere" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo *</Label>
        <Input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex: Escavadeira, Bulldozer" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="identifier">Identificador</Label>
        <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Código do ativo" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brandModel">Marca/Modelo</Label>
        <Input id="brandModel" value={brandModel} onChange={(e) => setBrandModel(e.target.value)} placeholder="Ex: John Deere 350G" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as Machine['status'])}>
          <option value="available">Disponível</option>
          <option value="allocated">Alocado</option>
          <option value="under_maintenance">Em Manutenção</option>
          <option value="inactive">Inativo</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." />
      </div>
    </FormCard>
  )
}
