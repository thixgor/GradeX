'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Send, Trash2, Lock, Globe, Video, Zap, Download, CheckCircle2 } from 'lucide-react'
import { AulaPostagem, AulaComentario } from '@/lib/types'
import { VideoWatermark } from '@/components/video-watermark'

interface User {
  id: string
  email: string
  name: string
  cpf?: string
  role: string
  accountType?: string
  secondaryRole?: string
}

export default function AulaDetalhePage() {
  const router = useRouter()
  const params = useParams()
  const aulaId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [aula, setAula] = useState<AulaPostagem | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [aulaLoading, setAulaLoading] = useState(false)
  const [aulaLoaded, setAulaLoaded] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [temAcesso, setTemAcesso] = useState(true)
  const [bloqueadaPorData, setBloqueadaPorData] = useState(false)
  const [comentarios, setComentarios] = useState<AulaComentario[]>([])
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [aulaConcluida, setAulaConcluida] = useState(false)
  const [marcandoConclusao, setMarcandoConclusao] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadAula()
    }
  }, [user?.id, aulaId])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        setRedirecting(true)
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      setIsAdmin(data.user.role === 'admin')
    } catch (error) {
      setRedirecting(true)
      router.push('/auth/login')
    } finally {
      setAuthLoading(false)
    }
  }

  async function loadAula() {
    setAulaLoaded(false)
    setAulaLoading(true)
    try {
      const res = await fetch(`/api/aulas/${aulaId}`)
      if (res.ok) {
        const data = await res.json()
        setAula(data.aula)
        setComentarios(data.aula.comentarios || [])
        setAulaConcluida(data.aula.usuariosConcluidos?.includes(user?.id) || false)
        
        // Verificar acesso
        const isPremium = data.aula.visibilidade === 'premium'
        const userIsPremium = user?.accountType === 'premium'
        const userIsAdmin = user?.role === 'admin'
        const userIsMonitor = user?.secondaryRole === 'monitor'

        const liberadaPorData = new Date(data.aula.dataLiberacao) <= new Date()
        const shouldHideUntilRelease = !!data.aula.ocultarAteLiberacao
        const isBlockedByDate = !liberadaPorData && !shouldHideUntilRelease
        setBloqueadaPorData(isBlockedByDate)
        
        if (isPremium && !userIsPremium && !userIsAdmin && !userIsMonitor) {
          setTemAcesso(false)
        } else {
          setTemAcesso(true)
        }
      } else {
        setRedirecting(true)
        router.push('/aulas')
      }
    } catch (error) {
      console.error('Erro ao carregar aula:', error)
      setRedirecting(true)
      router.push('/aulas')
    } finally {
      setAulaLoading(false)
      setAulaLoaded(true)
    }
  }

  async function enviarComentario() {
    if (!novoComentario.trim() || !user) return

    setEnviandoComentario(true)
    try {
      const res = await fetch(`/api/aulas/${aulaId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: novoComentario
        })
      })

      if (res.ok) {
        const data = await res.json()
        setComentarios([...comentarios, data.comentario])
        setNovoComentario('')
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
    } finally {
      setEnviandoComentario(false)
    }
  }

  async function deletarComentario(comentarioId: string) {
    if (!confirm('Tem certeza que deseja deletar este comentário?')) return

    try {
      const res = await fetch(`/api/aulas/${aulaId}/comentarios/${comentarioId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setComentarios(comentarios.filter(c => String(c._id) !== comentarioId))
      }
    } catch (error) {
      console.error('Erro ao deletar comentário:', error)
    }
  }

  async function marcarComoConcluida() {
    if (!user) return

    setMarcandoConclusao(true)
    try {
      const res = await fetch(`/api/aulas/${aulaId}/conclusao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluida: !aulaConcluida })
      })

      if (res.ok) {
        setAulaConcluida(!aulaConcluida)
      }
    } catch (error) {
      console.error('Erro ao marcar conclusão:', error)
    } finally {
      setMarcandoConclusao(false)
    }
  }

  if (redirecting || authLoading || !user || aulaLoading || !aulaLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!aula) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg mb-4">Aula não encontrada</p>
            <Button onClick={() => router.push('/aulas')}>
              Voltar para Aulas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
        }
      `}</style>

      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-40 backdrop-blur-md bg-white/5 border-b border-emerald-500/20 sticky top-0 animate-fadeInUp">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/aulas')}
                className="shrink-0 text-white hover:bg-emerald-500/20 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{aula.titulo}</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-30 container mx-auto px-4 py-8 max-w-5xl">
        {/* Bloqueio de Acesso Premium */}
        {!temAcesso && (
          <div className="mb-8 backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-2xl p-8 shadow-xl shadow-red-500/10 animate-fadeInUp">
            <div className="flex items-start gap-4">
              <Lock className="h-8 w-8 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-red-300 mb-2">Aula Premium</h2>
                <p className="text-red-200/80 mb-4">
                  Esta aula é exclusiva para usuários premium. Faça upgrade da sua conta para acessar este conteúdo.
                </p>
                <Button
                  onClick={() => router.push('/buy')}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-300"
                >
                  Fazer Upgrade para Premium
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bloqueio por Data de Liberação */}
        {bloqueadaPorData && (
          <div className="mb-8 backdrop-blur-md bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-8 shadow-xl shadow-cyan-500/10 animate-fadeInUp">
            <div className="flex items-start gap-4">
              <Lock className="h-8 w-8 text-cyan-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-cyan-200 mb-2">Aula ainda não liberada</h2>
                <p className="text-cyan-100/80 mb-4">
                  Esta aula está agendada para liberação em{' '}
                  {new Date(aula.dataLiberacao).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}.
                </p>
                <Button
                  onClick={() => router.push('/aulas')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all duration-300"
                >
                  Voltar para Aulas
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Capa da Aula */}
        {aula.capa && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-emerald-500/20 shadow-xl shadow-emerald-500/10 animate-fadeInUp">
            {aula.capa.tipo === 'imagem' && aula.capa.imagem ? (
              <img 
                src={aula.capa.imagem} 
                alt={aula.titulo}
                className="w-full h-64 object-cover"
              />
            ) : aula.capa.tipo === 'cor' ? (
              <div 
                className="w-full h-64 flex items-center justify-center"
                style={{ backgroundColor: aula.capa.cor || '#3b82f6' }}
              >
                <p className="text-4xl font-bold text-white text-center px-4">{aula.capa.titulo}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Informações da Aula */}
        <div className="mb-8 backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl p-6 shadow-xl shadow-emerald-500/10 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {aula.tipo === 'ao-vivo' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30 animate-pulse">
                    <Zap className="h-3 w-3" />
                    Ao Vivo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                    <Video className="h-3 w-3" />
                    Gravada
                  </span>
                )}
                {aula.visibilidade === 'premium' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-semibold border border-yellow-500/30">
                    <Lock className="h-3 w-3" />
                    Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    <Globe className="h-3 w-3" />
                    Gratuita
                  </span>
                )}
                {aulaConcluida && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Concluída
                  </span>
                )}
              </div>
              {aula.descricao && (
                <p className="text-white/80 mb-4 text-base leading-relaxed">{aula.descricao}</p>
              )}
              <p className="text-xs text-white/50">
                Postada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {aula.criadoEm !== aula.atualizadoEm && (
                  <> • Atualizada em {new Date(aula.atualizadoEm).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</>
                )}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                onClick={marcarComoConcluida}
                disabled={marcandoConclusao}
                className={`${
                  aulaConcluida
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                } backdrop-blur-md transition-all duration-300 hover-lift`}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {aulaConcluida ? 'Concluída' : 'Marcar como Concluída'}
              </Button>
              {(isAdmin || user?.secondaryRole === 'monitor') && (
                <Button
                  onClick={() => router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all duration-300 hover-lift"
                  size="sm"
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo da Aula */}
        {temAcesso && !bloqueadaPorData ? (
        <div className="space-y-6 mb-8">
          {/* Botões de Acesso */}
          {aula.botoesAcesso && aula.botoesAcesso.length > 0 && (
            <div className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl p-6 shadow-xl shadow-emerald-500/10 animate-fadeInUp" style={{animationDelay: '0.15s'}}>
              <h3 className="text-lg font-semibold text-white mb-4">Acessos Rápidos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aula.botoesAcesso.map((botao, idx) => (
                  <a
                    key={idx}
                    href={botao.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg transition-all duration-300 hover-lift font-medium"
                  >
                    {botao.nome}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Vídeo/Link */}
          {aula.tipo === 'ao-vivo' && aula.linkOuEmbed && (
            <div className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl p-6 shadow-xl shadow-emerald-500/10 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-400" />
                Acesso à Aula Ao Vivo
              </h3>
              {aula.linkOuEmbed.startsWith('<') ? (
                <div
                  dangerouslySetInnerHTML={{ __html: aula.linkOuEmbed }}
                  className="w-full aspect-video rounded-lg overflow-hidden"
                />
              ) : (
                <a
                  href={aula.linkOuEmbed}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-300 hover-lift"
                >
                  <Zap className="h-4 w-4" />
                  Entrar na Aula Ao Vivo
                </a>
              )}
            </div>
          )}

          {aula.tipo === 'gravada' && aula.videoEmbed && (
            <div className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl p-6 shadow-xl shadow-emerald-500/10 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-400" />
                Vídeo da Aula
              </h3>
              <VideoWatermark 
                userName={user?.name || 'Usuário'} 
                userCpf={user?.cpf || 'CPF'}
              >
                {aula.videoEmbed.startsWith('<') ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: aula.videoEmbed }}
                    className="w-full h-full"
                  />
                ) : (
                  <video
                    src={aula.videoEmbed}
                    controls
                    className="w-full h-full"
                  />
                )}
              </VideoWatermark>
            </div>
          )}

          {/* PDFs */}
          {aula.pdfs && aula.pdfs.length > 0 && (
            <div className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl p-6 shadow-xl shadow-emerald-500/10 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-emerald-400" />
                Materiais de Apoio
              </h3>
              <div className="space-y-2">
                {aula.pdfs.map((pdf, index) => (
                  <a
                    key={index}
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 hover-lift"
                  >
                    <Download className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{pdf.nome}</p>
                      <p className="text-xs text-white/50">
                        {(pdf.tamanho / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        ) : null}

        {/* Comentários */}
        {temAcesso && !bloqueadaPorData && (
        <div className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl p-6 shadow-xl shadow-emerald-500/10 animate-fadeInUp" style={{animationDelay: '0.4s'}}>
          <h3 className="text-lg font-semibold text-white mb-6">Comentários ({comentarios.length})</h3>
          <div className="space-y-6">
            {/* Novo Comentário */}
            <div className="space-y-3 pb-6 border-b border-white/10">
              <label className="text-sm font-medium text-white">Seu Comentário</label>
              <Textarea
                placeholder="Compartilhe suas dúvidas ou observações..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                rows={3}
              />
              <Button
                onClick={enviarComentario}
                disabled={!novoComentario.trim() || enviandoComentario}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift"
              >
                <Send className="h-4 w-4 mr-2" />
                {enviandoComentario ? 'Enviando...' : 'Enviar Comentário'}
              </Button>
            </div>

            {/* Lista de Comentários */}
            <div className="space-y-4">
              {comentarios.length === 0 ? (
                <p className="text-center text-white/50 py-4">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              ) : (
                comentarios.map(comentario => (
                  <div key={String(comentario._id)} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm text-white">{comentario.nomeUsuario}</span>
                        {comentario.isAdmin && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold">
                            Administrador
                          </span>
                        )}
                        {!comentario.isAdmin && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                            Aluno
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mb-2">
                        {new Date(comentario.criadoEm).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-white/80 break-words">{comentario.conteudo}</p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletarComentario(String(comentario._id))}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  )
}
