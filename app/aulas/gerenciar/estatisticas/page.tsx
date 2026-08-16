'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  EyeOff,
  FileWarning,
  PlayCircle,
  TrendingDown,
} from 'lucide-react'
import { LogoLoading } from '@/components/logo-loading'
import { ThemeToggle } from '@/components/theme-toggle'
import { formatarTempo } from '@/lib/aulas/progresso'
import type { Alerta, NumerosDaAula, NumerosDoCurso, ResumoGeral } from '@/lib/aulas/analytics'
import { cn } from '@/lib/utils'

/**
 * Painel de números das aulas (§26, §27).
 *
 * O cartão "Estatísticas" já existia no hub de gerenciamento e levava a esta
 * rota — que nunca foi escrita. Era um 404 à espera de quem clicasse.
 *
 * A tela é organizada por urgência, e não por completude. Com centenas de aulas,
 * uma tabela ordenável é uma planilha que ninguém varre; então o que aparece
 * primeiro é **o que está errado agora** — aula publicada e vazia, aula que
 * ninguém termina, aula que todo mundo abandona no mesmo ponto. A tabela
 * completa fica embaixo, para quem foi atrás de um número específico.
 */

interface Dados {
  resumo: ResumoGeral
  cursos: NumerosDoCurso[]
  alertas: Alerta[]
  aulas: NumerosDaAula[]
  truncado: boolean
}

const ICONE_DO_ALERTA: Record<Alerta['tipo'], typeof AlertTriangle> = {
  'sem-conteudo': FileWarning,
  'ninguem-concluiu': AlertTriangle,
  abandono: TrendingDown,
  'sem-atividade': Clock,
}

const TOM_DO_ALERTA: Record<Alerta['tipo'], string> = {
  'sem-conteudo': 'border-destructive/30 bg-destructive/10 text-destructive',
  'ninguem-concluiu': 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  abandono: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'sem-atividade': 'border-border bg-muted/40 text-muted-foreground',
}

