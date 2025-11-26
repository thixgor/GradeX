'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProctoringSession } from '@/lib/types'
import { ArrowLeft, Camera, Mic, Monitor, AlertTriangle, RefreshCw, Users } from 'lucide-react'

export default function ProctoringMonitoringPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<ProctoringSession[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  async function fetchSessions() {
    try {
      const res = await fetch('/api/proctoring/sessions')
      const data = await res.json()

      if (data.success) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Erro ao buscar sessões:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  // Auto-refresh a cada 5 segundos
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchSessions()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/exams')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                🎥 Monitoramento de Provas
              </h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe em tempo real os alunos fazendo provas com monitoramento ativo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'border-green-500' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Atualização Automática' : 'Atualização Manual'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                  <p className="text-3xl font-bold">{sessions.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Com Câmera</p>
                  <p className="text-3xl font-bold">
                    {sessions.filter(s => s.cameraEnabled).length}
                  </p>
                </div>
                <Camera className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Com Áudio</p>
                  <p className="text-3xl font-bold">
                    {sessions.filter(s => s.audioEnabled).length}
                  </p>
                </div>
                <Mic className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Com Tela</p>
                  <p className="text-3xl font-bold">
                    {sessions.filter(s => s.screenEnabled).length}
                  </p>
                </div>
                <Monitor className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Sessões */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Carregando sessões...</p>
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">Nenhuma sessão ativa no momento</p>
              <p className="text-sm text-muted-foreground">
                Quando alunos iniciarem provas com monitoramento habilitado, elas aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.submissionId} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        {session.userName}
                      </CardTitle>

                      {/* Informações da Prova */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">📋 Prova:</span>{' '}
                          <span className="font-semibold">{session.examTitle}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">👤 ID Aluno:</span>{' '}
                          <span className="font-mono text-xs">{session.userId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">🔢 ID Prova:</span>{' '}
                          <span className="font-mono text-xs">{session.examId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">📝 Questões:</span>{' '}
                          <span className="font-semibold">{session.numberOfQuestions}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">⭐ Valor Total:</span>{' '}
                          <span className="font-semibold">{session.totalPoints} pontos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informações da Sessão */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Início:</strong>{' '}
                        {new Date(session.startedAt).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm">
                        <strong>Duração:</strong>{' '}
                        {Math.floor(
                          (new Date().getTime() - new Date(session.startedAt).getTime()) / 60000
                        )}{' '}
                        minutos
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Monitoramento Ativo:</p>
                      <div className="flex flex-wrap gap-2">
                        {session.cameraEnabled && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded text-xs">
                            <Camera className="h-3 w-3" />
                            Câmera
                          </span>
                        )}
                        {session.audioEnabled && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded text-xs">
                            <Mic className="h-3 w-3" />
                            Áudio
                          </span>
                        )}
                        {session.screenEnabled && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded text-xs">
                            <Monitor className="h-3 w-3" />
                            {session.screenMode === 'window' ? 'Janela' : 'Tela Inteira'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Placeholder para streams - MVP */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-3">📺 Visualização (MVP):</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {session.cameraEnabled && (
                        <div className="border rounded-lg p-4 bg-muted/50 text-center">
                          <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Stream de câmera
                            <br />
                            (WebRTC em produção)
                          </p>
                        </div>
                      )}
                      {session.audioEnabled && (
                        <div className="border rounded-lg p-4 bg-muted/50 text-center">
                          <Mic className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Stream de áudio
                            <br />
                            (WebRTC em produção)
                          </p>
                        </div>
                      )}
                      {session.screenEnabled && (
                        <div className="border rounded-lg p-4 bg-muted/50 text-center">
                          <Monitor className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Stream de tela
                            <br />
                            (WebRTC em produção)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avisos */}
                  {session.cameraBlackWarnings > 0 && (
                    <div className="border-t pt-4">
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                            Avisos de Câmera Preta
                          </p>
                          <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                            Esta sessão teve {session.cameraBlackWarnings} aviso(s) de câmera bloqueada
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Nota sobre MVP */}
        <Card className="mt-6 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <p className="text-sm font-semibold mb-2">Sobre este MVP (Minimum Viable Product)</p>
                <p className="text-xs text-muted-foreground">
                  Esta versão simplificada demonstra a estrutura do sistema de monitoramento.
                  Em uma versão de produção completa, seria implementado:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 ml-4 list-disc space-y-1">
                  <li>WebRTC para streaming de vídeo, áudio e tela em tempo real</li>
                  <li>WebSocket para comunicação bidirecional instantânea</li>
                  <li>Gravação das sessões para revisão posterior</li>
                  <li>Detecção de múltiplas faces ou ausência de face</li>
                  <li>Detecção de troca de abas ou janelas</li>
                  <li>Análise de comportamento suspeito com IA</li>
                  <li>Sistema de alertas em tempo real para o administrador</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
