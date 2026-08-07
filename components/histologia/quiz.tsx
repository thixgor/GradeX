'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Check, ChevronLeft, ChevronRight, RotateCcw, Timer, X } from 'lucide-react'

import type { Quiz } from '@/lib/histologia/esquemas'
import { faixaDeAcerto, registrarEvento } from '@/lib/histologia/analitica'
import { urlDaMidia } from '@/lib/histologia/midia'
import { useProgresso } from '@/lib/histologia/progresso'
import {
  type EstadoDoQuiz,
  type Modo,
  calcularResultado,
  gerarSemente,
  prepararQuiz,
  questaoCorreta,
  responder,
  respondida,
} from '@/lib/histologia/quiz-engine'
import { BASE } from '@/lib/histologia/rotas'
import { EstadoEditorial } from './marca'

/**
 * Executor de quiz nativo.
 *
 * Substitui o player H5P inteiramente — o pacote original fica no acervo como
 * prova de origem, mas não é carregado. Trazer o runtime do H5P significaria um
 * iframe, ~200 KB de JavaScript de terceiros e um modelo de acessibilidade
 * sobre o qual não temos controle nenhum.
 *
 * ## Acessibilidade das alternativas
 *
 * As alternativas são um `radiogroup` (ou `group` de checkboxes, quando a
 * questão aceita várias). Não são `<button>` estilizados: leitor de tela
 * anuncia "opção 2 de 5" num radiogroup e nada disso numa lista de botões, e a
 * navegação por setas vem de graça do navegador.
 *
 * ## O gabarito no modo prova
 *
 * Chega sem `correta` e sem `feedback` — `quizParaCliente` os remove no
 * servidor. O gabarito só é buscado (rota `/gabarito`) quando o aluno finaliza.
 * "Ver código-fonte" antes de responder não entrega prova nenhuma.
 */

export interface QuizRunnerProps {
  /**
   * No modo prova o quiz chega **sem gabarito** — `quizParaCliente` removeu
   * `correta` e `feedback` no servidor. O gabarito é buscado na finalização,
   * pela rota `/gabarito`.
   */
  quiz: Quiz
  modoInicial?: Modo
  /** O payload recebido já contém gabarito? Falso quando veio em modo prova. */
  comGabarito: boolean
}

