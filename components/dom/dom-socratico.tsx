'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, GraduationCap, Search, Sparkles } from 'lucide-react'
import { ETAPAS_SOCRATICAS, ROTULO_DA_ETAPA, type EtapaSocratica } from '@/lib/dom/config'

/**
 * As duas telas do modo socrático antes da conversa: o que é o método (com a
 * escada do Dom) e a escolha do tema — da grade do cronograma (curso →
 * período → módulo) ou um tema livre ("Outro").
 */

export type TemaEscolhido =
  | { tipo: 'grade'; curso: string; periodo: number; id: string; titulo: string; trilha: string }
  | { tipo: 'livre'; titulo: string }

interface TemaDaGrade {
  id: string
  titulo: string
  trilha: string
  itens: string[]
}

const CURSOS = [
  { id: 'medicina', nome: 'Medicina', periodos: 5 },
  { id: 'biomedicina', nome: 'Biomedicina', periodos: 7 },
  { id: 'odontologia', nome: 'Odontologia', periodos: 10 },
  { id: 'psicologia', nome: 'Psicologia', periodos: 10 },
]

const PASSOS: Record<EtapaSocratica, string> = {
  diagnostico: 'Eu descubro o que você já sabe — sem nota, sem julgamento.',
  conceito: 'Construímos o conceito juntos, com as suas palavras.',
  porque: 'O porquê: por que funciona assim?',
  'porque-do-porque': 'O porquê do porquê: o mecanismo lá no fundo.',
  aplicacao: 'Aplicamos num mini caso clínico.',
  sintese: 'Síntese: o que VOCÊ construiu, com fontes atualizadas.',
}

export function IntroSocratica({ aoComecar }: { aoComecar: () => void }) {
  return (
    <div className="space-y-3 p-4">
      <div className="dom-cartao space-y-2">
        <div className="dom-cabecalho-grego">
          <Coluna />
          <div>
            <p className="text-[0.7rem] font-bold text-[#b8862a]">Maiêutica · Atenas, séc. V a.C.</p>
            <h3 className="dom-titulo">O que é o Método Socrático?</h3>
          </div>
        </div>
        <p className="dom-texto-2 text-[0.85rem] leading-relaxed">
          Sócrates, há 2.400 anos, ensinava <strong>perguntando</strong>. Ele dizia ser uma &ldquo;parteira de ideias&rdquo;
          (a <em>maiêutica</em>): em vez de entregar a resposta, fazia perguntas em sequência até o aluno
          <strong> chegar nela sozinho</strong>. O que você descobre pensando, o cérebro guarda muito melhor do que o que só lê.
        </p>
      </div>
      <div className="dom-cartao space-y-2">
        <h3 className="dom-titulo">A versão do Dom, feita para a saúde</h3>
        <p className="dom-texto-2 text-[0.82rem] leading-relaxed">
          Diferente do Sócrates original, <strong>você sempre recebe a explicação</strong> depois de pensar — com pérolas
          clínicas e feedback. Funciona assim: &ldquo;Se isso é assim, como você acha que aquilo funciona?&rdquo;
        </p>
        <ol className="dom-escada mt-1">
          {ETAPAS_SOCRATICAS.map((e) => (
            <li key={e}>
              <span>
                <strong className="text-[var(--dom-texto)]">{ROTULO_DA_ETAPA[e]}.</strong> {PASSOS[e]}
              </span>
            </li>
          ))}
        </ol>
        <p className="dom-texto-3 text-[0.75rem]">Errar faz parte e &ldquo;não sei&rdquo; é uma ótima resposta: é dali que a gente parte.</p>
      </div>
      <button type="button" className="dom-botao dom-botao--ouro w-full" onClick={aoComecar}>
        <Sparkles className="h-4 w-4" aria-hidden />
        Vestir a toga e começar
      </button>
    </div>
  )
}

/** Coluna jônica estilizada (traço), para o cabeçalho do modo socrático. */
function Coluna() {
  return (
    <svg width="34" height="44" viewBox="0 0 34 44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M3 6h28M5 6c0-3 3-4 5-2M29 6c0-3-3-4-5-2M7 10h20M9 10v26M14 10v26M20 10v26M25 10v26M5 36h24M3 40h28" />
    </svg>
  )
}

