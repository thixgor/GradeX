'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Focus,
  ListVideo,
  Loader2,
  Lock,
  PlayCircle,
  Sparkles,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { PlayerDaAula, type ControleDoPlayer } from '@/components/aulas/player'
import { PainelDeAnotacoes } from '@/components/aulas/anotacoes-painel'
import { PainelDeMarcadores } from '@/components/aulas/marcadores-painel'
import { BarraDeProgresso, CardDeAula, Trilho, type AulaNaBiblioteca } from '@/components/aulas/biblioteca'
import { FaixaModoAluno } from '@/components/aulas/faixa-modo-aluno'
import { comModo, lerModo, PARAMETRO_MODO } from '@/lib/aulas/modo-visualizacao'
import { cn } from '@/lib/utils'

/**
 * Assistir a uma aula (§6, §9, §17, §19, §20, §33).
 *
 * A tela é organizada em torno de uma pergunta: o que a pessoa faz enquanto o
 * vídeo roda? Ela assiste, anota e — quando termina — precisa saber qual é o
 * próximo passo sem voltar para a listagem.
 *
 * Por isso o vídeo domina a coluna principal, as anotações ficam ao lado (não
 * escondidas numa aba que ninguém abre), a navegação do curso é recolhível, e a
 * próxima aula aparece sozinha ao concluir. O Modo Foco tira tudo que não é
 * vídeo e anotação, para quem estuda horas seguidas.
 *
 * Aula bloqueada não vira erro: o servidor manda o motivo e o botão, e é isso
 * que a tela desenha (§17).
 */

interface Aula {
  _id: string
  titulo: string
  descricao?: string
  tipo?: string
  videoEmbed?: string
  linkOuEmbed?: string
  setorId?: string
  moduloId?: string
  avaliacao?: { examId: string; titulo?: string; obrigatoria?: boolean } | null
  capitulos?: Array<{ segundo: number; titulo: string }> | null
  transcricao?: Array<{ segundo: number; fim?: number; texto: string }> | null
  pdfs?: Array<{ nome: string; url: string; tamanho: number }>
  botoesAcesso?: Array<{ nome: string; url: string }>
  progresso?: { percentual: number; concluida: boolean; posicaoSegundos?: number } | null
  acesso?: {
    liberado: boolean
    porAmostra?: boolean
    requisito?: {
      motivo: string
      titulo: string
      acaoLabel?: string
      acaoHref?: string
      liberaEm?: string
    } | null
  }
}

interface AulaVizinha {
  _id: string
  titulo: string
  moduloId?: string
  ordem?: number
  progresso?: { concluida: boolean } | null
  acesso?: { liberado: boolean }
}

