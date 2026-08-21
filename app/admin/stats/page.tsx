'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidePanel, formatRelative } from '@/components/admin/stats/viz'
import { TabLive } from '@/components/admin/stats/tab-live'
import { TabOverview } from '@/components/admin/stats/tab-overview'
import { ExamDetail, TabExams, type ExamFilters } from '@/components/admin/stats/tab-exams'
import { TabUsers, UserDetail, type UserFilters } from '@/components/admin/stats/tab-users'
import { TabContent } from '@/components/admin/stats/tab-content'
import {
  RANGE_OPTIONS,
  type ContentPayload,
  type ExamDetailPayload,
  type ExamsPayload,
  type LivePayload,
  type OverviewPayload,
  type RangeKey,
  type UserDetailPayload,
  type UsersPayload,
} from '@/components/admin/stats/types'

type TabKey = 'live' | 'overview' | 'exams' | 'users' | 'content'

/** De quanto em quanto tempo a aba "Ao vivo" se atualiza sozinha. */
const LIVE_REFRESH_MS = 20_000

/**
 * ═══════════════════════════════════════════════════════════════
 *  /admin/stats
 * ───────────────────────────────────────────────────────────────
 *  Cada aba busca só o seu próprio endpoint, e só quando é aberta
 *  pela primeira vez. A versão anterior carregava tudo — inclusive
 *  a base inteira de usuários e provas — numa única requisição
 *  antes de desenhar o primeiro pixel.
 *
 *  As buscas passam pelo `useStatsResource` abaixo, que resolve
 *  três chatices de uma vez: cancelar a requisição anterior quando
 *  o filtro muda, ignorar respostas que chegam fora de ordem e não
 *  piscar a tela em toda revalidação.
 * ═══════════════════════════════════════════════════════════════
 */
