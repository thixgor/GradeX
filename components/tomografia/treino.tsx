'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Crosshair, Check, X, RotateCcw, Play, Trophy, ArrowRight } from 'lucide-react'
import type { EstruturaTC } from '@/lib/tomografia/tipos'

/**
 * Modo Treino — "encontre o corte".
 *
 * O quiz de identificação visual clássico ("qual estrutura a seta aponta?") não
 * funciona aqui: os rótulos estão impressos nas imagens, então bastaria ler a
 * legenda. Este exercício inverte o problema e usa a única mecânica que a
 * legenda não entrega de graça — o sorteio nomeia a estrutura e a pessoa tem
 * de percorrer a pilha até o corte em que ela aparece. Acertar exige saber em
 * que altura do corpo aquilo mora, que é justamente a habilidade que a leitura
 * de TC cobra.
 *
 * A validação usa o mapa de cortes extraído por OCR das próprias imagens, com
 * uma tolerância de um corte para cima e para baixo — a fronteira de onde uma
 * estrutura "aparece" é gradual, e exigir o corte exato puniria acerto legítimo.
 */

const TOLERANCIA = 1

interface TreinoProps {
  estruturas: EstruturaTC[]
  corteAtual: number
  /** Leva o visualizador a um corte (usado no "mostrar resposta"). */
  onIrParaCorte: (corte: number) => void
}

type Fase = 'ocioso' | 'procurando' | 'acertou' | 'errou' | 'fim'

export function ModoTreino({ estruturas, corteAtual, onIrParaCorte }: TreinoProps) {
  // Só entram estruturas cujo corte é conhecido — sem isso não há como corrigir.
  const elegiveis = useMemo(() => estruturas.filter((e) => e.cortes && e.cortes.length > 0), [estruturas])

  const [fase, setFase] = useState<Fase>('ocioso')
  const [fila, setFila] = useState<EstruturaTC[]>([])
  const [indice, setIndice] = useState(0)
  const [acertos, setAcertos] = useState(0)
  const [tentativas, setTentativas] = useState(0)

  const alvo = fila[indice]

  const embaralhar = useCallback(() => {
    const copia = elegiveis.slice()
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copia[i], copia[j]] = [copia[j], copia[i]]
    }
    return copia.slice(0, Math.min(8, copia.length))
  }, [elegiveis])

  function comecar() {
    setFila(embaralhar())
    setIndice(0)
    setAcertos(0)
    setTentativas(0)
    setFase('procurando')
  }

  function conferir() {
    if (!alvo?.cortes) return
    const acertou = alvo.cortes.some((c) => Math.abs(c - corteAtual) <= TOLERANCIA)
    setTentativas((n) => n + 1)
    if (acertou) setAcertos((n) => n + 1)
    setFase(acertou ? 'acertou' : 'errou')
  }

  function proxima() {
    if (indice + 1 >= fila.length) {
      setFase('fim')
      return
    }
    setIndice((i) => i + 1)
    setFase('procurando')
  }

  function mostrarResposta() {
    if (!alvo?.cortes) return
    onIrParaCorte(alvo.cortes[Math.floor(alvo.cortes.length / 2)])
  }

  // Trocar de série no meio do treino deixaria a fila apontando para estruturas
  // que não existem mais na tela.
  useEffect(() => {
    setFase('ocioso')
    setFila([])
  }, [elegiveis])

  if (elegiveis.length < 3) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">
          Esta série ainda não tem cortes mapeados suficientes para o modo treino. Use o quiz e a lista de
          estruturas.
        </p>
      </div>
    )
  }

  if (fase === 'ocioso') {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Crosshair className="h-5 w-5" />
        </div>
        <h3 className="font-heading text-lg font-semibold tracking-tight">Modo treino: encontre o corte</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sorteamos uma estrutura e você percorre a pilha até o corte em que ela aparece. É o exercício que
          mais se parece com a leitura real: não basta reconhecer a estrutura, é preciso saber em que altura
          do corpo ela vive. Oito rodadas, tolerância de um corte.
        </p>
        <button
          onClick={comecar}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <Play className="h-4 w-4" /> Começar treino
        </button>
      </div>
    )
  }

  if (fase === 'fim') {
    const pct = tentativas > 0 ? Math.round((acertos / tentativas) * 100) : 0
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div
          className={`mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${
            pct >= 70 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
          }`}
        >
          <Trophy className="h-7 w-7" />
        </div>
        <p className="font-heading text-xl font-semibold tracking-tight">
          {acertos} de {tentativas} cortes encontrados — {pct}%
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {pct >= 75
            ? 'Você já tem o mapa mental da série. Tente a próxima região.'
            : 'Percorra a série mais uma vez com o roteiro de leitura ao lado, prestando atenção na ordem em que as estruturas aparecem.'}
        </p>
        <button
          onClick={comecar}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 text-sm font-bold transition hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" /> Novo treino
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Rodada {indice + 1} de {fila.length}
        </span>
        <span className="font-mono text-[11px] font-bold text-muted-foreground">
          {acertos}/{tentativas} certas
        </span>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-primary">Encontre o corte de</p>
        <p className="mt-1 font-heading text-lg font-semibold leading-tight tracking-tight">{alvo?.nome}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{alvo?.resumo}</p>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Você está no corte <strong className="font-mono font-bold text-foreground">{corteAtual}</strong>. Role o
        visualizador até achar a estrutura e confira.
      </p>

      {fase === 'procurando' && (
        <button
          onClick={conferir}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <Crosshair className="h-4 w-4" /> Conferir este corte
        </button>
      )}

      {(fase === 'acertou' || fase === 'errou') && (
        <div
          className={`mt-3 rounded-xl border p-3.5 ${
            fase === 'acertou'
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-rose-500/30 bg-rose-500/10'
          }`}
        >
          <p
            className={`flex items-center gap-1.5 text-sm font-bold ${
              fase === 'acertou' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {fase === 'acertou' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {fase === 'acertou' ? 'Corte correto' : 'Ainda não é aqui'}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {alvo?.nome} aparece {alvo?.cortes && alvo.cortes.length > 1 ? 'nos cortes' : 'no corte'}{' '}
            <strong className="font-mono text-foreground">{alvo?.cortes?.join(', ')}</strong>.
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{alvo?.comoIdentificar}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {fase === 'errou' && (
              <button
                onClick={mostrarResposta}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold transition hover:bg-muted"
              >
                <Crosshair className="h-3.5 w-3.5" /> Mostrar no visualizador
              </button>
            )}
            <button
              onClick={proxima}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              {indice + 1 >= fila.length ? 'Ver resultado' : 'Próxima'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
