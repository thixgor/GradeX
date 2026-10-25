'use client'

import { useCallback, useState } from 'react'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { cn } from '@/lib/utils'

const HORA_MS = 60 * 60 * 1000

/**
 * Quanto falta para a janela da oferta fechar, em ms, andando de segundo em
 * segundo — e só com a aba visível (`useIntervaloVisivel`).
 *
 * O prazo chega como "quanto falta" + a hora local em que a resposta chegou,
 * para não depender do relógio do aparelho estar certo. Quando zera, a janela
 * seguinte começa (mesma regra de `prazoDaOferta` no servidor), então o número
 * nunca fica preso em 00:00:00 nem promete o que o checkout recusaria.
 */
export function useContagemDaOferta(
  restanteMs: number | null | undefined,
  recebidaEm: number | undefined,
  janelaHoras: number | undefined,
): number | null {
  const calcular = useCallback(() => {
    if (restanteMs == null || !recebidaEm) return null
    const janela = Math.max(1, janelaHoras || 48) * HORA_MS
    let falta = recebidaEm + restanteMs - Date.now()
    if (falta <= 0) falta = janela - (Math.abs(falta) % janela)
    return falta
  }, [restanteMs, recebidaEm, janelaHoras])

  const [falta, setFalta] = useState<number | null>(calcular)
  useIntervaloVisivel(() => setFalta(calcular()), restanteMs == null ? null : 1000)
  // Primeira leitura quando os dados chegam depois da montagem.
  if (falta === null && restanteMs != null && recebidaEm) {
    const valor = calcular()
    if (valor !== null) setFalta(valor)
  }
  return falta
}

function partes(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    horas: Math.floor(total / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  }
}

const dois = (n: number) => String(n).padStart(2, '0')

/** "47:12:09", em blocos de vidro. O leitor de tela ouve a frase inteira, uma vez. */
export function ContagemRegressiva({
  faltaMs,
  tamanho = 'normal',
  className,
}: {
  faltaMs: number
  tamanho?: 'normal' | 'compacto'
  className?: string
}) {
  const { horas, minutos, segundos } = partes(faltaMs)
  const blocos: Array<[string, string]> = [
    [dois(horas), 'h'],
    [dois(minutos), 'min'],
    [dois(segundos), 's'],
  ]
  return (
    <span
      className={cn('venda-contagem', tamanho === 'compacto' && 'venda-contagem-compacta', className)}
      role="timer"
      aria-label={`Faltam ${horas} horas e ${minutos} minutos`}
    >
      {blocos.map(([valor, unidade], i) => (
        <span key={unidade} className="venda-contagem-bloco" aria-hidden>
          <span className="venda-contagem-numero">{valor}</span>
          <span className="venda-contagem-unidade">{unidade}</span>
          {i < blocos.length - 1 && <span className="venda-contagem-sep">:</span>}
        </span>
      ))}
    </span>
  )
}
