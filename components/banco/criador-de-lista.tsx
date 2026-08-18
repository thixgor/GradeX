'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  ImageIcon,
  Layers,
  Loader2,
  MessageSquareText,
  PenLine,
  Shuffle,
  Sparkles,
  Target,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { cn } from '@/lib/utils'
import { ArvoreDoBanco, SELECAO_VAZIA, type SelecaoDaArvore } from '@/components/banco/arvore-banco'
import {
  FILTROS_VAZIOS,
  QUANTIDADES,
  QUANTIDADE_MAXIMA,
  avaliarConfiguracao,
  contarFiltros,
  corpoDaRequisicao,
  descreverLista,
  nomeSugerido,
  parametrosDeContagem,
  temAssuntoEscolhido,
  type ConfiguracaoDaLista,
  type FiltrosDaLista,
} from '@/lib/banco/criacao-lista'
import type { BancoDificuldade, BancoModoResposta, BancoQuestaoTipo } from '@/lib/types/banco-questoes'

/**
 * Criar uma lista.
 *
 * O que existia era um diálogo com nome, quantidade e um seletor de "quando
 * mostrar a resposta" — e os assuntos vinham por tabela, herdados do que
 * estivesse filtrado na página atrás. Quem quisesse "20 discursivas difíceis de
 * arritmias" tinha que montar isso em outra tela primeiro e torcer.
 *
 * Aqui os fatores são todos explícitos e ficam num fluxo de três passos, cada
 * um cabendo numa tela de celular: **de onde**, **o quê**, **como**. Em todos
 * eles o rodapé mostra a mesma frase — "20 questões objetivas difíceis de
 * Arritmias, corrigidas na hora" — e a contagem real do banco. A frase é o que
 * evita criar a lista errada; a contagem é o que evita pedir 50 quando existem
 * 12.
 */

interface Hierarquia {
  modulos: { _id: string; nome: string; totalQuestoes?: number }[]
  topicos: { _id: string; moduloId: string; nome: string; totalQuestoes?: number }[]
  subtopicos: { _id: string; topicoId: string; nome: string; totalQuestoes?: number }[]
}

type Passo = 'origem' | 'recorte' | 'formato'

const PASSOS: { id: Passo; titulo: string; legenda: string }[] = [
  { id: 'origem', titulo: 'De onde', legenda: 'Assuntos' },
  { id: 'recorte', titulo: 'O quê', legenda: 'Tipo e nível' },
  { id: 'formato', titulo: 'Como', legenda: 'Tamanho e correção' },
]

