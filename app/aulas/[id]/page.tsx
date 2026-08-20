'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileText,
  Layers,
  ListVideo,
  Loader2,
  MessageCircle,
  StickyNote,
  Play,
  Route,
  Sparkles,
  X,
} from 'lucide-react'

import { motion, useReducedMotion } from 'framer-motion'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA, RESPIRO_DO_TOPO } from '@/components/ensino/doca'
import { BotaoDuo, Confete } from '@/components/ensino/duo'
import { PlayerDaAula, type ControleDoPlayer } from '@/components/aulas/player'
import { PainelDeAnotacoes } from '@/components/aulas/anotacoes-painel'
import {
  BarraDeProgresso,
  Cadeado,
  CartaoDeAula,
  EstadoVazio,
  Esqueleto,
  LinhaDeAula,
  Migalha,
  ProvedorDeEnsino,
  Selo,
  SeloDeProfundidade,
  Trilho,
  type AcessoNaTela,
  type AulaNaTela,
} from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * Assistir a uma aula (§9, §10, §11, §17, §19, §20, §35).
 *
 * A PRIORIDADE ABSOLUTA É O CONTEÚDO
 *
 * A tela anterior tinha, ao redor do player: navegação do curso, anotações,
 * marcadores, avaliação, relacionadas, modo foco e uma faixa de progresso —
 * tudo aberto ao mesmo tempo, competindo com o vídeo. Aqui a regra é outra: o
 * player e o que está IMEDIATAMENTE ao redor dele (título, onde estou, próxima
 * aula, concluir) ficam visíveis; todo o resto entra em ABAS, que existem
 * apenas quando têm conteúdo (§10).
 *
 * A ABA É A RESPOSTA CERTA PARA "MUITOS RECURSOS"
 *
 * Uma aula pode ter resumo, PDF, flashcards, anotações e dúvidas. Cinco botões
 * lado a lado viram cinco decisões a cada abertura; cinco abas viram uma. E aba
 * de recurso inexistente simplesmente não é desenhada — a interface encolhe com
 * a aula, em vez de mostrar cinco portas com quatro trancadas.
 *
 * O CONTEXTO DA TRILHA É OPCIONAL (§4)
 *
 * Com `?trilha=slug`, a tela ganha etapa, progresso, anterior e próxima. Sem
 * ele, a mesma aula abre sozinha e continua completa — é a mesma aula, não uma
 * versão reduzida. Essa é a expressão na interface do princípio central: o
 * conteúdo existe uma vez e serve a vários caminhos.
 */

type Aba = 'aula' | 'resumo' | 'pdf' | 'flashcards' | 'anotacoes' | 'discussao'

interface Recursos {
  aula: boolean
  resumo: AulaNaTela | null
  aulaPrincipal: AulaNaTela | null
  pdf: boolean
  flashcards: Array<{ _id: string; titulo: string; cards: number; href: string }>
  pdfs: Array<{ nome: string; url: string }>
  anotacoes: boolean
  discussao: boolean
}

interface ContextoDaTrilha {
  slug: string
  titulo: string
  etapa: { titulo: string; indice: number; total: number; itens: AulaNaTela[] }
  anterior: AulaNaTela | null
  proxima: AulaNaTela | null
  progresso: { percentual: number; concluidos: number; total: number }
}

interface RespostaDaAula {
  aula: {
    _id: string
    titulo: string
    descricao?: string
    videoEmbed?: string
    linkOuEmbed?: string
    botoesAcesso?: Array<{ nome: string; url: string }>
    duracaoLabel?: string
    ensino?: { profundidade?: string; tags?: string[]; tipo?: string }
  }
  acesso: AcessoNaTela
  progresso: { percentual: number; concluida: boolean; posicaoSegundos?: number } | null
  caminho: Array<{ _id: string; nome: string; nivel: string }>
  recursos: Recursos
  prerequisitos: AulaNaTela[]
  relacionadas: AulaNaTela[]
  professores: Array<{ _id: string; nome: string; foto?: string | null; titulacao?: string | null }>
  trilha: ContextoDaTrilha | null
  trilhasQueContem: Array<{ slug: string; titulo: string; subtitulo?: string }>
  reforco: Array<{ rotulo: string; href: string }>
}

export default function AssistirAulaPage() {
  return (
    <AppShell headerTitle="Aula" headerSubtitle="Área de Ensino" comercio={false} vidro>
      <Suspense
        fallback={
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <Esqueleto className="aspect-video w-full rounded-2xl" />
          </div>
        }
      >
        <Conteudo />
      </Suspense>
    </AppShell>
  )
}

