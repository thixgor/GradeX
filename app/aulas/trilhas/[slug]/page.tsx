'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Award,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  Pencil,
  Play,
  Target,
  Trophy,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { CabecalhoDeEnsino } from '@/components/ensino/cabecalho'
import {
  AnelDeProgresso,
  BarraDeProgresso,
  Cadeado,
  Capa,
  EstadoVazio,
  Esqueleto,
  LinhaDeAula,
  ProvedorDeEnsino,
  Selo,
  formatarMinutos,
  type AcessoNaTela,
  type AulaNaTela,
} from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * A página de uma Trilha (§7, §8, §28).
 *
 * A TELA TEM DE TRANSMITIR PERCURSO, NÃO CATÁLOGO
 *
 * Três decisões sustentam isso:
 *
 *  • **O CTA é único e sabe onde a pessoa está.** "Começar Trilha" para quem
 *    nunca abriu, "Continuar de onde parei" para quem já anda nela. Dois botões
 *    concorrendo obrigariam o aluno a decidir algo que o sistema já sabe.
 *  • **As etapas são a estrutura, não decoração.** Cada uma abre e fecha, com o
 *    próprio contador. É o que impede a tela de virar uma lista de trinta
 *    vídeos consecutivos (§7).
 *  • **A etapa em que a pessoa está vem aberta; as concluídas vêm fechadas.**
 *    A tela mostra o percurso inteiro, mas destaca o presente.
 *
 * A Trilha não contém as aulas — ela as referencia. Todo cartão daqui aponta
 * para a MESMA aula que aparece na busca e em outras Trilhas, com o mesmo
 * progresso.
 */

interface ItemResolvido {
  id: string
  tipo: string
  refId: string
  url?: string
  rotulo?: string
  nota?: string
  obrigatorio?: boolean
  aula: AulaNaTela | null
}

interface EtapaResolvida {
  id: string
  titulo: string
  descricao?: string
  itens: ItemResolvido[]
}

interface ProgressoDaEtapa {
  etapaId: string
  titulo: string
  total: number
  concluidos: number
  percentual: number
  completa: boolean
}

interface RespostaDaTrilha {
  trilha: {
    _id: string
    slug: string
    titulo: string
    subtitulo?: string
    descricao?: string
    objetivo?: string
    aprendizados?: string[]
    capa?: any
    nivel?: string
    publico?: string
    certificado?: { ativo: boolean } | null
    situacao: string
    etapas: EtapaResolvida[]
    resumo: { aulas: number; etapas: number; minutos: number }
  }
  progresso: {
    total: number
    concluidos: number
    percentual: number
    etapas: ProgressoDaEtapa[]
    proximo: { etapaId: string; item: { refId: string } } | null
    iniciada: boolean
    concluida: boolean
  }
  acesso: AcessoNaTela
  podeEditar: boolean
}

const ROTULO_DO_NIVEL: Record<string, string> = {
  iniciante: 'Do zero',
  intermediario: 'Intermediária',
  avancado: 'Avançada',
}