export function CriadorDeLista({
  aberto,
  hierarquia,
  anosDisponiveis,
  periodosDisponiveis = [],
  selecaoInicial,
  onFechar,
  onCriada,
}: {
  aberto: boolean
  hierarquia: Hierarquia
  anosDisponiveis: number[]
  /** Períodos letivos com contagem, ex.: [{ periodo: '2026.2', total: 148 }]. */
  periodosDisponiveis?: { periodo: string; total: number }[]
  /** Assuntos já escolhidos na página — o criador começa de onde a pessoa estava. */
  selecaoInicial?: SelecaoDaArvore
  onFechar: () => void
  onCriada: (listaId: string, incompleta: boolean, total: number) => void
}) {
  const [passo, setPasso] = useState<Passo>('origem')
  const [filtros, setFiltros] = useState<FiltrosDaLista>(FILTROS_VAZIOS)
  const [quantidade, setQuantidade] = useState(10)
  const [modoResposta, setModoResposta] = useState<BancoModoResposta>('imediato')
  const [nome, setNome] = useState('')
  const [nomeTocado, setNomeTocado] = useState(false)

  const [disponiveis, setDisponiveis] = useState<number | null>(null)
  const [contando, setContando] = useState(false)
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')

  const nomePorId = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const m of hierarquia.modulos) mapa.set(m._id, m.nome)
    for (const t of hierarquia.topicos) mapa.set(t._id, t.nome)
    for (const s of hierarquia.subtopicos) mapa.set(s._id, s.nome)
    return mapa
  }, [hierarquia])

  const nomesEscolhidos = useMemo(
    () =>
      [...filtros.subtopicoIds, ...filtros.topicoIds, ...filtros.moduloIds]
        .map((id) => nomePorId.get(id))
        .filter(Boolean) as string[],
    [filtros, nomePorId],
  )

  const config: ConfiguracaoDaLista = { ...filtros, nome, quantidade, modoResposta }
  const veredito = avaliarConfiguracao(config, disponiveis)
  const frase = descreverLista(config, nomesEscolhidos)
  const sugestao = nomeSugerido(config, nomesEscolhidos)

  // Reabrir começa do zero — menos os assuntos, que vêm da página.
  useEffect(() => {
    if (!aberto) return
    setPasso('origem')
    setFiltros({ ...FILTROS_VAZIOS, ...(selecaoInicial || {}) })
    setQuantidade(10)
    setModoResposta('imediato')
    setNomeTocado(false)
    setErro('')
    setDisponiveis(null)
  }, [aberto, selecaoInicial])

  // O nome acompanha as escolhas até a pessoa digitar o dela. `aberto` entra
  // nas dependências porque reabrir com as mesmas escolhas não mudaria a
  // sugestão — e o campo ficaria vazio, exigindo digitar do nada.
  useEffect(() => {
    if (!nomeTocado) setNome(sugestao)
  }, [aberto, sugestao, nomeTocado])

  /** Conta quantas questões casam, com folga para não disparar a cada tecla. */
  const contar = useCallback(async () => {
    setContando(true)
    try {
      const res = await fetch(`/api/banco/questoes?${parametrosDeContagem(filtros).toString()}`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const d = await res.json()
      setDisponiveis(d?.paginacao?.total ?? null)
    } finally {
      setContando(false)
    }
  }, [filtros])

  const primeiroContar = useRef(true)
  useEffect(() => {
    if (!aberto) return
    const atraso = primeiroContar.current ? 0 : 350
    primeiroContar.current = false
    const t = setTimeout(() => void contar(), atraso)
    return () => clearTimeout(t)
  }, [aberto, contar])

  async function criar() {
    setCriando(true)
    setErro('')
    try {
      const res = await fetch('/api/banco/listas/aleatorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpoDaRequisicao(config)),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(d.error || 'Não foi possível criar a lista')
        return
      }
      onCriada(String(d.lista?._id || ''), d.incompleta === true, d.totalQuestoes || 0)
    } finally {
      setCriando(false)
    }
  }

  if (!aberto) return null

  const indiceDoPasso = PASSOS.findIndex((p) => p.id === passo)
  const ultimo = indiceDoPasso === PASSOS.length - 1

  return (
    <AnimatePresence>
      {/* Fora da árvore da página: ela vive dentro de `.vidro-ambiente`, que
          isola o contexto de empilhamento, e por isso os botões flutuantes do
          rodapé passavam por cima do modal — cobrindo o botão de criar a lista.
          Nenhum `z-index` atravessa um contexto isolado. Ver
          components/ui/portal.tsx. */}
      <Portal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 backdrop-blur-md sm:items-center sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !criando) onFechar()
        }}
      >
        <motion.div
          initial={{ y: '4%', opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '3%', opacity: 0, scale: 0.99 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          role="dialog"
          aria-modal="true"
          aria-label="Criar lista de questões"
          className="vidro-denso vidro-brilho relative flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] sm:h-auto sm:max-h-[88vh] sm:rounded-[28px]"
        >
          {/* ── Cabeçalho ────────────────────────────────────────────── */}
          <div className="relative flex-none px-5 pb-3 pt-4">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-foreground/15 sm:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Montar lista
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {PASSOS[indiceDoPasso].titulo} · {PASSOS[indiceDoPasso].legenda}
                </p>
              </div>
              <button
                type="button"
                onClick={onFechar}
                aria-label="Fechar"
                className="-m-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Trilha dos passos: clicável para voltar, porque revisar uma
                escolha anterior é o movimento mais comum. */}
            <div className="mt-3 flex items-center gap-1.5">
              {PASSOS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => i <= indiceDoPasso && setPasso(p.id)}
                  disabled={i > indiceDoPasso}
                  aria-label={`Passo ${i + 1}: ${p.titulo}`}
                  aria-current={i === indiceDoPasso ? 'step' : undefined}
                  className="group h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10 disabled:cursor-default"
                >
                  <motion.span
                    className="block h-full rounded-full bg-primary"
                    initial={false}
                    animate={{ width: i <= indiceDoPasso ? '100%' : '0%' }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* ── Passos ───────────────────────────────────────────────── */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={passo}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {passo === 'origem' ? (
                  <PassoOrigem
                    hierarquia={hierarquia}
                    filtros={filtros}
                    onChange={setFiltros}
                  />
                ) : passo === 'recorte' ? (
                  <PassoRecorte
                    filtros={filtros}
                    anosDisponiveis={anosDisponiveis}
                    periodosDisponiveis={periodosDisponiveis}
                    onChange={setFiltros}
                  />
                ) : (
                  <PassoFormato
                    quantidade={quantidade}
                    onQuantidade={setQuantidade}
                    modoResposta={modoResposta}
                    onModoResposta={setModoResposta}
                    nome={nome}
                    onNome={(v) => {
                      setNomeTocado(true)
                      setNome(v)
                    }}
                    disponiveis={disponiveis}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Rodapé: a frase, a conta e o avanço ──────────────────── */}
          <div className="flex-none border-t border-foreground/10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <div className="mb-2.5 flex items-start gap-2">
              <Target className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
              <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-muted-foreground">
                {frase}
              </p>
            </div>

            <div className="mb-2.5 flex items-center gap-2 text-[11px]">
              {contando ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> contando…
                </span>
              ) : disponiveis !== null ? (
                <motion.span
                  key={disponiveis}
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'rounded-full px-2 py-0.5 font-semibold tabular-nums',
                    disponiveis === 0
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {disponiveis} {disponiveis === 1 ? 'questão disponível' : 'questões disponíveis'}
                </motion.span>
              ) : null}

              {veredito.aviso ? (
                <span className="min-w-0 flex-1 text-amber-600 dark:text-amber-400">
                  {veredito.aviso}
                </span>
              ) : null}
            </div>

            {erro ? <p className="mb-2 text-[11.5px] text-destructive">{erro}</p> : null}
            {!erro && veredito.motivo && (ultimo || disponiveis === 0) ? (
              <p className="mb-2 text-[11.5px] text-muted-foreground">{veredito.motivo}</p>
            ) : null}

            <div className="flex items-center gap-2">
              {indiceDoPasso > 0 ? (
                <button
                  type="button"
                  onClick={() => setPasso(PASSOS[indiceDoPasso - 1].id)}
                  className="inline-flex h-11 flex-none items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-muted-foreground transition hover:bg-foreground/5 active:scale-[0.98]"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
              ) : null}

              {ultimo ? (
                <button
                  type="button"
                  onClick={criar}
                  disabled={!veredito.ok || criando}
                  className="btn-brand-glow inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
                  {criando ? 'Montando…' : 'Criar lista'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPasso(PASSOS[indiceDoPasso + 1].id)}
                  disabled={disponiveis === 0}
                  className="btn-brand-glow inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      </Portal>
    </AnimatePresence>
  )
}

// ── Passo 1: de onde ──────────────────────────────────────────────────
function PassoOrigem({
  hierarquia,
  filtros,
  onChange,
}: {
  hierarquia: Hierarquia
  filtros: FiltrosDaLista
  onChange: (f: FiltrosDaLista) => void
}) {
  const daArvore = temAssuntoEscolhido(filtros)

  return (
    <div className="space-y-3 py-1">
      <div className="grid grid-cols-2 gap-2">
        <Pastilha
          marcado={!daArvore}
          onClick={() =>
            onChange({ ...filtros, moduloIds: [], topicoIds: [], subtopicoIds: [] })
          }
          icone={<Shuffle className="h-4 w-4" />}
          titulo="Todo o banco"
          descricao="Sorteia de tudo"
        />
        <Pastilha
          marcado={daArvore}
          onClick={() => {}}
          icone={<Layers className="h-4 w-4" />}
          titulo="Por assunto"
          descricao="Escolha abaixo"
        />
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-background/40 p-2">
        <div className="flex h-[46vh] flex-col sm:h-72">
          <ArvoreDoBanco
            modulos={hierarquia.modulos}
            topicos={hierarquia.topicos}
            subtopicos={hierarquia.subtopicos}
            selecao={{
              moduloIds: filtros.moduloIds,
              topicoIds: filtros.topicoIds,
              subtopicoIds: filtros.subtopicoIds,
            }}
            onChange={(s: SelecaoDaArvore) => onChange({ ...filtros, ...s })}
          />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Sem nenhum assunto marcado, a lista sorteia de todo o banco. Marcar um módulo já inclui os
        tópicos dele.
      </p>
    </div>
  )
}

// ── Passo 2: o quê ────────────────────────────────────────────────────
function PassoRecorte({
  filtros,
  anosDisponiveis,
  periodosDisponiveis,
  onChange,
}: {
  filtros: FiltrosDaLista
  anosDisponiveis: number[]
  periodosDisponiveis: { periodo: string; total: number }[]
  onChange: (f: FiltrosDaLista) => void
}) {
  return (
    <div className="space-y-4 py-1">
      <Campo titulo="Tipo de questão">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { valor: '', titulo: 'Ambas' },
              { valor: 'objetiva', titulo: 'Objetiva' },
              { valor: 'discursiva', titulo: 'Discursiva' },
            ] as const
          ).map((o) => (
            <PastilhaCurta
              key={o.valor || 'ambas'}
              marcado={(filtros.tipo || '') === o.valor}
              onClick={() => onChange({ ...filtros, tipo: o.valor as BancoQuestaoTipo | '' })}
            >
              {o.titulo}
            </PastilhaCurta>
          ))}
        </div>
      </Campo>

      <Campo titulo="Dificuldade">
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { valor: '', titulo: 'Qualquer' },
              { valor: 'facil', titulo: 'Fácil' },
              { valor: 'medio', titulo: 'Média' },
              { valor: 'dificil', titulo: 'Difícil' },
            ] as const
          ).map((o) => (
            <PastilhaCurta
              key={o.valor || 'qualquer'}
              marcado={(filtros.dificuldade || '') === o.valor}
              onClick={() =>
                onChange({ ...filtros, dificuldade: o.valor as BancoDificuldade | '' })
              }
            >
              {o.titulo}
            </PastilhaCurta>
          ))}
        </div>
      </Campo>

      {/* Período letivo antes do ano: é o recorte que a prova usa de fato
          ("N1 SOI I - 2026.2"), e a contagem aparece na própria pastilha. O ano
          continua logo abaixo, para as questões cuja prova não diz o semestre. */}
      {periodosDisponiveis.length > 0 ? (
        <Campo titulo="Período letivo" opcional>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {periodosDisponiveis.slice(0, 16).map((p) => {
              const marcado = filtros.periodos.includes(p.periodo)
              return (
                <PastilhaCurta
                  key={p.periodo}
                  marcado={marcado}
                  className="inline-flex flex-none items-center justify-center gap-1.5 px-3"
                  onClick={() =>
                    onChange({
                      ...filtros,
                      periodos: marcado
                        ? filtros.periodos.filter((x) => x !== p.periodo)
                        : [...filtros.periodos, p.periodo],
                    })
                  }
                >
                  <span className="tabular-nums">{p.periodo}</span>
                  <span className="text-[10px] opacity-60 tabular-nums">{p.total}</span>
                </PastilhaCurta>
              )
            })}
          </div>
        </Campo>
      ) : null}

      {anosDisponiveis.length > 0 ? (
        <Campo titulo="Ano" opcional>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {anosDisponiveis.slice(0, 12).map((ano) => {
              const marcado = filtros.anos.includes(ano)
              return (
                <PastilhaCurta
                  key={ano}
                  marcado={marcado}
                  className="flex-none px-3"
                  onClick={() =>
                    onChange({
                      ...filtros,
                      anos: marcado ? filtros.anos.filter((a) => a !== ano) : [...filtros.anos, ano],
                    })
                  }
                >
                  {ano}
                </PastilhaCurta>
              )
            })}
          </div>
        </Campo>
      ) : null}

      {/* ── O que já foi resolvido ────────────────────────────────────
          As duas opções são mutuamente exclusivas: "ainda não resolvi" exclui
          quem já respondeu, "só as que errei" exige ter respondido errado.
          Marcar uma desmarca a outra — nunca fazem sentido juntas. */}
      <Campo titulo="Sobre o que você já resolveu" opcional>
        <div className="grid grid-cols-2 gap-2">
          <ToggleCurto
            marcado={filtros.excluirJaResolvidas}
            onClick={() =>
              onChange({
                ...filtros,
                excluirJaResolvidas: !filtros.excluirJaResolvidas,
                apenasErradas: false,
              })
            }
            icone={<Check className="h-3.5 w-3.5" />}
            titulo="Ainda não resolvi"
            descricao="Evita repetir questão"
          />
          <ToggleCurto
            marcado={filtros.apenasErradas}
            onClick={() =>
              onChange({
                ...filtros,
                apenasErradas: !filtros.apenasErradas,
                excluirJaResolvidas: false,
              })
            }
            icone={<XCircle className="h-3.5 w-3.5" />}
            titulo="Só as que errei"
            descricao="Lista de revisão"
          />
        </div>
      </Campo>

      {/* ── Conteúdo da questão ───────────────────────────────────────
          "Com imagem" é o pedido mais direto: ECG, radiografia, lâmina — quem
          quer treinar leitura de imagem não pode sortear questão de texto
          puro. "Com resposta comentada" é para quem estuda pela explicação,
          não só treina. */}
      <Campo titulo="Conteúdo da questão" opcional>
        <div className="grid grid-cols-2 gap-2">
          <ToggleCurto
            marcado={filtros.comImagem}
            onClick={() => onChange({ ...filtros, comImagem: !filtros.comImagem })}
            icone={<ImageIcon className="h-3.5 w-3.5" />}
            titulo="Só com imagem"
            descricao="ECG, raio-X, lâmina…"
          />
          <ToggleCurto
            marcado={filtros.comExplicacao}
            onClick={() => onChange({ ...filtros, comExplicacao: !filtros.comExplicacao })}
            icone={<MessageSquareText className="h-3.5 w-3.5" />}
            titulo="Com comentário"
            descricao="Resposta explicada"
          />
        </div>
      </Campo>
    </div>
  )
}

