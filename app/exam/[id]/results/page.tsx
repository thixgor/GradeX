'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Barcode } from '@/components/barcode'
import { Exam, TRIResult } from '@/lib/types'
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  Lock,
  Medal,
  Search,
  Trophy,
  Users,
} from 'lucide-react'
import { resolverDownloadsDaProva } from '@/lib/provas/downloads-da-prova'
import { cn } from '@/lib/utils'

/**
 * Os resultados de uma prova, depois que ela termina.
 *
 * ## O beco
 *
 * A tela da prova mandava o ALUNO para cá assim que a prova encerrava. A rota
 * de dados por trás era exclusiva de admin: ele chegava, recebia "Apenas
 * administradores podem ver os resultados" num `alert()` do navegador e era
 * jogado para a página inicial. A área de resultados, para quem fez a prova,
 * era um beco com um alerta no fim.
 *
 * Agora quem participou vê o resultado da prova que fez (a API libera depois do
 * término — ver `app/api/exams/[id]/results/route.ts`), e a tela é montada em
 * torno da pergunta que essa pessoa realmente tem: **onde eu fiquei?**
 *
 * ## As decisões de leitura
 *
 * - **A sua linha vem primeiro**, destacada, antes da lista. O ranking era
 *   ordenado por nome, então encontrar-se nele numa turma de 80 exigia rolar
 *   procurando o próprio nome.
 * - **A distribuição antes da lista.** Saber que a média foi 62 e que você
 *   tirou 71 diz mais, e mais rápido, do que oitenta linhas de nome e nota.
 * - **Ordenação por nota, com busca.** A lista alfabética servia à chamada, não
 *   ao resultado.
 */

interface NormalResult {
  userId: string
  userName: string
  score: number
}

type Linha = { userId: string; userName: string; nota: number }

const FAIXAS = [
  { rotulo: '0–20%', min: 0, max: 20 },
  { rotulo: '20–40%', min: 20, max: 40 },
  { rotulo: '40–60%', min: 40, max: 60 },
  { rotulo: '60–80%', min: 60, max: 80 },
  { rotulo: '80–100%', min: 80, max: 100.0001 },
]

