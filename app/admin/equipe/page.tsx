'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, RotateCcw } from 'lucide-react'

interface TeamMember {
  name: string
  role: string
  image?: string
  description?: string
  imageOffsetY?: number // Offset vertical em porcentagem (0-100)
}

interface DraggingState {
  type: 'leadership' | 'instructors'
  index: number
  startY: number
  startOffset: number
}

export default function AdminEquipePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<DraggingState | null>(null)

  const [leadership, setLeadership] = useState<TeamMember[]>([
    {
      name: 'Thiago Ferreira Rodrigues',
      role: 'CEO, Fundador & Líder de Desenvolvimento',
      image: 'https://i.imgur.com/z1pX1ze.jpeg',
      imageOffsetY: 50
    },
    {
      name: 'Joaquim Henrique Soares',
      role: 'Sócio Co-Fundador',
      imageOffsetY: 50
    }
  ])

  const [instructors, setInstructors] = useState<TeamMember[]>([
    {
      name: 'Gisele Grubitsch Mietzsch',
      role: 'Ministrante Parceira',
      image: 'https://i.imgur.com/mrWGYVv.jpeg',
      imageOffsetY: 50
    },
    {
      name: 'Ronaldo Campos Rodrigues',
      role: 'Ministrante Parceiro',
      image: 'https://i.imgur.com/6rs82bt.jpeg',
      imageOffsetY: 50
    },
    {
      name: 'Amanda Santiago',
      role: 'Ministrante Parceira',
      imageOffsetY: 50
    },
    {
      name: 'Maria Rita Meyer Assunção',
      role: 'Ministrante Parceira',
      imageOffsetY: 50
    },
    {
      name: 'João Henrique Pimentel',
      role: 'Ministrante Parceiro',
      image: 'https://i.imgur.com/oHEjiJE.png',
      imageOffsetY: 50
    },
    {
      name: 'Gustavo Murillo Gonçalves Caúla',
      role: 'Ministrante Parceiro',
      imageOffsetY: 50
    }
  ])

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

        // Atualizar com dados salvos
        if (data.leadership) {
          setLeadership(prev => prev.map(member => {
            const saved = data.leadership.find((l: any) => l.name === member.name)
            return saved ? { ...member, imageOffsetY: saved.imageOffsetY } : member
          }))
        }

        if (data.instructors) {
          setInstructors(prev => prev.map(member => {
            const saved = data.instructors.find((i: any) => i.name === member.name)
            return saved ? { ...member, imageOffsetY: saved.imageOffsetY } : member
          }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  useEffect(() => {
    if (dragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - dragging.startY
        const container = document.getElementById(`drag-container-${dragging.type}-${dragging.index}`)
        if (!container) return

        const containerHeight = container.clientHeight
        const offsetChange = (deltaY / containerHeight) * 100
        let newOffset = Math.max(0, Math.min(100, dragging.startOffset + offsetChange))

        if (dragging.type === 'leadership') {
          const updated = [...leadership]
          updated[dragging.index].imageOffsetY = newOffset
          setLeadership(updated)
        } else {
          const updated = [...instructors]
          updated[dragging.index].imageOffsetY = newOffset
          setInstructors(updated)
        }
      }

      const handleMouseUp = () => {
        setDragging(null)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
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

  const handleMouseDown = (type: 'leadership' | 'instructors', index: number, e: React.MouseEvent) => {
    const currentOffset = type === 'leadership' ? leadership[index].imageOffsetY || 50 : instructors[index].imageOffsetY || 50
    setDragging({
      type,
      index,
      startY: e.clientY,
      startOffset: currentOffset
    })
  }

  const resetPosition = (type: 'leadership' | 'instructors', index: number) => {
    if (type === 'leadership') {
      const updated = [...leadership]
      updated[index].imageOffsetY = 50
      setLeadership(updated)
    } else {
      const updated = [...instructors]
      updated[index].imageOffsetY = 50
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
          leadership: leadership.map(m => ({ name: m.name, imageOffsetY: m.imageOffsetY })),
          instructors: instructors.map(m => ({ name: m.name, imageOffsetY: m.imageOffsetY }))
        })
      })

      if (res.ok) {
        alert('Configurações salvas com sucesso!')
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
            <strong>Como usar:</strong> Clique e arraste a imagem verticalmente para ajustar a posição. Use o botão "Resetar" para voltar ao centro.
          </p>
        </div>

        {/* Liderança */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Liderança</CardTitle>
            <CardDescription>Arraste as imagens para ajustar a posição vertical</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leadership.map((member, index) => (
                <div key={member.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetPosition('leadership', index)}
                      className="gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Resetar
                    </Button>
                  </div>

                  {member.image ? (
                    <div
                      id={`drag-container-leadership-${index}`}
                      className="relative h-64 sm:h-80 overflow-hidden rounded-lg bg-muted border-2 border-dashed border-primary/30 cursor-move hover:border-primary transition-colors"
                      onMouseDown={(e) => handleMouseDown('leadership', index, e)}
                      style={{ userSelect: 'none' }}
                    >
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover pointer-events-none"
                        style={{
                          objectPosition: `50% ${member.imageOffsetY || 50}%`
                        }}
                        draggable={false}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-white/90 dark:bg-black/90 px-4 py-2 rounded-full text-sm font-semibold">
                          Arraste para ajustar
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 sm:h-80 flex items-center justify-center bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Sem imagem</p>
                    </div>
                  )}

                  {member.image && (
                    <div className="mt-2 text-xs text-center text-muted-foreground">
                      Posição: {Math.round(member.imageOffsetY || 50)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ministrantes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ministrantes Parceiros</CardTitle>
            <CardDescription>Arraste as imagens para ajustar a posição vertical</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((member, index) => (
                <div key={member.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate">{member.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetPosition('instructors', index)}
                      className="gap-1 ml-2 flex-shrink-0"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>

                  {member.image ? (
                    <div
                      id={`drag-container-instructors-${index}`}
                      className="relative h-56 overflow-hidden rounded-lg bg-muted border-2 border-dashed border-primary/30 cursor-move hover:border-primary transition-colors"
                      onMouseDown={(e) => handleMouseDown('instructors', index, e)}
                      style={{ userSelect: 'none' }}
                    >
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover pointer-events-none"
                        style={{
                          objectPosition: `50% ${member.imageOffsetY || 50}%`
                        }}
                        draggable={false}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-white/90 dark:bg-black/90 px-3 py-1 rounded-full text-xs font-semibold">
                          Arraste
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Sem imagem</p>
                    </div>
                  )}

                  {member.image && (
                    <div className="mt-2 text-xs text-center text-muted-foreground">
                      Posição: {Math.round(member.imageOffsetY || 50)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
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