export default function EstatisticasPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [dados, setDados] = useState<Dados | null>(null)
  const [curso, setCurso] = useState<string>('')

  const carregar = useCallback(async (setorId: string) => {
    const url = setorId ? `/api/aulas/analytics?curso=${encodeURIComponent(setorId)}` : '/api/aulas/analytics'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return
    setDados(await res.json())
  }, [])

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return router.push('/auth/login')
        const { user } = await res.json()
        if (user?.role !== 'admin' && user?.secondaryRole !== 'monitor') return router.push('/aulas')
        if (cancelado) return
        setAutorizado(true)
        await carregar('')
      } catch {
        router.push('/auth/login')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [router, carregar])

  // A lista de cursos vem da resposta sem filtro; guardá-la evita que filtrar
  // por um curso esvazie o próprio seletor.
  const [cursosConhecidos, setCursosConhecidos] = useState<NumerosDoCurso[]>([])
  useEffect(() => {
    if (dados && !curso) setCursosConhecidos(dados.cursos)
  }, [dados, curso])

  const trocarCurso = useCallback(
    async (setorId: string) => {
      setCurso(setorId)
      setDados(null)
      await carregar(setorId)
    },
    [carregar],
  )

  const semDadoNenhum = useMemo(
    () => dados !== null && dados.resumo.inicios === 0 && dados.resumo.totalAulas > 0,
    [dados],
  )

  if (carregando) return <LogoLoading message="Calculando..." size="lg" fullscreen />
  if (!autorizado) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="container mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/aulas/gerenciar"
                aria-label="Voltar"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">Estatísticas</h1>
                <p className="truncate text-xs text-muted-foreground">
                  {dados ? `${dados.resumo.totalAulas} aula(s)` : 'Calculando…'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-5">
        {/* ── Filtro por curso ──────────────────────────────────────────── */}
        {cursosConhecidos.length > 1 && (
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
            <Ficha ativa={curso === ''} onClick={() => trocarCurso('')}>
              Todos os cursos
            </Ficha>
            {cursosConhecidos
              .filter((c) => c.setorId !== '__sem_curso__')
              .map((c) => (
                <Ficha key={c.setorId} ativa={curso === c.setorId} onClick={() => trocarCurso(c.setorId)}>
                  {c.nome}
                </Ficha>
              ))}
          </div>
        )}

        {!dados ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : (
          <>
            {/* ── Cartões de topo ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Cartao
                icone={BookOpen}
                rotulo="No ar"
                valor={dados.resumo.publicadas}
                nota={`${dados.resumo.ocultas} oculta(s) · ${dados.resumo.agendadas} agendada(s)`}
              />
              <Cartao
                icone={PlayCircle}
                rotulo="Inícios"
                valor={dados.resumo.inicios}
                nota="Somados por aula"
              />
              <Cartao
                icone={CheckCircle2}
                rotulo="Conclusões"
                valor={dados.resumo.conclusoes}
                nota="Inclui o histórico antigo"
                destaque
              />
              <Cartao
                icone={TrendingDown}
                rotulo="Taxa média"
                valor={dados.resumo.taxaMedia === null ? '—' : `${dados.resumo.taxaMedia}%`}
                nota="Média por aula, não global"
              />
            </div>

            {semDadoNenhum && (
              <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Ainda não há progresso registrado. Os números aparecem conforme os alunos assistem —
                não é preciso configurar nada.
              </p>
            )}

            {/* ── Alertas ───────────────────────────────────────────────── */}
            {dados.alertas.length > 0 && (
              <section className="mt-7">
                <h2 className="mb-1 text-sm font-bold">Precisa de atenção</h2>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  Aulas com poucos alunos ficam de fora: com dois inícios, nenhuma taxa significa
                  nada ainda.
                </p>
                <div className="space-y-2">
                  {dados.alertas.map((a) => {
                    const Icone = ICONE_DO_ALERTA[a.tipo]
                    return (
                      <Link
                        key={`${a.tipo}-${a.aulaId}`}
                        href={`/aulas/gerenciar/aulas/${a.aulaId}/editar`}
                        className={cn(
                          'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition hover:brightness-105',
                          TOM_DO_ALERTA[a.tipo],
                        )}
                      >
                        <Icone className="mt-0.5 h-4 w-4 flex-none" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold">{a.titulo}</p>
                          <p className="text-[11.5px] leading-relaxed opacity-90">{a.detalhe}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Por curso ─────────────────────────────────────────────── */}
            {!curso && dados.cursos.length > 1 && (
              <section className="mt-7">
                <h2 className="mb-3 text-sm font-bold">Por curso</h2>
                <div className="space-y-2">
                  {dados.cursos.map((c) => (
                    <div key={c.setorId} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{c.nome}</p>
                        <p className="flex-none text-[11.5px] tabular-nums text-muted-foreground">
                          {c.aulas} aula(s) · {c.inicios} início(s) · {c.conclusoes} conclusão(ões)
                        </p>
                      </div>
                      <Barra valor={c.taxaMedia} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Tabela por aula ───────────────────────────────────────── */}
            <section className="mt-7">
              <h2 className="mb-3 text-sm font-bold">Aula por aula</h2>
              {dados.aulas.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhuma aula neste recorte.
                </p>
              ) : (
                <>
                  {/* Rola dentro da própria caixa: a página não pode rolar de
                      lado no celular por causa de uma tabela. */}
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[640px] text-left text-[12.5px]">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Aula</th>
                          <th className="px-3 py-2 text-right font-semibold">Começaram</th>
                          <th className="px-3 py-2 text-right font-semibold">Terminaram</th>
                          <th className="px-3 py-2 text-right font-semibold">Taxa</th>
                          <th className="px-3 py-2 text-right font-semibold">% médio</th>
                          <th className="px-3 py-2 text-right font-semibold">Param em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.aulas.map((a) => (
                          <tr key={a.aulaId} className="border-t border-border">
                            <td className="max-w-[280px] px-3 py-2">
                              <Link
                                href={`/aulas/gerenciar/aulas/${a.aulaId}/editar`}
                                className="block truncate font-medium transition hover:text-primary"
                                title={a.titulo}
                              >
                                {a.titulo}
                              </Link>
                              {a.oculta && (
                                <span className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
                                  <EyeOff className="h-3 w-3" /> oculta
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{a.iniciaram}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{a.concluiram}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {/* Traço, não "0%": sem ninguém, não houve abandono. */}
                              {a.taxaConclusao === null ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                <span className={a.taxaConclusao < 30 ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>
                                  {a.taxaConclusao}%
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {a.percentualMedio === null ? '—' : `${a.percentualMedio}%`}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {a.paradaMediaSegundos ? formatarTempo(a.paradaMediaSegundos) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {dados.truncado && (
                    <p className="mt-2 text-[11.5px] text-muted-foreground">
                      Mostrando as primeiras {dados.aulas.length} aulas. Filtre por curso para ver o resto.
                    </p>
                  )}
                </>
              )}
            </section>

            <p className="mt-8 border-t border-border pt-5 text-center text-[11.5px] leading-relaxed text-muted-foreground">
              &ldquo;Começaram&rdquo; conta o progresso registrado desde a reformulação;
              &ldquo;terminaram&rdquo; inclui também as conclusões anteriores a ela. Por isso quem
              concluiu conta como quem começou — e a taxa nunca passa de 100%.
            </p>
          </>
        )}
      </main>
    </div>
  )
}

/* ─────────────────────────── Peças ─────────────────────────── */

function Cartao({
  icone: Icone,
  rotulo,
  valor,
  nota,
  destaque,
}: {
  icone: typeof BookOpen
  rotulo: string
  valor: number | string
  nota?: string
  destaque?: boolean
}) {
  return (
    <div className={cn('rounded-xl border p-3.5', destaque ? 'border-primary/30 bg-primary/5' : 'border-border bg-card')}>
      <div className="flex items-center gap-1.5">
        <Icone className={cn('h-3.5 w-3.5', destaque ? 'text-primary' : 'text-muted-foreground')} />
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      </div>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums tracking-tight">{valor}</p>
      {nota && <p className="mt-0.5 text-[10.5px] leading-tight text-muted-foreground">{nota}</p>}
    </div>
  )
}

function Barra({ valor }: { valor: number | null }) {
  if (valor === null) {
    return <p className="mt-2 text-[11px] text-muted-foreground">Sem dado de conclusão ainda.</p>
  }
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', valor < 30 ? 'bg-amber-500' : 'bg-primary')}
          style={{ width: `${Math.min(100, Math.max(2, valor))}%` }}
        />
      </div>
      <span className="w-9 flex-none text-right text-[11px] font-semibold tabular-nums">{valor}%</span>
    </div>
  )
}

function Ficha({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 flex-none items-center rounded-lg border px-3 text-[12px] font-semibold transition',
        ativa ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-card hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}