export default function ExamResultsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [scoringMethod, setScoringMethod] = useState<'tri' | 'normal'>('normal')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [conta, setConta] = useState<{ id?: string; role?: string; accountType?: string }>({})
  const [busca, setBusca] = useState('')
  const [gerando, setGerando] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const avisar = useCallback((mensagem: string) => {
    setToastMessage(mensagem)
    setToastOpen(true)
  }, [])

  useEffect(() => {
    async function carregar() {
      try {
        const [resExam, resMe] = await Promise.all([
          fetch(`/api/exams/${id}?ordem=original`),
          fetch('/api/auth/me'),
        ])

        const dadosExam = await resExam.json()
        if (!resExam.ok) throw new Error(dadosExam.error)
        setExam(dadosExam.exam)

        if (resMe.ok) {
          const dadosMe = await resMe.json()
          setConta({
            id: dadosMe.user?._id || dadosMe.user?.id,
            role: dadosMe.user?.role,
            accountType: dadosMe.user?.accountType,
          })
        }

        const resResultados = await fetch(`/api/exams/${id}/results`)
        const dados = await resResultados.json()
        if (!resResultados.ok) {
          // Uma recusa aqui não é um erro fatal: é uma prova que ainda não
          // terminou, ou alguém que não participou dela. A tela conta isso em
          // vez de despejar a pessoa na home.
          setErro(dados.error || 'Resultados indisponíveis.')
          return
        }

        setScoringMethod(dados.scoringMethod)
        setLinhas(
          (dados.results || []).map((r: TRIResult | NormalResult) => ({
            userId: r.userId,
            userName: r.userName,
            nota: dados.scoringMethod === 'tri' ? (r as TRIResult).triScore : (r as NormalResult).score,
          })),
        )
      } catch (error: any) {
        setErro(error.message || 'Não foi possível carregar os resultados.')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  const notaMaxima = scoringMethod === 'tri' ? 1000 : exam?.totalPoints || 100

  const downloads = useMemo(
    () =>
      resolverDownloadsDaProva(exam, {
        accountType: conta.accountType,
        isAdmin: conta.role === 'admin',
        jaEnviou: true,
      }),
    [exam, conta],
  )

  const ordenadas = useMemo(() => [...linhas].sort((a, b) => b.nota - a.nota), [linhas])

  const estatisticas = useMemo(() => {
    if (ordenadas.length === 0) return null
    const notas = ordenadas.map((l) => l.nota)
    const soma = notas.reduce((a, b) => a + b, 0)
    return {
      participantes: ordenadas.length,
      media: soma / notas.length,
      maior: notas[0],
      menor: notas[notas.length - 1],
      distribuicao: FAIXAS.map((faixa) => ({
        rotulo: faixa.rotulo,
        quantidade: notas.filter((n) => {
          const pct = notaMaxima > 0 ? (n / notaMaxima) * 100 : 0
          return pct >= faixa.min && pct < faixa.max
        }).length,
      })),
    }
  }, [ordenadas, notaMaxima])

  /** Onde EU fiquei — a pergunta que traz a pessoa a esta tela. */
  const minhaPosicao = useMemo(() => {
    if (!conta.id) return null
    const indice = ordenadas.findIndex((l) => l.userId === conta.id)
    if (indice < 0) return null
    const melhoresQueEu = ordenadas.filter((l) => l.nota > ordenadas[indice].nota).length
    return {
      posicao: melhoresQueEu + 1,
      linha: ordenadas[indice],
      // Percentil: quantos por cento da turma ficaram abaixo.
      percentil: Math.round(((ordenadas.length - melhoresQueEu - 1) / Math.max(1, ordenadas.length - 1)) * 100),
    }
  }, [ordenadas, conta.id])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return ordenadas
    return ordenadas.filter((l) => l.userName.toLowerCase().includes(termo))
  }, [ordenadas, busca])

  async function baixarGabarito() {
    if (!exam) return
    if (!downloads.gabarito.permitido) {
      avisar(downloads.gabarito.motivo || 'Download não disponível.')
      return
    }
    try {
      setGerando(true)
      const { generateGabaritoPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateGabaritoPDF(exam)
      downloadPDF(blob, `gabarito-${exam.title.replace(/\s/g, '-')}.pdf`, {
        type: 'gabarito_pdf',
        resourceId: exam._id?.toString() || '',
        resourceTitle: exam.title,
      })
    } catch (error: any) {
      avisar('Erro ao gerar gabarito: ' + error.message)
    } finally {
      setGerando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Carregando resultados…
        </div>
      </div>
    )
  }

  if (erro || !exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold">Resultados indisponíveis</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {erro || 'Não encontramos esta prova.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/provas')} className="rounded-xl">
            Ver minhas provas
          </Button>
          {conta.id && (
            <Button onClick={() => router.push(`/exam/${id}/user/${conta.id}`)} className="rounded-xl">
              Meu relatório
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/provas')} aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight sm:text-lg">Resultados</h1>
              <p className="truncate text-xs text-muted-foreground">{exam.title}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        {/* ── Onde eu fiquei ───────────────────────────────────────── */}
        {minhaPosicao && (
          <section
            className="exam-resultado-entra relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 shadow-lg"
            style={{ '--exam-ordem': 0 } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-center gap-5">
              <div className="exam-selo-estoura flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <span className="text-2xl font-black leading-none tabular-nums">{minhaPosicao.posicao}º</span>
                <span className="text-[10px] font-medium opacity-90">lugar</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Seu resultado
                </p>
                <p className="mt-0.5 text-2xl font-black tabular-nums">
                  {minhaPosicao.linha.nota}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/ {notaMaxima}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ordenadas.length > 1
                    ? `Você ficou à frente de ${minhaPosicao.percentil}% da turma.`
                    : 'Você é a única entrega registrada até agora.'}
                </p>
              </div>
              <Button
                onClick={() => router.push(`/exam/${id}/user/${conta.id}`)}
                className="rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
              >
                Ver meu relatório
              </Button>
            </div>
          </section>
        )}

        {/* ── A turma ──────────────────────────────────────────────── */}
        {estatisticas && (
          <section
            className="exam-resultado-entra rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md sm:p-6"
            style={{ '--exam-ordem': 1 } as React.CSSProperties}
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Como foi a turma
            </h2>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Numero icone={Users} rotulo="Participantes" valor={String(estatisticas.participantes)} />
              <Numero rotulo="Média" valor={estatisticas.media.toFixed(1)} />
              <Numero icone={Trophy} rotulo="Maior nota" valor={String(estatisticas.maior)} destaque />
              <Numero rotulo="Menor nota" valor={String(estatisticas.menor)} />
            </div>

            {/*
              A distribuição em barras. Uma média sozinha esconde a forma da
              turma: 62 pode ser "todo mundo perto de 62" ou "metade em 30 e
              metade em 90", e essas duas provas pedem conversas diferentes.
            */}
            <div className="space-y-2">
              {estatisticas.distribuicao.map((faixa, i) => {
                const proporcao = (faixa.quantidade / estatisticas.participantes) * 100
                const minhaFaixa =
                  minhaPosicao &&
                  (minhaPosicao.linha.nota / notaMaxima) * 100 >= FAIXAS[i].min &&
                  (minhaPosicao.linha.nota / notaMaxima) * 100 < FAIXAS[i].max
                return (
                  <div key={faixa.rotulo} className="flex items-center gap-3">
                    <span className="w-16 flex-shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {faixa.rotulo}
                    </span>
                    <div className="h-6 flex-1 overflow-hidden rounded-lg bg-muted">
                      <div
                        className={cn(
                          'exam-retomada-barra h-full rounded-lg transition-all',
                          minhaFaixa ? 'bg-emerald-500' : 'bg-slate-400/60 dark:bg-slate-500/60',
                        )}
                        style={{ width: `${Math.max(proporcao, faixa.quantidade > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="w-8 flex-shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {faixa.quantidade}
                    </span>
                  </div>
                )
              })}
              {minhaPosicao && (
                <p className="pt-1 text-[11px] text-muted-foreground">
                  <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500 align-middle" />
                  A faixa em verde é a sua.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── Classificação ────────────────────────────────────────── */}
        <section
          className="exam-resultado-entra rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md sm:p-6"
          style={{ '--exam-ordem': 2 } as React.CSSProperties}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Medal className="h-4 w-4 text-muted-foreground" />
              {scoringMethod === 'tri' ? 'Classificação (TRI)' : 'Classificação'}
            </h2>
            {ordenadas.length > 6 && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar nome"
                  className="h-9 w-44 rounded-xl border border-border bg-background pl-8 pr-3 text-sm outline-none transition-colors focus:border-emerald-500/60"
                />
              </div>
            )}
          </div>

          {ordenadas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma entrega registrada nesta prova.
            </p>
          ) : filtradas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum nome encontrado.</p>
          ) : (
            <ol className="space-y-1.5">
              {filtradas.map((linha) => {
                const posicao = ordenadas.filter((l) => l.nota > linha.nota).length + 1
                const souEu = linha.userId === conta.id
                const podeAbrir = conta.role === 'admin' || souEu
                const proporcao = notaMaxima > 0 ? (linha.nota / notaMaxima) * 100 : 0

                return (
                  <li
                    key={linha.userId}
                    className={cn(
                      'relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 transition-colors',
                      souEu ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border/50 hover:bg-muted/40',
                    )}
                  >
                    {/* A barra de fundo dá a nota sem exigir a leitura do número. */}
                    <span
                      className={cn(
                        'absolute inset-y-0 left-0 -z-10',
                        souEu ? 'bg-emerald-500/10' : 'bg-muted/50',
                      )}
                      style={{ width: `${proporcao}%` }}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        'w-7 flex-shrink-0 text-center text-sm font-bold tabular-nums',
                        posicao === 1 ? 'text-amber-500' : 'text-muted-foreground',
                      )}
                    >
                      {posicao}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {linha.userName}
                      {souEu && (
                        <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          você
                        </span>
                      )}
                    </span>
                    <span className="flex-shrink-0 text-sm font-bold tabular-nums">
                      {linha.nota}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">/{notaMaxima}</span>
                    </span>
                    {podeAbrir && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 flex-shrink-0 rounded-lg text-xs"
                        onClick={() => router.push(`/exam/${id}/user/${linha.userId}`)}
                      >
                        Relatório
                      </Button>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        {/* ── Documentos ───────────────────────────────────────────── */}
        <section
          className="exam-resultado-entra rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md"
          style={{ '--exam-ordem': 3 } as React.CSSProperties}
        >
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Documentos</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={baixarGabarito}
              disabled={gerando || downloads.gabarito.esperandoOFim}
              className="rounded-xl"
              title={downloads.gabarito.motivo || undefined}
            >
              {gerando ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Gabarito oficial (PDF)
            </Button>

            {exam.pdfUrl && (
              <Button variant="outline" onClick={() => window.open(exam.pdfUrl, '_blank')} className="rounded-xl">
                <FileText className="mr-2 h-4 w-4" />
                PDF original da prova
              </Button>
            )}
          </div>
          {!downloads.gabarito.permitido && (
            <p className="mt-2.5 text-[11px] leading-snug text-muted-foreground">{downloads.gabarito.motivo}</p>
          )}
        </section>

        <section className="rounded-2xl border border-border/60 bg-background/60 p-5 text-center backdrop-blur-md">
          <Barcode value={id} height={48} fontSize={12} />
          <p className="mt-2 text-[11px] text-muted-foreground">Código da prova: {id}</p>
        </section>
      </main>

      <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type="info" />
    </div>
  )
}

function Numero({
  icone: Icone,
  rotulo,
  valor,
  destaque,
}: {
  icone?: typeof Users
  rotulo: string
  valor: string
  destaque?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 text-center',
        destaque ? 'border-amber-500/30 bg-amber-500/10' : 'border-border/50 bg-muted/30',
      )}
    >
      <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icone && <Icone className="h-3 w-3" />}
        {rotulo}
      </p>
      <p className="exam-numero-sobe mt-1 text-2xl font-black tabular-nums">{valor}</p>
    </div>
  )
}
