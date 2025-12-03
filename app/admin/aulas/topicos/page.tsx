'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react'
import { AulaTopic, AulaSubtopic, AulaModulo } from '@/lib/types'
import { ToastAlert } from '@/components/ui/toast-alert'

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function AdminAulasTopicosPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Estados para dados
  const [topicos, setTopicos] = useState<AulaTopic[]>([])
  const [subtopicos, setSubtopicos] = useState<AulaSubtopic[]>([])
  const [modulos, setModulos] = useState<AulaModulo[]>([])

  // Estados de navegação
  const [selectedTopico, setSelectedTopico] = useState<AulaTopic | null>(null)
  const [selectedSubtopico, setSelectedSubtopico] = useState<AulaSubtopic | null>(null)

  // Estados de dialog
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [dialogType, setDialogType] = useState<'topico' | 'subtopico' | 'modulo'>('topico')
  const [formData, setFormData] = useState({ nome: '', descricao: '' })

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
      if (data.user.role !== 'admin') {
        router.push('/')
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
        setTopicos(data.topicos || [])
        setSubtopicos(data.subtopicos || [])
        setModulos(data.modulos || [])
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

  function openCreateDialog(type: 'topico' | 'subtopico' | 'modulo') {
    setDialogType(type)
    setDialogMode('create')
    setFormData({ nome: '', descricao: '' })
    setShowDialog(true)
  }

  async function salvarItem() {
    if (!formData.nome.trim()) {
      showToast('Nome é obrigatório', 'error')
      return
    }

    try {
      let endpoint = ''
      let body: any = {
        nome: formData.nome,
        descricao: formData.descricao,
        ordem: 0
      }

      if (dialogType === 'topico') {
        endpoint = '/api/aulas/topicos'
      } else if (dialogType === 'subtopico') {
        endpoint = '/api/aulas/subtopicos'
        body.topicoId = selectedTopico?._id
      } else if (dialogType === 'modulo') {
        endpoint = '/api/aulas/modulos'
        body.topicoId = selectedTopico?._id
        body.subtopicoId = selectedSubtopico?._id
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const data = await res.json()
        
        if (dialogType === 'topico') {
          setTopicos([...topicos, data.item])
        } else if (dialogType === 'subtopico') {
          setSubtopicos([...subtopicos, data.item])
        } else if (dialogType === 'modulo') {
          setModulos([...modulos, data.item])
        }

        showToast(`${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} criado com sucesso!`)
        setShowDialog(false)
      } else {
        showToast('Erro ao salvar', 'error')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast('Erro ao salvar', 'error')
    }
  }

  async function deletarItem(id: string, type: 'topico' | 'subtopico' | 'modulo') {
    if (!confirm('Tem certeza que deseja deletar?')) return

    try {
      let endpoint = ''
      if (type === 'topico') {
        endpoint = `/api/aulas/topicos/${id}`
      } else if (type === 'subtopico') {
        endpoint = `/api/aulas/subtopicos/${id}`
      } else if (type === 'modulo') {
        endpoint = `/api/aulas/modulos/${id}`
      }

      const res = await fetch(endpoint, { method: 'DELETE' })

      if (res.ok) {
        if (type === 'topico') {
          setTopicos(topicos.filter(t => String(t._id) !== id))
          setSelectedTopico(null)
        } else if (type === 'subtopico') {
          setSubtopicos(subtopicos.filter(s => String(s._id) !== id))
          setSelectedSubtopico(null)
        } else if (type === 'modulo') {
          setModulos(modulos.filter(m => String(m._id) !== id))
        }
        showToast('Deletado com sucesso!')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast('Erro ao deletar', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  const subtopicosFiltrados = subtopicos.filter(s => s.topicoId === String(selectedTopico?._id))
  const modulosFiltrados = modulos.filter(m => 
    selectedSubtopico 
      ? m.subtopicoId === String(selectedSubtopico._id)
      : m.topicoId === String(selectedTopico?._id)
  )

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
                onClick={() => router.push('/admin/aulas')}
                className="shrink-0 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Gerenciar Estrutura</h1>
                <p className="text-sm text-white/60">
                  Tópicos → Subtópicos → Módulos
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-30 container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tópicos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Tópicos</h2>
              <Button
                size="sm"
                onClick={() => openCreateDialog('topico')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {topicos.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <p className="text-sm">Nenhum tópico criado</p>
                </div>
              ) : (
                topicos.map(topico => (
                  <div
                    key={String(topico._id)}
                    onClick={() => {
                      setSelectedTopico(topico)
                      setSelectedSubtopico(null)
                    }}
                    className={`group p-4 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                      selectedTopico?._id === topico._id
                        ? 'bg-white/20 border-white/40 shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{topico.nome}</p>
                        {topico.descricao && (
                          <p className="text-xs text-white/50 line-clamp-1">{topico.descricao}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletarItem(String(topico._id), 'topico')
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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
                      onClick={() => setSelectedSubtopico(subtopico)}
                      className={`group p-4 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                        selectedSubtopico?._id === subtopico._id
                          ? 'bg-white/20 border-white/40 shadow-lg shadow-blue-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{subtopico.nome}</p>
                          {subtopico.descricao && (
                            <p className="text-xs text-white/50 line-clamp-1">{subtopico.descricao}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletarItem(String(subtopico._id), 'subtopico')
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Módulos */}
          {(selectedTopico || selectedSubtopico) && (
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
                      className="group p-4 rounded-xl backdrop-blur-md border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{modulo.nome}</p>
                          {modulo.descricao && (
                            <p className="text-xs text-white/50 line-clamp-1">{modulo.descricao}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletarItem(String(modulo._id), 'modulo')}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
              Criar {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
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
              Criar
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
