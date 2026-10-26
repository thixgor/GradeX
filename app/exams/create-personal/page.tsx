'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  GitBranch,
  Loader2,
  Play,
  Plus,
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Table2,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { AnelProgresso } from '@/components/flashcards/pecas-ios'
import { Campo, ChipAlternar, Rascunho, Segmentado, Stepper, VitrineIa, useFraseRotativa } from '@/components/estudo-ia/pecas'
import { SeletorDeTemas } from '@/components/estudo-ia/seletor-de-temas'
import { FILTROS_VAZIOS, FiltrosDoBancoIos, parametrosDoBanco, type FiltrosDoBanco } from '@/components/estudo-ia/filtros-do-banco'
import { ToastAlert } from '@/components/ui/toast-alert'
import { iaDeEstudoLiberada } from '@/lib/ia/estudo/acesso'
import {
  FORMATOS,
  MAXIMO_DE_QUESTOES_IA,
  MAXIMO_DE_TEMAS,
  emLotes,
  formatosPossiveis,
  planejarProva,
  type EstiloDaQuestao,
  type NivelDaQuestao,
  type VagaDaQuestao,
} from '@/lib/ia/estudo/plano-da-prova'
import type { FormatoDeQuestao } from '@/lib/ia/estudo/auditoria-de-questoes'
import { TIPOS_DE_RECURSO, type TipoDeRecurso } from '@/lib/ia/estudo/recursos-visuais'
import type { CustomContext, Question } from '@/lib/types'

/**
 * Prova com IA — um fluxo só, do tema à prova pronta.
 *
 * Eram duas telas (ajustes da prova → `/exams/personal/[id]/generate-questions`)
 * com estado passado por `sessionStorage`, um modal de cronograma com os
 * modelos antigos e uma única requisição que gerava a prova inteira — se ela
 * passasse de 120 s, tudo se perdia. Agora:
 *
 *  - a tela monta o plano da prova (`planejarProva`) e pede à IA em lotes de
 *    três, dois lotes por vez, com progresso real e reenvio do que faltar;
 *  - os temas vêm da ementa dos `/cronogramas` (`SeletorDeTemas`);
 *  - cada lote volta auditado (anti-padrão: correta mais longa, distratora
 *    banal, termos absolutos…) e a tela mostra o placar dessa revisão;
 *  - a prova é salva sozinha ao fim, com a resposta comentada de cada questão.
 */

type Modo = 'ai' | 'banco' | 'misto'
type Contexto = 'medicina' | 'psicologia' | 'biomedicina' | 'odontologia' | 'enem' | 'uerj' | 'outro'

const CONTEXTOS: { id: Contexto; rotulo: string; prompt: string }[] = [
  { id: 'medicina', rotulo: 'Medicina', prompt: 'Medicina — padrão de residência médica, casos clínicos e raciocínio aplicado' },
  { id: 'psicologia', rotulo: 'Psicologia', prompt: 'Psicologia — situações clínicas e raciocínio psicológico aplicado' },
  { id: 'biomedicina', rotulo: 'Biomedicina', prompt: 'Biomedicina — contextualização laboratorial e raciocínio biomédico' },
  { id: 'odontologia', rotulo: 'Odontologia', prompt: 'Odontologia — casos clínicos e raciocínio odontológico aplicado' },
  { id: 'enem', rotulo: 'ENEM', prompt: 'ENEM — interdisciplinar, interpretativa, com texto-base e situação-problema' },
  { id: 'uerj', rotulo: 'UERJ', prompt: 'Vestibular UERJ — analítica, crítica, com ênfase em raciocínio' },
  { id: 'outro', rotulo: 'Outro', prompt: '' },
]

const ICONE_RECURSO: Record<TipoDeRecurso, typeof Table2> = {
  tabela: Table2,
  grafico: BarChart3,
  esquema: GitBranch,
  citacao: Quote,
}

const FRASES = [
  'Montando os casos clínicos…',
  'Escrevendo distratoras que fazem pensar…',
  'Conferindo se enunciado, comando e alternativas casam…',
  'Caçando a alternativa mais longa e o "exclusivamente"…',
  'Escrevendo a resposta comentada, do zero…',
]

