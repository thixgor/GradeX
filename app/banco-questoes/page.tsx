'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { GlassGlow } from '@/components/glass-glow'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Database,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Lock,
  Loader2,
  ListFilter,
  BarChart3,
  Plus,
  Shuffle,
  List,
  Sparkles,
  Target,
  Zap,
  GraduationCap,
  AlertTriangle,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { PageLoading } from '@/components/page-loading'
import {
  BancoPeriodoComContagem,
  BancoModuloComContagem,
  BancoTopicoComContagem,
  BancoSubtopicoComContagem,
  BancoQuestaoComHierarquia,
  BancoQuestoesFiltros,
  BancoPaginacao,
  BancoListaUsuario,
  BancoDificuldade,
  BancoQuestaoTipo,
  BancoModoResposta
} from '@/lib/types/banco-questoes'

interface ListaComContagem extends BancoListaUsuario {
  totalQuestoes?: number
}

export default function BancoQuestoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requiresPremium, setRequiresPremium] = useState(false)
  const [accountType, setAccountType] = useState<'gratuito' | 'trial' | 'premium' | 'admin'>('gratuito')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')

  // Seletor de período para usuários gratuitos
  const [showPeriodSelector, setShowPeriodSelector] = useState(false)
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('')
  const [periodoError, setPeriodoError] = useState('')
  const [loadingPeriodo, setLoadingPeriodo] = useState(false)

  // Dados de hierarquia
  const [periodos, setPeriodos] = useState<BancoPeriodoComContagem[]>([])
  const [modulos, setModulos] = useState<BancoModuloComContagem[]>([])
  const [topicos, setTopicos] = useState<BancoTopicoComContagem[]>([])
  const [subtopicos, setSubtopicos] = useState<BancoSubtopicoComContagem[]>([])

  // Filtros
  const [filtros, setFiltros] = useState<BancoQuestoesFiltros>({})
  const [busca, setBusca] = useState('')

  // Questões
  const [questoes, setQuestoes] = useState<BancoQuestaoComHierarquia[]>([])
  const [paginacao, setPaginacao] = useState<BancoPaginacao | null>(null)
  const [loadingQuestoes, setLoadingQuestoes] = useState(false)

  // Estatísticas
  const [estatisticas, setEstatisticas] = useState<{
    totalResolvidas: number
    percentualAcerto: number
  } | null>(null)

  // Listas do usuário
  const [listas, setListas] = useState<ListaComContagem[]>([])

  // Modal de adicionar à lista
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [selectedQuestaoId, setSelectedQuestaoId] = useState<string | null>(null)
  const [novaListaNome, setNovaListaNome] = useState('')
  const [addingToList, setAddingToList] = useState(false)

  // Modal de lista aleatória
  const [showRandomListModal, setShowRandomListModal] = useState(false)
  const [randomListForm, setRandomListForm] = useState({
    nome: '',
    quantidade: 10,
    periodoId: '',
    moduloId: '',
    topicoId: '',
    subtopicoId: '',
    tipo: '' as BancoQuestaoTipo | '',
    dificuldade: '' as BancoDificuldade | '',
    ano: '' as string,
    modoResposta: 'imediato' as BancoModoResposta
  })
  const [creatingRandomList, setCreatingRandomList] = useState(false)

  // Filtros UI state
  const [filtersOpen, setFiltersOpen] = useState(true)

  // Hierarquia para modal de lista aleatória
  const [randomModulos, setRandomModulos] = useState<BancoModuloComContagem[]>([])
  const [randomTopicos, setRandomTopicos] = useState<BancoTopicoComContagem[]>([])
  const [randomSubtopicos, setRandomSubtopicos] = useState<BancoSubtopicoComContagem[]>([])

  useEffect(() => {
    loadInitialData()
    loadListas()
  }, [])

  useEffect(() => {
    if (!requiresPremium) {
      loadQuestoes()
    }
  }, [filtros])

  useEffect(() => {
    if (filtros.periodoId) {
      loadModulos(filtros.periodoId)
    } else {
      setModulos([])
      setTopicos([])
      setSubtopicos([])
    }
  }, [filtros.periodoId])

  useEffect(() => {
    if (filtros.moduloId) {
      loadTopicos(filtros.moduloId)
    } else {
      setTopicos([])
      setSubtopicos([])
    }
  }, [filtros.moduloId])

  useEffect(() => {
    if (filtros.topicoId) {
      loadSubtopicos(filtros.topicoId)
    } else {
      setSubtopicos([])
    }
  }, [filtros.topicoId])

  // Hierarquia para modal aleatório
  useEffect(() => {
    if (randomListForm.periodoId) {
      loadRandomModulos(randomListForm.periodoId)
    } else {
      setRandomModulos([])
      setRandomTopicos([])
      setRandomSubtopicos([])
    }
  }, [randomListForm.periodoId])

  useEffect(() => {
    if (randomListForm.moduloId) {
      loadRandomTopicos(randomListForm.moduloId)
    } else {
      setRandomTopicos([])
      setRandomSubtopicos([])
    }
  }, [randomListForm.moduloId])

  useEffect(() => {
    if (randomListForm.topicoId) {
      loadRandomSubtopicos(randomListForm.topicoId)
    } else {
      setRandomSubtopicos([])
    }
  }, [randomListForm.topicoId])

  async function loadInitialData() {
    try {
      // Carregar tipo de conta primeiro
      const authRes = await fetch('/api/auth/me')
      let currentUserRole: 'admin' | 'user' = 'user'
      let currentAccountType: 'gratuito' | 'trial' | 'premium' | 'admin' = 'gratuito'

      if (authRes.ok) {
        const authData = await authRes.json()
        currentUserRole = authData.user?.role || 'user'
        currentAccountType = authData.user?.accountType || 'gratuito'
        setAccountType(currentAccountType)
        setUserRole(currentUserRole)
      }

      const res = await fetch('/api/banco/periodos')
      if (res.status === 403) {
        const data = await res.json()
        if (data.requiresPremium) {
          setRequiresPremium(true)
          setLoading(false)
          return
        }
      }
      if (res.ok) {
        const data = await res.json()
        setPeriodos(data.periodos)

        // Se for usuário gratuito E não for admin, verificar se já tem período selecionado
        // IMPORTANTE: Usar variáveis locais, não o estado (que não atualizou ainda)
        const isFreeUser = currentUserRole !== 'admin' &&
          currentAccountType !== 'premium' &&
          currentAccountType !== 'trial'

        if (isFreeUser) {
          // Verificar se já tem período salvo no localStorage
          const savedPeriodo = localStorage.getItem('banco-questoes-periodo')
          if (savedPeriodo) {
            // Carregar as 5 questões do período salvo
            setSelectedPeriodo(savedPeriodo)
            setShowPeriodSelector(false)

            // Carregar questões do período salvo (API irá retornar as 5 questões fixas)
            const params = new URLSearchParams()
            params.set('periodoId', savedPeriodo)

            const questoesRes = await fetch(`/api/banco/questoes?${params.toString()}`)
            if (questoesRes.ok) {
              const questoesData = await questoesRes.json()
              setQuestoes(questoesData.questoes || [])
              setFiltros({ periodoId: savedPeriodo })
            }
          } else {
            // Mostrar seletor de período
            setShowPeriodSelector(true)
          }
          setLoading(false)
          return
        }
      }

      // Carregar estatísticas
      const statsRes = await fetch('/api/banco/estatisticas')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setEstatisticas({
          totalResolvidas: statsData.estatisticas.totalResolvidas,
          percentualAcerto: statsData.estatisticas.percentualAcerto
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadListas() {
    try {
      const res = await fetch('/api/banco/listas')
      if (res.ok) {
        const data = await res.json()
        setListas(data.listas)
      }
    } catch (error) {
      console.error('Erro ao carregar listas:', error)
    }
  }

  async function loadModulos(periodoId: string) {
    try {
      const res = await fetch(`/api/banco/modulos?periodoId=${periodoId}`)
      if (res.ok) {
        const data = await res.json()
        setModulos(data.modulos)
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error)
    }
  }

  async function loadTopicos(moduloId: string) {
    try {
      const res = await fetch(`/api/banco/topicos?moduloId=${moduloId}`)
      if (res.ok) {
        const data = await res.json()
        setTopicos(data.topicos)
      }
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error)
    }
  }

  async function loadSubtopicos(topicoId: string) {
    try {
      const res = await fetch(`/api/banco/subtopicos?topicoId=${topicoId}`)
      if (res.ok) {
        const data = await res.json()
        setSubtopicos(data.subtopicos)
      }
    } catch (error) {
      console.error('Erro ao carregar subtópicos:', error)
    }
  }

  async function loadRandomModulos(periodoId: string) {
    try {
      const res = await fetch(`/api/banco/modulos?periodoId=${periodoId}`)
      if (res.ok) {
        const data = await res.json()
        setRandomModulos(data.modulos)
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error)
    }
  }

  async function loadRandomTopicos(moduloId: string) {
    try {
      const res = await fetch(`/api/banco/topicos?moduloId=${moduloId}`)
      if (res.ok) {
        const data = await res.json()
        setRandomTopicos(data.topicos)
      }
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error)
    }
  }

  async function loadRandomSubtopicos(topicoId: string) {
    try {
      const res = await fetch(`/api/banco/subtopicos?topicoId=${topicoId}`)
      if (res.ok) {
        const data = await res.json()
        setRandomSubtopicos(data.subtopicos)
      }
    } catch (error) {
      console.error('Erro ao carregar subtópicos:', error)
    }
  }

  // Função para selecionar período e carregar 5 questões para usuários gratuitos
  async function handleSelectPeriodo(periodoId: string) {
    setSelectedPeriodo(periodoId)
    setLoadingPeriodo(true)
    setPeriodoError('')

    try {
      // A API irá retornar as 5 questões fixas para este período
      const params = new URLSearchParams()
      params.set('periodoId', periodoId)

      const res = await fetch(`/api/banco/questoes?${params.toString()}`)

      if (!res.ok) {
        const error = await res.json()
        setPeriodoError(`Erro ao carregar questões: ${error.error}`)
        setLoadingPeriodo(false)
        return
      }

      const data = await res.json()

      if (data.questoes.length < 5) {
        setPeriodoError(`Desculpe, ainda não temos 5 questões suficientes para este período. Por favor, selecione outro período.`)
        setLoadingPeriodo(false)
        return
      }

      // Salvar periodo no localStorage
      localStorage.setItem('banco-questoes-periodo', periodoId)

      // Carregar as 5 questoes (a API já atribuiu as questões permanentemente ao usuário)
      setQuestoes(data.questoes)
      setFiltros({ periodoId })
      setShowPeriodSelector(false)
      setLoadingPeriodo(false)
    } catch (error) {
      console.error('Erro ao selecionar período:', error)
      setPeriodoError('Erro ao carregar questões. Tente novamente.')
      setLoadingPeriodo(false)
    }
  }

  async function loadQuestoes(page = 1) {
    setLoadingQuestoes(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')

      if (filtros.periodoId) params.set('periodoId', filtros.periodoId)
      if (filtros.moduloId) params.set('moduloId', filtros.moduloId)
      if (filtros.topicoId) params.set('topicoId', filtros.topicoId)
      if (filtros.subtopicoId) params.set('subtopicoId', filtros.subtopicoId)
      if (filtros.tipo) params.set('tipo', filtros.tipo)
      if (filtros.dificuldade) params.set('dificuldade', filtros.dificuldade)
      if (filtros.apenasNaoResolvidas) params.set('apenasNaoResolvidas', 'true')
      if (busca) params.set('busca', busca)

      const res = await fetch(`/api/banco/questoes?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setQuestoes(data.questoes)
        setPaginacao(data.paginacao)
      }
    } catch (error) {
      console.error('Erro ao carregar questões:', error)
    } finally {
      setLoadingQuestoes(false)
    }
  }

  function handleSearch() {
    setFiltros(prev => ({ ...prev, busca }))
    loadQuestoes(1)
  }

  function clearFilters() {
    setFiltros({})
    setBusca('')
  }

  function openAddToListModal(questaoId: string) {
    setSelectedQuestaoId(questaoId)
    setShowAddToListModal(true)
    setNovaListaNome('')
  }

  async function handleAddToList(listaId: string) {
    if (!selectedQuestaoId) return

    setAddingToList(true)
    try {
      const res = await fetch(`/api/banco/listas/${listaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addQuestaoId: selectedQuestaoId
        })
      })

      if (res.ok) {
        setShowAddToListModal(false)
        loadListas()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao adicionar à lista')
      }
    } catch (error) {
      console.error('Erro ao adicionar à lista:', error)
    } finally {
      setAddingToList(false)
    }
  }

  async function handleCreateListAndAdd() {
    if (!selectedQuestaoId || !novaListaNome.trim()) return

    setAddingToList(true)
    try {
      const res = await fetch('/api/banco/listas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novaListaNome.trim(),
          questaoIds: [selectedQuestaoId],
          modoResposta: 'imediato'
        })
      })

      if (res.ok) {
        setShowAddToListModal(false)
        loadListas()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao criar lista')
      }
    } catch (error) {
      console.error('Erro ao criar lista:', error)
    } finally {
      setAddingToList(false)
    }
  }

  async function handleCreateRandomList() {
    if (!randomListForm.nome.trim()) {
      alert('Nome da lista é obrigatório')
      return
    }

    setCreatingRandomList(true)
    try {
      const res = await fetch('/api/banco/listas/aleatorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: randomListForm.nome.trim(),
          quantidade: randomListForm.quantidade,
          periodoId: randomListForm.periodoId || undefined,
          moduloId: randomListForm.moduloId || undefined,
          topicoId: randomListForm.topicoId || undefined,
          subtopicoId: randomListForm.subtopicoId || undefined,
          tipo: randomListForm.tipo || undefined,
          dificuldade: randomListForm.dificuldade || undefined,
          ano: randomListForm.ano ? parseInt(randomListForm.ano) : undefined,
          modoResposta: randomListForm.modoResposta
        })
      })

      if (res.ok) {
        const data = await res.json()
        setShowRandomListModal(false)
        loadListas()
        // Navegar para a lista criada
        router.push(`/banco-questoes/listas/${data.lista._id}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao criar lista')
      }
    } catch (error) {
      console.error('Erro ao criar lista aleatória:', error)
    } finally {
      setCreatingRandomList(false)
    }
  }

  if (loading) {
    return (
      <AppShell headerTitle="Banco de Questoes">
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="h-12 w-64 rounded-xl skeleton-pulse" />
            <div className="grid gap-3 md:grid-cols-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl skeleton-pulse" />)}
            </div>
            <div className="h-64 rounded-2xl skeleton-pulse" />
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl skeleton-pulse" />)}
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  // Modal de seletor de periodo para usuarios gratuitos
  if (showPeriodSelector) {
    return (
      <AppShell headerTitle="Banco de Questoes">
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
          <div className="mx-auto w-full max-w-2xl px-4 py-12">
            <div className="glass-page-card rounded-2xl overflow-hidden">
              <div className="p-8 text-center space-y-4">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#468152]/20 to-[#E2A43E]/20">
                  <GraduationCap className="h-8 w-8 text-[#468152]" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Banco de Questoes Gratuito</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  No plano Gratuito, voce pode ver 5 questoes por periodo.
                  Selecione o periodo do AFYA que voce esta cursando:
                </p>
              </div>
              <div className="p-8 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="periodo-select" className="text-base font-semibold">
                    Qual periodo voce esta?
                  </Label>
                  <Select
                    value={selectedPeriodo}
                    onValueChange={handleSelectPeriodo}
                    disabled={loadingPeriodo}
                  >
                    <SelectTrigger id="periodo-select" className="h-12 text-base rounded-xl">
                      <SelectValue placeholder="Selecione seu periodo (1 ao 5)" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.filter(p => p.nome.includes('°') || p.nome.includes('º')).map((periodo) => (
                        <SelectItem key={periodo._id?.toString()} value={periodo._id?.toString() || ''}>
                          {periodo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {periodoError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{periodoError}</AlertDescription>
                  </Alert>
                )}

                {loadingPeriodo && (
                  <PageLoading variant="minimal" message="Carregando questoes..." />
                )}

                <div className="space-y-3 pt-4">
                  <div className="glass-stat rounded-xl p-4 flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-[#E2A43E] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Sabe que voce pode ter mais?</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Faca upgrade para Premium e tenha acesso a mais de 1.000 questoes de Medicina,
                        com filtros avancados e criacao de listas personalizadas!
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push('/buy')}
                    className="w-full btn-brand-glow text-white rounded-xl"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Fazer Upgrade para Premium
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (requiresPremium) {
    return (
      <AppShell headerTitle="Banco de Questoes">
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
          <div className="mx-auto w-full max-w-2xl px-4 py-12">
            <div className="glass-page-card rounded-2xl overflow-hidden text-center">
              <div className="p-8 space-y-4">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                  <Lock className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Acesso Premium</h2>
                <p className="text-sm text-muted-foreground">
                  O Banco de Questoes e exclusivo para assinantes Premium
                </p>
              </div>
              <div className="p-8 pt-0 space-y-6">
                <div className="space-y-3 text-left glass-stat rounded-xl p-5">
                  {[
                    '1.000+ questoes de Medicina',
                    'Organizadas por periodo e modulo',
                    'Questoes objetivas e discursivas',
                    'Acompanhe seu progresso',
                    'Crie listas personalizadas',
                    'Exporte suas listas em PDF',
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-[#468152] flex-shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => router.push('/buy')}
                  className="w-full btn-brand-glow text-white rounded-xl"
                  size="lg"
                >
                  Assinar Premium
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  const totalQuestoes = periodos.reduce((acc, p) => acc + p.totalQuestoes, 0);

  // Count active filters for badge
  const activeFilterCount = [
    filtros.periodoId, filtros.moduloId, filtros.topicoId, filtros.subtopicoId,
    filtros.tipo, filtros.dificuldade, filtros.apenasNaoResolvidas, busca
  ].filter(Boolean).length;

  return (
    <AppShell headerTitle="Banco de Questoes" headerSubtitle={`${totalQuestoes.toLocaleString()}+ questoes disponiveis`}>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total de Questões', value: totalQuestoes.toLocaleString(), sub: `Em ${periodos.length} períodos`, icon: Database, color: '#468152', glowColor: 'rgba(70, 129, 82, 0.3)' },
            { label: 'Resolvidas', value: String(estatisticas?.totalResolvidas || 0), sub: 'questões completadas', icon: BookOpen, color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.3)' },
            { label: 'Taxa de Acerto', value: `${estatisticas?.percentualAcerto || 0}%`, sub: 'nas objetivas', icon: BarChart3, color: '#E2A43E', glowColor: 'rgba(226, 164, 62, 0.3)' },
            { label: 'Minhas Listas', value: String(listas.length), sub: '', icon: List, color: '#468152', glowColor: 'rgba(70, 129, 82, 0.3)', isListas: true },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <GlassGlow
                key={index}
                glowColor={stat.glowColor}
                glowSize={160}
                className="glass-stat rounded-2xl p-4 hover-lift transition-all duration-300 group cursor-default"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                  <div className="p-1.5 rounded-lg bg-white/10 dark:bg-white/5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold tracking-tight">{stat.value}</p>
                {stat.sub && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
                )}
                {'isListas' in stat && stat.isListas && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-6 rounded-lg"
                      onClick={() => router.push('/banco-questoes/listas')}
                    >
                      Ver listas
                    </Button>
                    <Button
                      size="sm"
                      className="text-[10px] h-6 rounded-lg btn-brand-glow text-white"
                      onClick={() => setShowRandomListModal(true)}
                    >
                      <Shuffle className="h-2.5 w-2.5 mr-1" />
                      Criar
                    </Button>
                  </div>
                )}
              </GlassGlow>
            )
          })
        }</div>


        {/* ─── Collapsible Filter Panel ─── */}
        {!(userRole !== 'admin' && accountType !== 'premium' && accountType !== 'trial' && selectedPeriodo) && (
          <div className="glass-page-card rounded-2xl overflow-hidden">
            {/* Filter Header — always visible, clickable to toggle */}
            <button
              onClick={() => setFiltersOpen(prev => !prev)}
              className="w-full flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-white/5 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#468152]/10 dark:bg-[#468152]/20">
                  <SlidersHorizontal className="h-4 w-4 text-[#468152]" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold">Filtros</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativo(s)` : 'Refine sua busca'}
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-[#468152] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-xl hidden sm:flex"
                  onClick={(e) => { e.stopPropagation(); setShowRandomListModal(true) }}
                >
                  <Shuffle className="h-3 w-3 mr-1" />
                  Lista Aleatória
                </Button>
                <motion.div
                  animate={{ rotate: filtersOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
            </button>

            {/* Active filter pills — shown when collapsed */}
            <AnimatePresence>
              {!filtersOpen && activeFilterCount > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-1.5">
                    {filtros.periodoId && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#468152]/10 text-[#468152] px-2 py-1 rounded-full">
                        Período
                        <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => setFiltros(prev => ({ ...prev, periodoId: undefined, moduloId: undefined, topicoId: undefined, subtopicoId: undefined }))} />
                      </span>
                    )}
                    {filtros.moduloId && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                        Módulo
                        <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => setFiltros(prev => ({ ...prev, moduloId: undefined, topicoId: undefined, subtopicoId: undefined }))} />
                      </span>
                    )}
                    {filtros.tipo && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                        {filtros.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
                        <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => setFiltros(prev => ({ ...prev, tipo: undefined }))} />
                      </span>
                    )}
                    {filtros.dificuldade && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${
                        filtros.dificuldade === 'facil' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                        filtros.dificuldade === 'medio' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                        'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {filtros.dificuldade === 'facil' ? 'Fácil' : filtros.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
                        <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => setFiltros(prev => ({ ...prev, dificuldade: undefined }))} />
                      </span>
                    )}
                    {busca && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        &quot;{busca}&quot;
                        <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" onClick={() => { setBusca(''); loadQuestoes(1) }} />
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expandable filter body */}
            <AnimatePresence initial={false}>
              {filtersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-5 pb-5 space-y-4">
                    {/* Row 1: Hierarchy filters in grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Período</Label>
                        <Select
                          value={filtros.periodoId || 'all-periodos'}
                          onValueChange={(value) => {
                            const isAll = value === 'all-periodos'
                            setFiltros(prev => ({ ...prev, periodoId: isAll ? undefined : value, moduloId: undefined, topicoId: undefined, subtopicoId: undefined }))
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl bg-background/50 border-white/10 dark:border-white/5">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-periodos">Todos os períodos</SelectItem>
                            {periodos.map((periodo) => (
                              <SelectItem key={String(periodo._id)} value={String(periodo._id)}>
                                {periodo.nome} ({periodo.totalQuestoes})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Módulo</Label>
                        <Select
                          value={filtros.moduloId || 'all-modulos'}
                          onValueChange={(value) => {
                            const isAll = value === 'all-modulos'
                            setFiltros(prev => ({ ...prev, moduloId: isAll ? undefined : value, topicoId: undefined, subtopicoId: undefined }))
                          }}
                          disabled={!filtros.periodoId}
                        >
                          <SelectTrigger className={cn('h-10 rounded-xl bg-background/50 border-white/10 dark:border-white/5', !filtros.periodoId && 'opacity-50')}>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-modulos">Todos</SelectItem>
                            {modulos.map((modulo) => (
                              <SelectItem key={String(modulo._id)} value={String(modulo._id)}>
                                {modulo.nome} ({modulo.totalQuestoes})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Tópico</Label>
                        <Select
                          value={filtros.topicoId || 'all-topicos'}
                          onValueChange={(value) => {
                            const isAll = value === 'all-topicos'
                            setFiltros(prev => ({ ...prev, topicoId: isAll ? undefined : value, subtopicoId: undefined }))
                          }}
                          disabled={!filtros.moduloId}
                        >
                          <SelectTrigger className={cn('h-10 rounded-xl bg-background/50 border-white/10 dark:border-white/5', !filtros.moduloId && 'opacity-50')}>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-topicos">Todos</SelectItem>
                            {topicos.map((topico) => (
                              <SelectItem key={String(topico._id)} value={String(topico._id)}>
                                {topico.nome} ({topico.totalQuestoes})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Subtópico</Label>
                        <Select
                          value={filtros.subtopicoId || 'all-subtopicos'}
                          onValueChange={(value) => {
                            const isAll = value === 'all-subtopicos'
                            setFiltros(prev => ({ ...prev, subtopicoId: isAll ? undefined : value }))
                          }}
                          disabled={!filtros.topicoId}
                        >
                          <SelectTrigger className={cn('h-10 rounded-xl bg-background/50 border-white/10 dark:border-white/5', !filtros.topicoId && 'opacity-50')}>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-subtopicos">Todos</SelectItem>
                            {subtopicos.map((sub) => (
                              <SelectItem key={String(sub._id)} value={String(sub._id)}>
                                {sub.nome} ({sub.totalQuestoes})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 2: Type + Difficulty + Search */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
                        <Select
                          value={filtros.tipo || 'all-tipos'}
                          onValueChange={(value) => {
                            const isAll = value === 'all-tipos'
                            setFiltros(prev => ({ ...prev, tipo: isAll ? undefined : (value as BancoQuestaoTipo) }))
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl bg-background/50 border-white/10 dark:border-white/5">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-tipos">Todos os tipos</SelectItem>
                            <SelectItem value="objetiva">Objetiva</SelectItem>
                            <SelectItem value="discursiva">Discursiva</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Dificuldade</Label>
                        <Select
                          value={filtros.dificuldade || 'all-dificuldades'}
                          onValueChange={(value) => {
                            const isAll = value === 'all-dificuldades'
                            setFiltros(prev => ({ ...prev, dificuldade: isAll ? undefined : (value as BancoDificuldade) }))
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl bg-background/50 border-white/10 dark:border-white/5">
                            <SelectValue placeholder="Todas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-dificuldades">Todas</SelectItem>
                            <SelectItem value="facil"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />Fácil</span></SelectItem>
                            <SelectItem value="medio"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-yellow-500" />Médio</span></SelectItem>
                            <SelectItem value="dificil"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Difícil</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Buscar</Label>
                        <div className="flex gap-1.5">
                          <Input
                            placeholder="Buscar no enunciado..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 h-10 rounded-xl bg-background/50 border-white/10 dark:border-white/5"
                          />
                          <Button variant="outline" size="icon" onClick={handleSearch} className="h-10 w-10 rounded-xl shrink-0">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Checkbox + Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          id="naoResolvidas"
                          checked={filtros.apenasNaoResolvidas || false}
                          onCheckedChange={(checked) => setFiltros(prev => ({ ...prev, apenasNaoResolvidas: checked as boolean }))}
                        />
                        <span className="text-xs text-muted-foreground">Apenas não resolvidas</span>
                      </label>

                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                          <X className="h-3 w-3 mr-1" />
                          Limpar filtros
                        </Button>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs rounded-xl sm:hidden"
                          onClick={() => setShowRandomListModal(true)}
                        >
                          <Shuffle className="h-3 w-3 mr-1" />
                          Lista Aleatória
                        </Button>
                        {paginacao && (
                          <span className="text-[11px] text-muted-foreground">
                            {paginacao.total} resultado(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Banner para usuarios gratuitos */}
        {accountType === 'gratuito' && selectedPeriodo && (
          <div className="glass-stat rounded-2xl p-4 flex items-start gap-3 hover-glow-orange transition-all">
            <div className="p-2 rounded-xl bg-amber-500/10 flex-shrink-0">
              <GraduationCap className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Voce esta visualizando 5 questoes gratuitas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Para ver questoes de outro periodo ou usar filtros, faca upgrade para Premium!
              </p>
              <Button
                size="sm"
                onClick={() => router.push('/buy')}
                className="mt-2 btn-brand-glow text-white rounded-xl text-xs h-8"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Fazer Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Lista de questoes */}
        <div className="space-y-3">
          {loadingQuestoes ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl skeleton-pulse" />)}
            </div>
          ) : questoes.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Nenhuma questao encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros para encontrar questoes
              </p>
            </div>
          ) : (
            <>
              {questoes.map((questao) => (
                <div
                  key={String(questao._id)}
                  className="glass-page-card rounded-2xl group hover-glow-green hover-lift transition-all duration-300"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => router.push(`/banco-questoes/${questao._id}`)}
                      >
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant={questao.tipo === 'objetiva' ? 'default' : 'secondary'}>
                            {questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
                          </Badge>
                          <Badge variant="outline">{questao.periodoNome}</Badge>
                          {questao.moduloNome && (
                            <Badge variant="outline" className="text-xs">
                              {questao.moduloNome}
                            </Badge>
                          )}
                          {questao.topicoNome && (
                            <Badge variant="outline" className="text-xs">
                              {questao.topicoNome}
                            </Badge>
                          )}
                          {questao.ano && (
                            <Badge variant="outline" className="bg-primary/10 text-xs">
                              {questao.ano}
                            </Badge>
                          )}
                          {questao.dificuldade && (
                            <Badge
                              variant="outline"
                              className={
                                questao.dificuldade === 'facil'
                                  ? 'border-green-500 text-green-600'
                                  : questao.dificuldade === 'medio'
                                    ? 'border-yellow-500 text-yellow-600'
                                    : 'border-red-500 text-red-600'
                              }
                            >
                              {questao.dificuldade === 'facil' ? 'Fácil' :
                                questao.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm line-clamp-2 mb-2">
                          {questao.enunciado}
                        </p>

                        {questao.jaResolvida && (
                          <div className="flex items-center gap-1 text-xs">
                            {questao.ultimaResolucao?.correta ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">Acertou</span>
                              </>
                            ) : questao.tipo === 'objetiva' ? (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-red-600">Errou</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-600">Respondida</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openAddToListModal(String(questao._id))}>
                              <List className="h-4 w-4 mr-2" />
                              Adicionar à lista
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/banco-questoes/${questao._id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {paginacao && paginacao.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Button
                    variant="outline"
                    disabled={paginacao.page <= 1}
                    onClick={() => loadQuestoes(paginacao.page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {paginacao.page} de {paginacao.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={paginacao.page >= paginacao.totalPages}
                    onClick={() => loadQuestoes(paginacao.page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>

      {/* Modal de Adicionar a Lista */}
      <Dialog open={showAddToListModal} onOpenChange={setShowAddToListModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Adicionar à Lista
            </DialogTitle>
            <DialogDescription>
              Escolha uma lista existente ou crie uma nova
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {listas.length > 0 && (
              <div className="space-y-2">
                <Label>Listas existentes</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {listas.map((lista) => (
                    <Button
                      key={String(lista._id)}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleAddToList(String(lista._id))}
                      disabled={addingToList}
                    >
                      <span>{lista.nome}</span>
                      <Badge variant="secondary">{lista.totalQuestoes || 0}</Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label>Ou crie uma nova lista</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Nome da nova lista"
                  value={novaListaNome}
                  onChange={(e) => setNovaListaNome(e.target.value)}
                />
                <Button
                  onClick={handleCreateListAndAdd}
                  disabled={!novaListaNome.trim() || addingToList}
                >
                  {addingToList ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Lista Aleatória */}
      <Dialog open={showRandomListModal} onOpenChange={setShowRandomListModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-r from-[#468152]/20 to-[#E2A43E]/20">
                <Shuffle className="h-5 w-5 text-[#468152]" />
              </div>
              Criar Lista Aleatória
            </DialogTitle>
            <DialogDescription>
              Monte sua lista de questões personalizada para estudar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Seção 1: Informações básicas */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#468152] text-white flex items-center justify-center text-xs">1</span>
                Informações Básicas
              </h4>

              {/* Nome da lista */}
              <div className="space-y-2">
                <Label>Nome da Lista <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ex: Revisão de Cardiologia, Treino Anatomia..."
                  value={randomListForm.nome}
                  onChange={(e) => setRandomListForm(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-background"
                />
              </div>

              {/* Quantidade */}
              <div className="space-y-2">
                <Label>Quantidade de questões</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={randomListForm.quantidade}
                    onChange={(e) => setRandomListForm(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 10 }))}
                    className="w-20 bg-background"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[5, 10, 20, 30, 50].map((n) => (
                      <Button
                        key={n}
                        variant={randomListForm.quantidade === n ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRandomListForm(prev => ({ ...prev, quantidade: n }))}
                        className={randomListForm.quantidade === n ? 'bg-[#468152] hover:bg-[#468152]/90' : ''}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Modo de resposta */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#468152] text-white flex items-center justify-center text-xs">2</span>
                Modo de Correção
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setRandomListForm(prev => ({ ...prev, modoResposta: 'imediato' }))}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${randomListForm.modoResposta === 'imediato'
                    ? 'border-[#468152] bg-[#468152]/10'
                    : 'border-muted hover:border-[#468152]/50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Zap className={`h-8 w-8 ${randomListForm.modoResposta === 'imediato' ? 'text-[#468152]' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Correção Imediata</span>
                    <span className="text-xs text-muted-foreground">Veja a resposta após cada questão</span>
                  </div>
                </div>
                <div
                  onClick={() => setRandomListForm(prev => ({ ...prev, modoResposta: 'final' }))}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${randomListForm.modoResposta === 'final'
                    ? 'border-[#E2A43E] bg-[#E2A43E]/10'
                    : 'border-muted hover:border-[#E2A43E]/50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Target className={`h-8 w-8 ${randomListForm.modoResposta === 'final' ? 'text-[#E2A43E]' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Correção no Final</span>
                    <span className="text-xs text-muted-foreground">Simula uma prova real</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Filtros */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#468152] text-white flex items-center justify-center text-xs">3</span>
                Filtros <span className="text-xs font-normal">(opcional)</span>
              </h4>

              {/* Linha 1: Período, Módulo e Tópico */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Período</Label>
                  <Select
                    value={randomListForm.periodoId || 'all'}
                    onValueChange={(value) => {
                      const isAll = value === 'all'
                      setRandomListForm(prev => ({
                        ...prev,
                        periodoId: isAll ? '' : value,
                        moduloId: '',
                        topicoId: '',
                        subtopicoId: ''
                      }))
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Todos os períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      {periodos.map((periodo) => (
                        <SelectItem key={String(periodo._id)} value={String(periodo._id)}>
                          {periodo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Módulo</Label>
                  <Select
                    value={randomListForm.moduloId || 'all'}
                    onValueChange={(value) => {
                      const isAll = value === 'all'
                      setRandomListForm(prev => ({
                        ...prev,
                        moduloId: isAll ? '' : value,
                        topicoId: '',
                        subtopicoId: ''
                      }))
                    }}
                    disabled={!randomListForm.periodoId}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Todos os módulos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os módulos</SelectItem>
                      {randomModulos.map((modulo) => (
                        <SelectItem key={String(modulo._id)} value={String(modulo._id)}>
                          {modulo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tópico</Label>
                  <Select
                    value={randomListForm.topicoId || 'all'}
                    onValueChange={(value) => {
                      const isAll = value === 'all'
                      setRandomListForm(prev => ({
                        ...prev,
                        topicoId: isAll ? '' : value,
                        subtopicoId: ''
                      }))
                    }}
                    disabled={!randomListForm.moduloId}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Todos os tópicos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tópicos</SelectItem>
                      {randomTopicos.map((topico) => (
                        <SelectItem key={String(topico._id)} value={String(topico._id)}>
                          {topico.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Linha 2: Tipo, Dificuldade e Ano */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de questão</Label>
                  <Select
                    value={randomListForm.tipo || 'all'}
                    onValueChange={(value) => {
                      const isAll = value === 'all'
                      setRandomListForm(prev => ({
                        ...prev,
                        tipo: isAll ? '' : value as BancoQuestaoTipo
                      }))
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="objetiva">Objetiva</SelectItem>
                      <SelectItem value="discursiva">Discursiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Dificuldade</Label>
                  <Select
                    value={randomListForm.dificuldade || 'all'}
                    onValueChange={(value) => {
                      const isAll = value === 'all'
                      setRandomListForm(prev => ({
                        ...prev,
                        dificuldade: isAll ? '' : value as BancoDificuldade
                      }))
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Ano da prova</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 2024"
                    min={2000}
                    max={new Date().getFullYear()}
                    value={randomListForm.ano}
                    onChange={(e) => setRandomListForm(prev => ({ ...prev, ano: e.target.value }))}
                    className="bg-background"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowRandomListModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRandomList}
              disabled={!randomListForm.nome.trim() || creatingRandomList}
              className="btn-brand-glow text-white rounded-xl"
            >
              {creatingRandomList ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shuffle className="h-4 w-4 mr-2" />
              )}
              Criar Lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
