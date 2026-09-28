'use client'

import {
  ArrowRight,
  Check,
  ChevronDown,
  HelpCircle,
  ExternalLink,
  Lightbulb,
  ListChecks,
  Loader2,
  PenLine,
  RotateCcw,
  Target,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Correcao, QuestaoPublica, TipoDeQuestao } from '@/lib/histologia-zoom/quiz/banco'
import { VisorDoQuiz } from './visor'

interface SistemaDisponivel {
  sistema: string
  nome: string
  estrutura: number
  orgao: number
}

type Formato = 'objetiva' | 'escrita' | 'misto'

interface Registro {
  questao: QuestaoPublica
  resposta: string
  correcao: Correcao
  usouDica: boolean
}

const API = '/api/manual-clinico/histologia-zoom/quiz'
const LETRAS = ['A', 'B', 'C', 'D', 'E']

export function QuizDeIdentificacao({ sistemas }: { sistemas: SistemaDisponivel[] }) {
  const [fase, setFase] = useState<'config' | 'carregando' | 'questao' | 'fim'>('config')
  const [tipos, setTipos] = useState<TipoDeQuestao[]>(['estrutura', 'orgao'])
  const [formato, setFormato] = useState<Formato>('misto')
  const [escolhidos, setEscolhidos] = useState<string[]>([])
  const [quantidade, setQuantidade] = useState(20)
  const [questoes, setQuestoes] = useState<QuestaoPublica[]>([])
  const [indice, setIndice] = useState(0)
  const [registros, setRegistros] = useState<Registro[]>([])
  const [erro, setErro] = useState<string | null>(null)

  const disponiveis = useMemo(() => {
    const alvo = escolhidos.length ? sistemas.filter((s) => escolhidos.includes(s.sistema)) : sistemas
    return alvo.reduce((n, s) => n + (tipos.includes('estrutura') ? s.estrutura : 0) + (tipos.includes('orgao') ? s.orgao : 0), 0)
  }, [escolhidos, sistemas, tipos])

  const iniciar = async () => {
    setErro(null)
    setFase('carregando')
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipos, formato, sistemas: escolhidos, quantidade, semente: Math.floor(Math.random() * 2 ** 31) }),
      })
      if (!r.ok) throw new Error(String(r.status))
      const { questoes } = (await r.json()) as { questoes: QuestaoPublica[] }
      if (!questoes.length) throw new Error('vazio')
      setQuestoes(questoes)
      setIndice(0)
      setRegistros([])
      setFase('questao')
      window.scrollTo({ top: 0 })
    } catch {
      setErro('Não foi possível montar o quiz. Tente de novo.')
      setFase('config')
    }
  }

  if (fase === 'config' || fase === 'carregando') {
    return (
      <Configuracao
        sistemas={sistemas}
        tipos={tipos}
        setTipos={setTipos}
        formato={formato}
        setFormato={setFormato}
        escolhidos={escolhidos}
        setEscolhidos={setEscolhidos}
        quantidade={quantidade}
        setQuantidade={setQuantidade}
        disponiveis={disponiveis}
        carregando={fase === 'carregando'}
        erro={erro}
        onIniciar={iniciar}
      />
    )
  }

  if (fase === 'fim') {
    return (
      <Resultado
        registros={registros}
        onRefazer={() => setFase('config')}
      />
    )
  }

  const q = questoes[indice]
  return (
    <Questao
      key={q.id}
      questao={q}
      numero={indice + 1}
      total={questoes.length}
      acertos={registros.filter((r) => r.correcao.resultado === 'certo').length}
      onRespondida={(reg) => setRegistros((rs) => [...rs, reg])}
      onProxima={() => {
        if (indice + 1 >= questoes.length) setFase('fim')
        else setIndice((i) => i + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
      onEncerrar={() => setFase('fim')}
    />
  )
}

// ─── Configuração ───────────────────────────────────────────────────────────

function Configuracao(props: {
  sistemas: SistemaDisponivel[]
  tipos: TipoDeQuestao[]
  setTipos: (t: TipoDeQuestao[]) => void
  formato: Formato
  setFormato: (f: Formato) => void
  escolhidos: string[]
  setEscolhidos: (s: string[]) => void
  quantidade: number
  setQuantidade: (n: number) => void
  disponiveis: number
  carregando: boolean
  erro: string | null
  onIniciar: () => void
}) {
  const alternarTipo = (t: TipoDeQuestao) => {
    const novo = props.tipos.includes(t) ? props.tipos.filter((x) => x !== t) : [...props.tipos, t]
    if (novo.length) props.setTipos(novo)
  }
  const alternarSistema = (s: string) =>
    props.setEscolhidos(props.escolhidos.includes(s) ? props.escolhidos.filter((x) => x !== s) : [...props.escolhidos, s])

  return (
    <div className="space-y-6">
      <Bloco titulo="O que identificar">
        <div className="grid gap-2 sm:grid-cols-2">
          <Opcao
            ativo={props.tipos.includes('estrutura')}
            onClick={() => alternarTipo('estrutura')}
            icone={<Target className="h-5 w-5" />}
            titulo="Estruturas"
            texto="Uma seta ou um contorno aponta células, camadas e componentes — sem dizer de que lâmina é."
          />
          <Opcao
            ativo={props.tipos.includes('orgao')}
            onClick={() => alternarTipo('orgao')}
            icone={<HelpCircle className="h-5 w-5" />}
            titulo="Órgãos"
            texto="A lâmina inteira, anônima: diga que órgão ou tecido é, como na prova prática."
          />
        </div>
      </Bloco>

      <Bloco titulo="Formato da resposta">
        <div className="grid gap-2 sm:grid-cols-3">
          <Opcao
            ativo={props.formato === 'objetiva'}
            onClick={() => props.setFormato('objetiva')}
            icone={<ListChecks className="h-5 w-5" />}
            titulo="Objetiva"
            texto="Cinco alternativas, com distratoras que realmente se confundem ao microscópio."
          />
          <Opcao
            ativo={props.formato === 'escrita'}
            onClick={() => props.setFormato('escrita')}
            icone={<PenLine className="h-5 w-5" />}
            titulo="Escrita"
            texto="Você escreve o nome. Acentos e pequenos erros de digitação são tolerados."
          />
          <Opcao
            ativo={props.formato === 'misto'}
            onClick={() => props.setFormato('misto')}
            icone={<RotateCcw className="h-5 w-5" />}
            titulo="Misto"
            texto="Metade de cada, sorteadas."
          />
        </div>
      </Bloco>

      <Bloco titulo="Sistemas" subtitulo={props.escolhidos.length ? `${props.escolhidos.length} selecionados` : 'Todos'}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => props.setEscolhidos([])}
            className={chip(props.escolhidos.length === 0)}
          >
            Todos
          </button>
          {props.sistemas.map((s) => (
            <button key={s.sistema} type="button" onClick={() => alternarSistema(s.sistema)} className={chip(props.escolhidos.includes(s.sistema))}>
              {s.nome}
            </button>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Quantidade" subtitulo={`${props.disponiveis} questões disponíveis nesta seleção`}>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 40, 60, 100].map((n) => (
            <button key={n} type="button" onClick={() => props.setQuantidade(n)} className={chip(props.quantidade === n)} disabled={n > props.disponiveis && n !== 10}>
              {n}
            </button>
          ))}
        </div>
      </Bloco>

      {props.erro && <p className="text-sm text-red-600 dark:text-red-400">{props.erro}</p>}

      <button
        type="button"
        onClick={props.onIniciar}
        disabled={props.carregando || props.disponiveis === 0}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-teal-700 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
      >
        {props.carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Começar o quiz
      </button>
    </div>
  )
}

function chip(ativo: boolean) {
  return `inline-flex min-h-[38px] items-center rounded-full border px-3.5 text-sm font-medium transition-colors disabled:opacity-40 ${
    ativo ? 'border-teal-600 bg-teal-600/10 text-teal-800 dark:text-teal-200' : 'border-border bg-card hover:border-teal-500/40'
  }`
}

function Bloco({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 flex items-baseline gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
        {subtitulo && <span className="font-normal normal-case tracking-normal">· {subtitulo}</span>}
      </h2>
      {children}
    </section>
  )
}

function Opcao(p: { ativo: boolean; onClick: () => void; icone: React.ReactNode; titulo: string; texto: string }) {
  return (
    <button
      type="button"
      onClick={p.onClick}
      aria-pressed={p.ativo}
      className={`flex gap-3 rounded-xl border p-4 text-left transition-colors ${
        p.ativo ? 'border-teal-600 bg-teal-600/[0.07]' : 'border-border bg-card hover:border-teal-500/40'
      }`}
    >
      <span className={p.ativo ? 'text-teal-700 dark:text-teal-300' : 'text-muted-foreground'}>{p.icone}</span>
      <span>
        <span className="block text-sm font-semibold">{p.titulo}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{p.texto}</span>
      </span>
    </button>
  )
}

// ─── Questão ────────────────────────────────────────────────────────────────

function Questao(props: {
  questao: QuestaoPublica
  numero: number
  total: number
  acertos: number
  onRespondida: (r: Registro) => void
  onProxima: () => void
  onEncerrar: () => void
}) {
  const q = props.questao
  const [escolha, setEscolha] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [correcao, setCorrecao] = useState<Correcao | null>(null)
  const [dica, setDica] = useState(false)
  const [falha, setFalha] = useState(false)
  const entradaRef = useRef<HTMLInputElement | null>(null)
  const comentarioRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (q.formato === 'escrita') entradaRef.current?.focus({ preventScroll: true })
  }, [q])

  const podeResponder = !correcao && !enviando && (q.formato === 'objetiva' ? escolha !== null : texto.trim().length >= 2)

  const responder = useCallback(async () => {
    if (!podeResponder) return
    setEnviando(true)
    setFalha(false)
    try {
      const r = await fetch(`${API}/corrigir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: q.id,
          ...(q.formato === 'objetiva' ? { opcao: escolha } : { texto }),
          opcoes: q.opcoes?.map((o) => o.id) ?? [],
        }),
      })
      if (!r.ok) throw new Error()
      const c = (await r.json()) as Correcao
      setCorrecao(c)
      props.onRespondida({
        questao: q,
        resposta: q.formato === 'objetiva' ? q.opcoes?.find((o) => o.id === escolha)?.texto ?? '' : texto,
        correcao: c,
        usouDica: dica,
      })
      setTimeout(() => comentarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    } catch {
      setFalha(true)
    } finally {
      setEnviando(false)
    }
  }, [podeResponder, q, escolha, texto, dica, props])

  // Teclado: 1–5 escolhem, Enter responde / avança.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && e.key !== 'Enter') return
      if (!correcao && q.formato === 'objetiva' && /^[1-5]$/.test(e.key)) {
        const o = q.opcoes?.[Number(e.key) - 1]
        if (o) setEscolha(o.id)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (correcao) props.onProxima()
        else void responder()
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [correcao, q, responder, props])

  const estiloDaOpcao = (id: string) => {
    if (!correcao) {
      return escolha === id ? 'border-teal-600 bg-teal-600/10' : 'border-border bg-card hover:border-teal-500/50'
    }
    if (id === correcao.opcaoCerta) return 'border-emerald-600 bg-emerald-600/10'
    if (id === escolha) return 'border-red-600 bg-red-600/10'
    return 'border-border bg-card opacity-70'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">
          Questão {props.numero} <span className="font-normal text-muted-foreground">de {props.total}</span>
        </span>
        <span className="text-muted-foreground">
          {props.acertos} acerto{props.acertos === 1 ? '' : 's'}
          <button type="button" onClick={props.onEncerrar} className="ml-3 underline-offset-2 hover:underline">
            Encerrar
          </button>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-teal-600 transition-all" style={{ width: `${((props.numero - 1) / props.total) * 100}%` }} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <VisorDoQuiz piramide={q.piramide} marcas={q.marcas} vista={q.vista} chave={q.id} />

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              {q.tipo === 'estrutura' ? 'Identificação de estrutura' : 'Identificação de órgão'} ·{' '}
              {q.formato === 'objetiva' ? 'objetiva' : 'escrita'}
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold leading-snug">{q.enunciado}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Amplie e percorra a lâmina à vontade antes de responder.</p>
          </div>

          {q.formato === 'objetiva' ? (
            <div className="space-y-2" role="radiogroup" aria-label="Alternativas">
              {q.opcoes?.map((o, i) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={escolha === o.id}
                  disabled={Boolean(correcao)}
                  onClick={() => setEscolha(o.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${estiloDaOpcao(o.id)}`}
                >
                  <span className="mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current/20 text-xs font-bold">
                    {LETRAS[i]}
                  </span>
                  <span className="flex-1">{o.texto}</span>
                  {correcao && o.id === correcao.opcaoCerta && <Check className="h-4 w-4 text-emerald-600" />}
                  {correcao && o.id === escolha && o.id !== correcao.opcaoCerta && <X className="h-4 w-4 text-red-600" />}
                </button>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void responder()
              }}
            >
              <label className="text-xs font-semibold" htmlFor="resposta-escrita">
                Sua resposta
              </label>
              <input
                id="resposta-escrita"
                ref={entradaRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                disabled={Boolean(correcao)}
                autoComplete="off"
                spellCheck={false}
                placeholder={q.tipo === 'estrutura' ? 'Ex.: célula de Purkinje' : 'Ex.: cerebelo'}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-teal-600"
              />
            </form>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!correcao ? (
              <button
                type="button"
                onClick={() => void responder()}
                disabled={!podeResponder}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Responder
              </button>
            ) : (
              <button
                type="button"
                onClick={props.onProxima}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800"
              >
                {props.numero === props.total ? 'Ver resultado' : 'Próxima'} <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {!correcao && (
              <button
                type="button"
                onClick={() => setDica(true)}
                disabled={dica}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-4 text-sm hover:border-amber-500/60 disabled:opacity-70"
              >
                <Lightbulb className="h-4 w-4 text-amber-600" /> {dica ? q.dica : 'Dica'}
              </button>
            )}
          </div>
          {falha && <p className="text-sm text-red-600">Não foi possível corrigir agora. Tente de novo.</p>}
        </div>
      </div>

      {correcao && (
        <div ref={comentarioRef} className="scroll-mt-4">
          <Comentario correcao={correcao} />
        </div>
      )}
    </div>
  )
}

// ─── Resposta comentada ─────────────────────────────────────────────────────

function Comentario({ correcao }: { correcao: Correcao }) {
  const cor =
    correcao.resultado === 'certo'
      ? 'border-emerald-600/50 bg-emerald-600/[0.07]'
      : correcao.resultado === 'parcial'
        ? 'border-amber-500/50 bg-amber-500/[0.08]'
        : 'border-red-600/40 bg-red-600/[0.06]'
  const titulo = correcao.resultado === 'certo' ? 'Acertou' : correcao.resultado === 'parcial' ? 'Quase' : 'Não foi desta vez'
  return (
    <article className="space-y-3">
      <div className={`rounded-xl border p-4 ${cor}`}>
        <p className="text-sm font-bold">{titulo}</p>
        <p className="mt-1 text-[15px]">
          Resposta: <span className="font-semibold">{correcao.respostaCerta}</span>
        </p>
        {correcao.veredito && correcao.resultado !== 'certo' && <p className="mt-1 text-sm text-muted-foreground">{correcao.veredito}</p>}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Lâmina: <span className="font-semibold text-foreground">{correcao.revelacao.titulo}</span> · {correcao.revelacao.coloracao} ·{' '}
          {correcao.revelacao.especie}
          {correcao.revelacao.credito && <> · Imagem: {correcao.revelacao.credito}</>}
          {' · '}
          <Link href={correcao.revelacao.url} target="_blank" className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline dark:text-teal-300">
            abrir a lâmina <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {correcao.secoes.map((s, i) => (
          <details key={s.titulo} open={i < 3} className="group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
              {s.titulo}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {s.paragrafos?.map((p) => <p key={p}>{p}</p>)}
              {s.itens && (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-teal-600">
                  {s.itens.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        ))}
      </div>
    </article>
  )
}

// ─── Resultado ──────────────────────────────────────────────────────────────

function Resultado({ registros, onRefazer }: { registros: Registro[]; onRefazer: () => void }) {
  const certos = registros.filter((r) => r.correcao.resultado === 'certo').length
  const parciais = registros.filter((r) => r.correcao.resultado === 'parcial').length
  const total = registros.length
  const pct = total ? Math.round(((certos + parciais * 0.5) / total) * 100) : 0
  const erros = registros.filter((r) => r.correcao.resultado !== 'certo')
  const [aberto, setAberto] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resultado</p>
        <p className="mt-1 font-heading text-4xl font-semibold">{pct}%</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {certos} certas{parciais ? `, ${parciais} quase` : ''} de {total} respondidas
          {registros.some((r) => r.usouDica) && ` · ${registros.filter((r) => r.usouDica).length} com dica`}
        </p>
        <button
          type="button"
          onClick={onRefazer}
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800"
        >
          <RotateCcw className="h-4 w-4" /> Novo quiz
        </button>
      </div>

      {erros.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Para revisar ({erros.length})</h2>
          <ul className="space-y-2">
            {erros.map((r, i) => (
              <li key={r.questao.id} className="rounded-xl border border-border bg-card">
                <button type="button" onClick={() => setAberto(aberto === i ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm">
                  <span>
                    <span className="font-semibold">{r.correcao.respostaCerta}</span>
                    <span className="text-muted-foreground"> — você respondeu: {r.resposta || '—'}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${aberto === i ? 'rotate-180' : ''}`} />
                </button>
                {aberto === i && (
                  <div className="space-y-3 border-t border-border p-4">
                    <VisorDoQuiz piramide={r.questao.piramide} marcas={r.questao.marcas} vista={r.questao.vista} chave={`rev-${r.questao.id}`} />
                    <Comentario correcao={r.correcao} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