function Conteudo() {
  const params = useParams()
  const router = useRouter()
  const busca = useSearchParams()
  const aulaId = String(params?.id || '')
  const slugDaTrilha = busca.get('trilha') || ''
  const abaInicial = (busca.get('aba') || 'aula') as Aba
  const segundoInicial = Number(busca.get('t')) || 0

  const [dados, setDados] = useState<RespostaDaAula | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<Aba>(abaInicial)
  const [controle, setControle] = useState<ControleDoPlayer | null>(null)
  const [concluida, setConcluida] = useState(false)
  const [percentual, setPercentual] = useState(0)
  const [marcando, setMarcando] = useState(false)
  const [impedimento, setImpedimento] = useState('')
  const [mostrarReforco, setMostrarReforco] = useState(false)
  const [indiceAberto, setIndiceAberto] = useState(false)
  const [celebrar, setCelebrar] = useState(false)
  const jaConcluidaAoAbrir = useRef(false)
  const semMovimento = useReducedMotion()

  /** Dispara a comemoração uma vez, na transição para concluída. */
  const comemorar = useCallback(() => {
    setCelebrar(true)
    setTimeout(() => setCelebrar(false), 2400)
  }, [])

  useEffect(() => {
    if (!aulaId) return
    let cancelado = false
    setCarregando(true)
    setErro('')

    const endereco = `/api/ensino/aulas/${aulaId}${slugDaTrilha ? `?trilha=${encodeURIComponent(slugDaTrilha)}` : ''}`

    fetch(endereco, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'Aula não encontrada')
        return d as RespostaDaAula
      })
      .then((d) => {
        if (cancelado) return
        setDados(d)
        setConcluida(d.progresso?.concluida === true)
        setPercentual(d.progresso?.percentual || 0)
        jaConcluidaAoAbrir.current = d.progresso?.concluida === true
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
  }, [aulaId, slugDaTrilha])

  /** Abre o vídeo no segundo pedido pela anotação (`?t=`). */
  useEffect(() => {
    if (segundoInicial > 0 && controle?.navegavel) controle.irPara(segundoInicial)
  }, [controle, segundoInicial])

  const aoRegistrarControle = useCallback((c: ControleDoPlayer) => setControle(c), [])

  const aoAtualizarProgresso = useCallback((p: { percentual: number; concluida: boolean }) => {
    setPercentual(p.percentual)
    setConcluida((antes) => {
      // O convite à revisão só aparece na TRANSIÇÃO para concluída, e nunca
      // para quem abriu uma aula que já tinha terminado: seria uma sugestão
      // repetida a cada visita (§17).
      if (p.concluida && !antes && !jaConcluidaAoAbrir.current) {
        setMostrarReforco(true)
        comemorar()
      }
      return p.concluida
    })
  }, [comemorar])

  async function alternarConclusao() {
    setMarcando(true)
    setImpedimento('')
    try {
      const resposta = await fetch(`/api/aulas/${aulaId}/conclusao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluida: !concluida }),
      })
      const d = await resposta.json().catch(() => ({}))
      if (resposta.ok) {
        const virou = d.progresso?.concluida ?? !concluida
        setConcluida(virou)
        if (d.progresso) setPercentual(d.progresso.percentual)
        if (virou && !jaConcluidaAoAbrir.current) {
          setMostrarReforco(true)
          comemorar()
        }
      } else {
        setImpedimento(d.error || 'Não foi possível marcar a aula como concluída.')
      }
    } finally {
      setMarcando(false)
    }
  }

  const abas = useMemo(() => {
    if (!dados) return [] as Array<{ id: Aba; rotulo: string; icone: typeof Play }>
    const lista: Array<{ id: Aba; rotulo: string; icone: typeof Play }> = [
      { id: 'aula', rotulo: 'Aula', icone: Play },
    ]
    if (dados.recursos.resumo) lista.push({ id: 'resumo', rotulo: 'Resumo', icone: Sparkles })
    if (dados.recursos.pdfs?.length) lista.push({ id: 'pdf', rotulo: 'PDF', icone: FileText })
    if (dados.recursos.flashcards?.length) {
      lista.push({ id: 'flashcards', rotulo: 'Flashcards', icone: Layers })
    }
    lista.push({ id: 'anotacoes', rotulo: 'Anotações', icone: StickyNote })
    if (dados.recursos.discussao) {
      lista.push({ id: 'discussao', rotulo: 'Dúvidas', icone: MessageCircle })
    }
    return lista
  }, [dados])

  if (carregando) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Esqueleto className="mb-4 h-4 w-64" />
        <Esqueleto className="aspect-video w-full rounded-2xl" />
        <Esqueleto className="mt-4 h-7 w-2/3" />
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <EstadoVazio
          icone={BookOpen}
          titulo="Aula não encontrada"
          descricao="Ela pode ter saído do ar ou o endereço está errado."
          acaoLabel="Voltar para o Ensino"
          acaoHref="/aulas"
        />
      </div>
    )
  }

  const { aula, acesso, recursos, trilha } = dados
  const video = aula.videoEmbed || aula.linkOuEmbed || ''

  return (
    <ProvedorDeEnsino trilha={trilha?.slug}>
      <div className={`container mx-auto max-w-6xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>
        {/* ── Onde estou ─────────────────────────────────────────────── */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          {trilha ? (
            <Link
              href={`/aulas/trilhas/${trilha.slug}`}
              className="group inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-primary"
            >
              <Route className="h-4 w-4 flex-none" />
              <span className="truncate">{trilha.titulo}</span>
              <span className="flex-none text-xs font-medium text-muted-foreground">
                · Etapa {trilha.etapa.indice} de {trilha.etapa.total}
              </span>
            </Link>
          ) : (
            <Migalha
              itens={dados.caminho.map((n) => ({
                _id: n._id,
                nome: n.nome,
                href: `/aulas/explorar?no=${n._id}`,
              }))}
            />
          )}

          {trilha ? (
            <div className="flex flex-none items-center gap-2 text-xs text-muted-foreground">
              <BarraDeProgresso percentual={trilha.progresso.percentual} className="w-24" />
              <span className="tabular-nums">
                {trilha.progresso.concluidos}/{trilha.progresso.total}
              </span>
            </div>
          ) : null}
        </div>

        <div className="lg:flex lg:gap-6">
          {/* ── Coluna principal ─────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {acesso.liberado && video ? (
              <PlayerDaAula
                aulaId={aulaId}
                videoEmbed={video}
                posicaoInicial={dados.progresso?.posicaoSegundos || 0}
                aoRegistrarControle={aoRegistrarControle}
                aoAtualizarProgresso={aoAtualizarProgresso}
              />
            ) : acesso.liberado ? (
              <EstadoVazio
                icone={Play}
                titulo="Esta aula ainda não tem vídeo"
                descricao="Assim que o conteúdo for publicado, ele aparece aqui."
              />
            ) : (
              <Cadeado requisito={acesso.requisito} />
            )}

            {/* ── Título e ações ───────────────────────────────────── */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                {aula.ensino?.tipo === 'resumo' ? <Selo tom="primario">Aula Resumo</Selo> : null}
                <SeloDeProfundidade profundidade={aula.ensino?.profundidade} />
                {acesso.porAmostra ? (
                  <Selo tom="aviso">Esta é uma aula demonstrativa do Domine Aqui</Selo>
                ) : null}
                {aula.duracaoLabel ? <Selo>{aula.duracaoLabel}</Selo> : null}
              </div>

              <h1 className="mt-2 font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                {aula.titulo}
              </h1>

              {dados.professores.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {dados.professores.map((professor) => (
                    <span key={professor._id} className="flex items-center gap-2">
                      {professor.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={professor.foto}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : null}
                      <span className="text-sm">
                        <span className="font-semibold">{professor.nome}</span>
                        {professor.titulacao ? (
                          <span className="text-muted-foreground"> · {professor.titulacao}</span>
                        ) : null}
                      </span>
                    </span>
                  ))}
                </div>
              ) : null}

              {acesso.liberado ? (
                <div className="relative mt-3 flex flex-wrap items-center gap-2">
                  <Confete ativo={celebrar} />

                  <motion.div
                    // O botão dá um pulinho ao virar concluído. É meio segundo
                    // de retorno para uma ação que, sem ele, só troca uma cor.
                    animate={
                      semMovimento || !concluida ? {} : { scale: [1, 1.08, 1] }
                    }
                    transition={{ duration: 0.35 }}
                  >
                    <BotaoDuo
                      onClick={alternarConclusao}
                      disabled={marcando}
                      tom={concluida ? 'primario' : 'claro'}
                    >
                      {marcando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" strokeWidth={concluida ? 3.5 : 2.5} />
                      )}
                      {concluida ? 'Concluída' : 'Marcar como concluída'}
                    </BotaoDuo>
                  </motion.div>

                  {(aula.botoesAcesso || []).map((botao) => (
                    <BotaoDuo
                      key={botao.url}
                      tom="claro"
                      href={botao.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {botao.nome}
                    </BotaoDuo>
                  ))}

                  {percentual > 0 && !concluida ? (
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {percentual}% assistido
                    </span>
                  ) : null}
                </div>
              ) : null}

              {impedimento ? (
                <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {impedimento}
                </p>
              ) : null}
            </div>

            {/* ── O que vem depois (§9, §17) ───────────────────────── */}
            {mostrarReforco ? (
              <PainelDeConclusao
                trilha={trilha}
                reforco={dados.reforco}
                relacionada={dados.relacionadas[0] || null}
                aoDispensar={() => setMostrarReforco(false)}
              />
            ) : null}

            {/* ── Navegação sequencial (§9) ────────────────────────── */}
            {trilha ? (
              <nav className="mt-4 grid gap-2 sm:grid-cols-2">
                {trilha.anterior ? (
                  <Link
                    href={`${trilha.anterior.href}`}
                    className="group flex items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border/70 shadow-[0_3px_0_rgb(0_0_0/0.08)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
                  >
                    <ArrowLeft className="h-4 w-4 flex-none text-muted-foreground transition group-hover:-translate-x-0.5" />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Aula anterior
                      </span>
                      <span className="block truncate text-sm font-medium">
                        {trilha.anterior.titulo}
                      </span>
                    </span>
                  </Link>
                ) : (
                  <span className="hidden sm:block" />
                )}

                {trilha.proxima ? (
                  <Link
                    href={`${trilha.proxima.href}`}
                    className="group flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-right ring-1 ring-primary/30 shadow-[0_3px_0_rgb(0_0_0/0.08)] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-primary">
                        Próxima aula
                      </span>
                      <span className="block truncate text-sm font-medium">
                        {trilha.proxima.titulo}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 flex-none text-primary transition group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/aulas/trilhas/${trilha.slug}`}
                    className="group flex items-center justify-end gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 transition hover:border-primary/40"
                  >
                    <span className="text-sm font-medium">Última aula da Trilha — ver índice</span>
                    <ArrowRight className="h-4 w-4 flex-none text-muted-foreground" />
                  </Link>
                )}
              </nav>
            ) : null}

            {/* ── Abas (§10) ───────────────────────────────────────── */}
            <div className="mt-6">
              <div
                role="tablist"
                className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {abas.map(({ id, rotulo, icone: Icone }) => (
                  <button
                    key={id}
                    role="tab"
                    type="button"
                    aria-selected={aba === id}
                    onClick={() => setAba(id)}
                    className={cn(
                      'inline-flex h-11 flex-none items-center gap-1.5 border-b-2 px-3 text-sm font-semibold transition',
                      aba === id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icone className="h-4 w-4" />
                    {rotulo}
                  </button>
                ))}
              </div>

              <div className="pt-4">
                {aba === 'aula' ? (
                  <SobreAula dados={dados} />
                ) : aba === 'resumo' && recursos.resumo ? (
                  <PainelDoResumo resumo={recursos.resumo} trilhaSlug={trilha?.slug} />
                ) : aba === 'pdf' ? (
                  <PainelDePdf pdfs={recursos.pdfs || []} />
                ) : aba === 'flashcards' ? (
                  <PainelDeFlashcards decks={recursos.flashcards || []} />
                ) : aba === 'anotacoes' ? (
                  <PainelDeAnotacoes aulaId={aulaId} controle={controle} />
                ) : (
                  <EstadoVazio
                    icone={MessageCircle}
                    titulo="Dúvidas em breve"
                    descricao="O espaço de discussão desta aula está sendo preparado."
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Lateral: o conteúdo da etapa atual ───────────────────── */}
          {trilha ? (
            <aside className="mt-6 w-full flex-none lg:mt-0 lg:w-80">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card lg:sticky lg:top-20">
                <button
                  type="button"
                  onClick={() => setIndiceAberto((v) => !v)}
                  aria-expanded={indiceAberto}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left lg:cursor-default"
                >
                  <ListVideo className="h-4 w-4 flex-none text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {trilha.etapa.titulo}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Etapa {trilha.etapa.indice} de {trilha.etapa.total}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 flex-none text-muted-foreground transition lg:hidden',
                      indiceAberto && 'rotate-180',
                    )}
                  />
                </button>

                {/* No celular a lista é recolhível — ela não pode empurrar o
                    player para fora da tela. No desktop fica sempre aberta. */}
                <div
                  className={cn(
                    'max-h-[60vh] overflow-y-auto border-t border-border/60 p-1.5',
                    indiceAberto ? 'block' : 'hidden lg:block',
                  )}
                >
                  {trilha.etapa.itens.map((item, i) => (
                    <LinhaDeAula
                      key={item._id}
                      aula={item}
                      numero={i + 1}
                      atual={item._id === aulaId}
                    />
                  ))}
                </div>

                <Link
                  href={`/aulas/trilhas/${trilha.slug}`}
                  className="flex items-center justify-center gap-1.5 border-t border-border/60 px-4 py-2.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
                >
                  Ver a Trilha completa <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </ProvedorDeEnsino>
  )
}

/**
 * O que acontece quando a aula termina (§9).
 *
 * ══ O FIM DE UMA AULA É O COMEÇO DA PRÓXIMA ══════════════════════════
 *
 * Antes, concluir uma aula produzia uma faixa fina perguntando "quer reforçar
 * esse conteúdo?" com três atalhos do mesmo tamanho — e a próxima aula ficava
 * mais abaixo, num par de cartões cinza empatados com o "aula anterior". O
 * momento de maior embalo do estudo terminava numa escolha entre iguais, e a
 * saída mais fácil da tela era o "voltar".
 *
 * Aqui a conclusão é anunciada, a próxima aula é NOMEADA e o botão dela é o
 * único elemento sólido do bloco. Reforçar continua possível, um degrau abaixo,
 * porque é o que uma minoria quer fazer naquele instante — e não o padrão.
 *
 * Sem Trilha o painel não inventa uma sequência: oferece o reforço e, se
 * houver, um conteúdo relacionado. Uma "próxima aula" fabricada a partir da
 * ordem do acervo seria pior do que nenhuma.
 */
function PainelDeConclusao({
  trilha,
  reforco,
  relacionada,
  aoDispensar,
}: {
  trilha: ContextoDaTrilha | null
  reforco: Array<{ rotulo: string; href: string }>
  relacionada: AulaNaTela | null
  aoDispensar: () => void
}) {
  const proxima = trilha?.proxima || null
  const terminouATrilha = Boolean(trilha && !proxima)
  const seguinte = proxima || (!trilha ? relacionada : null)

  return (
    <div className="mt-4 overflow-hidden rounded-3xl bg-primary/[0.07] ring-1 ring-primary/25">
      <div className="flex items-start gap-3 px-4 pt-4">
        <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-5 w-5" strokeWidth={3.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-extrabold tracking-tight">
            {terminouATrilha ? 'Trilha concluída!' : 'Aula concluída'}
          </p>
          <p className="text-xs text-muted-foreground">
            {terminouATrilha
              ? `Você fechou ${trilha!.titulo}.`
              : proxima
                ? `Faltam ${Math.max(0, trilha!.progresso.total - trilha!.progresso.concluidos)} de ${trilha!.progresso.total} aulas nesta Trilha.`
                : 'Registrado no seu progresso.'}
          </p>
        </div>
        <button
          type="button"
          onClick={aoDispensar}
          aria-label="Dispensar"
          className="-mr-1 -mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* A próxima aula, nomeada e com o único botão sólido do bloco. */}
      {seguinte ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-primary/15 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-primary">
              {proxima ? 'Próxima aula' : 'Continue por aqui'}
            </p>
            <p className="truncate text-sm font-bold">{seguinte.titulo}</p>
          </div>
          <BotaoDuo href={seguinte.href} className="flex-none">
            <Play className="h-4 w-4" fill="currentColor" />
            Continuar
          </BotaoDuo>
        </div>
      ) : terminouATrilha ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-primary/15 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-primary">
              Feche o ciclo
            </p>
            <p className="truncate text-sm font-bold">Veja o caminho inteiro que você percorreu</p>
          </div>
          <BotaoDuo href={`/aulas/trilhas/${trilha!.slug}`} className="flex-none">
            <Route className="h-4 w-4" />
            Ver a Trilha
          </BotaoDuo>
        </div>
      ) : null}

      {/* O reforço, um degrau abaixo — botões claros, nunca sólidos. */}
      {reforco.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-primary/15 px-4 py-3">
          <span className="text-xs font-semibold text-muted-foreground">Antes de seguir:</span>
          {reforco.map((atalho) => (
            <BotaoDuo key={atalho.href} href={atalho.href} tom="claro" tamanho="pequeno">
              {atalho.rotulo}
            </BotaoDuo>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* =================== ABAS =================== */

/**
 * A aba "Aula": descrição, pré-requisitos, relacionadas e as Trilhas que contêm
 * esta aula.
 *
 * As Trilhas ficam aqui, e não no topo, de propósito: quem chegou pela busca
 * veio atrás DESTA aula (§4). Descobrir que existe um caminho inteiro sobre o
 * assunto é um bônus valioso, mas não pode competir com o vídeo que a pessoa
 * abriu para assistir.
 */
function SobreAula({ dados }: { dados: RespostaDaAula }) {
  return (
    <div className="space-y-6">
      {dados.aula.descricao ? (
        <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {dados.aula.descricao}
        </p>
      ) : null}

      {dados.prerequisitos.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-bold">Recomendamos conhecer antes</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Não é obrigatório — se você já domina, siga em frente.
          </p>
          <Trilho>
            {dados.prerequisitos.map((aula) => (
              <CartaoDeAula key={aula._id} aula={aula} />
            ))}
          </Trilho>
        </section>
      ) : null}

      {dados.trilhasQueContem.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-bold">Esta aula faz parte de</h2>
          <div className="flex flex-wrap gap-2">
            {dados.trilhasQueContem.map((trilha) => (
              <Link
                key={trilha.slug}
                href={`/aulas/trilhas/${trilha.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
              >
                <Route className="h-3.5 w-3.5 text-primary" />
                {trilha.titulo}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {dados.relacionadas.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-bold">Conteúdo relacionado</h2>
          <Trilho>
            {dados.relacionadas.map((aula) => (
              <CartaoDeAula key={aula._id} aula={aula} />
            ))}
          </Trilho>
        </section>
      ) : null}
    </div>
  )
}

/**
 * A aba "Resumo".
 *
 * Não embute um segundo player: leva à Aula Resumo, que é uma aula de verdade
 * com progresso e anotações próprios (§3). Duplicar o player aqui criaria uma
 * segunda sessão de vídeo cujo progresso ninguém saberia onde foi parar.
 */
function PainelDoResumo({ resumo, trilhaSlug }: { resumo: AulaNaTela; trilhaSlug?: string }) {
  const href = trilhaSlug ? `${resumo.href}?trilha=${encodeURIComponent(trilhaSlug)}` : resumo.href

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Aula Resumo</p>
        <h3 className="mt-0.5 font-heading text-base font-semibold tracking-tight">
          {resumo.titulo}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          A versão condensada desta aula
          {resumo.duracaoLabel ? ` — ${resumo.duracaoLabel}` : ''}. Ideal para revisar depois.
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex h-10 flex-none items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <Play className="h-4 w-4" fill="currentColor" /> Assistir resumo
      </Link>
    </div>
  )
}

function PainelDePdf({ pdfs }: { pdfs: Array<{ nome: string; url: string }> }) {
  if (pdfs.length === 0) {
    return (
      <EstadoVazio
        icone={FileText}
        titulo="Sem PDF nesta aula"
        descricao="Quando houver material escrito, ele aparece aqui."
      />
    )
  }

  return (
    <div className="space-y-2">
      {pdfs.map((pdf) => (
        <a
          key={pdf.url}
          href={pdf.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 transition hover:border-primary/40"
        >
          <FileText className="h-5 w-5 flex-none text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{pdf.nome}</span>
          <Download className="h-4 w-4 flex-none text-muted-foreground transition group-hover:text-primary" />
        </a>
      ))}
    </div>
  )
}

function PainelDeFlashcards({
  decks,
}: {
  decks: Array<{ _id: string; titulo: string; cards: number; href: string }>
}) {
  if (decks.length === 0) {
    return (
      <EstadoVazio
        icone={Layers}
        titulo="Sem flashcards nesta aula"
        descricao="Quando houver um deck vinculado, ele aparece aqui."
      />
    )
  }

  return (
    <div className="space-y-2">
      {decks.map((deck) => (
        <Link
          key={deck._id}
          href={deck.href}
          className="group flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 transition hover:border-primary/40"
        >
          <Layers className="h-5 w-5 flex-none text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{deck.titulo}</span>
            <span className="block text-xs text-muted-foreground">{deck.cards} cards</span>
          </span>
          <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      ))}
    </div>
  )
}