// ── Passo 3: como ─────────────────────────────────────────────────────
function PassoFormato({
  quantidade,
  onQuantidade,
  modoResposta,
  onModoResposta,
  nome,
  onNome,
  disponiveis,
}: {
  quantidade: number
  onQuantidade: (n: number) => void
  modoResposta: BancoModoResposta
  onModoResposta: (m: BancoModoResposta) => void
  nome: string
  onNome: (v: string) => void
  disponiveis: number | null
}) {
  const teto = Math.min(QUANTIDADE_MAXIMA, Math.max(disponiveis ?? QUANTIDADE_MAXIMA, 1))

  return (
    <div className="space-y-4 py-1">
      <Campo titulo="Quantas questões">
        <div className="grid grid-cols-5 gap-2">
          {QUANTIDADES.map((n) => (
            <PastilhaCurta key={n} marcado={quantidade === n} onClick={() => onQuantidade(n)}>
              {n}
            </PastilhaCurta>
          ))}
        </div>
        {/* O controle contínuo existe porque os atalhos nunca cobrem o número
            que a pessoa quer — e o teto acompanha o que o banco tem. */}
        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={teto}
            value={Math.min(quantidade, teto)}
            onChange={(e) => onQuantidade(Number(e.target.value))}
            className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-foreground/10 accent-primary"
            aria-label="Quantidade de questões"
          />
          <span className="w-12 flex-none rounded-lg bg-primary/10 py-1 text-center text-sm font-bold tabular-nums text-primary">
            {quantidade}
          </span>
        </div>
      </Campo>

      <Campo titulo="Quando ver a resposta">
        <div className="grid gap-2 sm:grid-cols-2">
          <Pastilha
            marcado={modoResposta === 'imediato'}
            onClick={() => onModoResposta('imediato')}
            icone={<Zap className="h-4 w-4" />}
            titulo="Na hora"
            descricao="Corrige a cada questão"
          />
          <Pastilha
            marcado={modoResposta === 'final'}
            onClick={() => onModoResposta('final')}
            icone={<Clock className="h-4 w-4" />}
            titulo="No final"
            descricao="Como um simulado"
          />
        </div>
      </Campo>

      <Campo titulo="Nome da lista">
        <div className="relative">
          <PenLine className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={nome}
            onChange={(e) => onNome(e.target.value)}
            placeholder="Ex: Arritmias antes da P1"
            className="h-11 w-full rounded-2xl border border-foreground/10 bg-background/60 pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Sugerimos um nome a partir do que você escolheu — troque à vontade.
        </p>
      </Campo>
    </div>
  )
}

