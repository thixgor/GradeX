'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Plus, Trash2, ChevronRight, Edit2, Copy, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { AulaSetor, AulaTopic, AulaSubtopic, AulaModulo, AulaSubmodulo } from '@/lib/types'
import { ToastAlert } from '@/components/ui/toast-alert'

interface User {
  id: string
  email: string
  name: string
  role: string
  secondaryRole?: string
}

export default function EstruturasPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Estados para dados
  const [setores, setSetores] = useState<AulaSetor[]>([])
  const [topicos, setTopicos] = useState<AulaTopic[]>([])
  const [subtopicos, setSubtopicos] = useState<AulaSubtopic[]>([])
  const [modulos, setModulos] = useState<AulaModulo[]>([])
  const [submodulos, setSubmodulos] = useState<AulaSubmodulo[]>([])

  // Estados de navegação
  const [selectedSetor, setSelectedSetor] = useState<AulaSetor | null>(null)
  const [selectedTopico, setSelectedTopico] = useState<AulaTopic | null>(null)
  const [selectedSubtopico, setSelectedSubtopico] = useState<AulaSubtopic | null>(null)
  const [selectedModulo, setSelectedModulo] = useState<AulaModulo | null>(null)

  // Estados de dialog
  const [showDialog, setShowDialog] = useState(false)
  const [dialogType, setDialogType] = useState<'setor' | 'topico' | 'subtopico' | 'modulo' | 'submodulo'>('setor')
  const [formData, setFormData] = useState({ nome: '', descricao: '' })
  const [editingId, setEditingId] = useState<string | null>(null)

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
      loadDados()
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadDados() {
    try {
      const res = await fetch('/api/aulas')
      if (res.ok) {
        const data = await res.json()
        setSetores(data.setores || [])
        setTopicos(data.topicos || [])
        setSubtopicos(data.subtopicos || [])
        setModulos(data.modulos || [])
        setSubmodulos(data.submodulos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  function showToast(message: string, type: 'error' | 'success' | 'info' = 'success') {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  function openCreateDialog(type: 'setor' | 'topico' | 'subtopico' | 'modulo' | 'submodulo', item?: any) {
    setDialogType(type)
    if (item) {
      setFormData({ nome: item.nome, descricao: item.descricao || '' })
      setEditingId(String(item._id))
    } else {
      setFormData({ nome: '', descricao: '' })
      setEditingId(null)
    }
    setShowDialog(true)
  }

  async function salvarItem() {
    if (!formData.nome.trim()) {
      showToast('Nome é obrigatório', 'error')
      return
    }

    try {
      let endpoint = ''
      let method = editingId ? 'PATCH' : 'POST'
      let body: any = {
        nome: formData.nome,
        descricao: formData.descricao,
        ordem: 0
      }

      if (dialogType === 'setor') {
        endpoint = editingId ? `/api/aulas/setores/${editingId}` : '/api/aulas/setores'
      } else if (dialogType === 'topico') {
        endpoint = editingId ? `/api/aulas/topicos/${editingId}` : '/api/aulas/topicos'
        body.setorId = selectedSetor?._id
      } else if (dialogType === 'subtopico') {
        endpoint = editingId ? `/api/aulas/subtopicos/${editingId}` : '/api/aulas/subtopicos'
        body.setorId = selectedSetor?._id
        body.topicoId = selectedTopico?._id
      } else if (dialogType === 'modulo') {
        endpoint = editingId ? `/api/aulas/modulos/${editingId}` : '/api/aulas/modulos'
        body.setorId = selectedSetor?._id
        body.topicoId = selectedTopico?._id
        body.subtopicoId = selectedSubtopico?._id
      } else if (dialogType === 'submodulo') {
        endpoint = editingId ? `/api/aulas/submodulos/${editingId}` : '/api/aulas/submodulos'
        body.setorId = selectedSetor?._id
        body.topicoId = selectedTopico?._id
        body.subtopicoId = selectedSubtopico?._id
        body.moduloId = selectedModulo?._id
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const data = await res.json()
        console.log('Salvar resposta:', { status: res.status, data })

        if (!data.item) {
          console.error('Resposta sem item:', data)
          showToast('Erro ao salvar - resposta inválida', 'error')
          return
        }

        if (editingId) {
          // Atualizar item existente
          if (dialogType === 'setor') {
            setSetores(setores.map(s => String(s._id) === editingId ? data.item : s))
          } else if (dialogType === 'topico') {
            setTopicos(topicos.map(t => String(t._id) === editingId ? data.item : t))
          } else if (dialogType === 'subtopico') {
            setSubtopicos(subtopicos.map(s => String(s._id) === editingId ? data.item : s))
          } else if (dialogType === 'modulo') {
            setModulos(modulos.map(m => String(m._id) === editingId ? data.item : m))
          } else if (dialogType === 'submodulo') {
            setSubmodulos(submodulos.map(sm => String(sm._id) === editingId ? data.item : sm))
          }
          showToast(`${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} atualizado com sucesso!`)
        } else {
          // Criar novo item
          if (dialogType === 'setor') {
            setSetores([...setores, data.item])
          } else if (dialogType === 'topico') {
            setTopicos([...topicos, data.item])
          } else if (dialogType === 'subtopico') {
            setSubtopicos([...subtopicos, data.item])
          } else if (dialogType === 'modulo') {
            setModulos([...modulos, data.item])
          } else if (dialogType === 'submodulo') {
            setSubmodulos([...submodulos, data.item])
          }
          showToast(`${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} criado com sucesso!`)
        }
        setShowDialog(false)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Erro ao salvar:', { status: res.status, error: errorData })
        showToast(errorData.error || 'Erro ao salvar', 'error')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast('Erro ao salvar', 'error')
    }
  }

  async function deletarItem(id: string, type: 'setor' | 'topico' | 'subtopico' | 'modulo' | 'submodulo') {
    if (!confirm('Tem certeza que deseja deletar?')) return

    try {
      let endpoint = ''
      if (type === 'setor') {
        endpoint = `/api/aulas/setores/${id}`
      } else if (type === 'topico') {
        endpoint = `/api/aulas/topicos/${id}`
      } else if (type === 'subtopico') {
        endpoint = `/api/aulas/subtopicos/${id}`
      } else if (type === 'modulo') {
        endpoint = `/api/aulas/modulos/${id}`
      } else if (type === 'submodulo') {
        endpoint = `/api/aulas/submodulos/${id}`
      }

      const res = await fetch(endpoint, { method: 'DELETE' })

      if (res.ok) {
        if (type === 'setor') {
          setSetores(setores.filter(s => String(s._id) !== id))
          setSelectedSetor(null)
          setSelectedTopico(null)
          setSelectedSubtopico(null)
          setSelectedModulo(null)
        } else if (type === 'topico') {
          setTopicos(topicos.filter(t => String(t._id) !== id))
          setSelectedTopico(null)
          setSelectedSubtopico(null)
          setSelectedModulo(null)
        } else if (type === 'subtopico') {
          setSubtopicos(subtopicos.filter(s => String(s._id) !== id))
          setSelectedSubtopico(null)
          setSelectedModulo(null)
        } else if (type === 'modulo') {
          setModulos(modulos.filter(m => String(m._id) !== id))
          setSelectedModulo(null)
        } else if (type === 'submodulo') {
          setSubmodulos(submodulos.filter(sm => String(sm._id) !== id))
        }
        showToast('Deletado com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast('Erro ao deletar', 'error')
    }
  }

  async function duplicarItem(id: string, type: 'setor' | 'topico' | 'subtopico' | 'modulo' | 'submodulo', item: any) {
    try {
      let endpoint = ''
      let body: any = {
        nome: `${item.nome} (Cópia)`,
        descricao: item.descricao,
        ordem: 0
      }

      if (type === 'setor') {
        endpoint = '/api/aulas/setores'
      } else if (type === 'topico') {
        endpoint = '/api/aulas/topicos'
        body.setorId = item.setorId
      } else if (type === 'subtopico') {
        endpoint = '/api/aulas/subtopicos'
        body.setorId = item.setorId
        body.topicoId = item.topicoId
      } else if (type === 'modulo') {
        endpoint = '/api/aulas/modulos'
        body.setorId = item.setorId
        body.topicoId = item.topicoId
        body.subtopicoId = item.subtopicoId
      } else if (type === 'submodulo') {
        endpoint = '/api/aulas/submodulos'
        body.setorId = item.setorId
        body.topicoId = item.topicoId
        body.subtopicoId = item.subtopicoId
        body.moduloId = item.moduloId
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const data = await res.json()
        if (type === 'setor') {
          setSetores([...setores, data.item])
        } else if (type === 'topico') {
          setTopicos([...topicos, data.item])
        } else if (type === 'subtopico') {
          setSubtopicos([...subtopicos, data.item])
        } else if (type === 'modulo') {
          setModulos([...modulos, data.item])
        } else if (type === 'submodulo') {
          setSubmodulos([...submodulos, data.item])
        }
        showToast('Duplicado com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast('Erro ao duplicar', 'error')
    }
  }

  async function toggleOcultar(id: string, type: 'setor' | 'topico' | 'subtopico' | 'modulo' | 'submodulo', oculta: boolean) {
    try {
      let endpoint = ''
      if (type === 'setor') {
        endpoint = `/api/aulas/setores/${id}`
      } else if (type === 'topico') {
        endpoint = `/api/aulas/topicos/${id}`
      } else if (type === 'subtopico') {
        endpoint = `/api/aulas/subtopicos/${id}`
      } else if (type === 'modulo') {
        endpoint = `/api/aulas/modulos/${id}`
      } else if (type === 'submodulo') {
        endpoint = `/api/aulas/submodulos/${id}`
      }

      console.log('Toggling ocultar:', { endpoint, type, id, oculta })

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oculta: !oculta })
      })

      console.log('Response status:', res.status)

      if (res.ok) {
        const data = await res.json()
        if (type === 'setor') {
          setSetores(setores.map(s => String(s._id) === id ? data.item : s))
        } else if (type === 'topico') {
          setTopicos(topicos.map(t => String(t._id) === id ? data.item : t))
        } else if (type === 'subtopico') {
          setSubtopicos(subtopicos.map(s => String(s._id) === id ? data.item : s))
        } else if (type === 'modulo') {
          setModulos(modulos.map(m => String(m._id) === id ? data.item : m))
        } else if (type === 'submodulo') {
          setSubmodulos(submodulos.map(sm => String(sm._id) === id ? data.item : sm))
        }
        showToast(oculta ? 'Visível!' : 'Oculto!')
      } else {
        const errorData = await res.json()
        showToast(errorData.error || 'Erro ao atualizar', 'error')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast('Erro ao atualizar', 'error')
    }
  }

  async function reordenarItem(id: string, type: 'setor' | 'topico' | 'subtopico' | 'modulo' | 'submodulo', direcao: 'up' | 'down') {
    try {
      let items: any[] = []
      let setItems: any = null

      if (type === 'setor') {
        items = setores
        setItems = setSetores
      } else if (type === 'topico') {
        items = topicosFiltrados
        setItems = setTopicos
      } else if (type === 'subtopico') {
        items = subtopicosFiltrados
        setItems = setSubtopicos
      } else if (type === 'modulo') {
        items = modulosFiltrados
        setItems = setModulos
      } else if (type === 'submodulo') {
        items = submodulosFiltrados
        setItems = setSubmodulos
      }

      const itemIndex = items.findIndex(i => String(i._id) === id)
      if (itemIndex === -1) return

      const novaOrdem = direcao === 'up' ? (items[itemIndex].ordem || 0) - 1 : (items[itemIndex].ordem || 0) + 1

      let endpoint = ''
      if (type === 'setor') {
        endpoint = `/api/aulas/setores/${id}`
      } else if (type === 'topico') {
        endpoint = `/api/aulas/topicos/${id}`
      } else if (type === 'subtopico') {
        endpoint = `/api/aulas/subtopicos/${id}`
      } else if (type === 'modulo') {
        endpoint = `/api/aulas/modulos/${id}`
      } else if (type === 'submodulo') {
        endpoint = `/api/aulas/submodulos/${id}`
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem: novaOrdem })
      })

      if (res.ok) {
        const data = await res.json()
        
        if (type === 'setor') {
          setSetores(setores.map(s => String(s._id) === id ? data.item : s).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)))
        } else if (type === 'topico') {
          setTopicos(topicos.map(t => String(t._id) === id ? data.item : t).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)))
        } else if (type === 'subtopico') {
          setSubtopicos(subtopicos.map(s => String(s._id) === id ? data.item : s).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)))
        } else if (type === 'modulo') {
          setModulos(modulos.map(m => String(m._id) === id ? data.item : m).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)))
        } else if (type === 'submodulo') {
          setSubmodulos(submodulos.map(sm => String(sm._id) === id ? data.item : sm).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)))
        }
        
        showToast(direcao === 'up' ? 'Movido para cima!' : 'Movido para baixo!')
      } else {
        showToast('Erro ao reordenar', 'error')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast('Erro ao reordenar', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  const topicosFiltrados = topicos.filter(t => t.setorId === String(selectedSetor?._id))
  const subtopicosFiltrados = subtopicos.filter(s => s.topicoId === String(selectedTopico?._id))
  const modulosFiltrados = modulos.filter(m =>
    selectedSubtopico
      ? m.subtopicoId === String(selectedSubtopico._id)
      : m.topicoId === String(selectedTopico?._id)
  )
  const submodulosFiltrados = submodulos.filter(sm => sm.moduloId === String(selectedModulo?._id))

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
                <h1 className="text-xl sm:text-2xl font-bold text-white">Estrutura de Aulas</h1>
                <p className="text-sm text-white/60">
                  Setor → Tópico → Subtópico → Módulo → Submódulo
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-30 container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-4">
          {/* Setores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Setores</h2>
              <Button
                size="sm"
                onClick={() => openCreateDialog('setor')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {setores.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <p className="text-sm">Nenhum setor criado</p>
                </div>
              ) : (
                setores.map(setor => (
                  <div
                    key={String(setor._id)}
                    onClick={() => {
                      setSelectedSetor(setor)
                      setSelectedTopico(null)
                      setSelectedSubtopico(null)
                      setSelectedModulo(null)
                    }}
                    className={`group p-4 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                      selectedSetor?._id === setor._id
                        ? 'bg-white/20 border-white/40 shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white break-words">{setor.nome}</p>
                          {setor.descricao && (
                            <p className="text-xs text-white/50 line-clamp-1">{setor.descricao}</p>
                          )}
                          {setor.oculta && (
                            <p className="text-xs text-gray-400 mt-1">Oculto</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            reordenarItem(String(setor._id), 'setor', 'up')
                          }}
                          title="Mover para cima"
                          className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            reordenarItem(String(setor._id), 'setor', 'down')
                          }}
                          title="Mover para baixo"
                          className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleOcultar(String(setor._id), 'setor', setor.oculta || false)
                          }}
                          title={setor.oculta ? 'Mostrar' : 'Ocultar'}
                          className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                        >
                          {setor.oculta ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            openCreateDialog('setor', setor)
                          }}
                          className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicarItem(String(setor._id), 'setor', setor)
                          }}
                          className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletarItem(String(setor._id), 'setor')
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-5 w-5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tópicos */}
          {selectedSetor && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-white/40" />
                  <h2 className="text-lg font-semibold text-white">Tópicos</h2>
                </div>
                <Button
                  size="sm"
                  onClick={() => openCreateDialog('topico')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {topicosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <p className="text-sm">Nenhum tópico criado</p>
                  </div>
                ) : (
                  topicosFiltrados.map(topico => (
                    <div
                      key={String(topico._id)}
                      onClick={() => {
                        setSelectedTopico(topico)
                        setSelectedSubtopico(null)
                        setSelectedModulo(null)
                      }}
                      className={`group p-4 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                        selectedTopico?._id === topico._id
                          ? 'bg-white/20 border-white/40 shadow-lg shadow-blue-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white break-words">{topico.nome}</p>
                            {topico.descricao && (
                              <p className="text-xs text-white/50 line-clamp-1">{topico.descricao}</p>
                            )}
                            {topico.oculta && (
                              <p className="text-xs text-gray-400 mt-1">Oculto</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              reordenarItem(String(topico._id), 'topico', 'up')
                            }}
                            title="Mover para cima"
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              reordenarItem(String(topico._id), 'topico', 'down')
                            }}
                            title="Mover para baixo"
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleOcultar(String(topico._id), 'topico', topico.oculta || false)
                            }}
                            title={topico.oculta ? 'Mostrar' : 'Ocultar'}
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            {topico.oculta ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openCreateDialog('topico', topico)
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicarItem(String(topico._id), 'topico', topico)
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletarItem(String(topico._id), 'topico')
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Subtópicos */}
          {selectedTopico && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-white/40" />
                  <h2 className="text-lg font-semibold text-white">Subtópicos</h2>
                </div>
                <Button
                  size="sm"
                  onClick={() => openCreateDialog('subtopico')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subtopicosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <p className="text-sm">Nenhum subtópico criado</p>
                  </div>
                ) : (
                  subtopicosFiltrados.map(subtopico => (
                    <div
                      key={String(subtopico._id)}
                      onClick={() => {
                        setSelectedSubtopico(subtopico)
                        setSelectedModulo(null)
                      }}
                      className={`group p-4 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                        selectedSubtopico?._id === subtopico._id
                          ? 'bg-white/20 border-white/40 shadow-lg shadow-cyan-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white break-words">{subtopico.nome}</p>
                            {subtopico.descricao && (
                              <p className="text-xs text-white/50 line-clamp-1">{subtopico.descricao}</p>
                            )}
                            {subtopico.oculta && (
                              <p className="text-xs text-gray-400 mt-1">Oculto</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              reordenarItem(String(subtopico._id), 'subtopico', 'up')
                            }}
                            title="Mover para cima"
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              reordenarItem(String(subtopico._id), 'subtopico', 'down')
                            }}
                            title="Mover para baixo"
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleOcultar(String(subtopico._id), 'subtopico', subtopico.oculta || false)
                            }}
                            title={subtopico.oculta ? 'Mostrar' : 'Ocultar'}
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            {subtopico.oculta ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openCreateDialog('subtopico', subtopico)
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicarItem(String(subtopico._id), 'subtopico', subtopico)
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletarItem(String(subtopico._id), 'subtopico')
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Módulos */}
          {selectedSubtopico && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-white/40" />
                  <h2 className="text-lg font-semibold text-white">Módulos</h2>
                </div>
                <Button
                  size="sm"
                  onClick={() => openCreateDialog('modulo')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {modulosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <p className="text-sm">Nenhum módulo criado</p>
                  </div>
                ) : (
                  modulosFiltrados.map(modulo => (
                    <div
                      key={String(modulo._id)}
                      onClick={() => setSelectedModulo(modulo)}
                      className={`group p-4 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                        selectedModulo?._id === modulo._id
                          ? 'bg-white/20 border-white/40 shadow-lg shadow-green-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white break-words">{modulo.nome}</p>
                            {modulo.descricao && (
                              <p className="text-xs text-white/50 line-clamp-1">{modulo.descricao}</p>
                            )}
                            {modulo.oculta && (
                              <p className="text-xs text-gray-400 mt-1">Oculto</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              reordenarItem(String(modulo._id), 'modulo', 'up')
                            }}
                            title="Mover para cima"
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              reordenarItem(String(modulo._id), 'modulo', 'down')
                            }}
                            title="Mover para baixo"
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleOcultar(String(modulo._id), 'modulo', modulo.oculta || false)
                            }}
                            title={modulo.oculta ? 'Mostrar' : 'Ocultar'}
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            {modulo.oculta ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openCreateDialog('modulo', modulo)
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicarItem(String(modulo._id), 'modulo', modulo)
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletarItem(String(modulo._id), 'modulo')}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Submódulos */}
          {selectedModulo && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-white/40" />
                  <h2 className="text-lg font-semibold text-white">Submódulos</h2>
                </div>
                <Button
                  size="sm"
                  onClick={() => openCreateDialog('submodulo')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {submodulosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <p className="text-sm">Nenhum submódulo criado</p>
                  </div>
                ) : (
                  submodulosFiltrados.map(submodulo => (
                    <div
                      key={String(submodulo._id)}
                      className="group p-4 rounded-xl backdrop-blur-md border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white break-words">{submodulo.nome}</p>
                            {submodulo.descricao && (
                              <p className="text-xs text-white/50 line-clamp-1">{submodulo.descricao}</p>
                            )}
                            {submodulo.oculta && (
                              <p className="text-xs text-gray-400 mt-1">Oculto</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              reordenarItem(String(submodulo._id), 'submodulo', 'up')
                            }}
                            title="Mover para cima"
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              reordenarItem(String(submodulo._id), 'submodulo', 'down')
                            }}
                            title="Mover para baixo"
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleOcultar(String(submodulo._id), 'submodulo', submodulo.oculta || false)
                            }}
                            title={submodulo.oculta ? 'Mostrar' : 'Ocultar'}
                            className="text-white/60 hover:text-white hover:bg-white/10 h-5 w-5"
                          >
                            {submodulo.oculta ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openCreateDialog('submodulo', submodulo)
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicarItem(String(submodulo._id), 'submodulo', submodulo)
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletarItem(String(submodulo._id), 'submodulo')}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="backdrop-blur-md bg-slate-900/80 border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? 'Editar' : 'Criar'} {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80">Nome *</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder={`Nome do ${dialogType}`}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80">Descrição (Opcional)</label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder={`Descrição do ${dialogType}`}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={salvarItem}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              {editingId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
