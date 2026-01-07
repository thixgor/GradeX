'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, Edit2, X } from 'lucide-react'

interface TeamMember {
  name: string
  role: string
  image?: string
  description?: string
  imageOffsetX?: number
  imageOffsetY?: number
  imageZoom?: number
}

interface DraggingState {
  type: 'leadership' | 'instructors'
  index: number
  pointerId: number
  startX: number
  startY: number
  startOffsetX: number
  startOffset: number
}

export default function AdminEquipePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<DraggingState | null>(null)
  const [editingMember, setEditingMember] = useState<{ type: 'leadership' | 'instructors', index: number } | null>(null)

  const [leadership, setLeadership] = useState<TeamMember[]>([])
  const [instructors, setInstructors] = useState<TeamMember[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadConfig()
    }
  }, [user])

  async function loadConfig() {
    try {
      const res = await fetch('/api/admin/equipe')
      if (res.ok) {
        const data = await res.json()

        if (data.leadership) {
          setLeadership(data.leadership)
        }

        if (data.instructors) {
          setInstructors(data.instructors)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  useEffect(() => {
    if (dragging) {
      const handlePointerMove = (e: PointerEvent) => {
        if (e.pointerId !== dragging.pointerId) return
        const deltaX = e.clientX - dragging.startX
        const deltaY = e.clientY - dragging.startY
        const container = document.getElementById(`drag-container-${dragging.type}-${dragging.index}`)
        if (!container) return

        const containerHeight = container.clientHeight
        const containerWidth = container.clientWidth

        const offsetChangeX = (deltaX / containerWidth) * 100
        const offsetChangeY = (deltaY / containerHeight) * 100

        let newOffsetX = Math.max(0, Math.min(100, dragging.startOffsetX + offsetChangeX))
        let newOffsetY = Math.max(0, Math.min(100, dragging.startOffset + offsetChangeY))

        if (dragging.type === 'leadership') {
          const updated = [...leadership]
          updated[dragging.index].imageOffsetX = newOffsetX
          updated[dragging.index].imageOffsetY = newOffsetY
          setLeadership(updated)
        } else {
          const updated = [...instructors]
          updated[dragging.index].imageOffsetX = newOffsetX
          updated[dragging.index].imageOffsetY = newOffsetY
          setInstructors(updated)
        }
      }

      const handlePointerUp = (e: PointerEvent) => {
        if (e.pointerId !== dragging.pointerId) return
        setDragging(null)
      }

      const handlePointerCancel = (e: PointerEvent) => {
        if (e.pointerId !== dragging.pointerId) return
        setDragging(null)
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
      document.addEventListener('pointercancel', handlePointerCancel)

      return () => {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
        document.removeEventListener('pointercancel', handlePointerCancel)
      }
    }
  }, [dragging, leadership, instructors])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }
      setUser(data.user)
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handlePointerDown = (type: 'leadership' | 'instructors', index: number, e: React.PointerEvent) => {
    const currentOffsetX = type === 'leadership' ? leadership[index].imageOffsetX ?? 50 : instructors[index].imageOffsetX ?? 50
    const currentOffsetY = type === 'leadership' ? leadership[index].imageOffsetY ?? 50 : instructors[index].imageOffsetY ?? 50

    // Captura o ponteiro para funcionar bem em mobile (touch) e desktop (mouse)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    setDragging({
      type,
      index,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: currentOffsetX,
      startOffset: currentOffsetY
    })
  }

  const handlePositionChange = (
    type: 'leadership' | 'instructors',
    index: number,
    axis: 'x' | 'y',
    value: number
  ) => {
    const clamped = Math.max(0, Math.min(100, value))
    if (type === 'leadership') {
      const updated = [...leadership]
      if (axis === 'x') updated[index].imageOffsetX = clamped
      else updated[index].imageOffsetY = clamped
      setLeadership(updated)
    } else {
      const updated = [...instructors]
      if (axis === 'x') updated[index].imageOffsetX = clamped
      else updated[index].imageOffsetY = clamped
      setInstructors(updated)
    }
  }

  const handleResetImage = (type: 'leadership' | 'instructors', index: number) => {
    if (type === 'leadership') {
      const updated = [...leadership]
      updated[index].imageOffsetX = 50
      updated[index].imageOffsetY = 50
      updated[index].imageZoom = 100
      setLeadership(updated)
    } else {
      const updated = [...instructors]
      updated[index].imageOffsetX = 50
      updated[index].imageOffsetY = 50
      updated[index].imageZoom = 100
      setInstructors(updated)
    }
  }

  const handleZoomChange = (type: 'leadership' | 'instructors', index: number, zoom: number) => {
    if (type === 'leadership') {
      const updated = [...leadership]
      updated[index].imageZoom = zoom
      setLeadership(updated)
    } else {
      const updated = [...instructors]
      updated[index].imageZoom = zoom
      setInstructors(updated)
    }
  }

  const addMember = (type: 'leadership' | 'instructors') => {
    const newMember: TeamMember = {
      name: '',
      role: '',
      image: '',
      description: '',
      imageOffsetX: 50,
      imageOffsetY: 50,
      imageZoom: 100
    }

    if (type === 'leadership') {
      setLeadership([...leadership, newMember])
      setEditingMember({ type, index: leadership.length })
    } else {
      setInstructors([...instructors, newMember])
      setEditingMember({ type, index: instructors.length })
    }
  }

  const removeMember = (type: 'leadership' | 'instructors', index: number) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      if (type === 'leadership') {
        setLeadership(leadership.filter((_, i) => i !== index))
      } else {
        setInstructors(instructors.filter((_, i) => i !== index))
      }
      if (editingMember?.type === type && editingMember?.index === index) {
        setEditingMember(null)
      }
    }
  }

  const moveMember = (type: 'leadership' | 'instructors', index: number, direction: 'up' | 'down') => {
    const members = type === 'leadership' ? [...leadership] : [...instructors]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= members.length) return

    const temp = members[index]
    members[index] = members[newIndex]
    members[newIndex] = temp

    if (type === 'leadership') {
      setLeadership(members)
    } else {
      setInstructors(members)
    }
  }

  const updateMember = (type: 'leadership' | 'instructors', index: number, field: keyof TeamMember, value: any) => {
    if (type === 'leadership') {
      const updated = [...leadership]
      updated[index] = { ...updated[index], [field]: value }
      setLeadership(updated)
    } else {
      const updated = [...instructors]
      updated[index] = { ...updated[index], [field]: value }
      setInstructors(updated)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/equipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadership,
          instructors
        })
      })

      if (res.ok) {
        alert('Configurações salvas com sucesso!')
        setEditingMember(null)
      } else {
        throw new Error('Erro ao salvar')
      }
    } catch (error) {
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  const renderMemberCard = (member: TeamMember, index: number, type: 'leadership' | 'instructors') => {
    const isEditing = editingMember?.type === type && editingMember?.index === index
    const members = type === 'leadership' ? leadership : instructors

    return (
      <Card key={index} className="relative">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Nome</label>
                    <Input
                      value={member.name}
                      onChange={(e) => updateMember(type, index, 'name', e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Cargo</label>
                    <Input
                      value={member.role}
                      onChange={(e) => updateMember(type, index, 'role', e.target.value)}
                      placeholder="Ex: Ministrante Parceiro"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">URL da Imagem (Imgur)</label>
                    <Input
                      value={member.image || ''}
                      onChange={(e) => updateMember(type, index, 'image', e.target.value)}
                      placeholder="https://i.imgur.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Descrição</label>
                    <Textarea
                      value={member.description || ''}
                      onChange={(e) => updateMember(type, index, 'description', e.target.value)}
                      placeholder="Descrição do membro..."
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-sm">{member.name || 'Sem nome'}</h3>
                  <p className="text-xs text-muted-foreground">{member.role || 'Sem cargo'}</p>
                </>
              )}
            </div>

            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingMember(isEditing ? null : { type, index })}
                className="h-8 w-8 p-0"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveMember(type, index, 'up')}
                disabled={index === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moveMember(type, index, 'down')}
                disabled={index === members.length - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeMember(type, index)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {member.image && (
            <>
              <div
                id={`drag-container-${type}-${index}`}
                className="relative w-full max-w-[260px] sm:max-w-[280px] md:w-64 h-80 sm:h-96 mx-auto overflow-hidden rounded-lg bg-muted border-2 border-dashed border-primary/30 cursor-grab active:cursor-grabbing hover:border-primary transition-colors"
                onPointerDown={(e) => handlePointerDown(type, index, e)}
                style={{ userSelect: 'none', touchAction: 'none' }}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover pointer-events-none"
                  style={{
                    objectPosition: `${member.imageOffsetX ?? 50}% ${member.imageOffsetY ?? 50}%`,
                    transform: `scale(${(member.imageZoom || 100) / 100})`
                  }}
                  draggable={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-r border-b border-white/10" />
                    <div className="border-b border-white/10" />
                    <div className="border-r border-white/10" />
                    <div className="border-r border-white/10" />
                    <div className="" />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full text-xs font-semibold">
                    Arraste para ajustar (X/Y)
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Posição Horizontal: {Math.round(member.imageOffsetX ?? 50)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={member.imageOffsetX ?? 50}
                    onChange={(e) => handlePositionChange(type, index, 'x', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Posição Vertical: {Math.round(member.imageOffsetY ?? 50)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={member.imageOffsetY ?? 50}
                    onChange={(e) => handlePositionChange(type, index, 'y', parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Zoom: {Math.round(member.imageZoom || 100)}%
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="250"
                    value={member.imageZoom || 100}
                    onChange={(e) => handleZoomChange(type, index, parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetImage(type, index)}
                    className="flex-1"
                  >
                    Centralizar / Reset
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Gerenciar Equipe</h1>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Como usar:</strong> Adicione, edite, remova e reordene membros da equipe. Clique no ícone de edição para modificar informações. Arraste as imagens verticalmente para ajustar a posição. Use o slider para dar zoom.
          </p>
        </div>

        {/* Administração */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Administração</CardTitle>
                <CardDescription>Gerencie os membros da administração</CardDescription>
              </div>
              <Button onClick={() => addMember('leadership')} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leadership.map((member, index) => renderMemberCard(member, index, 'leadership'))}
            </div>
            {leadership.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum membro na administração. Clique em "Adicionar" para começar.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ministrantes Parceiros */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ministrantes Parceiros</CardTitle>
                <CardDescription>Gerencie os ministrantes parceiros</CardDescription>
              </div>
              <Button onClick={() => addMember('instructors')} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((member, index) => renderMemberCard(member, index, 'instructors'))}
            </div>
            {instructors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ministrante parceiro. Clique em "Adicionar" para começar.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end sticky bottom-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="gap-2 shadow-lg"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  )
}
