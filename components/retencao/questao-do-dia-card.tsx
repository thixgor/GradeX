'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Sparkles, ChevronDown, MessageCircleHeart } from 'lucide-react'
import { TiltCard } from '@/components/tilt-card'

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

const STORAGE_PREFIX = 'gradex-questao-dia-'

// Card "Questão do dia": mecânica de retorno diário. Determinística por data,
// some sozinho se não houver questões (não polui o dashboard com estado vazio).
// Começa recolhido (uma única linha) para não ocupar espaço no topo do
// dashboard; expande sob demanda. A resposta do dia fica em localStorage,
// então reabrir o card mais tarde no mesmo dia mostra o resultado direto.
export function QuestaoDoDiaCard() {
  const [questao, setQuestao] = useState<Questao | null>(null)
  const [dataKey, setDataKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [escolha, setEscolha] = useState<string | null>(null)
  const [aberta, setAberta] = useState(false)

  useEffect(() => {
    let ativo = true
    fetch('/api/questao-do-dia')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ativo) return
        const q: Questao | null = data?.questao || null
        setQuestao(q)
        setDataKey(data?.data || null)
        if (q && data?.data) {
          try {
            const salva = window.localStorage.getItem(STORAGE_PREFIX + data.data)
            if (salva) setEscolha(salva)
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => ativo && setLoading(false))
    return () => {
      ativo = false
    }
  }, [])

  if (loading || !questao) return null

  const respondida = !!escolha
  const acertou = respondida && questao.alternativas.some((a) => a.letra === escolha && a.correta)
  const previewTexto = questao.enunciado.replace(/\s+/g, ' ').trim()

  function responder(letra: string) {
    setEscolha(letra)
    if (dataKey) {
      try {
        window.localStorage.setItem(STORAGE_PREFIX + dataKey, letra)
      } catch {}
    }
  }

  return (
    <motion.div data-tour="questao-do-dia" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <TiltCard maxTilt={2} scale={1.004} className="rounded-2xl">
        <div className="glass-irish relative isolate overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* Cabeçalho — sempre visível, compacto (linha única) */}
          <button
            type="button"
            onClick={() => setAberta((v) => !v)}
            aria-expanded={aberta}
            className="relative flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5 sm:py-3.5"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300/30 to-emerald-500/20 text-amber-600 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
              {!respondida && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1120]" />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-amber-300">
                Questão do dia
                {respondida && (
                  <span
                    className={`inline-flex items-center gap-1 normal-case ${
                      acertou ? 'text-emerald-500' : 'text-red-400'
                    }`}
                  >
                    {acertou ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {acertou ? 'Você acertou' : 'Você errou'}
                  </span>
                )}
              </span>
              {!aberta && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{previewTexto}</span>}
            </span>

            <motion.span
              animate={{ rotate: aberta ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {aberta && (
              <motion.div
                key="corpo"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="relative px-4 pb-4 sm:px-5 sm:pb-5">
                  {(questao.fonte || questao.ano) && (
                    <div className="mb-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                      {questao.fonte && <span>{questao.fonte}</span>}
                      {questao.fonte && questao.ano && <span>·</span>}
                      {questao.ano && <span>{questao.ano}</span>}
                    </div>
                  )}

                  <p className="mb-4 whitespace-pre-line text-sm leading-relaxed sm:text-[15px]">{questao.enunciado}</p>

                  {questao.imagemUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={questao.imagemUrl}
                      alt="Imagem da questão"
                      className="mb-4 max-h-64 rounded-xl border border-border"
                    />
                  )}

                  <div className="space-y-2">
                    {questao.alternativas.map((alt, i) => {
                      const selecionada = escolha === alt.letra
                      let estilo = 'border-border/60 hover:border-emerald-400/40 hover:bg-emerald-400/[0.05]'
                      if (respondida) {
                        if (alt.correta) estilo = 'border-emerald-400/50 bg-emerald-400/10'
                        else if (selecionada) estilo = 'border-red-400/50 bg-red-400/10'
                        else estilo = 'border-border/40 opacity-60'
                      }
                      return (
                        <motion.button
                          key={alt.letra}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                          disabled={respondida}
                          onClick={() => responder(alt.letra)}
                          className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 ${estilo}`}
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 text-xs font-bold">
                            {alt.letra}
                          </span>
                          <span className="flex-1 text-sm leading-relaxed">{alt.texto}</span>
                          {respondida && alt.correta && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                          {respondida && selecionada && !alt.correta && (
                            <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>

                  <AnimatePresence>
                    {respondida && questao.explicacao && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="glass-irish-soft mt-4 rounded-xl p-3.5"
                      >
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-amber-300">
                          <MessageCircleHeart className="h-3.5 w-3.5" /> Comentário
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {questao.explicacao}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TiltCard>
    </motion.div>
  )
}
