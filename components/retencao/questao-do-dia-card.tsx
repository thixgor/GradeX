'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react'

type Alternativa = { letra: string; texto: string; correta: boolean }
type Questao = {
  id: string
  enunciado: string
  explicacao: string
  imagemUrl: string | null
  alternativas: Alternativa[]
  fonte: string | null
  ano: number | null
}

// Card "Questão do dia": mecânica de retorno diário. Determinística por data,
// some sozinho se não houver questões (não polui o dashboard com estado vazio).
export function QuestaoDoDiaCard() {
  const [questao, setQuestao] = useState<Questao | null>(null)
  const [loading, setLoading] = useState(true)
  const [escolha, setEscolha] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    fetch('/api/questao-do-dia')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => ativo && setQuestao(data?.questao || null))
      .catch(() => {})
      .finally(() => ativo && setLoading(false))
    return () => {
      ativo = false
    }
  }, [])

  if (loading || !questao) return null

  const respondida = !!escolha

  return (
    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2 text-amber-500 dark:text-amber-300">
        <Lightbulb className="h-5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-wide">Questão do dia</span>
        {questao.fonte && <span className="text-xs text-muted-foreground">· {questao.fonte}</span>}
        {questao.ano && <span className="text-xs text-muted-foreground">· {questao.ano}</span>}
      </div>

      <p className="mb-4 whitespace-pre-line leading-relaxed">{questao.enunciado}</p>

      {questao.imagemUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={questao.imagemUrl} alt="Imagem da questão" className="mb-4 max-h-72 rounded-xl border border-border" />
      )}

      <div className="space-y-2">
        {questao.alternativas.map((alt) => {
          const selecionada = escolha === alt.letra
          let estilo = 'border-border hover:bg-muted/60'
          if (respondida) {
            if (alt.correta) estilo = 'border-emerald-400/50 bg-emerald-400/10'
            else if (selecionada) estilo = 'border-red-400/50 bg-red-400/10'
            else estilo = 'border-border opacity-70'
          }
          return (
            <button
              key={alt.letra}
              disabled={respondida}
              onClick={() => setEscolha(alt.letra)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${estilo}`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-xs font-bold">
                {alt.letra}
              </span>
              <span className="flex-1 text-sm leading-relaxed">{alt.texto}</span>
              {respondida && alt.correta && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
              {respondida && selecionada && !alt.correta && <XCircle className="h-5 w-5 shrink-0 text-red-500" />}
            </button>
          )
        })}
      </div>

      {respondida && questao.explicacao && (
        <div className="mt-4 rounded-xl border border-teal-400/20 bg-teal-400/[0.06] p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-teal-300">Comentário</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{questao.explicacao}</p>
        </div>
      )}
    </div>
  )
}