interface Progresso {
  total: number
  feitas: number
  reparadas: number
  descartadas: number
  falhas: number
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

const letraCorreta = (q: Question) => q.alternatives?.find((a) => a.isCorrect)?.letter ?? ''

/** A ordem final evita três corretas na mesma letra em sequência (os lotes chegam fora de ordem). */
function semTresIguais(questoes: Question[]): Question[] {
  const q = questoes.slice()
  for (let i = 2; i < q.length; i++) {
    const l = letraCorreta(q[i])
    if (l && l === letraCorreta(q[i - 1]) && l === letraCorreta(q[i - 2])) {
      const j = q.findIndex((x, k) => k > i && letraCorreta(x) !== l)
      if (j > 0) [q[i], q[j]] = [q[j], q[i]]
    }
  }
  return q
}

export default function CriarProvaComIaPage() {
  const router = useRouter()
  const [conta, setConta] = useState<{ carregada: boolean; liberada: boolean }>({ carregada: false, liberada: false })

  const [modo, setModo] = useState<Modo>('ai')
  const [temas, setTemas] = useState<string[]>([])
  const [temaDigitado, setTemaDigitado] = useState('')
  const [cronogramaAberto, setCronogramaAberto] = useState(false)
  const [contexto, setContexto] = useState<Contexto>('medicina')
  const [contextoLivre, setContextoLivre] = useState('')
  const [contextosSalvos, setContextosSalvos] = useState<CustomContext[]>([])

  const [quantidade, setQuantidade] = useState(10)
  const [alternativas, setAlternativas] = useState<4 | 5>(5)
  const [nivel, setNivel] = useState<NivelDaQuestao | 'misto'>('misto')
  const [estilo, setEstilo] = useState<EstiloDaQuestao | 'misto'>('misto')
  const [formatos, setFormatos] = useState<FormatoDeQuestao[]>(['standard', 'multiple-affirmative', 'assertion-reason'])
  const [recursos, setRecursos] = useState<TipoDeRecurso[]>(['tabela', 'grafico', 'esquema'])

  const [filtros, setFiltros] = useState<FiltrosDoBanco>(FILTROS_VAZIOS)
  const [quantidadeBanco, setQuantidadeBanco] = useState(10)

  const [titulo, setTitulo] = useState('')
  const [navegacao, setNavegacao] = useState<'paginated' | 'scroll'>('paginated')
  const [feedback, setFeedback] = useState<'end' | 'immediate'>('end')
  const [minutosPorQuestao, setMinutosPorQuestao] = useState(0)
  const [pontuacao, setPontuacao] = useState<'normal' | 'tri'>('normal')
  const [pontos, setPontos] = useState(100)

  const [fase, setFase] = useState<'config' | 'gerando' | 'pronta'>('config')
  const [progresso, setProgresso] = useState<Progresso>({ total: 0, feitas: 0, reparadas: 0, descartadas: 0, falhas: 0 })
  const [questoes, setQuestoes] = useState<Question[]>([])
  const [provaId, setProvaId] = useState<string | null>(null)
  const [baixando, setBaixando] = useState(false)
  const abortar = useRef<AbortController | null>(null)
  const frase = useFraseRotativa(FRASES, fase === 'gerando', 2800)

  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ open: false, message: '' })
  const avisar = (message: string, type: 'error' | 'success' | 'info' = 'error') => setToast({ open: true, message, type })

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (r.status === 401) router.push('/auth/login?redirect=/exams/create-personal')
        return r.ok ? r.json() : null
      })
      .then((d) => setConta({ carregada: true, liberada: iaDeEstudoLiberada(d?.user?.accountType, d?.user?.role === 'admin') }))
      .catch(() => setConta({ carregada: true, liberada: false }))
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.personalExamsEnabled === false) router.push('/')
      })
      .catch(() => {})
    fetch('/api/contexts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && setContextosSalvos(d.contexts || []))
      .catch(() => {})
    return () => abortar.current?.abort()
  }, [router])

  // Asserção-razão tem cinco alternativas fixas.
  useEffect(() => {
    if (alternativas === 4) setFormatos((f) => (f.includes('assertion-reason') ? formatosPossiveis(f, 4) : f))
  }, [alternativas])
  useEffect(() => {
    if (navegacao === 'scroll') setFeedback('end')
  }, [navegacao])

  const usaIa = modo !== 'banco'
  const usaBanco = modo !== 'ai'
  const totalQuestoes = (usaIa ? quantidade : 0) + (usaBanco ? quantidadeBanco : 0)
  const textoDoContexto =
    contexto === 'outro' ? contextoLivre.trim() || 'Prova de estudo' : CONTEXTOS.find((c) => c.id === contexto)!.prompt
  const tituloFinal = titulo.trim() || (temas[0] ? `Prova · ${temas[0].split(' — ')[0]}` : 'Minha prova')

  function adicionarTemas(novos: string[]) {
    setTemas((atual) => {
      const todos = [...atual]
      for (const t of novos.map((x) => x.replace(/\s+/g, ' ').trim().slice(0, 160)).filter(Boolean)) {
        if (!todos.some((y) => y.toLowerCase() === t.toLowerCase()) && todos.length < MAXIMO_DE_TEMAS) todos.push(t)
      }
      return todos
    })
  }

  function teclaNoTema(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ';') && temaDigitado.trim()) {
      e.preventDefault()
      adicionarTemas([temaDigitado])
      setTemaDigitado('')
    } else if (e.key === 'Backspace' && !temaDigitado && temas.length) {
      setTemas((t) => t.slice(0, -1))
    }
  }

  const podeGerar = conta.liberada && totalQuestoes > 0 && (!usaIa || temas.length > 0 || temaDigitado.trim().length > 0) && formatos.length > 0

  async function buscarBanco(n: number): Promise<Question[]> {
    const r = await fetch(`/api/banco/questoes/random?${parametrosDoBanco(filtros, n)}`)
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d?.error || 'Não foi possível buscar questões do Banco.')
    return (d.questions || []).map((q: Question) => ({ ...q, origin: 'banco' }))
  }

  async function gerarComIa(listaDeTemas: string[], sinal: AbortSignal): Promise<Question[]> {
    const plano = planejarProva({ temas: listaDeTemas, quantidade, alternativas, nivel, estilo, formatos, recursos })
    const fila: { vagas: VagaDaQuestao[]; tentativas: number }[] = emLotes(plano).map((vagas) => ({ vagas, tentativas: 0 }))
    const prontas: Question[] = []
    const focos: string[] = []
    let bloqueada: string | null = null

    const trabalhador = async () => {
      while (fila.length && !sinal.aborted && !bloqueada) {
        const lote = fila.shift()!
        try {
          const r = await fetch('/api/exams/temp-ia/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vagas: lote.vagas, alternativas, contexto: textoDoContexto, evitar: focos }),
            signal: sinal,
          })
          const d = await r.json().catch(() => ({}))
          if (r.status === 403) {
            bloqueada = d?.error || 'Sem permissão para gerar.'
            return
          }
          if (!r.ok) {
            if (lote.tentativas < 1 && (r.status >= 500 || r.status === 429)) {
              fila.push({ ...lote, tentativas: lote.tentativas + 1 })
              await espera(r.status === 429 ? 6000 : 1500)
            } else {
              setProgresso((p) => ({ ...p, falhas: p.falhas + lote.vagas.length }))
            }
            continue
          }
          const novas: Question[] = (d.questoes || []).map((q: Question) => ({ ...q, origin: 'ia' }))
          prontas.push(...novas)
          focos.push(...novas.map((q) => q.aiInfo?.foco || '').filter(Boolean))
          const faltaram: VagaDaQuestao[] = Array.isArray(d.faltaram) ? d.faltaram : []
          if (faltaram.length && lote.tentativas < 1) fila.push({ vagas: faltaram, tentativas: lote.tentativas + 1 })
          setProgresso((p) => ({
            ...p,
            feitas: p.feitas + novas.length,
            reparadas: p.reparadas + (d.auditoria?.reparadas || 0),
            descartadas: p.descartadas + (d.auditoria?.descartadas || 0),
            falhas: p.falhas + (lote.tentativas >= 1 ? faltaram.length : 0),
          }))
        } catch (e) {
          if ((e as Error)?.name === 'AbortError') return
          if (lote.tentativas < 1) fila.push({ ...lote, tentativas: lote.tentativas + 1 })
          else setProgresso((p) => ({ ...p, falhas: p.falhas + lote.vagas.length }))
        }
      }
    }
    await Promise.all([trabalhador(), trabalhador()])
    if (bloqueada) {
      setConta((c) => ({ ...c, liberada: false }))
      throw new Error(bloqueada)
    }
    return semTresIguais(prontas)
  }

  async function gerar() {
    const listaDeTemas = temaDigitado.trim() ? [...temas, temaDigitado.trim()] : temas
    if (temaDigitado.trim()) {
      adicionarTemas([temaDigitado])
      setTemaDigitado('')
    }
    const controle = new AbortController()
    abortar.current = controle
    setFase('gerando')
    setProgresso({ total: totalQuestoes, feitas: 0, reparadas: 0, descartadas: 0, falhas: 0 })
    try {
      let todas: Question[] = []
      if (usaBanco) {
        const banco = await buscarBanco(quantidadeBanco)
        if (banco.length === 0 && modo === 'banco') throw new Error('Nenhuma questão do Banco com esses filtros.')
        todas = banco
        setProgresso((p) => ({ ...p, feitas: p.feitas + banco.length }))
      }
      if (usaIa) {
        const ia = await gerarComIa(listaDeTemas, controle.signal)
        if (controle.signal.aborted) return
        if (ia.length === 0) throw new Error('A IA não conseguiu gerar questões agora. Tente de novo em instantes.')
        // Na mista, intercala: a prova não vira "bloco do banco, bloco da IA".
        if (todas.length) {
          const misturadas: Question[] = []
          const max = Math.max(todas.length, ia.length)
          for (let i = 0; i < max; i++) {
            if (ia[i]) misturadas.push(ia[i])
            if (todas[i]) misturadas.push(todas[i])
          }
          todas = misturadas
        } else {
          todas = ia
        }
      }
      if (controle.signal.aborted) return
      const numeradas = todas.map((q, i) => ({ ...q, number: i + 1 }))
      setQuestoes(numeradas)

      const r = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tituloFinal.slice(0, 140),
          numberOfAlternatives: alternativas,
          scoringMethod: pontuacao,
          totalPoints: pontuacao === 'tri' ? 1000 : pontos,
          navigationMode: navegacao,
          duration: minutosPorQuestao ? minutosPorQuestao * numeradas.length : undefined,
          isPracticeExam: true,
          isPersonalExam: true,
          feedbackMode: feedback,
          examMode: modo,
          numberOfQuestions: numeradas.length,
          aiQuestionsCount: numeradas.filter((q) => (q as any).origin === 'ia').length,
          questions: numeradas,
        }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (d?.requiresUpgrade && d?.motivo === 'ia-exclusiva-pagantes') setConta((c) => ({ ...c, liberada: false }))
        throw new Error(d?.error || 'Não foi possível salvar a prova.')
      }
      setProvaId(d.examId)
      setFase('pronta')
    } catch (e) {
      if ((e as Error)?.name === 'AbortError' || controle.signal.aborted) return
      avisar((e as Error).message)
      setFase('config')
    }
  }

  function cancelar() {
    abortar.current?.abort()
    setFase('config')
  }

  async function baixarPdf() {
    if (!questoes.length) return
    setBaixando(true)
    try {
      const { generateExamStudyPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateExamStudyPDF({
        title: tituloFinal,
        numberOfQuestions: questoes.length,
        numberOfAlternatives: alternativas,
        scoringMethod: pontuacao,
        questions: questoes,
      } as any)
      downloadPDF(blob, `${tituloFinal.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}-com-respostas-comentadas.pdf`)
    } catch {
      avisar('Não foi possível gerar o PDF agora.')
    } finally {
      setBaixando(false)
    }
  }

  const porLetra = useMemo(() => {
    const contagem: Record<string, number> = {}
    for (const q of questoes) {
      const l = letraCorreta(q)
      if (l) contagem[l] = (contagem[l] || 0) + 1
    }
    return contagem
  }, [questoes])

  // ── Telas ──────────────────────────────────────────────────────────────

  const cabecalho = (
    <>
      <Link href="/provas" className="ios-voltar -ml-2">
        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} /> Provas
      </Link>
      <header className="mb-6 mt-2">
        <h1 className="ios-titulo-grande">Prova com IA</h1>
        <p className="ios-rotulo-2 mt-1.5 max-w-xl text-[16px] leading-relaxed sm:text-[17px]">
          Do seu cronograma a uma prova de verdade — tabelas, gráficos, esquemas e resposta comentada que ensina do zero.
        </p>
      </header>
    </>
  )

  return (
    <AppShell vidro headerTitle="Prova com IA" headerSubtitle="Provas pessoais">
      <FundoIos>
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-3 sm:px-6 sm:pt-5">
          {cabecalho}

          {!conta.carregada ? (
            <div className="ia-folha space-y-4 p-6">
              <div className="ios-esqueleto h-10 rounded-2xl" />
              <div className="ios-esqueleto h-14 rounded-2xl" />
              <div className="ios-esqueleto h-24 rounded-2xl" />
            </div>
          ) : !conta.liberada ? (
            <VitrineIa
              recurso="provas"
              beneficios={[
                'Temas direto da ementa do seu cronograma',
                'Questões com tabelas, gráficos, esquemas e citações',
                'Distratoras que fazem pensar — revisadas contra os vícios de IA',
                'Resposta comentada que ensina do zero, também no PDF',
              ]}
            />
          ) : fase === 'gerando' ? (
            <section className="ia-folha flex min-h-[460px] flex-col items-center justify-center gap-6 px-6 py-12 text-center" aria-busy="true">
              <AnelProgresso valor={progresso.feitas} total={Math.max(1, progresso.total)} tamanho={132} espessura={11} rotulo={`${progresso.feitas} de ${progresso.total} questões`}>
                <span className="text-[30px] font-bold tracking-tight ios-numeros">{progresso.feitas}</span>
                <span className="ios-rotulo-2 text-[12px] ios-numeros">de {progresso.total}</span>
              </AnelProgresso>
              <div>
                <p className="text-[19px] font-bold tracking-tight">Escrevendo sua prova</p>
                <p key={frase} className="ia-status ios-rotulo-2 mt-1 text-[15px]" aria-live="polite">
                  {frase}
                </p>
              </div>
              <Rascunho linhas={3} className="w-full max-w-sm" />
              <div className="ios-rotulo-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="ios-tinta h-4 w-4" /> Revisão anti-padrão ativa
                </span>
                {progresso.reparadas > 0 && <span className="ios-numeros">{progresso.reparadas} reescritas</span>}
                {progresso.descartadas > 0 && <span className="ios-numeros">{progresso.descartadas} refeitas</span>}
              </div>
              <button type="button" onClick={cancelar} className="ios-botao-cinza ios-botao-p">
                Cancelar
              </button>
            </section>
          ) : fase === 'pronta' ? (
            <section className="ios-assenta space-y-5">
              <div className="ia-folha p-6 sm:p-8">
                <p className="ios-tinta flex items-center gap-1.5 text-[13px] font-bold">
                  <Check className="h-4 w-4" strokeWidth={3} /> Prova pronta e salva
                </p>
                <h2 className="ios-titulo-produto mt-1.5">{tituloFinal}</h2>
                <div className="ios-faixa -mx-2 mt-5">
                  <div>
                    <span className="ios-faixa-rotulo">Questões</span>
                    <span className="ios-faixa-valor">{questoes.length}</span>
                  </div>
                  <div>
                    <span className="ios-faixa-rotulo">Com recurso</span>
                    <span className="ios-faixa-valor">{questoes.filter((q) => q.supportMaterial).length}</span>
                  </div>
                  <div>
                    <span className="ios-faixa-rotulo">Revisadas</span>
                    <span className="ios-faixa-valor">{progresso.reparadas + progresso.descartadas}</span>
                    <span className="ios-faixa-nota">pela auditoria</span>
                  </div>
                  {minutosPorQuestao > 0 && (
                    <div>
                      <span className="ios-faixa-rotulo">Tempo</span>
                      <span className="ios-faixa-valor">{minutosPorQuestao * questoes.length}</span>
                      <span className="ios-faixa-nota">min</span>
                    </div>
                  )}
                </div>
                {Object.keys(porLetra).length > 1 && (
                  <div className="mt-5">
                    <p className="ios-rotulo-2 mb-2 text-[13px] font-semibold">Gabarito distribuído por igual — sem “na dúvida, C”</p>
                    <div className="flex gap-2">
                      {Object.keys(porLetra)
                        .sort()
                        .map((l) => (
                          <div key={l} className="ia-letra">
                            <b>{porLetra[l]}</b>
                            <span>{l}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {progresso.falhas > 0 && (
                  <p className="ios-ambar mt-4 text-[14px]">
                    {progresso.falhas} {progresso.falhas === 1 ? 'questão não saiu' : 'questões não saíram'} a tempo — a prova ficou com {questoes.length}.
                  </p>
                )}
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                  <button type="button" className="ios-botao ios-botao-g flex-1" onClick={() => provaId && router.push(`/exam/${provaId}`)}>
                    <Play className="h-[18px] w-[18px]" fill="currentColor" /> Começar a prova
                  </button>
                  <button type="button" className="ios-botao-suave ios-botao-g flex-1" onClick={() => void baixarPdf()} disabled={baixando}>
                    {baixando ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Download className="h-[18px] w-[18px]" />} PDF com respostas comentadas
                  </button>
                </div>
              </div>

              <div>
                <h3 className="ios-titulo-secao mb-3 px-1">O que caiu</h3>
                <ul className="ios-lista">
                  {questoes.map((q) => (
                    <li key={q.id} className="ios-linha !items-start !py-3">
                      <span className="ios-rotulo-3 w-6 shrink-0 pt-0.5 text-[13px] font-bold ios-numeros">{q.number}</span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[14.5px] leading-snug">{q.statement}</p>
                        <p className="ios-rotulo-2 mt-1 flex flex-wrap gap-x-2 text-[12px]">
                          {(q as any).origin === 'banco' ? <span>Banco</span> : <span>{FORMATOS.find((f) => f.id === q.alternativeType)?.rotulo || 'Clássica'}</span>}
                          {q.supportMaterial && <span>· {TIPOS_DE_RECURSO.find((r) => r.id === q.supportMaterial!.tipo)?.rotulo.replace(/s$/, '')}</span>}
                          {q.aiInfo?.tema && <span className="truncate">· {q.aiInfo.tema}</span>}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="ios-botao-cinza mx-auto flex"
                onClick={() => {
                  setFase('config')
                  setQuestoes([])
                  setProvaId(null)
                }}
              >
                <RotateCcw className="h-4 w-4" /> Montar outra prova
              </button>
            </section>
          ) : (
            <div className="space-y-6">
              <Segmentado<Modo>
                rotulo="De onde vêm as questões"
                valor={modo}
                onChange={setModo}
                opcoes={[
                  { id: 'ai', rotulo: 'IA' },
                  { id: 'misto', rotulo: 'IA + Banco' },
                  { id: 'banco', rotulo: 'Banco' },
                ]}
              />

              {usaIa && (
                <section className="ia-folha space-y-6 p-5 sm:p-7" aria-labelledby="sec-conteudo">
                  <h2 id="sec-conteudo" className="sr-only">
                    Conteúdo
                  </h2>
                  <Campo rotulo="Temas" nota={`${temas.length}/${MAXIMO_DE_TEMAS}`}>
                    <div className="ia-campo flex min-h-[56px] flex-wrap items-center gap-2 !py-2.5" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}>
                      {temas.map((t) => (
                        <span key={t} className="ia-tag">
                          <span>{t}</span>
                          <button type="button" aria-label={`Tirar ${t}`} onClick={() => setTemas((ts) => ts.filter((x) => x !== t))}>
                            <X className="h-3 w-3" strokeWidth={3} />
                          </button>
                        </span>
                      ))}
                      <input
                        value={temaDigitado}
                        onChange={(e) => setTemaDigitado(e.target.value)}
                        onKeyDown={teclaNoTema}
                        onBlur={() => {
                          if (temaDigitado.trim()) {
                            adicionarTemas([temaDigitado])
                            setTemaDigitado('')
                          }
                        }}
                        placeholder={temas.length ? 'Mais um tema…' : 'Ex.: Síndrome nefrótica — Enter para adicionar'}
                        className="min-w-[180px] flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-[color:var(--ios-rotulo-3)]"
                        aria-label="Adicionar tema"
                        maxLength={160}
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setCronogramaAberto(true)} className="ios-botao-suave ios-botao-p" disabled={temas.length >= MAXIMO_DE_TEMAS}>
                        <CalendarRange className="h-4 w-4" /> Escolher do cronograma
                      </button>
                      {temaDigitado.trim() && (
                        <button
                          type="button"
                          className="ios-botao-cinza ios-botao-p"
                          onClick={() => {
                            adicionarTemas([temaDigitado])
                            setTemaDigitado('')
                          }}
                        >
                          <Plus className="h-4 w-4" /> Adicionar
                        </button>
                      )}
                    </div>
                  </Campo>

                  <Campo rotulo="Estilo de banca">
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Estilo de banca">
                      {CONTEXTOS.map((c) => (
                        <button key={c.id} type="button" aria-pressed={contexto === c.id} onClick={() => setContexto(c.id)} className="ios-pilula">
                          {c.rotulo}
                        </button>
                      ))}
                    </div>
                    {contexto === 'outro' && (
                      <div className="mt-3 space-y-2">
                        <input
                          value={contextoLivre}
                          onChange={(e) => setContextoLivre(e.target.value)}
                          placeholder="Ex.: Residência SUS-SP, prova de clínica médica"
                          className="ia-campo"
                          maxLength={200}
                        />
                        {contextosSalvos.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {contextosSalvos.map((c) => (
                              <button key={c.id} type="button" className="ios-pilula !h-[32px] !text-[13px]" aria-pressed={contextoLivre === c.name} onClick={() => setContextoLivre(c.name)}>
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Campo>

                  <div className="ia-divisor" />

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Campo rotulo="Questões da IA">
                      <Stepper rotulo="Questões" valor={quantidade} onChange={setQuantidade} min={1} max={MAXIMO_DE_QUESTOES_IA} passo={quantidade < 5 ? 1 : 5} />
                    </Campo>
                    <Campo rotulo="Alternativas">
                      <Segmentado<4 | 5>
                        rotulo="Alternativas por questão"
                        valor={alternativas}
                        onChange={setAlternativas}
                        opcoes={[
                          { id: 4, rotulo: 'A–D' },
                          { id: 5, rotulo: 'A–E' },
                        ]}
                      />
                    </Campo>
                  </div>

                  <Campo rotulo="Dificuldade">
                    <Segmentado<NivelDaQuestao | 'misto'>
                      rotulo="Dificuldade"
                      valor={nivel}
                      onChange={setNivel}
                      opcoes={[
                        { id: 'facil', rotulo: 'Fácil' },
                        { id: 'medio', rotulo: 'Médio' },
                        { id: 'dificil', rotulo: 'Difícil' },
                        { id: 'misto', rotulo: 'Misto' },
                      ]}
                    />
                  </Campo>

                  <Campo rotulo="Enunciado">
                    <Segmentado<EstiloDaQuestao | 'misto'>
                      rotulo="Estilo do enunciado"
                      valor={estilo}
                      onChange={setEstilo}
                      opcoes={[
                        { id: 'contextualizada', rotulo: 'Com caso' },
                        { id: 'direta', rotulo: 'Direto' },
                        { id: 'misto', rotulo: 'Misto' },
                      ]}
                    />
                  </Campo>

                  <Campo rotulo="Formatos de questão" nota="escolha um ou mais">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {FORMATOS.map((f) => {
                        const bloqueado = !!f.exige5 && alternativas < 5
                        return (
                          <ChipAlternar
                            key={f.id}
                            ativo={formatos.includes(f.id)}
                            desabilitado={bloqueado}
                            titulo={bloqueado ? 'Asserção-razão precisa de 5 alternativas' : undefined}
                            descricao={bloqueado ? 'precisa de A–E' : f.descricao}
                            onClick={() =>
                              setFormatos((atual) =>
                                atual.includes(f.id) ? (atual.length > 1 ? atual.filter((x) => x !== f.id) : atual) : [...atual, f.id],
                              )
                            }
                          >
                            {f.rotulo}
                          </ChipAlternar>
                        )
                      })}
                    </div>
                  </Campo>

                  <Campo rotulo="Além do texto" nota={recursos.length ? 'em ~60% das questões' : 'só texto'}>
                    <div className="grid grid-cols-2 gap-2">
                      {TIPOS_DE_RECURSO.map((r) => {
                        const Icone = ICONE_RECURSO[r.id]
                        return (
                          <ChipAlternar
                            key={r.id}
                            ativo={recursos.includes(r.id)}
                            icone={<Icone className="h-3 w-3" />}
                            descricao={r.descricao}
                            onClick={() => setRecursos((atual) => (atual.includes(r.id) ? atual.filter((x) => x !== r.id) : [...atual, r.id]))}
                          >
                            {r.rotulo}
                          </ChipAlternar>
                        )
                      })}
                    </div>
                  </Campo>
                </section>
              )}

              {usaBanco && (
                <section className="ia-folha p-5 sm:p-7" aria-labelledby="sec-banco">
                  <h2 id="sec-banco" className="ios-titulo-secao mb-1">
                    Do Banco de Questões
                  </h2>
                  <p className="ios-rotulo-2 mb-5 text-[14px]">Questões reais de prova, sorteadas pelos filtros.</p>
                  <FiltrosDoBancoIos filtros={filtros} onChange={setFiltros} quantidade={quantidadeBanco} onQuantidade={setQuantidadeBanco} />
                </section>
              )}

              <details className="ia-folha group" open={false}>
                <summary className="flex cursor-pointer list-none items-center gap-3 p-5 sm:px-7 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold tracking-tight">Ajustes da prova</p>
                    <p className="ios-rotulo-2 truncate text-[13px]">
                      {navegacao === 'paginated' ? 'Uma por vez' : 'Rolagem'} · correção {feedback === 'end' ? 'no final' : 'a cada questão'} ·{' '}
                      {minutosPorQuestao ? `${minutosPorQuestao} min/questão` : 'sem tempo'}
                    </p>
                  </div>
                  <ChevronRight className="ios-rotulo-3 h-5 w-5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="space-y-6 px-5 pb-6 sm:px-7">
                  <Campo rotulo="Título" nota="opcional">
                    <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={tituloFinal} maxLength={140} className="ia-campo" />
                  </Campo>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Campo rotulo="Navegação">
                      <Segmentado
                        rotulo="Navegação"
                        valor={navegacao}
                        onChange={setNavegacao}
                        opcoes={[
                          { id: 'paginated', rotulo: 'Uma por vez' },
                          { id: 'scroll', rotulo: 'Rolagem' },
                        ]}
                      />
                    </Campo>
                    <Campo rotulo="Correção" nota={navegacao === 'scroll' ? 'imediata só em “uma por vez”' : undefined}>
                      <Segmentado
                        rotulo="Correção"
                        valor={feedback}
                        onChange={setFeedback}
                        opcoes={[
                          { id: 'end', rotulo: 'No final' },
                          { id: 'immediate', rotulo: 'A cada uma', desabilitado: navegacao === 'scroll' },
                        ]}
                      />
                    </Campo>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Campo rotulo="Tempo por questão">
                      <Stepper rotulo="Minutos por questão" valor={minutosPorQuestao} onChange={setMinutosPorQuestao} min={0} max={10} formatar={(v) => (v ? `${v} min` : 'Livre')} />
                    </Campo>
                    <Campo rotulo="Pontuação">
                      <Segmentado
                        rotulo="Pontuação"
                        valor={pontuacao}
                        onChange={setPontuacao}
                        opcoes={[
                          { id: 'normal', rotulo: 'Acertos' },
                          { id: 'tri', rotulo: 'TRI' },
                        ]}
                      />
                    </Campo>
                  </div>
                  {pontuacao === 'normal' && (
                    <Campo rotulo="Nota máxima">
                      <Stepper rotulo="Nota máxima" valor={pontos} onChange={setPontos} min={10} max={1000} passo={10} />
                    </Campo>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Barra de ação: o que vai sair e o botão, sempre ao alcance do polegar. */}
          {conta.liberada && fase === 'config' && (
            <div className="sticky bottom-0 z-30 -mx-1 mt-6 pb-[max(12px,env(safe-area-inset-bottom))]">
              <div className="ios-vidro flex items-center gap-3 rounded-[22px] p-3 pl-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold tracking-tight ios-numeros">
                    {totalQuestoes} {totalQuestoes === 1 ? 'questão' : 'questões'}
                  </p>
                  <p className="ios-rotulo-2 truncate text-[12.5px]">
                    {usaIa && temas.length === 0 && !temaDigitado.trim() ? 'Adicione pelo menos um tema' : 'com resposta comentada que ensina'}
                  </p>
                </div>
                <button type="button" className="ios-botao" disabled={!podeGerar} onClick={() => void gerar()}>
                  <Sparkles className="h-4 w-4" /> Gerar prova
                </button>
              </div>
            </div>
          )}
        </div>

        <SeletorDeTemas
          aberto={cronogramaAberto}
          onFechar={() => setCronogramaAberto(false)}
          maximo={MAXIMO_DE_TEMAS}
          jaEscolhidos={temas.length}
          onAplicar={adicionarTemas}
        />
        <ToastAlert open={toast.open} onOpenChange={(open) => setToast((t) => ({ ...t, open }))} message={toast.message} type={toast.type} />
      </FundoIos>
    </AppShell>
  )
}
