'use client'

import { useId, useState } from 'react'
import { Check, X } from 'lucide-react'

/**
 * Autoavaliação com devolutiva.
 *
 * A devolutiva só aparece depois da resposta — recuperação da memória exige que
 * a resposta não esteja visível de imediato, e é o ponto do exercício. Ela
 * também explica **por que as erradas estão erradas**, e não apenas por que a
 * certa está certa: sem isso, o aluno que acertou por eliminação sai com o mesmo
 * modelo mental defeituoso com que entrou.
 *
 * As alternativas são `<input type="radio">` reais dentro de um `<fieldset>`.
 * Um `<button>` estilizado ficaria idêntico na tela e seria anunciado como
 * "botão", não como "opção 2 de 4" — a informação que torna a questão navegável
 * sem enxergar.
 */

export interface Pergunta {
  pergunta: string
  alternativas: string[]
  indiceCorreto: number
  devolutiva: string
  nivel: 'essencial' | 'aprofundar' | 'avancado'
}

export function Autoavaliacao({ perguntas }: { perguntas: Pergunta[] }) {
  if (perguntas.length === 0) return null
  return (
    <ol className="space-y-4">
      {perguntas.map((p, i) => (
        <li key={p.pergunta}>
          <Questao pergunta={p} numero={i + 1} />
        </li>
      ))}
    </ol>
  )
}

function Questao({ pergunta, numero }: { pergunta: Pergunta; numero: number }) {
  const [escolhida, setEscolhida] = useState<number | null>(null)
  const [respondida, setRespondida] = useState(false)
  const nome = useId()
  const idDaDevolutiva = useId()

  const acertou = escolhida === pergunta.indiceCorreto

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <fieldset>
        <legend className="text-sm font-bold leading-snug">
          <span className="mr-1.5 text-muted-foreground">{numero}.</span>
          {pergunta.pergunta}
        </legend>

        <div className="mt-3 space-y-1.5">
          {pergunta.alternativas.map((alternativa, i) => {
            const correta = i === pergunta.indiceCorreto
            const marcada = escolhida === i
            let realce = 'border-border'
            if (respondida && correta) realce = 'border-emerald-500/60 bg-emerald-500/5'
            else if (respondida && marcada) realce = 'border-rose-500/60 bg-rose-500/5'

            return (
              <label
                key={alternativa}
                className={`flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs leading-relaxed transition-colors ${realce}`}
              >
                <input
                  type="radio"
                  name={nome}
                  checked={marcada}
                  disabled={respondida}
                  onChange={() => setEscolhida(i)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span className="flex-1">{alternativa}</span>
                {respondida && correta && (
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Alternativa correta" />
                )}
                {respondida && marcada && !correta && (
                  <X className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" aria-label="Alternativa escolhida, incorreta" />
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      {!respondida ? (
        <button
          type="button"
          disabled={escolhida === null}
          onClick={() => setRespondida(true)}
          aria-controls={idDaDevolutiva}
          className="mt-3 inline-flex min-h-[40px] items-center rounded-md bg-teal-700 px-4 text-xs font-bold text-white transition-colors hover:bg-teal-800 disabled:opacity-40"
        >
          Conferir resposta
        </button>
      ) : (
        <div
          id={idDaDevolutiva}
          role="status"
          className={`mt-3 rounded-lg border p-3 text-xs leading-relaxed ${
            acertou
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-amber-500/40 bg-amber-500/5'
          }`}
        >
          <p className="font-bold">{acertou ? 'Correto.' : 'Ainda não.'}</p>
          <p className="mt-1">{pergunta.devolutiva}</p>
          <button
            type="button"
            onClick={() => {
              setRespondida(false)
              setEscolhida(null)
            }}
            className="mt-2 inline-flex min-h-[36px] items-center rounded-md border border-border bg-card px-3 text-[11px] font-bold transition-colors hover:border-teal-600/50"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  )
}