export function EscolhaDeTema({
  periodoDoAluno,
  aoEscolher,
  aoVoltar,
}: {
  periodoDoAluno?: number | null
  aoEscolher: (t: TemaEscolhido) => void
  aoVoltar?: () => void
}) {
  const [curso, setCurso] = useState('medicina')
  const def = CURSOS.find((c) => c.id === curso)!
  const [periodo, setPeriodo] = useState(() => Math.min(Math.max(periodoDoAluno || 1, 1), 5))
  const [temas, setTemas] = useState<TemaDaGrade[] | null>(null)
  const [busca, setBusca] = useState('')
  const [livre, setLivre] = useState('')

  useEffect(() => {
    if (periodo > def.periodos) setPeriodo(def.periodos)
  }, [def.periodos, periodo])

  useEffect(() => {
    let vivo = true
    setTemas(null)
    fetch(`/api/dom/temas?curso=${curso}&periodo=${Math.min(periodo, def.periodos)}`)
      .then((r) => (r.ok ? r.json() : { temas: [] }))
      .then((d) => vivo && setTemas(Array.isArray(d.temas) ? d.temas : []))
      .catch(() => vivo && setTemas([]))
    return () => {
      vivo = false
    }
  }, [curso, periodo, def.periodos])

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const filtrados = (temas || []).filter(
      (t) => !termo || t.titulo.toLowerCase().includes(termo) || t.trilha.toLowerCase().includes(termo) || t.itens.some((i) => i.toLowerCase().includes(termo)),
    )
    const mapa = new Map<string, TemaDaGrade[]>()
    for (const t of filtrados) {
      const k = t.trilha.split(' › ')[0]
      if (!mapa.has(k)) mapa.set(k, [])
      mapa.get(k)!.push(t)
    }
    return [...mapa.entries()]
  }, [temas, busca])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b border-[var(--dom-borda)] p-3">
        <div className="flex items-center gap-2">
          {aoVoltar && (
            <button type="button" className="dom-icone-botao" onClick={aoVoltar} aria-label="Voltar para a explicação">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h3 className="dom-titulo text-[0.95rem]">Escolha um tema do seu cronograma</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[0.7rem] font-semibold text-[var(--dom-texto-3)]">
            Curso
            <select className="dom-campo mt-1" value={curso} onChange={(e) => setCurso(e.target.value)}>
              {CURSOS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[0.7rem] font-semibold text-[var(--dom-texto-3)]">
            Período
            <select className="dom-campo mt-1" value={Math.min(periodo, def.periodos)} onChange={(e) => setPeriodo(Number(e.target.value))}>
              {Array.from({ length: def.periodos }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}º período
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dom-texto-3)]" aria-hidden />
          <input
            className="dom-campo"
            style={{ paddingLeft: '2rem' }}
            placeholder="Filtrar temas (ex.: potencial de ação)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Filtrar temas"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {temas === null && <p className="dom-texto-3 p-3 text-sm">Abrindo a grade do período…</p>}
        {temas && !grupos.length && <p className="dom-texto-3 p-3 text-sm">Nenhum tema aqui. Que tal escolher um tema livre abaixo?</p>}
        {grupos.map(([grupo, lista]) => (
          <div key={grupo} className="mb-2">
            <p className="px-2 pb-1 pt-2 text-[0.68rem] font-bold uppercase tracking-wide text-[var(--dom-texto-3)]">{grupo}</p>
            {lista.map((t) => (
              <button
                key={t.id}
                type="button"
                className="dom-tema"
                onClick={() => aoEscolher({ tipo: 'grade', curso, periodo: Math.min(periodo, def.periodos), id: t.id, titulo: t.titulo, trilha: t.trilha })}
              >
                <span className="flex items-start gap-2">
                  <BookOpen className="mt-0.5 h-4 w-4 flex-none text-[var(--dom-laranja-forte)]" aria-hidden />
                  <span>
                    <span className="block text-[0.84rem] font-semibold leading-snug text-[var(--dom-texto)]">{t.titulo}</span>
                    <span className="block text-[0.72rem] leading-snug text-[var(--dom-texto-3)]">{t.trilha.split(' › ').slice(1).join(' › ')}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-[var(--dom-borda)] p-3"
        onSubmit={(e) => {
          e.preventDefault()
          const t = livre.trim()
          if (t.length >= 3) aoEscolher({ tipo: 'livre', titulo: t.slice(0, 120) })
        }}
      >
        <input
          className="dom-campo"
          placeholder="Outro tema (ex.: choque séptico)"
          value={livre}
          maxLength={120}
          onChange={(e) => setLivre(e.target.value)}
          aria-label="Outro tema"
        />
        <button type="submit" className="dom-botao dom-botao--principal flex-none px-3" disabled={livre.trim().length < 3}>
          <GraduationCap className="h-4 w-4" aria-hidden />
          Ir
        </button>
      </form>
    </div>
  )
}

export function ProgressoSocratico({ etapa, progresso, tema }: { etapa: EtapaSocratica | null; progresso: number; tema: string }) {
  const atual = etapa ? ETAPAS_SOCRATICAS.indexOf(etapa) : 0
  return (
    <div className="dom-progresso">
      <div className="mb-1 flex items-center justify-between gap-2 text-[0.72rem]">
        <span className="truncate font-semibold text-[var(--dom-texto)]" title={tema}>
          {tema}
        </span>
        <span className="flex-none text-[var(--dom-texto-3)]">{progresso}%</span>
      </div>
      <div className="dom-progresso__trilho" role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso no tema">
        <div className="dom-progresso__barra" style={{ transform: `scaleX(${Math.max(0.03, progresso / 100)})` }} />
      </div>
      <div className="dom-progresso__degraus" aria-hidden>
        {ETAPAS_SOCRATICAS.map((e, i) => (
          <span key={e} className="dom-progresso__degrau" data-atual={i === atual ? '1' : '0'} data-feito={i < atual ? '1' : '0'}>
            {i === atual ? ROTULO_DA_ETAPA[e] : '•'}
          </span>
        ))}
      </div>
    </div>
  )
}