function AssistirAulaConteudo() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const aulaId = String(params?.id || '')
  const modo = lerModo(searchParams.get(PARAMETRO_MODO))

  const [aula, setAula] = useState<Aula | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [controle, setControle] = useState<ControleDoPlayer | null>(null)
  const [modoFoco, setModoFoco] = useState(false)
  const [lateralAberta, setLateralAberta] = useState(false)
  const [concluida, setConcluida] = useState(false)
  const [percentual, setPercentual] = useState(0)
  const [marcando, setMarcando] = useState(false)

  const [relacionadas, setRelacionadas] = useState<AulaNaBiblioteca[]>([])
  const [vizinhas, setVizinhas] = useState<AulaVizinha[]>([])
  const [nomeDoCurso, setNomeDoCurso] = useState<string | null>(null)

  useEffect(() => {
    if (!aulaId) return
    let cancelado = false
    setCarregando(true)

    fetch(comModo(`/api/aulas/${aulaId}`, modo), { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'Aula não encontrada')
        return d
      })
      .then((d) => {
        if (cancelado) return
        const carregada: Aula = { ...d.aula, _id: String(d.aula._id), acesso: d.acesso }
        setAula(carregada)
        setRelacionadas((d.relacionadas || []).map((r: any) => ({ ...r, _id: String(r._id) })))
        setConcluida(carregada.progresso?.concluida === true)
        setPercentual(carregada.progresso?.percentual || 0)
      })
      .catch((e) => {
        if (!cancelado) setErro(e?.message || 'Aula não encontrada')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [aulaId, modo])

  // A navegação do curso vem da árvore já filtrada por acesso — a mesma que a
  // biblioteca usa, então a lateral nunca mostra aula que a pessoa não veria lá.
  useEffect(() => {
    if (!aula?.setorId) return
    let cancelado = false
    fetch(comModo('/api/aulas', modo), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelado || !d) return
        const doCurso = (d.aulas || [])
          .filter((a: any) => a.setorId === aula.setorId)
          .map((a: any) => ({ ...a, _id: String(a._id) }))
          .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
        setVizinhas(doCurso)
        const setor = (d.setores || []).find((s: any) => String(s._id) === aula.setorId)
        setNomeDoCurso(setor?.nome || null)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [aula?.setorId, modo])

  const indiceAtual = vizinhas.findIndex((a) => a._id === aulaId)
  const proxima = indiceAtual >= 0 ? vizinhas.slice(indiceAtual + 1).find((a) => a.acesso?.liberado !== false) : undefined
  const anterior = indiceAtual > 0 ? vizinhas[indiceAtual - 1] : undefined

  const totalCurso = vizinhas.length
  const concluidasCurso = vizinhas.filter((a) => a.progresso?.concluida).length

  const aoRegistrarControle = useCallback((c: ControleDoPlayer) => setControle(c), [])
  const aoAtualizarProgresso = useCallback((p: { percentual: number; concluida: boolean }) => {
    setPercentual(p.percentual)
    setConcluida(p.concluida)
  }, [])

  async function alternarConclusao() {
    setMarcando(true)
    try {
      const res = await fetch(`/api/aulas/${aulaId}/conclusao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluida: !concluida }),
      })
      if (res.ok) {
        const d = await res.json()
        setConcluida(d.progresso?.concluida ?? !concluida)
        if (d.progresso) setPercentual(d.progresso.percentual)
      }
    } finally {
      setMarcando(false)
    }
  }

  const conteudo = aula?.videoEmbed || aula?.linkOuEmbed || ''

  if (carregando) {
    return (
      <AppShell headerTitle="Aula">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
          <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </AppShell>
    )
  }

  if (erro || !aula) {
    return (
      <AppShell headerTitle="Aula">
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-lg font-bold">Aula não encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ela pode ter sido removida ou o endereço está errado.
          </p>
          <Link
            href="/aulas"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground"
          >
            Voltar para as aulas
          </Link>
        </div>
      </AppShell>
    )
  }

  const bloqueada = aula.acesso ? !aula.acesso.liberado : false

  const corpo = (
    <div
      className={cn(
        'container mx-auto px-4 py-5',
        modoFoco ? 'max-w-5xl' : 'max-w-7xl',
      )}
    >
      {/* ── Barra superior ────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={comModo(aula.setorId ? `/aulas?curso=${aula.setorId}` : '/aulas', modo)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {nomeDoCurso || 'Aulas'}
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModoFoco((v) => !v)}
            aria-pressed={modoFoco}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition',
              modoFoco
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            <Focus className="h-3.5 w-3.5" /> Modo foco
          </button>

          {totalCurso > 0 && !modoFoco ? (
            <button
              type="button"
              onClick={() => setLateralAberta((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:text-foreground xl:hidden"
            >
              <ListVideo className="h-3.5 w-3.5" /> Conteúdo
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          'grid gap-6',
          !modoFoco && totalCurso > 0 && 'xl:grid-cols-[minmax(0,1fr)_320px]',
        )}
      >
        {/* ── Coluna principal ────────────────────────────────────────── */}
        <div className="min-w-0">
          {bloqueada ? (
            <CadeadoDaAula acesso={aula.acesso} />
          ) : conteudo ? (
            <PlayerDaAula
              aulaId={aulaId}
              videoEmbed={conteudo}
              posicaoInicial={aula.progresso?.posicaoSegundos || 0}
              aoRegistrarControle={aoRegistrarControle}
              aoAtualizarProgresso={aoAtualizarProgresso}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              Esta aula ainda não tem vídeo publicado.
            </div>
          )}

          {/* Título e ações */}
          <div className="mt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                  {aula.titulo}
                </h1>
                {aula.acesso?.porAmostra ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Esta é uma amostra das vídeo-aulas do Domine Aqui
                  </p>
                ) : null}
              </div>

              {!bloqueada ? (
                <button
                  type="button"
                  onClick={alternarConclusao}
                  disabled={marcando}
                  className={cn(
                    'inline-flex h-10 flex-none items-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60',
                    concluida
                      ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'bg-primary text-primary-foreground hover:brightness-110',
                  )}
                >
                  {marcando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : concluida ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {concluida ? 'Aula concluída' : 'Marcar como concluída'}
                </button>
              ) : null}
            </div>

            {percentual > 0 && !bloqueada ? (
              <BarraDeProgresso percentual={percentual} concluida={concluida} className="mt-3" />
            ) : null}

            {aula.descricao ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {aula.descricao}
              </p>
            ) : null}
          </div>

          {/* Próxima aula (§20) — o próximo passo sem voltar para a lista. */}
          {concluida && proxima ? (
            <Link
              href={comModo(`/aulas/${proxima._id}`, modo)}
              className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 transition hover:border-primary/60"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Próxima aula</p>
                <p className="mt-0.5 line-clamp-1 font-semibold">{proxima.titulo}</p>
              </div>
              <span className="inline-flex h-10 flex-none items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
                Continuar <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ) : null}

          {/* Anexos */}
          {!bloqueada && aula.pdfs && aula.pdfs.length > 0 ? (
            <section className="mt-5">
              <h2 className="mb-2 text-sm font-bold">Materiais da aula</h2>
              <ul className="space-y-2">
                {aula.pdfs.map((pdf) => (
                  <li key={pdf.url}>
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition hover:bg-muted"
                    >
                      <span className="truncate">{pdf.nome}</span>
                      <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Capítulos e transcrição (§10, §11): no celular vêm logo abaixo do
              vídeo — é onde a pergunta "onde está a parte que eu preciso?"
              aparece — e no desktop sobem para a lateral, junto do índice. */}
          {!bloqueada ? (
            <div className={cn('mt-6', !modoFoco && totalCurso > 0 && 'xl:hidden')}>
              <PainelDeMarcadores
                capitulos={aula.capitulos}
                transcricao={aula.transcricao}
                controle={controle}
              />
            </div>
          ) : null}

          {/* Anotações: no celular vêm aqui embaixo; no desktop, na lateral. */}
          {!bloqueada ? (
            <div className={cn('mt-6', !modoFoco && totalCurso > 0 && 'xl:hidden')}>
              <PainelDeAnotacoes aulaId={aulaId} controle={controle} />
            </div>
          ) : null}
        </div>

        {/* ── Lateral ─────────────────────────────────────────────────── */}
        {!modoFoco && totalCurso > 0 ? (
          <aside
            className={cn(
              'min-w-0 space-y-6',
              lateralAberta ? 'block' : 'hidden xl:block',
            )}
          >
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold">Conteúdo do curso</p>
                <span className="text-xs text-muted-foreground">
                  {concluidasCurso}/{totalCurso}
                </span>
              </div>
              <BarraDeProgresso
                percentual={totalCurso ? (concluidasCurso / totalCurso) * 100 : 0}
                concluida={concluidasCurso === totalCurso}
                className="mb-3"
              />

              <ol className="max-h-[60vh] space-y-0.5 overflow-y-auto">
                {vizinhas.map((v) => {
                  const atual = v._id === aulaId
                  const travada = v.acesso?.liberado === false
                  return (
                    <li key={v._id}>
                      <Link
                        href={comModo(`/aulas/${v._id}`, modo)}
                        aria-current={atual ? 'page' : undefined}
                        className={cn(
                          'flex items-start gap-2 rounded-lg px-2 py-2 text-xs transition',
                          atual ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted',
                          travada && 'opacity-60',
                        )}
                      >
                        <span className="mt-0.5 flex-none">
                          {v.progresso?.concluida ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : travada ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : atual ? (
                            <PlayCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </span>
                        <span className="line-clamp-2 leading-snug">{v.titulo}</span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </div>

            {!bloqueada ? (
              <PainelDeMarcadores
                capitulos={aula.capitulos}
                transcricao={aula.transcricao}
                controle={controle}
              />
            ) : null}

            {!bloqueada ? <PainelDeAnotacoes aulaId={aulaId} controle={controle} /> : null}
          </aside>
        ) : null}
      </div>

      {/* Avaliação (§39): a aula aponta para uma prova que já existe no sistema
          de provas, em vez de a plataforma ganhar um segundo motor de quiz. */}
      {aula.avaliacao?.examId && !bloqueada && !modoFoco ? (
        <section className="mt-8 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                {aula.avaliacao.titulo || 'Avaliação desta aula'}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {aula.avaliacao.obrigatoria
                  ? 'Necessária para concluir a aula.'
                  : 'Teste o que você acabou de ver.'}
              </p>
            </div>
            <Link
              href={`/exam/${aula.avaliacao.examId}`}
              className="inline-flex h-9 flex-none items-center rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:brightness-110"
            >
              Fazer avaliação
            </Link>
          </div>
        </section>
      ) : null}

      {/* Conteúdo relacionado (§31): a curadoria que o índice do curso não faz,
          porque atravessa módulo e curso — "antes desta, veja gasometria". */}
      {relacionadas.length > 0 && !modoFoco ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold">Veja também</h2>
          <Trilho>
            {relacionadas.map((r) => (
              <CardDeAula key={r._id} aula={r} noTrilho />
            ))}
          </Trilho>
        </section>
      ) : null}

      {/* Navegação entre aulas, sempre disponível */}
      {(anterior || proxima) && !modoFoco ? (
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-4">
          {anterior ? (
            <button
              type="button"
              onClick={() => router.push(comModo(`/aulas/${anterior._id}`, modo))}
              className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 flex-none" />
              <span className="truncate">{anterior.titulo}</span>
            </button>
          ) : (
            <span />
          )}
          {proxima ? (
            <button
              type="button"
              onClick={() => router.push(comModo(`/aulas/${proxima._id}`, modo))}
              className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-primary transition hover:brightness-110"
            >
              <span className="truncate">{proxima.titulo}</span>
              <ArrowRight className="h-4 w-4 flex-none" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  // O Modo Foco tira o shell inteiro: menu lateral, cabeçalho e o resto da
  // navegação da plataforma. Quem ativou quer o vídeo e nada mais.
  if (modoFoco) {
    return (
      <div className="min-h-screen bg-background">
        <button
          type="button"
          onClick={() => setModoFoco(false)}
          className="fixed right-4 top-4 z-50 inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card/95 px-3 text-xs font-bold shadow-lg backdrop-blur"
        >
          <X className="h-4 w-4" /> Sair do foco
        </button>
        {corpo}
      </div>
    )
  }

  return (
    <AppShell headerTitle="Aula">
      <FaixaModoAluno modo={modo} caminho={`/aulas/${aulaId}`} />
      {corpo}
    </AppShell>
  )
}

export default function AssistirAulaPage() {
  // `useSearchParams` obriga a fronteira de Suspense no App Router — sem ela o
  // build reclama e a rota inteira deixa de ser pré-renderizada.
  return (
    <Suspense
      fallback={
        <AppShell headerTitle="Aula">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
            <div className="mt-4 h-6 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </AppShell>
      }
    >
      <AssistirAulaConteudo />
    </Suspense>
  )
}

/**
 * Cadeado com motivo e saída (§17).
 *
 * Nunca uma página quebrada: o servidor já disse por que travou e para onde
 * mandar, e é exatamente isso que aparece.
 */
function CadeadoDaAula({ acesso }: { acesso?: Aula['acesso'] }) {
  const requisito = acesso?.requisito
  const agendada = requisito?.motivo === 'agendada'
  const liberaEm = requisito?.liberaEm ? new Date(requisito.liberaEm) : null

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/20 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {agendada ? <Clock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
      </span>
      <p className="text-base font-bold">{requisito?.titulo || 'Conteúdo restrito'}</p>

      {agendada && liberaEm ? (
        <p className="text-sm text-muted-foreground">
          Disponível em{' '}
          {liberaEm.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às{' '}
          {liberaEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      ) : (
        <p className="max-w-md text-sm text-muted-foreground">
          Assim que você tiver acesso, esta aula abre aqui mesmo — seu progresso e suas anotações
          continuam guardados.
        </p>
      )}

      {requisito?.acaoLabel && requisito.acaoHref ? (
        <Link
          href={requisito.acaoHref}
          className="mt-2 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
        >
          {requisito.acaoLabel}
        </Link>
      ) : null}
    </div>
  )
}
