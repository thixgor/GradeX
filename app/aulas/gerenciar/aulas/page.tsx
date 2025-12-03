'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Plus, Edit2, Trash2, Copy, Eye, EyeOff, ChevronDown, ChevronUp, ChevronRight, GripVertical } from 'lucide-react'
import { AulaPostagem, AulaSetor, AulaTopic, AulaSubtopic, AulaModulo, AulaSubmodulo } from '@/lib/types'
import { ToastAlert } from '@/components/ui/toast-alert'

interface User {
  id: string
  email: string
  name: string
  role: string
  secondaryRole?: string
}

export default function GerenciarAulasPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [aulas, setAulas] = useState<AulaPostagem[]>([])
  const [setores, setSetores] = useState<AulaSetor[]>([])
  const [topicos, setTopicos] = useState<AulaTopic[]>([])
  const [subtopicos, setSubtopicos] = useState<AulaSubtopic[]>([])
  const [modulos, setModulos] = useState<AulaModulo[]>([])
  const [submodulos, setSubmodulos] = useState<AulaSubmodulo[]>([])
  
  // Filtros de cascata
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null)
  const [selectedTopico, setSelectedTopico] = useState<string | null>(null)
  const [selectedSubtopico, setSelectedSubtopico] = useState<string | null>(null)
  const [selectedModulo, setSelectedModulo] = useState<string | null>(null)

  // Estados para expandir/colapsar
  const [expandedSetores, setExpandedSetores] = useState<Set<string>>(new Set())
  const [expandedTopicos, setExpandedTopicos] = useState<Set<string>>(new Set())
  const [expandedSubtopicos, setExpandedSubtopicos] = useState<Set<string>>(new Set())
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set())

  // Drag and drop
  const [draggedAula, setDraggedAula] = useState<string | null>(null)

  // Toast
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('success')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      const isAdmin = data.user.role === 'admin'
      const isMonitor = data.user.secondaryRole === 'monitor'

      if (!isAdmin && !isMonitor) {
        router.push('/aulas')
        return
      }

      setUser(data.user)
      loadAulas()
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadAulas() {
    try {
      const res = await fetch('/api/aulas')
      if (res.ok) {
        const data = await res.json()
        setAulas((data.aulas || []).sort((a: AulaPostagem, b: AulaPostagem) => (a.ordem || 0) - (b.ordem || 0)))
        setSetores(data.setores || [])
        setTopicos(data.topicos || [])
        setSubtopicos(data.subtopicos || [])
        setModulos(data.modulos || [])
        setSubmodulos(data.submodulos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar aulas:', error)
    }
  }

  function showToast(message: string, type: 'error' | 'success' | 'info' = 'success') {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  async function deletarAula(aulaId: string) {
    if (!confirm('Tem certeza que deseja deletar esta aula?')) return

    try {
      const res = await fetch(`/api/aulas/${aulaId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setAulas(aulas.filter(a => String(a._id) !== aulaId))
        showToast('Aula deletada com sucesso!')
      } else {
        showToast('Erro ao deletar aula', 'error')
      }
    } catch (error) {
      console.error('Erro ao deletar aula:', error)
      showToast('Erro ao deletar aula', 'error')
    }
  }

  async function duplicarAula(aulaId: string) {
    try {
      const res = await fetch(`/api/aulas/${aulaId}/duplicar`, {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        setAulas([...aulas, data.aula])
        showToast('Aula duplicada com sucesso!')
      } else {
        showToast('Erro ao duplicar aula', 'error')
      }
    } catch (error) {
      console.error('Erro ao duplicar aula:', error)
      showToast('Erro ao duplicar aula', 'error')
    }
  }

  async function toggleOcultarAula(aulaId: string, oculta: boolean) {
    try {
      const res = await fetch(`/api/aulas/${aulaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oculta: !oculta })
      })

      if (res.ok) {
        const data = await res.json()
        setAulas(aulas.map(a =>
          String(a._id) === aulaId ? data.aula : a
        ))
        showToast(oculta ? 'Aula visível!' : 'Aula oculta!')
      } else {
        showToast('Erro ao atualizar aula', 'error')
      }
    } catch (error) {
      console.error('Erro ao atualizar aula:', error)
      showToast('Erro ao atualizar aula', 'error')
    }
  }

  async function reordenarAula(aulaId: string, direcao: 'up' | 'down') {
    try {
      const aulaIndex = aulas.findIndex(a => String(a._id) === aulaId)
      if (aulaIndex === -1) return

      const novaOrdem = direcao === 'up' ? (aulas[aulaIndex].ordem || 0) - 1 : (aulas[aulaIndex].ordem || 0) + 1

      const res = await fetch(`/api/aulas/${aulaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem: novaOrdem })
      })

      if (res.ok) {
        const data = await res.json()
        const novasAulas = aulas.map(a =>
          String(a._id) === aulaId ? data.aula : a
        ).sort((a: AulaPostagem, b: AulaPostagem) => (a.ordem || 0) - (b.ordem || 0))
        setAulas(novasAulas)
        showToast(direcao === 'up' ? 'Aula movida para cima!' : 'Aula movida para baixo!')
      } else {
        showToast('Erro ao reordenar aula', 'error')
      }
    } catch (error) {
      console.error('Erro ao reordenar aula:', error)
      showToast('Erro ao reordenar aula', 'error')
    }
  }

  // Funções auxiliares para cascata
  function getTopicosDoSetor(setorId: string) {
    return topicos.filter(t => t.setorId === setorId && !t.oculta)
  }

  function getSubtopicosDoTopico(topicoId: string) {
    return subtopicos.filter(s => s.topicoId === topicoId && !s.oculta)
  }

  function getModulosDoSubtopico(subtopicoId: string) {
    return modulos.filter(m => m.subtopicoId === subtopicoId && !m.oculta)
  }

  function getSubmodulosDoModulo(moduloId: string) {
    return submodulos.filter(sm => sm.moduloId === moduloId && !sm.oculta)
  }

  // Obter localização da aula
  function getLocalizacaoAula(aula: AulaPostagem) {
    const partes: string[] = []
    
    if (aula.setorId) {
      const setor = setores.find(s => String(s._id) === aula.setorId)
      if (setor) partes.push(setor.nome)
    }
    
    if (aula.topicoId) {
      const topico = topicos.find(t => String(t._id) === aula.topicoId)
      if (topico) partes.push(topico.nome)
    }
    
    if (aula.subtopicoId) {
      const subtopico = subtopicos.find(s => String(s._id) === aula.subtopicoId)
      if (subtopico) partes.push(subtopico.nome)
    }
    
    if (aula.moduloId) {
      const modulo = modulos.find(m => String(m._id) === aula.moduloId)
      if (modulo) partes.push(modulo.nome)
    }
    
    if (aula.submoduloId) {
      const submodulo = submodulos.find(sm => String(sm._id) === aula.submoduloId)
      if (submodulo) partes.push(submodulo.nome)
    }
    
    return partes.length > 0 ? partes.join(' > ') : 'Sem localização'
  }

  // Drag and drop handlers
  function handleDragStart(aulaId: string) {
    setDraggedAula(aulaId)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleDropOnAula(targetAulaId: string) {
    if (!draggedAula || draggedAula === targetAulaId) return

    try {
      const draggedIndex = aulas.findIndex(a => String(a._id) === draggedAula)
      const targetIndex = aulas.findIndex(a => String(a._id) === targetAulaId)

      if (draggedIndex === -1 || targetIndex === -1) return

      const draggedAulaObj = aulas[draggedIndex]
      const targetAulaObj = aulas[targetIndex]

      // Determinar nova ordem baseado na posição
      let novaOrdem: number
      if (draggedIndex < targetIndex) {
        // Movendo para baixo
        novaOrdem = (targetAulaObj.ordem || 0) + 1
      } else {
        // Movendo para cima
        novaOrdem = (targetAulaObj.ordem || 0) - 1
      }
      
      const res = await fetch(`/api/aulas/${draggedAula}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem: novaOrdem })
      })

      if (res.ok) {
        const data = await res.json()
        // Atualizar imediatamente na UI
        const novasAulas = aulas.map(a =>
          String(a._id) === draggedAula ? { ...a, ordem: novaOrdem } : a
        ).sort((a: AulaPostagem, b: AulaPostagem) => (a.ordem || 0) - (b.ordem || 0))
        setAulas(novasAulas)
        showToast('Aula reordenada com sucesso!')
      } else {
        showToast('Erro ao reordenar aula', 'error')
      }
    } catch (error) {
      console.error('Erro ao reordenar:', error)
      showToast('Erro ao reordenar aula', 'error')
    } finally {
      setDraggedAula(null)
    }
  }

  // Renderizar hierarquia de aulas
  function renderHierarquia() {
    const setoresList = setores.filter(s => !s.oculta)

    return (
      <div className="space-y-2">
        {setoresList.map(setor => {
          const setorId = String(setor._id)
          const isExpanded = expandedSetores.has(setorId)
          const topicosDoSetor = topicos.filter(t => t.setorId === setorId && !t.oculta)
          const aulasSetor = aulas.filter(a => a.setorId === setorId && !a.topicoId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))

          return (
            <div key={setorId} className="space-y-2">
              {/* Setor */}
              <button
                onClick={() => {
                  const newSet = new Set(expandedSetores)
                  if (newSet.has(setorId)) newSet.delete(setorId)
                  else newSet.add(setorId)
                  setExpandedSetores(newSet)
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all text-left"
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                <span className="font-semibold text-white">{setor.nome}</span>
                <span className="text-xs text-white/60 ml-auto">({topicosDoSetor.length + aulasSetor.length})</span>
              </button>

              {isExpanded && (
                <div className="ml-4 space-y-2">
                  {/* Aulas do setor */}
                  {aulasSetor.map(aula => (
                    <div
                      key={String(aula._id)}
                      draggable
                      onDragStart={() => handleDragStart(String(aula._id))}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnAula(String(aula._id))}
                      className={`p-4 rounded-lg border transition-all cursor-move ${
                        draggedAula === String(aula._id)
                          ? 'bg-blue-500/30 border-blue-500/50 opacity-50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="h-4 w-4 text-white/40 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white">{aula.titulo}</h4>
                          <p className="text-xs text-white/50 mt-1">{getLocalizacaoAula(aula)}</p>
                          {aula.descricao && (
                            <p className="text-sm text-white/70 mt-2 line-clamp-1">{aula.descricao}</p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleOcultarAula(String(aula._id), aula.oculta)}
                            className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                          >
                            {aula.oculta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)}
                            className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicarAula(String(aula._id))}
                            className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletarAula(String(aula._id))}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Tópicos */}
                  {topicosDoSetor.map(topico => {
                    const topicoId = String(topico._id)
                    const isTopicoExpanded = expandedTopicos.has(topicoId)
                    const subtopicosDoTopico = subtopicos.filter(s => s.topicoId === topicoId && !s.oculta)
                    const aulasTopico = aulas.filter(a => a.topicoId === topicoId && !a.subtopicoId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))

                    return (
                      <div key={topicoId} className="space-y-2">
                        <button
                          onClick={() => {
                            const newSet = new Set(expandedTopicos)
                            if (newSet.has(topicoId)) newSet.delete(topicoId)
                            else newSet.add(topicoId)
                            setExpandedTopicos(newSet)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-left"
                        >
                          <ChevronRight className={`h-4 w-4 transition-transform ${isTopicoExpanded ? 'rotate-90' : ''}`} />
                          <span className="font-medium text-white">{topico.nome}</span>
                          <span className="text-xs text-white/60 ml-auto">({subtopicosDoTopico.length + aulasTopico.length})</span>
                        </button>

                        {isTopicoExpanded && (
                          <div className="ml-4 space-y-2">
                            {/* Aulas do tópico */}
                            {aulasTopico.map(aula => (
                              <div
                                key={String(aula._id)}
                                draggable
                                onDragStart={() => handleDragStart(String(aula._id))}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDropOnAula(String(aula._id))}
                                className={`p-4 rounded-lg border transition-all cursor-move ${
                                  draggedAula === String(aula._id)
                                    ? 'bg-blue-500/30 border-blue-500/50 opacity-50'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <GripVertical className="h-4 w-4 text-white/40 mt-1 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white">{aula.titulo}</h4>
                                    <p className="text-xs text-white/50 mt-1">{getLocalizacaoAula(aula)}</p>
                                    {aula.descricao && (
                                      <p className="text-sm text-white/70 mt-2 line-clamp-1">{aula.descricao}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleOcultarAula(String(aula._id), aula.oculta)}
                                      className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                    >
                                      {aula.oculta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)}
                                      className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => duplicarAula(String(aula._id))}
                                      className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deletarAula(String(aula._id))}
                                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Subtópicos */}
                            {subtopicosDoTopico.map(subtopico => {
                              const subtopicoId = String(subtopico._id)
                              const isSubtopicoExpanded = expandedSubtopicos.has(subtopicoId)
                              const modulosDoSubtopico = modulos.filter(m => m.subtopicoId === subtopicoId && !m.oculta)
                              const aulasSubtopico = aulas.filter(a => a.subtopicoId === subtopicoId && !a.moduloId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))

                              return (
                                <div key={subtopicoId} className="space-y-2">
                                  <button
                                    onClick={() => {
                                      const newSet = new Set(expandedSubtopicos)
                                      if (newSet.has(subtopicoId)) newSet.delete(subtopicoId)
                                      else newSet.add(subtopicoId)
                                      setExpandedSubtopicos(newSet)
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all text-left"
                                  >
                                    <ChevronRight className={`h-4 w-4 transition-transform ${isSubtopicoExpanded ? 'rotate-90' : ''}`} />
                                    <span className="font-medium text-white">{subtopico.nome}</span>
                                    <span className="text-xs text-white/60 ml-auto">({modulosDoSubtopico.length + aulasSubtopico.length})</span>
                                  </button>

                                  {isSubtopicoExpanded && (
                                    <div className="ml-4 space-y-2">
                                      {/* Aulas do subtópico */}
                                      {aulasSubtopico.map(aula => (
                                        <div
                                          key={String(aula._id)}
                                          draggable
                                          onDragStart={() => handleDragStart(String(aula._id))}
                                          onDragOver={handleDragOver}
                                          onDrop={() => handleDropOnAula(String(aula._id))}
                                          className={`p-4 rounded-lg border transition-all cursor-move ${
                                            draggedAula === String(aula._id)
                                              ? 'bg-blue-500/30 border-blue-500/50 opacity-50'
                                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                                          }`}
                                        >
                                          <div className="flex items-start gap-3">
                                            <GripVertical className="h-4 w-4 text-white/40 mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-semibold text-white">{aula.titulo}</h4>
                                              <p className="text-xs text-white/50 mt-1">{getLocalizacaoAula(aula)}</p>
                                              {aula.descricao && (
                                                <p className="text-sm text-white/70 mt-2 line-clamp-1">{aula.descricao}</p>
                                              )}
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleOcultarAula(String(aula._id), aula.oculta)}
                                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                              >
                                                {aula.oculta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)}
                                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                              >
                                                <Edit2 className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => duplicarAula(String(aula._id))}
                                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                              >
                                                <Copy className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deletarAula(String(aula._id))}
                                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}

                                      {/* Módulos */}
                                      {modulosDoSubtopico.map(modulo => {
                                        const moduloId = String(modulo._id)
                                        const isModuloExpanded = expandedModulos.has(moduloId)
                                        const submodulosDoModulo = submodulos.filter(sm => sm.moduloId === moduloId && !sm.oculta)
                                        const aulasModulo = aulas.filter(a => a.moduloId === moduloId && !a.submoduloId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))

                                        return (
                                          <div key={moduloId} className="space-y-2">
                                            <button
                                              onClick={() => {
                                                const newSet = new Set(expandedModulos)
                                                if (newSet.has(moduloId)) newSet.delete(moduloId)
                                                else newSet.add(moduloId)
                                                setExpandedModulos(newSet)
                                              }}
                                              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 transition-all text-left"
                                            >
                                              <ChevronRight className={`h-4 w-4 transition-transform ${isModuloExpanded ? 'rotate-90' : ''}`} />
                                              <span className="font-medium text-white">{modulo.nome}</span>
                                              <span className="text-xs text-white/60 ml-auto">({submodulosDoModulo.length + aulasModulo.length})</span>
                                            </button>

                                            {isModuloExpanded && (
                                              <div className="ml-4 space-y-2">
                                                {/* Aulas do módulo */}
                                                {aulasModulo.map(aula => (
                                                  <div
                                                    key={String(aula._id)}
                                                    draggable
                                                    onDragStart={() => handleDragStart(String(aula._id))}
                                                    onDragOver={handleDragOver}
                                                    onDrop={() => handleDropOnAula(String(aula._id))}
                                                    className={`p-4 rounded-lg border transition-all cursor-move ${
                                                      draggedAula === String(aula._id)
                                                        ? 'bg-blue-500/30 border-blue-500/50 opacity-50'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    }`}
                                                  >
                                                    <div className="flex items-start gap-3">
                                                      <GripVertical className="h-4 w-4 text-white/40 mt-1 flex-shrink-0" />
                                                      <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-white">{aula.titulo}</h4>
                                                        <p className="text-xs text-white/50 mt-1">{getLocalizacaoAula(aula)}</p>
                                                        {aula.descricao && (
                                                          <p className="text-sm text-white/70 mt-2 line-clamp-1">{aula.descricao}</p>
                                                        )}
                                                      </div>
                                                      <div className="flex gap-1 flex-shrink-0">
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => toggleOcultarAula(String(aula._id), aula.oculta)}
                                                          className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                                        >
                                                          {aula.oculta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)}
                                                          className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                                        >
                                                          <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => duplicarAula(String(aula._id))}
                                                          className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                                        >
                                                          <Copy className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => deletarAula(String(aula._id))}
                                                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                                        >
                                                          <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}

                                                {/* Submódulos */}
                                                {submodulosDoModulo.map(submodulo => {
                                                  const aulasSubmodulo = aulas.filter(a => a.submoduloId === String(submodulo._id)).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))

                                                  return (
                                                    <div key={String(submodulo._id)} className="space-y-2">
                                                      <div className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                                                        <span className="font-medium text-white">{submodulo.nome}</span>
                                                        <span className="text-xs text-white/60 ml-2">({aulasSubmodulo.length})</span>
                                                      </div>

                                                      <div className="ml-4 space-y-2">
                                                        {aulasSubmodulo.map(aula => (
                                                          <div
                                                            key={String(aula._id)}
                                                            draggable
                                                            onDragStart={() => handleDragStart(String(aula._id))}
                                                            onDragOver={handleDragOver}
                                                            onDrop={() => handleDropOnAula(String(aula._id))}
                                                            className={`p-4 rounded-lg border transition-all cursor-move ${
                                                              draggedAula === String(aula._id)
                                                                ? 'bg-blue-500/30 border-blue-500/50 opacity-50'
                                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                            }`}
                                                          >
                                                            <div className="flex items-start gap-3">
                                                              <GripVertical className="h-4 w-4 text-white/40 mt-1 flex-shrink-0" />
                                                              <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-white">{aula.titulo}</h4>
                                                                <p className="text-xs text-white/50 mt-1">{getLocalizacaoAula(aula)}</p>
                                                                {aula.descricao && (
                                                                  <p className="text-sm text-white/70 mt-2 line-clamp-1">{aula.descricao}</p>
                                                                )}
                                                              </div>
                                                              <div className="flex gap-1 flex-shrink-0">
                                                                <Button
                                                                  variant="outline"
                                                                  size="sm"
                                                                  onClick={() => toggleOcultarAula(String(aula._id), aula.oculta)}
                                                                  className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                                                >
                                                                  {aula.oculta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </Button>
                                                                <Button
                                                                  variant="outline"
                                                                  size="sm"
                                                                  onClick={() => router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)}
                                                                  className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                                                >
                                                                  <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                  variant="outline"
                                                                  size="sm"
                                                                  onClick={() => duplicarAula(String(aula._id))}
                                                                  className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                                                >
                                                                  <Copy className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                  variant="outline"
                                                                  size="sm"
                                                                  onClick={() => deletarAula(String(aula._id))}
                                                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                                                                >
                                                                  <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-40 backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/aulas/gerenciar')}
                className="shrink-0 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Gerenciar Aulas</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/aulas/gerenciar/aulas/criar')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Aula
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-30 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Gerenciar Aulas</h2>
          <p className="text-white/60 mb-4">Clique para expandir/colapsar seções. Arraste aulas para reordenar.</p>
          <Button
            onClick={() => router.push('/aulas/gerenciar/aulas/criar')}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Aula
          </Button>
        </div>

        {/* Hierarquia de Aulas */}
        {aulas.length === 0 ? (
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="pt-6 text-center">
              <p className="text-white/60 mb-4">Nenhuma aula encontrada</p>
            </CardContent>
          </Card>
        ) : (
          renderHierarquia()
        )}
      </main>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
