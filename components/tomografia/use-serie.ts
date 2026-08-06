'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Pré-carregamento progressivo de uma pilha de cortes.
 *
 * O visualizador só é convincente se rolar o scroll trocar o corte na hora — e
 * isso não acontece se cada corte só começar a baixar quando aparece. Por outro
 * lado, montar as 61 imagens de uma vez no DOM estoura a memória do celular
 * (cada corte decodificado ocupa ~2,7 MB).
 *
 * A saída é separar as duas coisas:
 *  - aqui, um preloader fora do DOM (`new Image()`) que aquece o cache HTTP da
 *    série inteira, em ondas de poucas requisições e começando pelo corte que a
 *    pessoa está olhando;
 *  - no componente, apenas uma janela de cortes vizinhos montada de verdade.
 *
 * A prioridade é reavaliada a cada mudança de corte: quem rola rápido para o
 * fim da série não fica esperando o começo terminar de baixar.
 */

const CONCORRENCIA = 4

export interface EstadoSerie {
  /** true para cada índice (0-based) já baixado. */
  carregados: boolean[]
  /** Quantos cortes já estão em cache. */
  prontos: number
  total: number
  /** 0 a 1. */
  progresso: number
  /** O corte atual já está disponível? */
  atualPronto: boolean
  /** Marca um corte como pronto (usado pelo onLoad das <img> montadas). */
  marcarPronto: (indice: number) => void
}

export function useSerie(urls: string[], indiceAtual: number): EstadoSerie {
  const total = urls.length
  const [carregados, setCarregados] = useState<boolean[]>(() => new Array(total).fill(false))
  const emAndamento = useRef<Set<number>>(new Set())
  const concluidos = useRef<Set<number>>(new Set())
  const indiceRef = useRef(indiceAtual)
  indiceRef.current = indiceAtual

  // Zera tudo quando a série troca (navegação entre subseções sem remontar).
  const chave = urls[0] || ''
  useEffect(() => {
    emAndamento.current = new Set()
    concluidos.current = new Set()
    setCarregados(new Array(total).fill(false))
  }, [chave, total])

  const marcarPronto = useCallback((indice: number) => {
    if (concluidos.current.has(indice)) return
    concluidos.current.add(indice)
    emAndamento.current.delete(indice)
    setCarregados((prev) => {
      if (prev[indice]) return prev
      const proximo = prev.slice()
      proximo[indice] = true
      return proximo
    })
  }, [])

  useEffect(() => {
    if (total === 0) return
    let vivo = true

    /** Próximo alvo: o mais perto do corte atual que ainda não foi baixado. */
    function proximoAlvo(): number | null {
      const centro = indiceRef.current
      for (let raio = 0; raio <= total; raio++) {
        for (const cand of raio === 0 ? [centro] : [centro + raio, centro - raio]) {
          if (cand < 0 || cand >= total) continue
          if (concluidos.current.has(cand) || emAndamento.current.has(cand)) continue
          return cand
        }
      }
      return null
    }

    function bombear() {
      if (!vivo) return
      while (emAndamento.current.size < CONCORRENCIA) {
        const alvo = proximoAlvo()
        if (alvo == null) return
        emAndamento.current.add(alvo)
        const img = new Image()
        img.decoding = 'async'
        const finalizar = () => {
          if (!vivo) return
          marcarPronto(alvo)
          bombear()
        }
        img.onload = finalizar
        img.onerror = () => {
          if (!vivo) return
          // Um corte que falha não pode travar a fila — conta como resolvido.
          emAndamento.current.delete(alvo)
          concluidos.current.add(alvo)
          bombear()
        }
        img.src = urls[alvo]
      }
    }

    bombear()
    return () => {
      vivo = false
    }
    // `indiceAtual` entra de propósito: mudar de corte reprioriza a fila.
  }, [urls, total, indiceAtual, marcarPronto])

  const prontos = useMemo(() => carregados.reduce((n, c) => n + (c ? 1 : 0), 0), [carregados])

  return {
    carregados,
    prontos,
    total,
    progresso: total ? prontos / total : 0,
    atualPronto: !!carregados[indiceAtual],
    marcarPronto,
  }
}