export function QuizRunner({ quiz: quizInicial, modoInicial = 'pratica', comGabarito }: QuizRunnerProps) {
  /*
   * `quiz` é o payload em uso. Começa como o que veio do servidor e, no modo
   * prova, é substituído pela versão com gabarito assim que o aluno finaliza.
   * Guardar isso em estado (e não numa variável derivada) é o que permite ao
   * relatório mostrar a resposta certa e a devolutiva de cada questão sem que
   * elas tenham passado pelo HTML inicial.
   */
  const [quiz, setQuiz] = useState<Quiz>(quizInicial)
  const [temGabarito, setTemGabarito] = useState(comGabarito)
  const [corrigindo, setCorrigindo] = useState(false)
  const [erroDeCorrecao, setErroDeCorrecao] = useState(false)
  const { progresso, carregado, registrarQuiz, salvarQuizEmAndamento } = useProgresso()

  const [modo, setModo] = useState<Modo>(modoInicial)
  const [tentativa, setTentativa] = useState(1)
  const [estado, setEstado] = useState<EstadoDoQuiz | null>(null)
  const [finalizado, setFinalizado] = useState(false)
  const [revelado, setRevelado] = useState<Record<string, boolean>>({})
  const [confianca, setConfianca] = useState<Record<string, 'certa' | 'duvida'>>({})
  const [segundos, setSegundos] = useState(0)
  const [cronometroLigado, setCronometroLigado] = useState(false)

  /* ── início e retomada ── */
  useEffect(() => {
    if (!carregado || estado) return
    const salvo = progresso.quizEmAndamento[quizInicial.slug]
    if (salvo) {
      // Retomada: a mesma semente devolve exatamente a mesma prova, com as
      // alternativas nas mesmas posições.
      const retomado = prepararQuiz(quizInicial, modo, salvo.semente)
      setEstado({ ...retomado, respostas: salvo.respostas, indice: salvo.indice })
      return
    }
    setEstado(prepararQuiz(quizInicial, modo, gerarSemente(quizInicial.slug, tentativa)))
    registrarEvento({ nome: 'quiz_iniciado', quiz: quizInicial.slug, modo })
  }, [carregado, estado, progresso.quizEmAndamento, quizInicial, modo, tentativa])

  /* ── persistência do andamento ── */
  useEffect(() => {
    if (!estado || finalizado) return
    salvarQuizEmAndamento(quiz.slug, {
      semente: estado.semente,
      respostas: estado.respostas,
      indice: estado.indice,
    })
  }, [estado, finalizado, quiz.slug, salvarQuizEmAndamento])

  /* ── cronômetro opcional ── */
  useEffect(() => {
    if (!cronometroLigado || finalizado) return
    const intervalo = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(intervalo)
  }, [cronometroLigado, finalizado])

  const reiniciar = useCallback(
    (novoModo: Modo) => {
      const proxima = tentativa + 1
      setTentativa(proxima)
      setModo(novoModo)
      setQuiz(quizInicial)
      setTemGabarito(comGabarito)
      setEstado(prepararQuiz(quizInicial, novoModo, gerarSemente(quizInicial.slug, proxima)))
      setFinalizado(false)
      setRevelado({})
      setConfianca({})
      setSegundos(0)
      registrarEvento({ nome: 'quiz_iniciado', quiz: quizInicial.slug, modo: novoModo })
    },
    [quizInicial, comGabarito, tentativa],
  )

  const resultado = useMemo(
    () => (estado ? calcularResultado(estado, quiz.percentualAprovacao) : null),
    [estado, quiz.percentualAprovacao],
  )

  /**
   * Finaliza e corrige.
   *
   * No modo prova é aqui que o gabarito entra em cena: buscamos a chave de
   * correção, remontamos as questões com `correta` e `feedback` e só então
   * calculamos o resultado. Enquanto a rede não responde, nada é pontuado — um
   * resultado calculado sem gabarito diria "zero acertos" e seria pior que
   * esperar.
   */
  const finalizar = useCallback(async () => {
    if (!estado) return

    let quizCompleto = quiz
    if (!temGabarito) {
      setCorrigindo(true)
      setErroDeCorrecao(false)
      try {
        const resposta = await fetch(
          `/api/manual-clinico/histologia/quiz/${encodeURIComponent(quiz.slug)}/gabarito`,
        )
        if (!resposta.ok) throw new Error('gabarito indisponível')
        const chave: {
          questoes: Array<{ id: string; alternativas: Array<{ id: string; correta: boolean; feedback: string }> }>
        } = await resposta.json()

        const porQuestao = new Map(chave.questoes.map((q) => [q.id, q]))
        quizCompleto = {
          ...quiz,
          questoes: quiz.questoes.map((questao) => {
            const gabarito = porQuestao.get(questao.id)
            if (!gabarito) return questao
            const porAlternativa = new Map(gabarito.alternativas.map((a) => [a.id, a]))
            return {
              ...questao,
              alternativas: questao.alternativas.map((alternativa) => ({
                ...alternativa,
                correta: porAlternativa.get(alternativa.id)?.correta ?? false,
                feedback: porAlternativa.get(alternativa.id)?.feedback ?? '',
              })),
            }
          }),
        }
        setQuiz(quizCompleto)
        setTemGabarito(true)
      } catch {
        setCorrigindo(false)
        setErroDeCorrecao(true)
        return
      }
      setCorrigindo(false)
    }

    // O estado guarda cópias das questões, então precisa ser remontado com o
    // gabarito antes da correção — senão `questaoCorreta` avaliaria as
    // alternativas vazias que vieram do modo prova.
    const estadoCorrigido: EstadoDoQuiz = {
      ...estado,
      questoes: estado.questoes.map((questao) => {
        const completa = quizCompleto.questoes.find((q) => q.id === questao.id)
        return completa ? { ...questao, alternativas: completa.alternativas } : questao
      }),
    }
    setEstado(estadoCorrigido)

    const final = calcularResultado(estadoCorrigido, quizCompleto.percentualAprovacao)
    setFinalizado(true)
    registrarQuiz(quiz.slug, {
      acertos: final.acertos,
      total: final.total,
      concluidoEm: Date.now(),
      erros: final.erros,
    })
    registrarEvento({
      nome: 'quiz_concluido',
      quiz: quiz.slug,
      modo,
      faixa: faixaDeAcerto(final.percentual),
    })
  }, [estado, quiz, temGabarito, modo, registrarQuiz])

  if (!estado || !resultado) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
  }

  if (finalizado) {
    return (
      <Relatorio
        quiz={quiz}
        estado={estado}
        resultado={resultado}
        segundos={cronometroLigado ? segundos : null}
        confianca={confianca}
        onRefazer={reiniciar}
      />
    )
  }

  const questao = estado.questoes[estado.indice]
  const escolhidas = estado.respostas[questao.id] ?? []
  const mostrarDevolutiva = modo === 'pratica' && !!revelado[questao.id]
  const acertou = questaoCorreta(questao, escolhidas)
  const respondidas = estado.questoes.filter((q) => respondida(estado, q.id)).length
  const urlImagem = questao.midia ? urlDaMidia(questao.midia) : null

  return (
    <div>
      {/* ── Cabeçalho ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <fieldset className="flex items-center gap-1">
            <legend className="sr-only">Modo do quiz</legend>
            {(['pratica', 'prova'] as Modo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => reiniciar(m)}
                aria-pressed={modo === m}
                className={`min-h-[36px] rounded-md border px-3 text-xs font-bold transition-colors ${
                  modo === m
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-border bg-card hover:border-rose-500/50'
                }`}
              >
                {m === 'pratica' ? 'Prática' : 'Prova'}
              </button>
            ))}
          </fieldset>

          <button
            type="button"
            onClick={() => setCronometroLigado((v) => !v)}
            aria-pressed={cronometroLigado}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
              cronometroLigado ? 'border-teal-700 bg-teal-700 text-white' : 'border-border bg-card'
            }`}
          >
            <Timer className="h-3.5 w-3.5" aria-hidden />
            {cronometroLigado ? formatarTempo(segundos) : 'Cronômetro'}
          </button>
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          Questão {estado.indice + 1} de {estado.questoes.length} · {respondidas} respondida
          {respondidas === 1 ? '' : 's'}
        </p>
      </div>

      {/* Barra de progresso — com texto, não só cor */}
      <div
        role="progressbar"
        aria-valuenow={respondidas}
        aria-valuemin={0}
        aria-valuemax={estado.questoes.length}
        aria-label="Progresso do quiz"
        className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-rose-600 transition-all duration-300"
          style={{ width: `${(respondidas / estado.questoes.length) * 100}%` }}
        />
      </div>

      {/* ── Questão ── */}
      <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-heading text-base font-semibold leading-snug sm:text-lg">
          {questao.enunciado}
        </h2>

        {urlImagem && questao.midia && (
          <figure className="mt-3 overflow-hidden rounded-lg border border-border bg-[#0d1210]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlImagem}
              /*
               * Alt de imagem de avaliação: descreve o que é e o que se pede,
               * jamais a estrutura perguntada. Descrever "corte de osso compacto
               * com linha cementante" numa questão que pergunta qual é a
               * estrutura anularia o exercício para quem usa leitor de tela — o
               * oposto de acessibilidade.
               */
              alt={questao.midia.alt}
              width={questao.midia.largura}
              height={questao.midia.altura}
              sizes="(max-width: 768px) 100vw, 720px"
              className="max-h-[420px] w-full object-contain"
            />
          </figure>
        )}

        {/* ── Alternativas ── */}
        <fieldset className="mt-4">
          <legend className="sr-only">
            {questao.multipla ? 'Selecione todas as corretas' : 'Selecione uma alternativa'}
          </legend>
          {questao.multipla && (
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Esta questão tem mais de uma resposta correta.
            </p>
          )}
          <div
            role={questao.multipla ? 'group' : 'radiogroup'}
            aria-label="Alternativas"
            className="space-y-2"
          >
            {questao.ordem.map((idAlternativa, indice) => {
              const alternativa = questao.alternativas.find((a) => a.id === idAlternativa)
              if (!alternativa) return null
              const marcada = escolhidas.includes(alternativa.id)
              const revelaEsta = mostrarDevolutiva && (marcada || alternativa.correta)

              return (
                <label
                  key={alternativa.id}
                  className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    revelaEsta
                      ? alternativa.correta
                        ? 'border-emerald-600 bg-emerald-500/10'
                        : 'border-rose-600 bg-rose-500/10'
                      : marcada
                        ? 'border-teal-600 bg-teal-500/10'
                        : 'border-border hover:border-teal-500/45'
                  }`}
                >
                  <input
                    type={questao.multipla ? 'checkbox' : 'radio'}
                    name={`questao-${questao.id}`}
                    checked={marcada}
                    disabled={mostrarDevolutiva}
                    onChange={() =>
                      setEstado((e) => (e ? responder(e, questao.id, alternativa.id) : e))
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-teal-700"
                  />
                  <span className="min-w-0 flex-1 text-sm leading-snug">
                    <span className="mr-1.5 font-mono text-xs text-muted-foreground" aria-hidden>
                      {String.fromCharCode(65 + indice)}.
                    </span>
                    {alternativa.texto}
                  </span>
                  {/* Estado não depende só de cor: há ícone e texto. */}
                  {revelaEsta && (
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold ${
                        alternativa.correta
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {alternativa.correta ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden /> correta
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" aria-hidden /> incorreta
                        </>
                      )}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>

        {/* ── Confiança (modo prova) ── */}
        {modo === 'prova' && escolhidas.length > 0 && (
          <fieldset className="mt-3">
            <legend className="mb-1.5 text-xs font-semibold">
              Quanta confiança você tem nesta resposta?
            </legend>
            <div className="flex gap-1.5">
              {(
                [
                  ['certa', 'Tenho certeza'],
                  ['duvida', 'Estou em dúvida'],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setConfianca((c) => ({ ...c, [questao.id]: valor }))}
                  aria-pressed={confianca[questao.id] === valor}
                  className={`min-h-[36px] rounded-md border px-3 text-xs font-medium transition-colors ${
                    confianca[questao.id] === valor
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : 'border-border hover:border-teal-500/50'
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* ── Devolutiva ── */}
        {mostrarDevolutiva && (
          <div
            role="status"
            className={`mt-3 rounded-lg border p-3 ${
              acertou ? 'border-emerald-600/40 bg-emerald-500/[0.07]' : 'border-rose-600/40 bg-rose-500/[0.07]'
            }`}
          >
            <p className="inline-flex items-center gap-1.5 text-sm font-bold">
              {acertou ? (
                <>
                  <Check className="h-4 w-4" aria-hidden /> Correto
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" aria-hidden /> Ainda não
                </>
              )}
            </p>
            {questao.alternativas
              .filter((a) => a.correta || escolhidas.includes(a.id))
              .map((a) =>
                a.feedback ? (
                  <p key={a.id} className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold">{a.texto}: </span>
                    {a.feedback}
                  </p>
                ) : null,
              )}
          </div>
        )}

        {/* ── Navegação ── */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={estado.indice === 0}
            onClick={() => setEstado((e) => (e ? { ...e, indice: e.indice - 1 } : e))}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold transition-colors hover:border-teal-500/50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
          </button>

          {modo === 'pratica' && !mostrarDevolutiva && escolhidas.length > 0 && (
            <button
              type="button"
              onClick={() => setRevelado((r) => ({ ...r, [questao.id]: true }))}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-teal-700 px-4 text-xs font-bold text-white transition-colors hover:bg-teal-800"
            >
              Conferir
            </button>
          )}

          {estado.indice < estado.questoes.length - 1 ? (
            <button
              type="button"
              onClick={() => setEstado((e) => (e ? { ...e, indice: e.indice + 1 } : e))}
              className="ml-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold transition-colors hover:border-teal-500/50"
            >
              Próxima <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void finalizar()}
              disabled={corrigindo}
              className="ml-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-rose-600 px-4 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
            >
              {corrigindo ? 'Corrigindo…' : 'Finalizar e ver relatório'}
            </button>
          )}
        </div>
      </article>

      {erroDeCorrecao && (
        <p role="alert" className="mt-3 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-xs leading-relaxed">
          Não foi possível buscar o gabarito para corrigir a prova. Suas respostas continuam
          guardadas — verifique a conexão e toque em finalizar de novo.
        </p>
      )}

      {/* ── Mapa de questões ── */}
      <nav aria-label="Ir para questão" className="mt-4">
        <ul className="flex flex-wrap gap-1.5">
          {estado.questoes.map((q, i) => {
            const feita = respondida(estado, q.id)
            const atual = i === estado.indice
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setEstado((e) => (e ? { ...e, indice: i } : e))}
                  aria-current={atual ? 'true' : undefined}
                  aria-label={`Questão ${i + 1}${feita ? ', respondida' : ', não respondida'}`}
                  className={`h-9 w-9 rounded-md border text-xs font-bold transition-colors ${
                    atual
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : feita
                        ? 'border-teal-600/40 bg-teal-500/10 text-teal-800 dark:text-teal-300'
                        : 'border-border bg-card text-muted-foreground hover:border-teal-500/50'
                  }`}
                >
                  {i + 1}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-5">
        <EstadoEditorial revisao={quiz.revisao} />
      </div>
    </div>
  )
}

/* ────────────────────────── relatório ────────────────────────── */

function Relatorio({
  quiz,
  estado,
  resultado,
  segundos,
  confianca,
  onRefazer,
}: {
  quiz: Quiz
  estado: EstadoDoQuiz
  resultado: ReturnType<typeof calcularResultado>
  segundos: number | null
  confianca: Record<string, 'certa' | 'duvida'>
  onRefazer: (modo: Modo) => void
}) {
  const errosComConfianca = resultado.erros.filter((id) => confianca[id] === 'certa')

  return (
    <div>
      <div
        className={`rounded-xl border p-5 ${
          resultado.aprovado
            ? 'border-emerald-600/40 bg-emerald-500/[0.07]'
            : 'border-amber-600/40 bg-amber-500/[0.07]'
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Resultado · {quiz.titulo}
        </p>
        <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
          {resultado.acertos} de {resultado.total}
          <span className="ml-2 text-lg font-normal text-muted-foreground">
            ({resultado.percentual.toFixed(0)}%)
          </span>
        </p>
        <p className="mt-1 text-sm">
          {resultado.aprovado
            ? `Acima do mínimo de ${quiz.percentualAprovacao}% deste quiz.`
            : `Abaixo do mínimo de ${quiz.percentualAprovacao}% deste quiz.`}
          {segundos !== null && ` Tempo: ${formatarTempo(segundos)}.`}
        </p>
      </div>

      {/* Onde errou, por assunto */}
      {resultado.porAssunto.some((a) => a.acertos < a.total) && (
        <section aria-labelledby="por-assunto" className="mt-5">
          <h3 id="por-assunto" className="mb-2 font-heading text-base font-semibold">
            O que revisar primeiro
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Agrupado pela estrutura que era a resposta certa. O topo da lista é onde o
            reconhecimento ainda não está firme.
          </p>
          <ul className="space-y-1.5">
            {resultado.porAssunto
              .filter((a) => a.acertos < a.total)
              .map((assunto) => (
                <li
                  key={assunto.assunto}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <span className="min-w-0 text-sm font-medium">{assunto.assunto}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {assunto.acertos}/{assunto.total}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Erros com alta confiança — o sinal mais útil do relatório */}
      {errosComConfianca.length > 0 && (
        <section className="mt-5 rounded-lg border border-rose-600/35 bg-rose-500/[0.06] p-4">
          <h3 className="text-sm font-bold">
            {errosComConfianca.length} erro{errosComConfianca.length > 1 ? 's' : ''} em que você
            tinha certeza
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Este é o achado mais importante do relatório. Errar com confiança significa que o
            critério de reconhecimento está trocado, não esquecido — reveja essas lâminas antes de
            qualquer outra coisa.
          </p>
        </section>
      )}

      {/* Revisão questão a questão */}
      <section aria-labelledby="revisao" className="mt-5">
        <h3 id="revisao" className="mb-2 font-heading text-base font-semibold">
          Revisão das questões
        </h3>
        <ol className="space-y-2">
          {estado.questoes.map((questao, i) => {
            const escolhidas = estado.respostas[questao.id] ?? []
            const certo = questaoCorreta(questao, escolhidas)
            const corretas = questao.alternativas.filter((a) => a.correta)
            return (
              <li key={questao.id} className="rounded-lg border border-border bg-card p-3">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                      certo ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                    aria-hidden
                  >
                    {certo ? (
                      <Check className="h-3 w-3" aria-hidden />
                    ) : (
                      <X className="h-3 w-3" aria-hidden />
                    )}
                  </span>
                  <span>
                    <span className="sr-only">{certo ? 'Acertou. ' : 'Errou. '}</span>
                    {i + 1}. {questao.enunciado}
                  </span>
                </p>
                {!certo && (
                  <p className="mt-1.5 pl-7 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold">Resposta correta: </span>
                    {corretas.map((a) => a.texto).join(', ')}
                    {corretas[0]?.feedback && ` — ${corretas[0].feedback}`}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRefazer('pratica')}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-teal-700 px-4 text-sm font-bold text-white transition-colors hover:bg-teal-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Refazer em prática
        </button>
        <button
          type="button"
          onClick={() => onRefazer('prova')}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border px-4 text-sm font-bold transition-colors hover:border-rose-500/50"
        >
          Nova prova, ordem diferente
        </button>
        <Link
          href={`${BASE}/quizzes`}
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 text-sm font-bold transition-colors hover:border-teal-500/50"
        >
          Outros quizzes
        </Link>
      </div>
    </div>
  )
}

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
