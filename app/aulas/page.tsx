'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Plus, Lock, Globe, Video, Zap, Search, ChevronRight, Info, BookOpen, AlertCircle, Pencil } from 'lucide-react'
import { useState as useStateDialog } from 'react'
import { AulaSetor, AulaTopic, AulaSubtopic, AulaModulo, AulaSubmodulo, AulaPostagem } from '@/lib/types'

interface User {
  id: string
  email: string
  name: string
  role: string
  secondaryRole?: string
  accountType?: string
}

export default function AulasPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Estados para dados
  const [setores, setSetores] = useState<AulaSetor[]>([])
  const [topicos, setTopicos] = useState<AulaTopic[]>([])
  const [subtopicos, setSubtopicos] = useState<AulaSubtopic[]>([])
  const [modulos, setModulos] = useState<AulaModulo[]>([])
  const [submodulos, setSubmodulos] = useState<AulaSubmodulo[]>([])
  const [aulas, setAulas] = useState<AulaPostagem[]>([])

  // Estados de navegação em cascata
  const [searchTerm, setSearchTerm] = useState('')
  const [view, setView] = useState<'setores' | 'topicos' | 'subtopicos' | 'modulos' | 'submodulos' | 'aulas'>('setores')
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null)
  const [selectedTopico, setSelectedTopico] = useState<string | null>(null)
  const [selectedSubtopico, setSelectedSubtopico] = useState<string | null>(null)
  const [selectedModulo, setSelectedModulo] = useState<string | null>(null)
  const [selectedSubmodulo, setSelectedSubmodulo] = useState<string | null>(null)

  // Dialog de descrição
  const [descricaoDialog, setDescricaoDialog] = useState<{ titulo: string; descricao: string } | null>(null)
  const [bloqueioDialog, setBloqueioDialog] = useState<{ titulo: string; mensagem: string } | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  // Recarregar aulas quando user muda
  useEffect(() => {
    if (user) {
      loadAulas()
    }
  }, [user?.id])

  // Recarregar aulas a cada 5 segundos para sincronizar com mudanças
  useEffect(() => {
    const interval = setInterval(() => {
      loadAulas()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      setIsAdmin(data.user.role === 'admin')
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
        setSetores(data.setores || [])
        setTopicos(data.topicos || [])
        setSubtopicos(data.subtopicos || [])
        setModulos(data.modulos || [])
        setSubmodulos(data.submodulos || [])
        setAulas(data.aulas || [])
      }
    } catch (error) {
      console.error('Erro ao carregar aulas:', error)
    }
  }

  // Funções auxiliares para filtrar dados
  const isAulaLiberada = (aula: AulaPostagem) => {
    return new Date(aula.dataLiberacao) <= new Date()
  }

  const isAulaBloqueadaPorData = (aula: AulaPostagem) => {
    if (!aula.dataLiberacao) return false
    if (isAulaLiberada(aula)) return false
    return !aula.ocultarAteLiberacao
  }

  const formatarDataLiberacao = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatarTempoRestante = (target: Date) => {
    const diffMs = target.getTime() - Date.now()
    if (diffMs <= 0) return 'agora'

    const totalMinutes = Math.floor(diffMs / 60000)
    const days = Math.floor(totalMinutes / (60 * 24))
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
    const minutes = totalMinutes % 60

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const filterAula = (aula: AulaPostagem) => {
    // Verificar se não está oculta (apenas admin vê ocultas)
    if (aula.oculta && !isAdmin && user?.secondaryRole !== 'monitor') return false
    // Verificar se foi liberada (ou se deve ficar oculta até a liberação)
    if (!isAulaLiberada(aula) && aula.ocultarAteLiberacao && !isAdmin && user?.secondaryRole !== 'monitor') return false
    // Mostrar aulas premium para todos (mas bloqueadas visualmente para não-premium)
    return true
  }

  // Aulas do setor (sem tópico)
  const aulasSetor = selectedSetor ? aulas.filter(a => filterAula(a) && a.setorId === selectedSetor && !a.topicoId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) : []
  
  // Aulas do tópico (sem subtópico)
  const aulasTopico = selectedTopico ? aulas.filter(a => filterAula(a) && a.topicoId === selectedTopico && !a.subtopicoId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) : []
  
  // Aulas do subtópico (sem módulo)
  const aulasSubtopico = selectedSubtopico ? aulas.filter(a => filterAula(a) && a.subtopicoId === selectedSubtopico && !a.moduloId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) : []
  
  // Aulas do módulo (sem submódulo)
  const aulasModulo = selectedModulo ? aulas.filter(a => filterAula(a) && a.moduloId === selectedModulo && !a.submoduloId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) : []
  
  // Aulas do submódulo
  const aulasSubmodulo = selectedSubmodulo ? aulas.filter(a => filterAula(a) && a.submoduloId === selectedSubmodulo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) : []

  // Aulas sem setor
  const aulasSemSetor = aulas.filter(a => filterAula(a) && !a.setorId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))

  // Função auxiliar para contar aulas de um tópico (incluindo todos os níveis abaixo)
  const countAulasTopico = (topicoId: string): number => {
    return aulas.filter(a => 
      filterAula(a) && a.topicoId === topicoId
    ).length
  }

  // Função auxiliar para contar aulas de um subtópico (incluindo todos os níveis abaixo)
  const countAulasSubtopico = (subtopicoId: string): number => {
    return aulas.filter(a => 
      filterAula(a) && a.subtopicoId === subtopicoId
    ).length
  }

  // Função auxiliar para contar aulas de um módulo (incluindo todos os níveis abaixo)
  const countAulasModulo = (moduloId: string): number => {
    return aulas.filter(a => 
      filterAula(a) && a.moduloId === moduloId
    ).length
  }

  // Função auxiliar para contar aulas de um submódulo
  const countAulasSubmodulo = (submoduloId: string): number => {
    return aulas.filter(a => 
      filterAula(a) && a.submoduloId === submoduloId
    ).length
  }

  // Tópicos do setor
  const topicosSetor = selectedSetor ? topicos.filter(t => t.setorId === selectedSetor && !t.oculta) : []
  
  // Subtópicos do tópico
  const subtopicosTopico = selectedTopico ? subtopicos.filter(s => s.topicoId === selectedTopico && !s.oculta) : []
  
  // Módulos do subtópico
  const modulosSubtopico = selectedSubtopico ? modulos.filter(m => m.subtopicoId === selectedSubtopico && !m.oculta) : []
  
  // Submódulos do módulo
  const submodulosModulo = selectedModulo ? submodulos.filter(sm => sm.moduloId === selectedModulo && !sm.oculta) : []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
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
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(70, 129, 82, 0.3), inset 0 0 20px rgba(70, 129, 82, 0.1);
          }
          50% {
            box-shadow: 0 0 40px rgba(70, 129, 82, 0.5), inset 0 0 20px rgba(70, 129, 82, 0.2);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out;
        }
        
        .animate-glowPulse {
          animation: glowPulse 3s ease-in-out infinite;
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
      <header className="relative z-40 backdrop-blur-md bg-white/5 border-b border-emerald-500/20 sticky top-0 animate-slideInLeft">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="shrink-0 text-white hover:bg-emerald-500/20 transition-colors h-8 w-8 sm:h-10 sm:w-10"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Aulas</h1>
                <p className="text-xs sm:text-sm text-white/60 hidden sm:block">
                  Aprenda com aulas ao-vivo e gravadas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {(isAdmin || user?.secondaryRole === 'monitor') && (
                <Button
                  onClick={() => router.push('/aulas/gerenciar')}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift hidden sm:flex"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Gerenciar
                </Button>
              )}
              {(isAdmin || user?.secondaryRole === 'monitor') && (
                <Button
                  onClick={() => router.push('/aulas/gerenciar')}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-emerald-500/20 transition-colors sm:hidden h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-30 container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Navegação em Cascata com Cards */}
        {!selectedSetor ? (
          // Tela de Setores
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
              Setores de Ensino
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Aulas sem setor - renderizadas como cards */}
              {aulasSemSetor.map((aula, idx) => (
                <div 
                  key={String(aula._id)} 
                  className={`backdrop-blur-md rounded-2xl overflow-hidden transition-all animate-fadeInUp hover-lift relative ${
                    aula.visibilidade === 'premium'
                      ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-2 border-yellow-500/40 shadow-xl shadow-yellow-500/20 hover:border-yellow-500/60 hover:shadow-yellow-500/30'
                      : 'bg-white/5 border border-emerald-500/20 shadow-xl shadow-emerald-500/5 hover:border-emerald-500/40'
                  }`}
                  style={{animationDelay: `${idx * 0.1}s`}}
                >
                  {(isAdmin || user?.secondaryRole === 'monitor') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)
                      }}
                      className="absolute bottom-2 right-2 z-20 p-2 rounded-lg bg-black/30 border border-white/20 hover:bg-black/40 transition-colors"
                      title="Editar aula"
                    >
                      <Pencil className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                  {/* Bloqueio Premium */}
                  {aula.visibilidade === 'premium' && user?.accountType !== 'premium' && !isAdmin && user?.secondaryRole !== 'monitor' && (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10">
                      <div className="text-center">
                        <Lock className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-yellow-300">Conteúdo Premium</p>
                      </div>
                    </div>
                  )}

                  {/* Bloqueio por Data de Liberação */}
                  {isAulaBloqueadaPorData(aula) && (
                    <div className="absolute inset-0 bg-black/35 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10">
                      <div className="text-center px-6">
                        <AlertCircle className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-cyan-200">Ainda não liberada</p>
                        <p className="text-xs text-white/70 mt-1">
                          Disponível em {formatarDataLiberacao(new Date(aula.dataLiberacao))}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          Faltam {formatarTempoRestante(new Date(aula.dataLiberacao))}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Capa da Aula */}
                  {aula.capa && (
                    <div className="w-full h-32 sm:h-40 relative overflow-hidden">
                      {aula.capa.tipo === 'imagem' && aula.capa.imagem ? (
                        <img 
                          src={aula.capa.imagem} 
                          alt={aula.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : aula.capa.tipo === 'cor' ? (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: aula.capa.cor || '#3b82f6' }}
                        >
                          <p className="text-lg sm:text-2xl font-bold text-white text-center px-4">{aula.capa.titulo}</p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold text-white">{aula.titulo}</h3>
                          <div className="flex gap-2 flex-wrap">
                            {aula.tipo === 'ao-vivo' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                <Zap className="h-3 w-3" />
                                Ao Vivo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                                <Video className="h-3 w-3" />
                                Gravada
                              </span>
                            )}
                            {aula.visibilidade === 'premium' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-semibold">
                                <Lock className="h-3 w-3" />
                                Premium
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                                <Globe className="h-3 w-3" />
                                Gratuita
                              </span>
                            )}
                          </div>
                        </div>
                        {aula.descricao && (
                          <div className="flex items-start gap-2 mb-2">
                            <p className="text-xs sm:text-sm text-white/70 line-clamp-2 flex-1">{aula.descricao}</p>
                            {aula.descricao && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDescricaoDialog({ titulo: aula.titulo, descricao: aula.descricao || '' })
                                }}
                                className="p-1 hover:bg-emerald-500/30 rounded transition-colors flex-shrink-0"
                                title="Ver descrição completa"
                              >
                                <Info className="h-4 w-4 text-emerald-400" />
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-white/50">
                          Postada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR')}
                          {aula.criadoEm !== aula.atualizadoEm && (
                            <> • Atualizada em {new Date(aula.atualizadoEm).toLocaleDateString('pt-BR')}</>
                          )}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          if (isAulaBloqueadaPorData(aula)) {
                            setBloqueioDialog({
                              titulo: aula.titulo,
                              mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                            })
                            return
                          }
                          router.push(`/aulas/${aula._id}`)
                        }}
                        className={`bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift ${
                          isAulaBloqueadaPorData(aula) ? 'opacity-70' : ''
                        }`}
                        size="sm"
                      >
                        Ver Aula
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Setores com aulas */}
              {setores
                .filter(s => !s.oculta)
                .map(setor => {
                  const aulaCount = aulas.filter(a => filterAula(a) && a.setorId === String(setor._id)).length
                  return (
                    <div
                      key={String(setor._id)}
                      onClick={() => {
                        setSelectedSetor(String(setor._id))
                        setSelectedTopico(null)
                        setSelectedSubtopico(null)
                        setSelectedModulo(null)
                        setSelectedSubmodulo(null)
                      }}
                      className="backdrop-blur-md bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/60 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-xl shadow-emerald-500/10 hover-lift group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white group-hover:text-emerald-200 transition-colors line-clamp-2">{setor.nome}</h3>
                        </div>
                        <ChevronRight className="h-6 w-6 text-emerald-400 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
                      </div>
                      {setor.descricao && (
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">{setor.descricao}</p>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-white/70 text-sm">Aulas</span>
                        <span className="text-2xl font-bold text-emerald-300">{aulaCount}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ) : !selectedTopico ? (
          // Tela de Tópicos
          <div>
            <div className="sticky top-16 sm:top-20 z-40 mb-6">
              <div className="inline-flex backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1">
                <Button
                  onClick={() => {
                    setSelectedSetor(null)
                    setSelectedTopico(null)
                    setSelectedSubtopico(null)
                    setSelectedModulo(null)
                    setSelectedSubmodulo(null)
                  }}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                  Voltar aos Setores
                </Button>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-8">Tópicos</h2>
            
            {/* Aulas do setor sem tópico */}
            {aulasSetor.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Aulas do Setor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {aulasSetor.map((aula, idx) => (
                    <div 
                      key={String(aula._id)} 
                      className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all shadow-xl shadow-emerald-500/5 animate-fadeInUp hover-lift relative"
                      style={{animationDelay: `${idx * 0.1}s`}}
                    >
                      {(isAdmin || user?.secondaryRole === 'monitor') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)
                          }}
                          className="absolute bottom-2 right-2 z-20 p-2 rounded-lg bg-black/30 border border-white/20 hover:bg-black/40 transition-colors"
                          title="Editar aula"
                        >
                          <Pencil className="h-3.5 w-3.5 text-white" />
                        </button>
                      )}
                      {/* Bloqueio por Data de Liberação */}
                      {isAulaBloqueadaPorData(aula) && (
                        <div className="absolute inset-0 bg-black/35 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10">
                          <div className="text-center px-6">
                            <AlertCircle className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-cyan-200">Ainda não liberada</p>
                            <p className="text-xs text-white/70 mt-1">
                              Disponível em {formatarDataLiberacao(new Date(aula.dataLiberacao))}
                            </p>
                            <p className="text-xs text-white/60 mt-1">
                              Faltam {formatarTempoRestante(new Date(aula.dataLiberacao))}
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Capa da Aula */}
                      {aula.capa && (
                        <div className="w-full h-32 sm:h-40 relative overflow-hidden">
                          {aula.capa.tipo === 'imagem' && aula.capa.imagem ? (
                            <img 
                              src={aula.capa.imagem} 
                              alt={aula.titulo}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : aula.capa.tipo === 'cor' ? (
                            <div 
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: aula.capa.cor || '#3b82f6' }}
                            >
                              <p className="text-lg sm:text-2xl font-bold text-white text-center px-4">{aula.capa.titulo}</p>
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-semibold text-white">{aula.titulo}</h3>
                              <div className="flex gap-2 flex-wrap">
                                {aula.tipo === 'ao-vivo' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                    <Zap className="h-3 w-3" />
                                    Ao Vivo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                                    <Video className="h-3 w-3" />
                                    Gravada
                                  </span>
                                )}
                                {aula.visibilidade === 'premium' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-semibold">
                                    <Lock className="h-3 w-3" />
                                    Premium
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                                    <Globe className="h-3 w-3" />
                                    Gratuita
                                  </span>
                                )}
                              </div>
                            </div>
                            {aula.descricao && (
                              <div className="flex items-start gap-2 mb-2">
                                <p className="text-xs sm:text-sm text-white/70 line-clamp-2 flex-1">{aula.descricao}</p>
                                {aula.descricao && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setDescricaoDialog({ titulo: aula.titulo, descricao: aula.descricao || '' })
                                    }}
                                    className="p-1 hover:bg-emerald-500/30 rounded transition-colors flex-shrink-0"
                                    title="Ver descrição completa"
                                  >
                                    <Info className="h-4 w-4 text-emerald-400" />
                                  </button>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-white/50">
                              Postada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR')}
                              {aula.criadoEm !== aula.atualizadoEm && (
                                <> • Atualizada em {new Date(aula.atualizadoEm).toLocaleDateString('pt-BR')}</>
                              )}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              if (isAulaBloqueadaPorData(aula)) {
                                setBloqueioDialog({
                                  titulo: aula.titulo,
                                  mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                                })
                                return
                              }
                              router.push(`/aulas/${aula._id}`)
                            }}
                            className={`bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift ${
                              isAulaBloqueadaPorData(aula) ? 'opacity-70' : ''
                            }`}
                            size="sm"
                          >
                            Ver Aula
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tópicos do setor */}
            {topicosSetor.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Tópicos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {topicosSetor.map(topico => {
                    const aulaCount = countAulasTopico(String(topico._id))
                    return (
                      <div
                        key={String(topico._id)}
                        onClick={() => {
                          setSelectedTopico(String(topico._id))
                          setSelectedSubtopico(null)
                          setSelectedModulo(null)
                          setSelectedSubmodulo(null)
                        }}
                        className="backdrop-blur-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6 hover:border-blue-500/60 hover:bg-blue-500/30 transition-all cursor-pointer shadow-xl shadow-blue-500/10 hover-lift group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-2">{topico.nome}</h3>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-2">
                            {topico.descricao && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDescricaoDialog({ titulo: topico.nome, descricao: topico.descricao || '' })
                                }}
                                className="p-1 hover:bg-blue-500/30 rounded transition-colors"
                                title="Ver descrição completa"
                              >
                                <Info className="h-5 w-5 text-blue-400" />
                              </button>
                            )}
                            <ChevronRight className="h-6 w-6 text-blue-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                        {topico.descricao && (
                          <p className="text-white/60 text-sm mb-4 line-clamp-2">{topico.descricao}</p>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <span className="text-white/70 text-sm">Aulas</span>
                          <span className="text-2xl font-bold text-blue-300">{aulaCount}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : !selectedSubtopico ? (
          // Tela de Subtópicos
          <div>
            <div className="sticky top-16 sm:top-20 z-40 mb-6">
              <div className="inline-flex backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1">
                <Button
                  onClick={() => {
                    setSelectedTopico(null)
                    setSelectedSubtopico(null)
                    setSelectedModulo(null)
                    setSelectedSubmodulo(null)
                  }}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                  Voltar aos Tópicos
                </Button>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-8">Subtópicos</h2>
            
            {/* Aulas do tópico sem subtópico */}
            {aulasTopico.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Aulas do Tópico</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {aulasTopico.map((aula, idx) => (
                    <div 
                      key={String(aula._id)} 
                      className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all shadow-xl shadow-emerald-500/5 animate-fadeInUp hover-lift relative"
                      style={{animationDelay: `${idx * 0.1}s`}}
                    >
                      {(isAdmin || user?.secondaryRole === 'monitor') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)
                          }}
                          className="absolute bottom-2 right-2 z-20 p-2 rounded-lg bg-black/30 border border-white/20 hover:bg-black/40 transition-colors"
                          title="Editar aula"
                        >
                          <Pencil className="h-3.5 w-3.5 text-white" />
                        </button>
                      )}
                      {/* Bloqueio por Data de Liberação */}
                      {isAulaBloqueadaPorData(aula) && (
                        <div className="absolute inset-0 bg-black/35 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10">
                          <div className="text-center px-6">
                            <AlertCircle className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-cyan-200">Ainda não liberada</p>
                            <p className="text-xs text-white/70 mt-1">
                              Disponível em {formatarDataLiberacao(new Date(aula.dataLiberacao))}
                            </p>
                            <p className="text-xs text-white/60 mt-1">
                              Faltam {formatarTempoRestante(new Date(aula.dataLiberacao))}
                            </p>
                          </div>
                        </div>
                      )}
                  {/* Capa da Aula */}
                  {aula.capa && (
                    <div className="w-full h-32 sm:h-40 relative overflow-hidden">
                      {aula.capa.tipo === 'imagem' && aula.capa.imagem ? (
                        <img 
                          src={aula.capa.imagem} 
                          alt={aula.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : aula.capa.tipo === 'cor' ? (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: aula.capa.cor || '#3b82f6' }}
                        >
                          <p className="text-lg sm:text-2xl font-bold text-white text-center px-4">{aula.capa.titulo}</p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold text-white">{aula.titulo}</h3>
                          <div className="flex gap-2 flex-wrap">
                            {aula.tipo === 'ao-vivo' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                <Zap className="h-3 w-3" />
                                Ao Vivo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                                <Video className="h-3 w-3" />
                                Gravada
                              </span>
                            )}
                            {aula.visibilidade === 'premium' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-semibold">
                                <Lock className="h-3 w-3" />
                                Premium
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                                <Globe className="h-3 w-3" />
                                Gratuita
                              </span>
                            )}
                          </div>
                        </div>
                        {aula.descricao && (
                          <div className="flex items-start gap-2 mb-2">
                            <p className="text-xs sm:text-sm text-white/70 line-clamp-2 flex-1">{aula.descricao}</p>
                            {aula.descricao && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDescricaoDialog({ titulo: aula.titulo, descricao: aula.descricao || '' })
                                }}
                                className="p-1 hover:bg-emerald-500/30 rounded transition-colors flex-shrink-0"
                                title="Ver descrição completa"
                              >
                                <Info className="h-4 w-4 text-emerald-400" />
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-white/50">
                          Postada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR')}
                          {aula.criadoEm !== aula.atualizadoEm && (
                            <> • Atualizada em {new Date(aula.atualizadoEm).toLocaleDateString('pt-BR')}</>
                          )}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          if (isAulaBloqueadaPorData(aula)) {
                            setBloqueioDialog({
                              titulo: aula.titulo,
                              mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                            })
                            return
                          }
                          router.push(`/aulas/${aula._id}`)
                        }}
                        className={`bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift ${
                          isAulaBloqueadaPorData(aula) ? 'opacity-70' : ''
                        }`}
                        size="sm"
                      >
                        Ver Aula
                      </Button>
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtópicos do tópico */}
            {subtopicosTopico.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Subtópicos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {subtopicosTopico.map(subtopico => {
                const aulaCount = countAulasSubtopico(String(subtopico._id))
                return (
                  <div
                    key={String(subtopico._id)}
                    onClick={() => {
                      setSelectedSubtopico(String(subtopico._id))
                      setSelectedModulo(null)
                      setSelectedSubmodulo(null)
                    }}
                    className="backdrop-blur-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 hover:bg-cyan-500/30 transition-all cursor-pointer shadow-xl shadow-cyan-500/10 hover-lift group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-2">{subtopico.nome}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        {subtopico.descricao && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDescricaoDialog({ titulo: subtopico.nome, descricao: subtopico.descricao || '' })
                            }}
                            className="p-1 hover:bg-cyan-500/30 rounded transition-colors"
                            title="Ver descrição completa"
                          >
                            <Info className="h-5 w-5 text-cyan-400" />
                          </button>
                        )}
                        <ChevronRight className="h-6 w-6 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    {subtopico.descricao && (
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">{subtopico.descricao}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-white/70 text-sm">Aulas</span>
                      <span className="text-2xl font-bold text-cyan-300">{aulaCount}</span>
                    </div>
                  </div>
                )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : !selectedModulo ? (
          // Tela de Módulos
          <div>
            <div className="sticky top-16 sm:top-20 z-40 mb-6">
              <div className="inline-flex backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1">
                <Button
                  onClick={() => {
                    setSelectedSubtopico(null)
                    setSelectedModulo(null)
                    setSelectedSubmodulo(null)
                  }}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                  Voltar aos Subtópicos
                </Button>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-8">Módulos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Aulas do subtópico sem módulo - renderizadas como cards */}
              {aulasSubtopico.map((aula, idx) => (
                <div 
                  key={String(aula._id)} 
                  className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all shadow-xl shadow-emerald-500/5 animate-fadeInUp hover-lift relative"
                  style={{animationDelay: `${idx * 0.1}s`}}
                >
                  {(isAdmin || user?.secondaryRole === 'monitor') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)
                      }}
                      className="absolute bottom-2 right-2 z-20 p-2 rounded-lg bg-black/30 border border-white/20 hover:bg-black/40 transition-colors"
                      title="Editar aula"
                    >
                      <Pencil className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                  {/* Bloqueio por Data de Liberação */}
                  {isAulaBloqueadaPorData(aula) && (
                    <div className="absolute inset-0 bg-black/35 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10">
                      <div className="text-center px-6">
                        <AlertCircle className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-cyan-200">Ainda não liberada</p>
                        <p className="text-xs text-white/70 mt-1">
                          Disponível em {formatarDataLiberacao(new Date(aula.dataLiberacao))}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          Faltam {formatarTempoRestante(new Date(aula.dataLiberacao))}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Capa da Aula */}
                  {aula.capa && (
                    <div className="w-full h-32 sm:h-40 relative overflow-hidden">
                      {aula.capa.tipo === 'imagem' && aula.capa.imagem ? (
                        <img 
                          src={aula.capa.imagem} 
                          alt={aula.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : aula.capa.tipo === 'cor' ? (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: aula.capa.cor || '#3b82f6' }}
                        >
                          <p className="text-lg sm:text-2xl font-bold text-white text-center px-4">{aula.capa.titulo}</p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold text-white">{aula.titulo}</h3>
                          <div className="flex gap-2 flex-wrap">
                            {aula.tipo === 'ao-vivo' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                <Zap className="h-3 w-3" />
                                Ao Vivo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                                <Video className="h-3 w-3" />
                                Gravada
                              </span>
                            )}
                            {aula.visibilidade === 'premium' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-semibold">
                                <Lock className="h-3 w-3" />
                                Premium
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                                <Globe className="h-3 w-3" />
                                Gratuita
                              </span>
                            )}
                          </div>
                        </div>
                        {aula.descricao && (
                          <div className="flex items-start gap-2 mb-2">
                            <p className="text-xs sm:text-sm text-white/70 line-clamp-2 flex-1">{aula.descricao}</p>
                            {aula.descricao && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDescricaoDialog({ titulo: aula.titulo, descricao: aula.descricao || '' })
                                }}
                                className="p-1 hover:bg-emerald-500/30 rounded transition-colors flex-shrink-0"
                                title="Ver descrição completa"
                              >
                                <Info className="h-4 w-4 text-emerald-400" />
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-white/50">
                          Postada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR')}
                          {aula.criadoEm !== aula.atualizadoEm && (
                            <> • Atualizada em {new Date(aula.atualizadoEm).toLocaleDateString('pt-BR')}</>
                          )}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          if (isAulaBloqueadaPorData(aula)) {
                            setBloqueioDialog({
                              titulo: aula.titulo,
                              mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                            })
                            return
                          }
                          router.push(`/aulas/${aula._id}`)
                        }}
                        className={`bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift ${
                          isAulaBloqueadaPorData(aula) ? 'opacity-70' : ''
                        }`}
                        size="sm"
                      >
                        Ver Aula
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {modulosSubtopico.map(modulo => {
                const aulaCount = countAulasModulo(String(modulo._id))
                return (
                  <div
                    key={String(modulo._id)}
                    onClick={() => {
                      setSelectedModulo(String(modulo._id))
                      setSelectedSubmodulo(null)
                    }}
                    className="backdrop-blur-md bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-6 hover:border-pink-500/60 hover:bg-pink-500/30 transition-all cursor-pointer shadow-xl shadow-pink-500/10 hover-lift group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-pink-200 transition-colors line-clamp-2">{modulo.nome}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        {modulo.descricao && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDescricaoDialog({ titulo: modulo.nome, descricao: modulo.descricao || '' })
                            }}
                            className="p-1 hover:bg-pink-500/30 rounded transition-colors"
                            title="Ver descrição completa"
                          >
                            <Info className="h-5 w-5 text-pink-400" />
                          </button>
                        )}
                        <ChevronRight className="h-6 w-6 text-pink-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    {modulo.descricao && (
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">{modulo.descricao}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-white/70 text-sm">Aulas</span>
                      <span className="text-2xl font-bold text-pink-300">{aulaCount}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : !selectedSubmodulo ? (
          // Tela de Submódulos
          <div>
            <div className="sticky top-16 sm:top-20 z-40 mb-6">
              <div className="inline-flex backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1">
                <Button
                  onClick={() => {
                    setSelectedModulo(null)
                    setSelectedSubmodulo(null)
                  }}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                  Voltar aos Módulos
                </Button>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-8">Submódulos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Aulas do módulo sem submódulo - renderizadas como cards */}
              {aulasModulo.map((aula, idx) => (
                <div 
                  key={String(aula._id)} 
                  className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all shadow-xl shadow-emerald-500/5 animate-fadeInUp hover-lift relative"
                  style={{animationDelay: `${idx * 0.1}s`}}
                >
                  {(isAdmin || user?.secondaryRole === 'monitor') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)
                      }}
                      className="absolute bottom-2 right-2 z-20 p-2 rounded-lg bg-black/30 border border-white/20 hover:bg-black/40 transition-colors"
                      title="Editar aula"
                    >
                      <Pencil className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                  {/* Bloqueio por Data de Liberação */}
                  {isAulaBloqueadaPorData(aula) && (
                    <div className="absolute inset-0 bg-black/35 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10">
                      <div className="text-center px-6">
                        <AlertCircle className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-cyan-200">Ainda não liberada</p>
                        <p className="text-xs text-white/70 mt-1">
                          Disponível em {formatarDataLiberacao(new Date(aula.dataLiberacao))}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          Faltam {formatarTempoRestante(new Date(aula.dataLiberacao))}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Capa da Aula */}
                  {aula.capa && (
                    <div className="w-full h-32 sm:h-40 relative overflow-hidden">
                      {aula.capa.tipo === 'imagem' && aula.capa.imagem ? (
                        <img 
                          src={aula.capa.imagem} 
                          alt={aula.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : aula.capa.tipo === 'cor' ? (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: aula.capa.cor || '#3b82f6' }}
                        >
                          <p className="text-lg sm:text-2xl font-bold text-white text-center px-4">{aula.capa.titulo}</p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold text-white">{aula.titulo}</h3>
                          <div className="flex gap-2 flex-wrap">
                            {aula.tipo === 'ao-vivo' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                <Zap className="h-3 w-3" />
                                Ao Vivo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                                <Video className="h-3 w-3" />
                                Gravada
                              </span>
                            )}
                            {aula.visibilidade === 'premium' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-semibold">
                                <Lock className="h-3 w-3" />
                                Premium
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                                <Globe className="h-3 w-3" />
                                Gratuita
                              </span>
                            )}
                          </div>
                        </div>
                        {aula.descricao && (
                          <div className="flex items-start gap-2 mb-2">
                            <p className="text-xs sm:text-sm text-white/70 line-clamp-2 flex-1">{aula.descricao}</p>
                            {aula.descricao && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDescricaoDialog({ titulo: aula.titulo, descricao: aula.descricao || '' })
                                }}
                                className="p-1 hover:bg-emerald-500/30 rounded transition-colors flex-shrink-0"
                                title="Ver descrição completa"
                              >
                                <Info className="h-4 w-4 text-emerald-400" />
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-white/50">
                          Postada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR')}
                          {aula.criadoEm !== aula.atualizadoEm && (
                            <> • Atualizada em {new Date(aula.atualizadoEm).toLocaleDateString('pt-BR')}</>
                          )}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          if (isAulaBloqueadaPorData(aula)) {
                            setBloqueioDialog({
                              titulo: aula.titulo,
                              mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                            })
                            return
                          }
                          router.push(`/aulas/${aula._id}`)
                        }}
                        className={`bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift ${
                          isAulaBloqueadaPorData(aula) ? 'opacity-70' : ''
                        }`}
                        size="sm"
                      >
                        Ver Aula
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {submodulosModulo.map(submodulo => {
                const aulaCount = countAulasSubmodulo(String(submodulo._id))
                return (
                  <div
                    key={String(submodulo._id)}
                    onClick={() => setSelectedSubmodulo(String(submodulo._id))}
                    className="backdrop-blur-md bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-6 hover:border-orange-500/60 hover:bg-orange-500/30 transition-all cursor-pointer shadow-xl shadow-orange-500/10 hover-lift group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-orange-200 transition-colors line-clamp-2">{submodulo.nome}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        {submodulo.descricao && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDescricaoDialog({ titulo: submodulo.nome, descricao: submodulo.descricao || '' })
                            }}
                            className="p-1 hover:bg-orange-500/30 rounded transition-colors"
                            title="Ver descrição completa"
                          >
                            <Info className="h-5 w-5 text-orange-400" />
                          </button>
                        )}
                        <ChevronRight className="h-6 w-6 text-orange-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    {submodulo.descricao && (
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">{submodulo.descricao}</p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-white/70 text-sm">Aulas</span>
                      <span className="text-2xl font-bold text-orange-300">{aulaCount}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Tela de Aulas
          <div>
            <div className="sticky top-16 sm:top-20 z-40 mb-6">
              <div className="inline-flex backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1">
                <Button
                  onClick={() => setSelectedSubmodulo(null)}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                  Voltar aos Submódulos
                </Button>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-8">Aulas</h2>
            {searchTerm && (
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Buscar por título ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {selectedSubmodulo && (
          <div className="space-y-4">
            {(() => {
              let aulasParaMostrar = aulasSubmodulo

              // Filtrar por busca
              if (searchTerm) {
                aulasParaMostrar = aulasParaMostrar.filter(a =>
                  a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
                )
              }

              return (
                <>
                  {aulasParaMostrar.length === 0 ? (
                    <div className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl p-12 text-center animate-fadeInUp">
                      <p className="text-white/60 text-lg">Nenhuma aula encontrada</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-white mb-6">Aulas ({aulasParaMostrar.length})</h3>
                      <div className="space-y-4">
                        {aulasParaMostrar.map((aula, idx) => (
              <div 
                key={String(aula._id)} 
                className="backdrop-blur-md bg-white/5 border border-emerald-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all shadow-xl shadow-emerald-500/5 animate-fadeInUp hover-lift relative"
                style={{animationDelay: `${idx * 0.1}s`}}
              >
                {(isAdmin || user?.secondaryRole === 'monitor') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/aulas/gerenciar/aulas/${aula._id}/editar`)
                    }}
                    className="absolute bottom-2 right-2 z-20 p-2 rounded-lg bg-black/30 border border-white/20 hover:bg-black/40 transition-colors"
                    title="Editar aula"
                  >
                    <Pencil className="h-3.5 w-3.5 text-white" />
                  </button>
                )}
                {/* Bloqueio por Data de Liberação */}
                {isAulaBloqueadaPorData(aula) && (
                  <div className="absolute inset-0 bg-black/35 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10">
                    <div className="text-center px-6">
                      <AlertCircle className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-cyan-200">Ainda não liberada</p>
                      <p className="text-xs text-white/70 mt-1">
                        Disponível em {formatarDataLiberacao(new Date(aula.dataLiberacao))}
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        Faltam {formatarTempoRestante(new Date(aula.dataLiberacao))}
                      </p>
                    </div>
                  </div>
                )}
                {/* Capa da Aula */}
                {aula.capa && (
                  <div className="w-full h-40 relative overflow-hidden">
                    {aula.capa.tipo === 'imagem' && aula.capa.imagem ? (
                      <img 
                        src={aula.capa.imagem} 
                        alt={aula.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : aula.capa.tipo === 'cor' ? (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: aula.capa.cor || '#3b82f6' }}
                      >
                        <p className="text-2xl font-bold text-white text-center px-4">{aula.capa.titulo}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">{aula.titulo}</h3>
                        <div className="flex gap-2 flex-wrap">
                          {aula.tipo === 'ao-vivo' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                              <Zap className="h-3 w-3" />
                              Ao Vivo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                              <Video className="h-3 w-3" />
                              Gravada
                            </span>
                          )}
                          {aula.visibilidade === 'premium' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-semibold">
                              <Lock className="h-3 w-3" />
                              Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                              <Globe className="h-3 w-3" />
                              Gratuita
                            </span>
                          )}
                        </div>
                      </div>
                      {aula.descricao && (
                        <p className="text-sm text-white/70 mb-2">{aula.descricao}</p>
                      )}
                      <p className="text-xs text-white/50">
                        Postada em {new Date(aula.criadoEm).toLocaleDateString('pt-BR')}
                        {aula.criadoEm !== aula.atualizadoEm && (
                          <> • Atualizada em {new Date(aula.atualizadoEm).toLocaleDateString('pt-BR')}</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (isAulaBloqueadaPorData(aula)) {
                          setBloqueioDialog({
                            titulo: aula.titulo,
                            mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                          })
                          return
                        }
                        router.push(`/aulas/${aula._id}`)
                      }}
                      className={`w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold transition-all duration-300 hover-lift flex items-center justify-center gap-2 text-sm sm:text-base ${
                        isAulaBloqueadaPorData(aula) ? 'opacity-70' : ''
                      }`}
                    >
                      Ver Aula
                    </button>
                  </div>
                </div>
              </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Dialog de Descrição */}
        {descricaoDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{descricaoDialog.titulo}</h2>
                <button
                  onClick={() => setDescricaoDialog(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{descricaoDialog.descricao}</p>
            </div>
          </div>
        )}

        {/* Dialog de Bloqueio */}
        {bloqueioDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-cyan-300 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{bloqueioDialog.titulo}</h2>
                  <p className="text-white/80 whitespace-pre-wrap leading-relaxed mt-2">{bloqueioDialog.mensagem}</p>
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => setBloqueioDialog(null)}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                      Entendi
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
