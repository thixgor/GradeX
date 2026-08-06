'use client'

import { useCallback, useMemo, useState } from 'react'
import { Check, X, RotateCcw, Trophy, ChevronRight, GraduationCap } from 'lucide-react'
import type { QuestaoTC } from '@/lib/tomografia/tipos'

/**
 * Quiz teórico da subseção.
 *
 * Uma escolha deliberada: as perguntas são sobre o raciocínio (por que a janela
 * muda o exame, por que a úlcera posterior sangra), e não "aponte a estrutura".
 * Os rótulos estão impressos nas próprias imagens da série, então uma pergunta
 * de identificação visual seria respondida lendo a legenda — o Modo Treino
 * cobre a identificação de outro jeito, pedindo que se ACHE o corte.
 */
export function QuizTC({ questoes }: { questoes: QuestaoTC[] }) {
  const [indice, setIndice] = useState(0)
  const [escolhida, setEscolhida] = useState<number | null>(null)
  const [acertos, setAcertos] = useState(0)
  const [respondidas, setRespondidas] = useState(0)
  const [terminou, setTerminou] = useState(false)

  const questao = questoes[indice]
  const respondeu = escolhida !== null

  const responder = useCallback(
    (i: number) => {
      if (escolhida !== null) return
      setEscolhida(i)
      setRespondidas((n) => n + 1)
      if (i === questao.correta) setAcertos((n) => n + 1)
    },
    [escolhida, questao],
  )

  function avancar() {
    if (indice + 1 >= questoes.length) {
      setTerminou(true)
      return
    }
    setIndice((i) => i + 1)
    setEscolhida(null)
  }

  function reiniciar() {
    setIndice(0)
    setEscolhida(null)
    setAcertos(0)
    setRespondidas(0)
    setTerminou(false)
  }

  const percentual = respondidas > 0 ? Math.round((acertos / respondidas) * 100) : 0

  if (terminou) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div
          className={`mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${
            percentual >= 70 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
          }`}
        >
          <Trophy className="h-7 w-7" />
        </div>
        <p className="font-heading text-xl font-semibold tracking-tight">
          {acertos} de {questoes.length} — {percentual}%
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {percentual >= 85
            ? 'Você domina esta série. Vale seguir para a próxima e voltar aqui em alguns dias para fixar.'
            : percentual >= 60
              ? 'Boa base. Releia as fichas das estruturas cujas questões você errou — as explicações apontam exatamente o raciocínio que faltou.'
              : 'Vale percorrer a série de novo com o roteiro de leitura ao lado e reler as fichas antes de repetir o quiz.'}
        </p>
        <button
          onClick={reiniciar}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 text-sm font-bold transition hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" /> Refazer
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" />
          Questão {indice + 1} de {questoes.length}
        </span>
        {respondidas > 0 && (
          <span className="font-mono text-[11px] font-bold text-muted-foreground">
            {acertos}/{respondidas} certas
          </span>
        )}
      </div>

      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${((indice + (respondeu ? 1 : 0)) / questoes.length) * 100}%` }}
        />
      </div>

      <p className="text-sm font-semibold leading-relaxed sm:text-base">{questao.pergunta}</p>

      <div className="mt-4 space-y-2">
        {questao.alternativas.map((alt, i) => {
          const correta = i === questao.correta
          const marcada = escolhida === i
          let estilo = 'border-border bg-muted/25 hover:border-primary/40 hover:bg-muted/50'
          if (respondeu && correta) estilo = 'border-emerald-500/40 bg-emerald-500/10'
          else if (respondeu && marcada) estilo = 'border-rose-500/40 bg-rose-500/10'
          else if (respondeu) estilo = 'border-border bg-muted/20 opacity-60'

          return (
            <button
              key={alt}
              onClick={() => responder(i)}
              disabled={respondeu}
              className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${estilo} ${
                respondeu ? 'cursor-default' : 'active:scale-[0.995]'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  respondeu && correta
                    ? 'bg-emerald-500 text-white'
                    : respondeu && marcada
                      ? 'bg-rose-500 text-white'
                      : 'bg-muted-foreground/15 text-muted-foreground'
                }`}
              >
                {respondeu && correta ? (
                  <Check className="h-3 w-3" />
                ) : respondeu && marcada ? (
                  <X className="h-3 w-3" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="text-sm leading-relaxed">{alt}</span>
            </button>
          )
        })}
      </div>

      {respondeu && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.05] p-3.5">
          <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-primary">Por quê</p>
          <p className="text-sm leading-relaxed text-foreground/85">{questao.explicacao}</p>
          <button
            onClick={avancar}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
          >
            {indice + 1 >= questoes.length ? 'Ver resultado' : 'Próxima'}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