// ── Peças ─────────────────────────────────────────────────────────────
function Campo({
  titulo,
  opcional,
  children,
}: {
  titulo: string
  opcional?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
        {opcional ? <span className="ml-1 normal-case opacity-60">(opcional)</span> : null}
      </p>
      {children}
    </div>
  )
}

function Pastilha({
  marcado,
  onClick,
  icone,
  titulo,
  descricao,
}: {
  marcado: boolean
  onClick: () => void
  icone: React.ReactNode
  titulo: string
  descricao: string
}) {
  return (
    <button
      type="button"
      data-marcado={marcado}
      onClick={onClick}
      aria-pressed={marcado}
      className="vidro-pastilha flex items-start gap-2.5 rounded-2xl p-3 text-left"
    >
      <span
        className={cn(
          'flex h-8 w-8 flex-none items-center justify-center rounded-xl transition',
          marcado ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-muted-foreground',
        )}
      >
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold leading-tight">{titulo}</span>
        <span className="block text-[11px] leading-snug text-muted-foreground">{descricao}</span>
      </span>
    </button>
  )
}

function PastilhaCurta({
  marcado,
  onClick,
  className,
  children,
}: {
  marcado: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      data-marcado={marcado}
      onClick={onClick}
      aria-pressed={marcado}
      className={cn(
        'vidro-pastilha h-10 rounded-2xl text-[12.5px] font-semibold tabular-nums',
        marcado ? 'text-primary' : 'text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

/**
 * Um interruptor com ícone, título e descrição — a versão curta da `Pastilha`
 * grande, para caber duas por linha nos filtros opcionais deste passo.
 */
function ToggleCurto({
  marcado,
  onClick,
  icone,
  titulo,
  descricao,
}: {
  marcado: boolean
  onClick: () => void
  icone: React.ReactNode
  titulo: string
  descricao: string
}) {
  return (
    <button
      type="button"
      data-marcado={marcado}
      onClick={onClick}
      aria-pressed={marcado}
      className="vidro-pastilha flex items-center gap-2.5 rounded-2xl p-2.5 text-left"
    >
      <span
        className={cn(
          'flex h-8 w-8 flex-none items-center justify-center rounded-xl transition',
          marcado ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-muted-foreground',
        )}
      >
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-bold leading-tight">{titulo}</span>
        <span className="block truncate text-[10.5px] leading-snug text-muted-foreground">
          {descricao}
        </span>
      </span>
    </button>
  )
}