export default function AdminStatsPage() {
  const router = useRouter()

  const [range, setRange] = useState<RangeKey>('30d')
  const [tab, setTab] = useState<TabKey>('live')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const [examFilters, setExamFilters] = useState<ExamFilters>({
    search: '',
    method: 'all',
    status: 'all',
    sort: 'aberturas',
    page: 0,
  })
  const [userFilters, setUserFilters] = useState<UserFilters>({
    search: '',
    filter: 'all',
    sort: 'provas',
    page: 0,
  })

  const [openExamId, setOpenExamId] = useState<string | null>(null)
  const [openUserId, setOpenUserId] = useState<string | null>(null)

  // ─── Recursos por aba ───────────────────────────────────────
  const live = useStatsResource<LivePayload>('/api/admin/stats/live', tab === 'live')
  const overview = useStatsResource<OverviewPayload>(
    `/api/admin/stats/overview?range=${range}`,
    tab === 'overview'
  )
  const exams = useStatsResource<ExamsPayload>(
    `/api/admin/stats/exams?range=${range}&search=${encodeURIComponent(examFilters.search)}&method=${examFilters.method}&status=${examFilters.status}&sort=${examFilters.sort}&page=${examFilters.page}`,
    tab === 'exams',
    350
  )
  const users = useStatsResource<UsersPayload>(
    `/api/admin/stats/users?range=${range}&search=${encodeURIComponent(userFilters.search)}&filter=${userFilters.filter}&sort=${userFilters.sort}&page=${userFilters.page}`,
    tab === 'users',
    350
  )
  const content = useStatsResource<ContentPayload>(
    `/api/admin/stats/content?range=${range}`,
    tab === 'content'
  )

  // `resetOnChange`: abrir outra prova/aluno tem de limpar a tela antes de
  // carregar. Nas tabelas é o oposto — manter o resultado anterior enquanto o
  // filtro novo carrega evita a lista piscar a cada tecla digitada.
  const examDetail = useStatsResource<ExamDetailPayload>(
    openExamId ? `/api/admin/stats/exams/${openExamId}` : '',
    !!openExamId,
    0,
    true
  )
  const userDetail = useStatsResource<UserDetailPayload>(
    openUserId ? `/api/admin/stats/users/${openUserId}` : '',
    !!openUserId,
    0,
    true
  )

  // Atualização automática do painel ao vivo.
  // `live.reload` é estável (useCallback sem dependências); usar o objeto do
  // recurso aqui recriaria o intervalo a cada render.
  const reloadLive = live.reload
  useEffect(() => {
    if (tab !== 'live' || !autoRefresh) return
    const timer = setInterval(reloadLive, LIVE_REFRESH_MS)
    return () => clearInterval(timer)
  }, [tab, autoRefresh, reloadLive])

  const active = useMemo(() => {
    switch (tab) {
      case 'live':
        return live
      case 'overview':
        return overview
      case 'exams':
        return exams
      case 'users':
        return users
      default:
        return content
    }
  }, [tab, live, overview, exams, users, content])

  const openExam = useCallback((examId: string) => {
    setOpenUserId(null)
    setOpenExamId(examId)
  }, [])
  const openUser = useCallback((userId: string) => {
    setOpenExamId(null)
    setOpenUserId(userId)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold sm:text-xl">Estatísticas</h1>
              <p className="truncate text-xs text-muted-foreground">
                Quem está usando a plataforma, o que abre e onde desiste
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => active.reload()}
              title="Atualizar"
              aria-label="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${active.loading ? 'animate-spin' : ''}`} />
            </Button>
            <ThemeToggle />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-0.5">
              {RANGE_OPTIONS.map(option => (
                <button
                  key={option.key}
                  onClick={() => setRange(option.key)}
                  title={option.label}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    range === option.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {option.short}
                </button>
              ))}
            </div>

            {tab === 'live' && (
              <button
                onClick={() => setAutoRefresh(v => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  autoRefresh ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Radio className={`h-3 w-3 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh ? `Atualizando a cada ${LIVE_REFRESH_MS / 1000}s` : 'Atualização pausada'}
              </button>
            )}

            {active.updatedAt && (
              <span className="text-xs text-muted-foreground">
                Atualizado {formatRelative(active.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-3 py-5 sm:px-4">
        {active.error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
            <p className="font-medium text-destructive">Não foi possível carregar esta aba</p>
            <p className="text-muted-foreground">{active.error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => active.reload()}>
              Tentar de novo
            </Button>
          </div>
        )}

        <Tabs defaultValue="live" value={tab} onValueChange={v => setTab(v as TabKey)} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="live" className="py-2 text-xs sm:text-sm">
              Ao vivo
              {live.data && live.data.resumo.fazendoProva > 0 && (
                <span
                  className="ml-1.5 rounded-full px-1.5 text-[10px] font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--viz-good) 20%, transparent)', color: 'var(--viz-good)' }}
                >
                  {live.data.resumo.fazendoProva}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="overview" className="py-2 text-xs sm:text-sm">Visão geral</TabsTrigger>
            <TabsTrigger value="exams" className="py-2 text-xs sm:text-sm">Provas</TabsTrigger>
            <TabsTrigger value="users" className="py-2 text-xs sm:text-sm">Usuários</TabsTrigger>
            <TabsTrigger value="content" className="py-2 text-xs sm:text-sm">Conteúdo</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <TabLive data={live.data} onOpenUser={openUser} onOpenExam={openExam} />
          </TabsContent>
          <TabsContent value="overview">
            <TabOverview data={overview.data} onOpenExam={openExam} onOpenUser={openUser} />
          </TabsContent>
          <TabsContent value="exams">
            <TabExams
              data={exams.data}
              filters={examFilters}
              onFilters={next => setExamFilters(prev => ({ ...prev, ...next }))}
              onOpenExam={openExam}
              loading={exams.loading && !exams.data}
            />
          </TabsContent>
          <TabsContent value="users">
            <TabUsers
              data={users.data}
              filters={userFilters}
              onFilters={next => setUserFilters(prev => ({ ...prev, ...next }))}
              onOpenUser={openUser}
              loading={users.loading && !users.data}
            />
          </TabsContent>
          <TabsContent value="content">
            <TabContent data={content.data} onOpenUser={openUser} />
          </TabsContent>
        </Tabs>
      </main>

      <SidePanel
        open={!!openExamId}
        onClose={() => setOpenExamId(null)}
        title={examDetail.data?.prova.titulo || 'Carregando prova...'}
        subtitle={
          examDetail.data
            ? `${examDetail.data.prova.questoes} questões · criada em ${new Date(
                examDetail.data.prova.criadaEm || Date.now()
              ).toLocaleDateString('pt-BR')}`
            : undefined
        }
      >
        <ExamDetail data={examDetail.data} onOpenUser={openUser} />
      </SidePanel>

      <SidePanel
        open={!!openUserId}
        onClose={() => setOpenUserId(null)}
        title={userDetail.data?.usuario.nome || 'Carregando aluno...'}
        subtitle={userDetail.data?.usuario.email}
      >
        <UserDetail data={userDetail.data} onOpenExam={openExam} />
      </SidePanel>
    </div>
  )
}

// ─── Busca de dados ───────────────────────────────────────────

interface StatsResource<T> {
  data: T | null
  loading: boolean
  error: string
  updatedAt: string | null
  reload: () => void
}

/**
 * Busca uma rota do painel com debounce opcional.
 *
 * O contador `requestRef` descarta respostas antigas: digitar na busca dispara
 * uma requisição por tecla e, sem ele, uma resposta lenta de "ca" podia
 * sobrescrever na tela o resultado já correto de "cardio".
 */
function useStatsResource<T>(
  url: string,
  enabled: boolean,
  debounceMs = 0,
  resetOnChange = false
): StatsResource<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const requestRef = useRef(0)

  useEffect(() => {
    if (!enabled || !url) return

    const requestId = ++requestRef.current
    const controller = new AbortController()
    if (resetOnChange) setData(null)

    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch(url, { signal: controller.signal })
        const payload = await res.json()
        if (requestId !== requestRef.current) return
        if (!res.ok) throw new Error(payload?.error || 'Erro ao carregar dados')
        setData(payload)
        setError('')
        setUpdatedAt(new Date().toISOString())
      } catch (err: any) {
        if (err?.name === 'AbortError' || requestId !== requestRef.current) return
        setError(err?.message || 'Erro ao carregar dados')
      } finally {
        if (requestId === requestRef.current) setLoading(false)
      }
    }

    const timer = debounceMs > 0 ? setTimeout(run, debounceMs) : null
    if (!timer) void run()

    return () => {
      if (timer) clearTimeout(timer)
      controller.abort()
    }
  }, [url, enabled, debounceMs, resetOnChange, nonce])

  const reload = useCallback(() => setNonce(n => n + 1), [])

  return { data, loading, error, updatedAt, reload }
}