export default function TrilhaPage() {
  return (
    <AppShell headerTitle="Trilha" headerSubtitle="Caminho de estudo">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const params = useParams()
  const router = useRouter()
  const slug = String(params?.slug || '')

  const [dados, setDados] = useState<RespostaDaTrilha | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [abertas, setAbertas] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!slug) return
    let cancelado = false
    setCarregando(true)

    fetch(`/api/ensino/trilhas/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'Trilha não encontrada')
        return d as RespostaDaTrilha
      })
      .then((d) => {
        if (cancelado) return
        setDados(d)
        // A etapa em que a pessoa está começa aberta. As já concluídas ficam
        // fechadas: o percurso inteiro continua visível, sem trinta linhas de
        // conteúdo que ela já venceu ocupando a tela.
        const emCurso = d.progresso.etapas.find((e) => !e.completa)
        setAbertas(new Set(emCurso ? [emCurso.etapaId] : d.trilha.etapas.map((e) => e.id)))
      })
      .catch((e) => {
        if (!cancelado) setErro(e?.message || 'Trilha não encontrada')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [slug])

  const proximaAula = useMemo(() => {
    const alvo = dados?.progresso.proximo?.item.refId
    if (!alvo) return null
    for (const etapa of dados?.trilha.etapas || []) {
      for (const item of etapa.itens) {
        if (item.aula?._id === alvo) return item.aula
      }
    }
    return null
  }, [dados])

  const comecar = useCallback(() => {
    if (!dados) return
    const destino = proximaAula || dados.trilha.etapas.flatMap((e) => e.itens).find((i) => i.aula)?.aula
    if (!destino) return
    // Registra a entrada na Trilha antes de navegar: é isso que faz a home
    // dizer "você está na Trilha X" em vez de só "você viu um vídeo".
    fetch(`/api/ensino/trilhas/${encodeURIComponent(dados.trilha.slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'iniciar', aulaId: destino._id }),
    }).catch(() => {})
    router.push(`/aulas/${destino._id}?trilha=${encodeURIComponent(dados.trilha.slug)}`)
  }, [dados, proximaAula, router])

  if (carregando) {
    return (
      <div className="container mx-auto max-w-5xl px-4 pb-16">
        <CabecalhoDeEnsino />
        <Esqueleto className="aspect-[21/9] w-full rounded-2xl" />
        <Esqueleto className="mt-4 h-8 w-2/3" />
        <Esqueleto className="mt-2 h-4 w-1/2" />
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div className="container mx-auto max-w-5xl px-4 pb-16">
        <CabecalhoDeEnsino />
        <EstadoVazio
          icone={Layers}
          titulo="Trilha não encontrada"
          descricao="Ela pode ter sido despublicada ou o endereço está errado."
          acaoLabel="Ver todas as Trilhas"
          acaoHref="/aulas/trilhas"
        />
      </div>
    )
  }

  const { trilha, progresso, acesso } = dados

  return (
    <ProvedorDeEnsino trilha={trilha.slug}>
      <div className="container mx-auto max-w-5xl px-4 pb-20">
        <CabecalhoDeEnsino />

        {/* ── Capa e identidade ──────────────────────────────────────── */}
        <header className="mb-8">
          <div className="relative overflow-hidden rounded-2xl">
            <Capa capa={trilha.capa} titulo={trilha.titulo} className="aspect-[21/9] rounded-2xl" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {trilha.nivel && ROTULO_DO_NIVEL[trilha.nivel] ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {ROTULO_DO_NIVEL[trilha.nivel]}
                  </span>
                ) : null}
                {trilha.publico ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {trilha.publico}
                  </span>
                ) : null}
                {trilha.situacao !== 'publicada' ? (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                    Rascunho
                  </span>
                ) : null}
              </div>

              <h1 className="mt-2 font-heading text-2xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm sm:text-4xl">
                {trilha.titulo}
              </h1>
              {trilha.subtitulo ? (
                <p className="mt-1 max-w-2xl text-sm text-white/85 sm:text-base">
                  {trilha.subtitulo}
                </p>
              ) : null}
            </div>
          </div>

          {/* ── Barra de ação ────────────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {acesso.liberado ? (
              <button
                type="button"
                onClick={comecar}
                className="inline-flex h-12 flex-none items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                <Play className="h-4 w-4" fill="currentColor" />
                {progresso.concluida
                  ? 'Revisar a Trilha'
                  : progresso.iniciada
                    ? 'Continuar de onde parei'
                    : 'Começar Trilha'}
              </button>
            ) : null}

            {progresso.total > 0 ? (
              <div className="flex min-w-[10rem] flex-1 items-center gap-3">
                <AnelDeProgresso percentual={progresso.percentual} tamanho={44} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{progresso.percentual}% concluído</p>
                  <p className="text-xs text-muted-foreground">
                    {progresso.concluidos} de {progresso.total} aulas
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> {trilha.resumo.etapas}{' '}
                {trilha.resumo.etapas === 1 ? 'etapa' : 'etapas'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Play className="h-3.5 w-3.5" /> {trilha.resumo.aulas} aulas
              </span>
              {trilha.resumo.minutos > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {formatarMinutos(trilha.resumo.minutos)}
                </span>
              ) : null}
              {trilha.certificado?.ativo ? (
                <span className="inline-flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" /> Com certificado
                </span>
              ) : null}
            </div>

            {dados.podeEditar ? (
              <Link
                href={`/aulas/gerenciar/trilhas/${trilha._id}`}
                className="ml-auto inline-flex h-10 flex-none items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold transition hover:bg-muted"
              >
                <Pencil className="h-4 w-4" /> Editar
              </Link>
            ) : null}
          </div>
        </header>

        {!acesso.liberado ? <Cadeado requisito={acesso.requisito} className="mb-8" /> : null}

        {/* ── Conclusão (§28) ────────────────────────────────────────── */}
        {progresso.concluida ? (
          <section className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <Trophy className="h-6 w-6 flex-none text-primary" />
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  Trilha concluída 🎉
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {progresso.total} aulas
                  {trilha.resumo.minutos > 0
                    ? ` · ${formatarMinutos(trilha.resumo.minutos)} de conteúdo`
                    : ''}
                  . O conteúdo continua disponível para revisão sempre que você precisar.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/aulas/revisar"
                    className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Revisar esta matéria
                  </Link>
                  {trilha.certificado?.ativo ? (
                    <Link
                      href="/aulas/certificado"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm font-semibold transition hover:bg-muted"
                    >
                      <Award className="h-4 w-4" /> Emitir certificado
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Objetivo e aprendizados ────────────────────────────────── */}
        {trilha.descricao || trilha.objetivo || trilha.aprendizados?.length ? (
          <section className="mb-8 grid gap-5 sm:grid-cols-2">
            {trilha.descricao || trilha.objetivo ? (
              <div>
                {trilha.objetivo ? (
                  <>
                    <h2 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      <Target className="h-4 w-4" /> Objetivo
                    </h2>
                    <p className="text-sm leading-relaxed">{trilha.objetivo}</p>
                  </>
                ) : null}
                {trilha.descricao ? (
                  <p
                    className={cn(
                      'text-sm leading-relaxed text-muted-foreground',
                      trilha.objetivo && 'mt-3',
                    )}
                  >
                    {trilha.descricao}
                  </p>
                ) : null}
              </div>
            ) : null}

            {trilha.aprendizados?.length ? (
              <div>
                <h2 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Ao concluir, você saberá
                </h2>
                <ul className="space-y-1.5">
                  {trilha.aprendizados.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-snug">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-primary" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ── As etapas (§7) ─────────────────────────────────────────── */}
        <section className="space-y-3">
          {trilha.etapas.length === 0 ? (
            <EstadoVazio
              icone={Layers}
              titulo="Esta Trilha ainda está sendo montada"
              descricao="As etapas aparecem aqui assim que forem publicadas."
            />
          ) : (
            trilha.etapas.map((etapa, indice) => {
              const p = progresso.etapas.find((e) => e.etapaId === etapa.id)
              const aberta = abertas.has(etapa.id)

              return (
                <div
                  key={etapa.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border transition',
                    p?.completa ? 'border-border/60 bg-card/50' : 'border-border/70 bg-card',
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setAbertas((atual) => {
                        const proximo = new Set(atual)
                        if (proximo.has(etapa.id)) proximo.delete(etapa.id)
                        else proximo.add(etapa.id)
                        return proximo
                      })
                    }
                    aria-expanded={aberta}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold tabular-nums',
                        p?.completa
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {p?.completa ? <Check className="h-4 w-4" strokeWidth={3} /> : indice + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-base font-semibold leading-snug tracking-tight">
                        {etapa.titulo}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {etapa.itens.length} {etapa.itens.length === 1 ? 'aula' : 'aulas'}
                        {p && p.total > 0 ? ` · ${p.concluidos}/${p.total} concluídas` : ''}
                      </span>
                      {p && p.total > 0 && !p.completa ? (
                        <BarraDeProgresso percentual={p.percentual} className="mt-2 max-w-xs" />
                      ) : null}
                    </span>

                    <ChevronDown
                      className={cn(
                        'h-5 w-5 flex-none text-muted-foreground transition',
                        aberta && 'rotate-180',
                      )}
                    />
                  </button>

                  {aberta ? (
                    <div className="border-t border-border/60 px-1.5 py-1.5">
                      {etapa.descricao ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">{etapa.descricao}</p>
                      ) : null}

                      {etapa.itens.map((item, i) =>
                        item.aula ? (
                          <div key={item.id}>
                            <LinhaDeAula
                              aula={item.aula}
                              numero={i + 1}
                              atual={progresso.proximo?.item.refId === item.aula._id}
                            />
                            {item.nota ? (
                              <p className="px-3 pb-2 pl-[3.25rem] text-xs italic text-muted-foreground">
                                {item.nota}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <ItemComplementar key={item.id} item={item} />
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </section>
      </div>
    </ProvedorDeEnsino>
  )
}

/**
 * Conteúdo complementar dentro da etapa (§6).
 *
 * Visualmente mais leve que uma aula, e é de propósito: ele não conta no
 * progresso e não é o caminho principal. Dar a ele o mesmo peso faria a Trilha
 * parecer mais longa do que é.
 */
function ItemComplementar({ item }: { item: ItemResolvido }) {
  const destino =
    item.tipo === 'link'
      ? item.url || '#'
      : item.tipo === 'material'
        ? `/materiais/${item.refId}`
        : item.tipo === 'prova'
          ? `/exam/${item.refId}`
          : `/flashcards/d/${item.refId}`

  const Icone = item.tipo === 'link' ? ExternalLink : item.tipo === 'flashcards' ? Layers : FileText

  return (
    <a
      href={destino}
      target={item.tipo === 'link' ? '_blank' : undefined}
      rel={item.tipo === 'link' ? 'noopener noreferrer' : undefined}
      className="group flex min-h-[3rem] items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-muted/70"
    >
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icone className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground transition group-hover:text-foreground">
        {item.rotulo || 'Conteúdo complementar'}
      </span>
      <Selo>Complementar</Selo>
    </a>
  )
}
