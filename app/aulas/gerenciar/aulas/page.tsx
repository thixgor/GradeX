'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Plus, Edit2, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { AulaPostagem } from '@/lib/types'
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
        setAulas(data.aulas || [])
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
        {aulas.length === 0 ? (
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardContent className="pt-6 text-center">
              <p className="text-white/60 mb-4">Nenhuma aula criada ainda</p>
              <Button
                onClick={() => router.push('/aulas/gerenciar/aulas/criar')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Aula
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {aulas.map(aula => (
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
