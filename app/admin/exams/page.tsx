'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Exam } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { generateExamPDF, downloadPDF } from '@/lib/pdf-generator'
import { ArrowLeft, Edit, Trash2, Eye, EyeOff, Plus, Play, StopCircle, RotateCcw, FileCheck, FileDown, AlertTriangle, Settings, Check, X, Lock, ShieldAlert, Database, Video } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error')
  const [showSettings, setShowSettings] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [savedGeminiApiKey, setSavedGeminiApiKey] = useState('')
  const [testingConnection, setTestingConnection] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showVaultDialog, setShowVaultDialog] = useState(false)
  const [vaultPassword, setVaultPassword] = useState('')
  const [resettingDatabase, setResettingDatabase] = useState(false)

  useEffect(() => {
    loadExams()
    loadSettings()
  }, [])

  const showToastMessage = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  async function loadExams() {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      setExams(data.exams || [])
    } catch (error) {
      console.error('Erro ao carregar provas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const apiKey = data.settings?.geminiApiKey || ''
        setSavedGeminiApiKey(apiKey)
        setGeminiApiKey(apiKey)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey })
      })

      if (res.ok) {
        setSavedGeminiApiKey(geminiApiKey)
        showToastMessage('Configurações salvas com sucesso!', 'success')
      } else {
        throw new Error('Erro ao salvar')
      }
    } catch (error: any) {
      showToastMessage(error.message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function testGeminiConnection() {
    if (!geminiApiKey.trim()) {
      showToastMessage('Por favor, insira uma API Key', 'error')
      return
    }

    setTestingConnection(true)
    try {
      const res = await fetch('/api/settings/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey })
      })

      const data = await res.json()

      if (data.success) {
        showToastMessage('Conexão com Gemini estabelecida com sucesso!', 'success')
      } else {
        showToastMessage(data.error || 'Falha ao conectar com Gemini', 'error')
      }
    } catch (error: any) {
      showToastMessage('Erro ao testar conexão: ' + error.message)
    } finally {
      setTestingConnection(false)
    }
  }

  async function resetDatabase() {
    if (!vaultPassword) {
      showToastMessage('Por favor, insira a senha do cofre', 'error')
      return
    }

    setResettingDatabase(true)
    try {
      const res = await fetch('/api/settings/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: vaultPassword })
      })

      const data = await res.json()

      if (data.success) {
        showToastMessage('⚠️ Banco de dados resetado! Faça logout e login novamente.', 'success')
        setShowVaultDialog(false)
        setVaultPassword('')
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        showToastMessage(data.error || 'Falha ao resetar banco de dados', 'error')
      }
    } catch (error: any) {
      showToastMessage('Erro ao resetar: ' + error.message)
    } finally {
      setResettingDatabase(false)
    }
  }

  async function handleDelete(examId: string) {
    if (!confirm('Tem certeza que deseja deletar esta prova?')) return

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao deletar')

      showToastMessage('Prova deletada com sucesso!', 'success')
      loadExams()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleDeleteAll() {
    try {
      const res = await fetch('/api/exams', {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao deletar')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowDeleteAllDialog(false)
      loadExams()
    } catch (error: any) {
      showToastMessage(error.message)
      setShowDeleteAllDialog(false)
    }
  }

  async function toggleVisibility(exam: Exam) {
    try {
      const res = await fetch(`/api/exams/${exam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !exam.isHidden }),
      })

      if (!res.ok) throw new Error('Erro ao atualizar')

      loadExams()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function forceStart(examId: string) {
    if (!confirm('Tem certeza que deseja forçar o início da prova AGORA?')) return

    try {
      const res = await fetch(`/api/exams/${examId}/force-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      })

      if (!res.ok) throw new Error('Erro ao forçar início')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      loadExams()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function forceEnd(examId: string) {
    if (!confirm('Tem certeza que deseja forçar o TÉRMINO da prova AGORA?')) return

    try {
      const res = await fetch(`/api/exams/${examId}/force-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      })

      if (!res.ok) throw new Error('Erro ao forçar término')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      loadExams()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function resetSubmissions(examId: string) {
    if (!confirm('⚠️ ATENÇÃO! Isso irá DELETAR PERMANENTEMENTE todas as submissões desta prova.\n\nTodos os usuários poderão refazer a prova. Esta ação NÃO pode ser desfeita!\n\nDeseja continuar?')) return

    try {
      const res = await fetch(`/api/exams/${examId}/reset-submissions`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Erro ao zerar resultados')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      loadExams()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  function handleDownloadExamPDF(exam: Exam) {
    try {
      const blob = generateExamPDF(exam)
      downloadPDF(blob, `${exam.title}.pdf`)
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      showToastMessage('Erro ao gerar PDF: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Provas</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/proctoring')}
              className="border-blue-500 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              <Video className="h-4 w-4 mr-2" />
              Monitoramento
            </Button>
            {exams.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteAllDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Todas
              </Button>
            )}
            <Button onClick={() => router.push('/admin/exams/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Prova
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Card de Configurações */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configure as integrações e API keys necessárias para o funcionamento do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key">API Key do Google Gemini</Label>
                <p className="text-sm text-muted-foreground">
                  Necessária para correção automática de questões discursivas.{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Obter API Key
                  </a>
                </p>
                <div className="flex gap-2">
                  <Input
                    id="gemini-api-key"
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={testGeminiConnection}
                    disabled={testingConnection || !geminiApiKey.trim()}
                  >
                    {testingConnection ? 'Testando...' : 'Testar'}
                  </Button>
                  <Button
                    onClick={saveSettings}
                    disabled={savingSettings || geminiApiKey === savedGeminiApiKey}
                  >
                    {savingSettings ? (
                      'Salvando...'
                    ) : geminiApiKey === savedGeminiApiKey ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Salvo
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </div>
                {savedGeminiApiKey && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ API Key configurada
                  </p>
                )}
              </div>

              {/* Zona de Perigo - Reset Database */}
              <div className="pt-6 mt-6 border-t border-red-200 dark:border-red-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">Zona de Perigo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ações irreversíveis que afetam todo o sistema. Use com extrema cautela.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowVaultDialog(true)}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Resetar Banco de Dados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : exams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhuma prova
              </p>
              <Button onClick={() => router.push('/admin/exams/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Prova
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <Card key={exam._id?.toString()}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle>{exam.title}</CardTitle>
                        {exam.isHidden && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            Oculto
                          </span>
                        )}
                      </div>
                      {exam.description && (
                        <CardDescription>{exam.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Questões:</span>{' '}
                        {exam.numberOfQuestions}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Pontuação:</span>{' '}
                        {exam.scoringMethod === 'tri' ? 'TRI (1000 pts)' : `${exam.totalPoints} pts`}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Início:</span>{' '}
                        {formatDate(exam.startTime)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Término:</span>{' '}
                        {formatDate(exam.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/exams/${exam._id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVisibility(exam)}
                    >
                      {exam.isHidden ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Tornar Visível
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Ocultar
                        </>
                      )}
                    </Button>

                    {new Date() < new Date(exam.startTime) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => forceStart(exam._id!.toString())}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Forçar Início
                      </Button>
                    )}

                    {new Date() < new Date(exam.endTime) && new Date() >= new Date(exam.startTime) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => forceEnd(exam._id!.toString())}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Forçar Término
                      </Button>
                    )}

                    {new Date() >= new Date(exam.startTime) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetSubmissions(exam._id!.toString())}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Zerar Resultados
                      </Button>
                    )}

                    {exam.questions.some(q => q.type === 'discursive') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/exams/${exam._id}/corrections`)}
                        className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                      >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Corrigir Discursivas
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadExamPDF(exam)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Gerar PDF da Prova
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(exam._id!.toString())}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>

                    {new Date() > new Date(exam.endTime) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/exam/${exam._id}/results`)}
                      >
                        Ver Resultados
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialog de confirmação para deletar todas as provas */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <DialogTitle className="text-center text-xl">
              Deletar Todas as Provas?
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              ⚠️ <strong>ATENÇÃO!</strong> Esta ação é <strong>IRREVERSÍVEL</strong>.
              <br /><br />
              Todas as {exams.length} prova(s) e suas submissões serão deletadas permanentemente do sistema.
              <br /><br />
              Tem certeza que deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sim, Deletar Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog do Cofre de Segurança Máxima */}
      <Dialog open={showVaultDialog} onOpenChange={(open) => {
        setShowVaultDialog(open)
        if (!open) setVaultPassword('')
      }}>
        <DialogContent className="max-w-md border-4 border-red-500 dark:border-red-700 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
          <DialogHeader>
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 dark:from-red-700 dark:to-red-900 flex items-center justify-center mb-4 shadow-2xl border-4 border-red-700 dark:border-red-600 relative">
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-pulse"></div>
              <Lock className="h-12 w-12 text-white drop-shadow-lg relative z-10" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-red-900 dark:text-red-100 uppercase tracking-wider">
              🔒 Cofre de Segurança Máxima
            </DialogTitle>
            <DialogDescription className="text-center mt-4 space-y-3">
              <div className="bg-red-100 dark:bg-red-900/50 border-2 border-red-400 dark:border-red-600 rounded-lg p-4">
                <p className="text-red-900 dark:text-red-100 font-bold text-lg mb-2">
                  ⚠️ AVISO CRÍTICO ⚠️
                </p>
                <p className="text-red-800 dark:text-red-200 text-sm leading-relaxed">
                  Você está prestes a <strong>DESTRUIR PERMANENTEMENTE</strong> todo o banco de dados do sistema.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 border-2 border-red-300 dark:border-red-700 rounded-lg p-3 text-left space-y-2">
                <p className="text-sm text-red-900 dark:text-red-100 font-semibold">
                  Esta ação irá deletar:
                </p>
                <ul className="text-xs text-red-800 dark:text-red-200 space-y-1 ml-4">
                  <li>✗ Todos os usuários</li>
                  <li>✗ Todas as provas</li>
                  <li>✗ Todas as submissões</li>
                  <li>✗ Todos os tickets</li>
                  <li>✗ Todas as notificações</li>
                  <li>✗ Todas as configurações</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg p-3 border-2 border-red-700">
                <p className="text-sm font-bold">
                  🔐 Esta operação NÃO pode ser desfeita!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vault-password" className="text-red-900 dark:text-red-100 font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha do Cofre
              </Label>
              <Input
                id="vault-password"
                type="password"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
                placeholder="Digite a senha de segurança"
                className="border-2 border-red-400 dark:border-red-600 focus:border-red-600 dark:focus:border-red-500 bg-white dark:bg-gray-900"
                disabled={resettingDatabase}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !resettingDatabase) {
                    resetDatabase()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Insira a senha de acesso ao cofre para prosseguir
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowVaultDialog(false)
                setVaultPassword('')
              }}
              disabled={resettingDatabase}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={resetDatabase}
              disabled={resettingDatabase || !vaultPassword}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 font-bold"
            >
              {resettingDatabase ? (
                <>
                  <Lock className="h-4 w-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Confirmar Reset Completo
                </>
              )}
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
