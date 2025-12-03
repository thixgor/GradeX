'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Plus, Edit2, Trash2, Copy, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
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

  // Filtrar aulas baseado na cascata
  function getAulasFiltradasPorCascata() {
    let aulasFiltradaslocal = aulas

    if (selectedSetor) {
      aulasFiltradaslocal = aulasFiltradaslocal.filter(a => a.setorId === selectedSetor)
    }
    if (selectedTopico) {
      aulasFiltradaslocal = aulasFiltradaslocal.filter(a => a.topicoId === selectedTopico)
    }
    if (selectedSubtopico) {
      aulasFiltradaslocal = aulasFiltradaslocal.filter(a => a.subtopicoId === selectedSubtopico)
    }
    if (selectedModulo) {
      aulasFiltradaslocal = aulasFiltradaslocal.filter(a => a.moduloId === selectedModulo)
    }

    return aulasFiltradaslocal.sort((a: AulaPostagem, b: AulaPostagem) => (a.ordem || 0) - (b.ordem || 0))
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
        {/* Filtros em Cascata */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Setores */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Setor</label>
            <select
              value={selectedSetor || ''}
              onChange={(e) => {
                setSelectedSetor(e.target.value || null)
                setSelectedTopico(null)
                setSelectedSubtopico(null)
                setSelectedModulo(null)
              }}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
            >
              <option value="">Todos os Setores</option>
              {setores.map(setor => (
                <option key={String(setor._id)} value={String(setor._id)}>
                  {setor.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tópicos */}
          {selectedSetor && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Tópico</label>
              <select
                value={selectedTopico || ''}
                onChange={(e) => {
                  setSelectedTopico(e.target.value || null)
                  setSelectedSubtopico(null)
                  setSelectedModulo(null)
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              >
                <option value="">Todos os Tópicos</option>
                {getTopicosDoSetor(selectedSetor).map(topico => (
                  <option key={String(topico._id)} value={String(topico._id)}>
                    {topico.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtópicos */}
          {selectedTopico && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Subtópico</label>
              <select
                value={selectedSubtopico || ''}
                onChange={(e) => {
                  setSelectedSubtopico(e.target.value || null)
                  setSelectedModulo(null)
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              >
                <option value="">Todos os Subtópicos</option>
                {getSubtopicosDoTopico(selectedTopico).map(subtopico => (
                  <option key={String(subtopico._id)} value={String(subtopico._id)}>
                    {subtopico.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Módulos */}
          {selectedSubtopico && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Módulo</label>
              <select
                value={selectedModulo || ''}
                onChange={(e) => setSelectedModulo(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
              >
                <option value="">Todos os Módulos</option>
                {getModulosDoSubtopico(selectedSubtopico).map(modulo => (
                  <option key={String(modulo._id)} value={String(modulo._id)}>
                    {modulo.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Aulas */}
        {getAulasFiltradasPorCascata().length === 0 ? (
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="pt-6 text-center">
              <p className="text-white/60 mb-4">Nenhuma aula encontrada</p>
              <Button
                onClick={() => router.push('/aulas/gerenciar/aulas/criar')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Aula
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {getAulasFiltradasPorCascata().map((aula, idx) => (
              <Card key={String(aula._id)} className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-white">{aula.titulo}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          aula.tipo === 'ao-vivo'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {aula.tipo === 'ao-vivo' ? 'Ao Vivo' : 'Gravada'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          aula.visibilidade === 'premium'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                          {aula.visibilidade === 'premium' ? 'Premium' : 'Gratuita'}
                        </span>
                        {aula.oculta && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30 font-semibold">
                            Oculta
                          </span>
                        )}
                      </div>
                      {aula.descricao && (
                        <p className="text-sm text-white/70 mb-2 line-clamp-2">
                          {aula.descricao}
                        </p>
                      )}
                      <p className="text-xs text-white/50">
                        Criada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reordenarAula(String(aula._id), 'up')}
                        title="Mover para cima"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reordenarAula(String(aula._id), 'down')}
                        title="Mover para baixo"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleOcultarAula(String(aula._id), aula.oculta)}
                        title={aula.oculta ? 'Mostrar' : 'Ocultar'}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        {aula.oculta ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicarAula(String(aula._id))}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletarAula(String(aula._id))}
                        className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
