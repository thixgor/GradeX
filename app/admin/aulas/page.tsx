'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Plus, Edit2, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { AulaTopic, AulaSubtopic, AulaModulo, AulaPostagem } from '@/lib/types'
import { ToastAlert } from '@/components/ui/toast-alert'

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function AdminAulasPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Estados para dados
  const [topicos, setTopicos] = useState<AulaTopic[]>([])
  const [subtopicos, setSubtopicos] = useState<AulaSubtopic[]>([])
  const [modulos, setModulos] = useState<AulaModulo[]>([])
  const [aulas, setAulas] = useState<AulaPostagem[]>([])

  // Estados de UI
  const [activeTab, setActiveTab] = useState<'topicos' | 'subtopicos' | 'modulos' | 'aulas'>('aulas')
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedItem, setSelectedItem] = useState<any>(null)

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
        setTopicos(data.topicos || [])
        setSubtopicos(data.subtopicos || [])
        setModulos(data.modulos || [])
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
        setAulas(aulas.map(a => 
          String(a._id) === aulaId ? { ...a, oculta: !oculta } : a
        ))
        showToast(oculta ? 'Aula visível!' : 'Aula oculta!')
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/users')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Gerenciar Aulas</h1>
                <p className="text-sm text-muted-foreground">
                  Crie e gerencie aulas online e gravadas
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['aulas', 'topicos', 'subtopicos', 'modulos'] as const).map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className="capitalize whitespace-nowrap"
            >
              {tab === 'aulas' && 'Aulas'}
              {tab === 'topicos' && 'Tópicos'}
              {tab === 'subtopicos' && 'Subtópicos'}
              {tab === 'modulos' && 'Módulos'}
            </Button>
          ))}
        </div>

        {/* Aulas Tab */}
        {activeTab === 'aulas' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Aulas ({aulas.length})</h2>
              <Button onClick={() => router.push('/admin/aulas/criar')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Aula
              </Button>
            </div>

            {aulas.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Nenhuma aula criada ainda</p>
                  <Button onClick={() => router.push('/admin/aulas/criar')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Aula
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {aulas.map(aula => (
                  <Card key={String(aula._id)} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{aula.titulo}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              aula.tipo === 'ao-vivo'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {aula.tipo === 'ao-vivo' ? 'Ao Vivo' : 'Gravada'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              aula.visibilidade === 'premium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {aula.visibilidade === 'premium' ? 'Premium' : 'Gratuita'}
                            </span>
                            {aula.oculta && (
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200 font-semibold">
                                Oculta
                              </span>
                            )}
                          </div>
                          {aula.descricao && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {aula.descricao}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Criada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleOcultarAula(String(aula._id), aula.oculta)}
                            title={aula.oculta ? 'Mostrar' : 'Ocultar'}
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
                            onClick={() => router.push(`/admin/aulas/${aula._id}/editar`)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicarAula(String(aula._id))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletarAula(String(aula._id))}
                            className="text-destructive hover:text-destructive"
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
          </div>
        )}

        {/* Topicos Tab */}
        {activeTab === 'topicos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Tópicos ({topicos.length})</h2>
              <Button onClick={() => router.push('/admin/aulas/topicos/criar')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Tópico
              </Button>
            </div>

            {topicos.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Nenhum tópico criado ainda</p>
                  <Button onClick={() => router.push('/admin/aulas/topicos/criar')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Tópico
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {topicos.map(topico => (
                  <Card key={String(topico._id)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{topico.nome}</h3>
                          {topico.descricao && (
                            <p className="text-sm text-muted-foreground">{topico.descricao}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/aulas/topicos/${topico._id}/editar`)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar delete
                            }}
                            className="text-destructive hover:text-destructive"
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
          </div>
        )}

        {/* Subtopicos Tab */}
        {activeTab === 'subtopicos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Subtópicos ({subtopicos.length})</h2>
              <Button onClick={() => router.push('/admin/aulas/subtopicos/criar')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Subtópico
              </Button>
            </div>

            {subtopicos.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Nenhum subtópico criado ainda</p>
                  <Button onClick={() => router.push('/admin/aulas/subtopicos/criar')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Subtópico
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {subtopicos.map(subtopico => (
                  <Card key={String(subtopico._id)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{subtopico.nome}</h3>
                          {subtopico.descricao && (
                            <p className="text-sm text-muted-foreground">{subtopico.descricao}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/aulas/subtopicos/${subtopico._id}/editar`)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
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
          </div>
        )}

        {/* Modulos Tab */}
        {activeTab === 'modulos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Módulos ({modulos.length})</h2>
              <Button onClick={() => router.push('/admin/aulas/modulos/criar')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Módulo
              </Button>
            </div>

            {modulos.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Nenhum módulo criado ainda</p>
                  <Button onClick={() => router.push('/admin/aulas/modulos/criar')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Módulo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {modulos.map(modulo => (
                  <Card key={String(modulo._id)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{modulo.nome}</h3>
                          {modulo.descricao && (
                            <p className="text-sm text-muted-foreground">{modulo.descricao}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/aulas/modulos/${modulo._id}/editar`)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
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
