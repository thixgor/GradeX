'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Lock, Globe, Video, Zap, Search, ChevronRight, Info, BookOpen, AlertCircle, Pencil, Clock, History, X, Bell, Trash2 } from 'lucide-react'
import { RotatingAds } from '@/components/rotating-ads'
import { AppShell, useAppShell } from '@/components/app-shell'
import { LogoLoading } from '@/components/logo-loading'
import { useState as useStateDialog } from 'react'
import { AulaSetor, AulaTopic, AulaSubtopic, AulaModulo, AulaSubmodulo, AulaPostagem } from '@/lib/types'

function AulasPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Get user data from AppShell context (no extra /api/auth/me call!)
  const { user: contextUser, isAdmin } = useAppShell()

  // Map context user to local format
  const user = contextUser ? {
    id: contextUser.id,
    email: contextUser.email,
    name: contextUser.name,
    role: contextUser.role,
    secondaryRole: contextUser.secondaryRole,
    accountType: contextUser.accountType,
  } : null

  const [loading, setLoading] = useState(true)
  const [initialParamsLoaded, setInitialParamsLoaded] = useState(false)

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

  // Função para atualizar a URL com o estado atual
  const updateUrlParams = useCallback((params: {
    setor?: string | null
    topico?: string | null
    subtopico?: string | null
    modulo?: string | null
    submodulo?: string | null
  }) => {
    const urlParams = new URLSearchParams()
    if (params.setor) urlParams.set('setor', params.setor)
    if (params.topico) urlParams.set('topico', params.topico)
    if (params.subtopico) urlParams.set('subtopico', params.subtopico)
    if (params.modulo) urlParams.set('modulo', params.modulo)
    if (params.submodulo) urlParams.set('submodulo', params.submodulo)

    const queryString = urlParams.toString()
    const newUrl = queryString ? `/aulas?${queryString}` : '/aulas'
    window.history.replaceState(null, '', newUrl)
  }, [])

  // Função para gerar URL para navegação (para abrir em nova aba)
  const getNavigationUrl = useCallback((params: {
    setor?: string | null
    topico?: string | null
    subtopico?: string | null
    modulo?: string | null
    submodulo?: string | null
  }) => {
    const urlParams = new URLSearchParams()
    if (params.setor) urlParams.set('setor', params.setor)
    if (params.topico) urlParams.set('topico', params.topico)
    if (params.subtopico) urlParams.set('subtopico', params.subtopico)
    if (params.modulo) urlParams.set('modulo', params.modulo)
    if (params.submodulo) urlParams.set('submodulo', params.submodulo)

    const queryString = urlParams.toString()
    return queryString ? `/aulas?${queryString}` : '/aulas'
  }, [])

  // Carregar estado inicial dos parâmetros da URL
  useEffect(() => {
    if (initialParamsLoaded) return

    const setorParam = searchParams.get('setor')
    const topicoParam = searchParams.get('topico')
    const subtopicoParam = searchParams.get('subtopico')
    const moduloParam = searchParams.get('modulo')
    const submoduloParam = searchParams.get('submodulo')

    if (setorParam) setSelectedSetor(setorParam)
    if (topicoParam) setSelectedTopico(topicoParam)
    if (subtopicoParam) setSelectedSubtopico(subtopicoParam)
    if (moduloParam) setSelectedModulo(moduloParam)
    if (submoduloParam) setSelectedSubmodulo(submoduloParam)

    setInitialParamsLoaded(true)
  }, [searchParams, initialParamsLoaded])

  // Atualizar URL quando seleções mudam
  useEffect(() => {
    if (!initialParamsLoaded) return
    updateUrlParams({
      setor: selectedSetor,
      topico: selectedTopico,
      subtopico: selectedSubtopico,
      modulo: selectedModulo,
      submodulo: selectedSubmodulo
    })
  }, [selectedSetor, selectedTopico, selectedSubtopico, selectedModulo, selectedSubmodulo, updateUrlParams, initialParamsLoaded])

  // Dialog de descrição
  const [descricaoDialog, setDescricaoDialog] = useState<{ titulo: string; descricao: string } | null>(null)
  const [bloqueioDialog, setBloqueioDialog] = useState<{ titulo: string; mensagem: string } | null>(null)

  // Última aula visitada
  const [ultimaAula, setUltimaAula] = useState<{ aulaId: string; aulaTitulo: string; visitadaEm: Date } | null>(null)

  // Aviso do admin
  const [aviso, setAviso] = useState<{
    titulo: string
    mensagem: string
    tipo: 'info' | 'warning' | 'success' | 'error'
    criadoEm: Date
    criadoPorNome: string
  } | null>(null)
  const [avisoFechado, setAvisoFechado] = useState(false)

  // Dialog de editar aviso (admin)
  const [editarAvisoDialog, setEditarAvisoDialog] = useState(false)
  const [avisoForm, setAvisoForm] = useState<{ titulo: string; mensagem: string; tipo: 'info' | 'warning' | 'success' | 'error' }>({ titulo: '', mensagem: '', tipo: 'info' })
  const [salvandoAviso, setSalvandoAviso] = useState(false)

  // Load data when component mounts (user already available from AppShell context)
  useEffect(() => {
    if (user) {
      loadAulas()
      loadUltimaAula()
      loadAviso()
      setLoading(false)
    }
  }, [user?.id])

  // REMOVED: checkAuth - now using AppShell context (no extra /api/auth/me call!)
  // REMOVED: Aggressive 5-second polling was destroying serverless quota

  async function loadUltimaAula() {
    try {
      const res = await fetch('/api/user/ultima-aula')
      if (res.ok) {
        const data = await res.json()
        if (data.ultimaAula) {
          setUltimaAula({
            aulaId: data.ultimaAula.aulaId,
            aulaTitulo: data.ultimaAula.aulaTitulo,
            visitadaEm: new Date(data.ultimaAula.visitadaEm)
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar última aula:', error)
    }
  }

  async function loadAviso() {
    try {
      const res = await fetch('/api/aulas/avisos')
      if (res.ok) {
        const data = await res.json()
        if (data.aviso) {
          setAviso({
            titulo: data.aviso.titulo,
            mensagem: data.aviso.mensagem,
            tipo: data.aviso.tipo,
            criadoEm: new Date(data.aviso.criadoEm),
            criadoPorNome: data.aviso.criadoPorNome
          })
          setAvisoForm({
            titulo: data.aviso.titulo,
            mensagem: data.aviso.mensagem,
            tipo: data.aviso.tipo
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar aviso:', error)
    }
  }

  async function salvarAviso() {
    setSalvandoAviso(true)
    try {
      const res = await fetch('/api/aulas/avisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(avisoForm)
      })
      if (res.ok) {
        loadAviso()
        setEditarAvisoDialog(false)
      }
    } catch (error) {
      console.error('Erro ao salvar aviso:', error)
    } finally {
      setSalvandoAviso(false)
    }
  }

  async function excluirAviso() {
    try {
      const res = await fetch('/api/aulas/avisos', { method: 'DELETE' })
      if (res.ok) {
        setAviso(null)
        setAvisoForm({ titulo: '', mensagem: '', tipo: 'info' })
        setEditarAvisoDialog(false)
      }
    } catch (error) {
      console.error('Erro ao excluir aviso:', error)
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
    return <LogoLoading message="Carregando aulas..." size="lg" />
  }

  return (
    <>
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

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Aviso do Admin */}
        {aviso && !avisoFechado && (
          <div className="relative z-40 px-3 sm:px-4 pt-4">
            <div className={`relative backdrop-blur-md rounded-2xl p-4 sm:p-6 border-2 ${aviso.tipo === 'info' ? 'bg-blue-500/20 border-blue-400/50' :
              aviso.tipo === 'warning' ? 'bg-yellow-500/20 border-yellow-400/50' :
                aviso.tipo === 'success' ? 'bg-emerald-500/20 border-emerald-400/50' :
                  'bg-red-500/20 border-red-400/50'
              }`}>
              <button
                onClick={() => setAvisoFechado(true)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
              <div className="flex items-start gap-3">
                <Bell className={`h-6 w-6 flex-shrink-0 ${aviso.tipo === 'info' ? 'text-blue-400' :
                  aviso.tipo === 'warning' ? 'text-yellow-400' :
                    aviso.tipo === 'success' ? 'text-emerald-400' :
                      'text-red-400'
                  }`} />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{aviso.titulo}</h3>
                  <div
                    className="text-white/80 mt-1 prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: aviso.mensagem }}
                  />
                  <p className="text-xs text-white/50 mt-2">
                    Por {aviso.criadoPorNome} • {aviso.criadoEm.toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setEditarAvisoDialog(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    onClick={excluirAviso}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin/Monitor Manage Button */}
        <div className="relative z-40 px-3 sm:px-4 pt-4 flex flex-wrap gap-2 sm:gap-3 justify-end">
          {(isAdmin || user?.secondaryRole === 'monitor') && (
            <Button
              onClick={() => router.push('/aulas/gerenciar')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Gerenciar Aulas
            </Button>
          )}

          {/* Admin: Criar/Editar Aviso */}
          {isAdmin && !aviso && (
            <Button
              onClick={() => setEditarAvisoDialog(true)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              size="sm"
            >
              <Bell className="h-4 w-4 mr-2" />
              Criar Aviso
            </Button>
          )}

          {/* Admin: Link para gerenciar anúncios */}
          {isAdmin && (
            <Button
              onClick={() => router.push('/admin/anuncios')}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              size="sm"
            >
              <Info className="h-4 w-4 mr-2" />
              Anúncios
            </Button>
          )}
        </div>



        {/* Main Content */}
        <main className="relative z-30 container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
          {/* Navegação em Cascata com Cards */}
          {!selectedSetor ? (
            // Tela de Setores
            <div>
              {/* Botão Continuar Última Aula */}
              {ultimaAula && (
                <div className="mb-6 animate-slideInLeft">
                  <Link
                    href={`/aulas/${ultimaAula.aulaId}`}
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#E2A43E] via-orange-500 to-[#E2A43E] hover:via-orange-600 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 backdrop-blur-md border-2 border-orange-400/50"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="relative">
                        <Video className="h-6 w-6" />
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-xs font-medium text-orange-100 mb-0.5 whitespace-nowrap">CONTINUAR AULA</span>
                      <span className="font-semibold">
                        {ultimaAula.aulaTitulo.length > 37
                          ? `${ultimaAula.aulaTitulo.substring(0, 37)}...`
                          : ultimaAula.aulaTitulo}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-orange-200 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </Link>
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
                Setores de Ensino
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Aulas sem setor - renderizadas como cards */}
                {aulasSemSetor.map((aula, idx) => (
                  <div
                    key={String(aula._id)}
                    className={`backdrop-blur-md rounded-2xl overflow-hidden transition-all animate-fadeInUp hover-lift relative ${aula.visibilidade === 'premium'
                      ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-2 border-yellow-500/40 shadow-xl shadow-yellow-500/20 hover:border-yellow-500/60 hover:shadow-yellow-500/30'
                      : 'bg-white/5 border border-emerald-500/20 shadow-xl shadow-emerald-500/5 hover:border-emerald-500/40'
                      }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
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
                          <AlertCircle className="h-8 w-8 text-[#468152] mx-auto mb-2" />
                          <p className="text-sm font-semibold text-[#468152]/80">Ainda não liberada</p>
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
                            <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2">{aula.titulo}</h3>
                            <div className="flex gap-2 flex-wrap">
                              {aula.tipo === 'ao-vivo' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                  <Zap className="h-3 w-3" />
                                  Ao Vivo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#468152]/20 text-[#468152] border border-[#468152]/30 text-xs font-semibold">
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
                        {isAulaBloqueadaPorData(aula) ? (
                          <Button
                            onClick={() => {
                              setBloqueioDialog({
                                titulo: aula.titulo,
                                mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                              })
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift opacity-70"
                            size="sm"
                          >
                            Ver Aula
                          </Button>
                        ) : (
                          <Link
                            href={`/aulas/${aula._id}`}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift"
                          >
                            Ver Aula
                          </Link>
                        )}
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
                      <Link
                        key={String(setor._id)}
                        href={getNavigationUrl({ setor: String(setor._id) })}
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedSetor(String(setor._id))
                          setSelectedTopico(null)
                          setSelectedSubtopico(null)
                          setSelectedModulo(null)
                          setSelectedSubmodulo(null)
                        }}
                        className="backdrop-blur-md bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/60 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-xl shadow-emerald-500/10 hover-lift group block"
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
                      </Link>
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
                        style={{ animationDelay: `${idx * 0.1}s` }}
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
                              <AlertCircle className="h-8 w-8 text-[#468152] mx-auto mb-2" />
                              <p className="text-sm font-semibold text-[#468152]/80">Ainda não liberada</p>
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
                                <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2">{aula.titulo}</h3>
                                <div className="flex gap-2 flex-wrap">
                                  {aula.tipo === 'ao-vivo' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                      <Zap className="h-3 w-3" />
                                      Ao Vivo
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#468152]/20 text-[#468152] border border-[#468152]/30 text-xs font-semibold">
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
                            {isAulaBloqueadaPorData(aula) ? (
                              <Button
                                onClick={() => {
                                  setBloqueioDialog({
                                    titulo: aula.titulo,
                                    mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                                  })
                                }}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift opacity-70"
                                size="sm"
                              >
                                Ver Aula
                              </Button>
                            ) : (
                              <Link
                                href={`/aulas/${aula._id}`}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift"
                              >
                                Ver Aula
                              </Link>
                            )}
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
                        <Link
                          key={String(topico._id)}
                          href={getNavigationUrl({ setor: selectedSetor, topico: String(topico._id) })}
                          onClick={(e) => {
                            e.preventDefault()
                            setSelectedTopico(String(topico._id))
                            setSelectedSubtopico(null)
                            setSelectedModulo(null)
                            setSelectedSubmodulo(null)
                          }}
                          className="backdrop-blur-md bg-gradient-to-br from-[#468152]/20 to-[#E2A43E]/20 border border-[#468152]/30 rounded-2xl p-6 hover:border-[#468152]/60 hover:bg-[#468152]/30 transition-all cursor-pointer shadow-xl shadow-[#468152]/10 hover-lift group block"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white group-hover:text-[#468152]/80 transition-colors line-clamp-2">{topico.nome}</h3>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 ml-2">
                              {topico.descricao && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    setDescricaoDialog({ titulo: topico.nome, descricao: topico.descricao || '' })
                                  }}
                                  className="p-1 hover:bg-[#468152]/30 rounded transition-colors"
                                  title="Ver descrição completa"
                                >
                                  <Info className="h-5 w-5 text-[#468152]" />
                                </button>
                              )}
                              <ChevronRight className="h-6 w-6 text-[#468152] group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                          {topico.descricao && (
                            <p className="text-white/60 text-sm mb-4 line-clamp-2">{topico.descricao}</p>
                          )}
                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <span className="text-white/70 text-sm">Aulas</span>
                            <span className="text-2xl font-bold text-[#468152]">{aulaCount}</span>
                          </div>
                        </Link>
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
                        style={{ animationDelay: `${idx * 0.1}s` }}
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
                              <AlertCircle className="h-8 w-8 text-[#468152] mx-auto mb-2" />
                              <p className="text-sm font-semibold text-[#468152]/80">Ainda não liberada</p>
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
                                <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2">{aula.titulo}</h3>
                                <div className="flex gap-2 flex-wrap">
                                  {aula.tipo === 'ao-vivo' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                      <Zap className="h-3 w-3" />
                                      Ao Vivo
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#468152]/20 text-[#468152] border border-[#468152]/30 text-xs font-semibold">
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
                            {isAulaBloqueadaPorData(aula) ? (
                              <Button
                                onClick={() => {
                                  setBloqueioDialog({
                                    titulo: aula.titulo,
                                    mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                                  })
                                }}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift opacity-70"
                                size="sm"
                              >
                                Ver Aula
                              </Button>
                            ) : (
                              <Link
                                href={`/aulas/${aula._id}`}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift"
                              >
                                Ver Aula
                              </Link>
                            )}
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
                        <Link
                          key={String(subtopico._id)}
                          href={getNavigationUrl({ setor: selectedSetor, topico: selectedTopico, subtopico: String(subtopico._id) })}
                          onClick={(e) => {
                            e.preventDefault()
                            setSelectedSubtopico(String(subtopico._id))
                            setSelectedModulo(null)
                            setSelectedSubmodulo(null)
                          }}
                          className="backdrop-blur-md bg-gradient-to-br from-[#468152]/20 to-[#E2A43E]/20 border border-[#468152]/30 rounded-2xl p-6 hover:border-[#468152]/60 hover:bg-[#468152]/30 transition-all cursor-pointer shadow-xl shadow-[#468152]/10 hover-lift group block"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white group-hover:text-[#468152]/80 transition-colors line-clamp-2">{subtopico.nome}</h3>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 ml-2">
                              {subtopico.descricao && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    setDescricaoDialog({ titulo: subtopico.nome, descricao: subtopico.descricao || '' })
                                  }}
                                  className="p-1 hover:bg-[#468152]/30 rounded transition-colors"
                                  title="Ver descrição completa"
                                >
                                  <Info className="h-5 w-5 text-[#E2A43E]" />
                                </button>
                              )}
                              <ChevronRight className="h-6 w-6 text-[#E2A43E] group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                          {subtopico.descricao && (
                            <p className="text-white/60 text-sm mb-4 line-clamp-2">{subtopico.descricao}</p>
                          )}
                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <span className="text-white/70 text-sm">Aulas</span>
                            <span className="text-2xl font-bold text-[#468152]">{aulaCount}</span>
                          </div>
                        </Link>
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
                    style={{ animationDelay: `${idx * 0.1}s` }}
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
                          <AlertCircle className="h-8 w-8 text-[#468152] mx-auto mb-2" />
                          <p className="text-sm font-semibold text-[#468152]/80">Ainda não liberada</p>
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
                            <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2">{aula.titulo}</h3>
                            <div className="flex gap-2 flex-wrap">
                              {aula.tipo === 'ao-vivo' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                  <Zap className="h-3 w-3" />
                                  Ao Vivo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#468152]/20 text-[#468152] border border-[#468152]/30 text-xs font-semibold">
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
                        {isAulaBloqueadaPorData(aula) ? (
                          <Button
                            onClick={() => {
                              setBloqueioDialog({
                                titulo: aula.titulo,
                                mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                              })
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift opacity-70"
                            size="sm"
                          >
                            Ver Aula
                          </Button>
                        ) : (
                          <Link
                            href={`/aulas/${aula._id}`}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift"
                          >
                            Ver Aula
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {modulosSubtopico.map(modulo => {
                  const aulaCount = countAulasModulo(String(modulo._id))
                  return (
                    <Link
                      key={String(modulo._id)}
                      href={getNavigationUrl({ setor: selectedSetor, topico: selectedTopico, subtopico: selectedSubtopico, modulo: String(modulo._id) })}
                      onClick={(e) => {
                        e.preventDefault()
                        setSelectedModulo(String(modulo._id))
                        setSelectedSubmodulo(null)
                      }}
                      className="backdrop-blur-md bg-gradient-to-br from-[#E2A43E]/20 to-[#468152]/20 border border-[#E2A43E]/30 rounded-2xl p-6 hover:border-[#E2A43E]/60 hover:bg-[#E2A43E]/30 transition-all cursor-pointer shadow-xl shadow-[#E2A43E]/10 hover-lift group block"
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
                                e.preventDefault()
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
                    </Link>
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
                    style={{ animationDelay: `${idx * 0.1}s` }}
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
                          <AlertCircle className="h-8 w-8 text-[#468152] mx-auto mb-2" />
                          <p className="text-sm font-semibold text-[#468152]/80">Ainda não liberada</p>
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
                            <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2">{aula.titulo}</h3>
                            <div className="flex gap-2 flex-wrap">
                              {aula.tipo === 'ao-vivo' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold animate-glowPulse">
                                  <Zap className="h-3 w-3" />
                                  Ao Vivo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#468152]/20 text-[#468152] border border-[#468152]/30 text-xs font-semibold">
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
                        {isAulaBloqueadaPorData(aula) ? (
                          <Button
                            onClick={() => {
                              setBloqueioDialog({
                                titulo: aula.titulo,
                                mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                              })
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift opacity-70"
                            size="sm"
                          >
                            Ver Aula
                          </Button>
                        ) : (
                          <Link
                            href={`/aulas/${aula._id}`}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-300 hover-lift"
                          >
                            Ver Aula
                          </Link>
                        )}
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
                              style={{ animationDelay: `${idx * 0.1}s` }}
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
                                    <AlertCircle className="h-8 w-8 text-[#468152] mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-[#468152]/80">Ainda não liberada</p>
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
                                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#468152]/20 text-[#468152] border border-[#468152]/30 text-xs font-semibold">
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
                                  {isAulaBloqueadaPorData(aula) ? (
                                    <button
                                      onClick={() => {
                                        setBloqueioDialog({
                                          titulo: aula.titulo,
                                          mensagem: `Esta aula será liberada em ${formatarDataLiberacao(new Date(aula.dataLiberacao))}.\n\nVocê pode ver a aula na lista, mas não pode acessá-la antes do lançamento.`
                                        })
                                      }}
                                      className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold transition-all duration-300 hover-lift flex items-center justify-center gap-2 text-sm sm:text-base opacity-70"
                                    >
                                      Ver Aula
                                    </button>
                                  ) : (
                                    <Link
                                      href={`/aulas/${aula._id}`}
                                      className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold transition-all duration-300 hover-lift flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                      Ver Aula
                                    </Link>
                                  )}
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
                  <AlertCircle className="h-6 w-6 text-[#468152] mt-0.5" />
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

          {/* Dialog de Editar/Criar Aviso (Admin) */}
          {editarAvisoDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="backdrop-blur-md bg-slate-800/95 border border-white/20 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#E2A43E]" />
                    {aviso ? 'Editar Aviso' : 'Criar Aviso'}
                  </h2>
                  <button
                    onClick={() => setEditarAvisoDialog(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Título</label>
                    <input
                      type="text"
                      value={avisoForm.titulo}
                      onChange={(e) => setAvisoForm({ ...avisoForm, titulo: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40"
                      placeholder="Título do aviso"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Mensagem (HTML permitido)</label>
                    <textarea
                      value={avisoForm.mensagem}
                      onChange={(e) => setAvisoForm({ ...avisoForm, mensagem: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 min-h-[100px]"
                      placeholder="Mensagem do aviso..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Tipo</label>
                    <div className="flex flex-wrap gap-2">
                      {(['info', 'warning', 'success', 'error'] as const).map((tipo) => (
                        <button
                          key={tipo}
                          onClick={() => setAvisoForm({ ...avisoForm, tipo })}
                          className={`px-3 py-1.5 rounded-lg border transition-all ${avisoForm.tipo === tipo
                            ? tipo === 'info' ? 'bg-blue-500/30 border-blue-400 text-blue-300' :
                              tipo === 'warning' ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300' :
                                tipo === 'success' ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300' :
                                  'bg-red-500/30 border-red-400 text-red-300'
                            : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
                            }`}
                        >
                          {tipo === 'info' ? 'Informação' :
                            tipo === 'warning' ? 'Atenção' :
                              tipo === 'success' ? 'Sucesso' : 'Erro'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={salvarAviso}
                    disabled={salvandoAviso || !avisoForm.titulo || !avisoForm.mensagem}
                    className="flex-1 bg-gradient-to-r from-[#468152] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                  >
                    {salvandoAviso ? 'Salvando...' : 'Salvar Aviso'}
                  </Button>
                  <Button
                    onClick={() => setEditarAvisoDialog(false)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Anúncios Rotativos (parte inferior) */}
          <div className="mt-8 px-3 sm:px-4 pb-6">
            <RotatingAds maxHeight="180px" className="rounded-2xl overflow-hidden" />
          </div>
        </main>
      </div>
    </>
  )
}

// Wrapper com Suspense para usar useSearchParams
export default function AulasPage() {
  return (
    <Suspense fallback={<LogoLoading message="Iniciando módulo de aulas..." size="lg" fullscreen />}>
      <AppShell headerTitle="Aulas" headerSubtitle="Aprenda com aulas ao-vivo e gravadas">
        <AulasPageContent />
      </AppShell>
    </Suspense>
  )
}
