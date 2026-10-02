import type { ExplicacoesExtras } from './casos-imagem'
import { EXPLICACOES_TC_1 } from './casos-tc-explicacoes-1'
import { EXPLICACOES_TC_2 } from './casos-tc-explicacoes-2'
import { EXPLICACOES_TC_3 } from './casos-tc-explicacoes-3'

/**
 * Comentário aprofundado das setas da primeira leva de TC. A revisão (`_3`)
 * sobrescreve a explicação e herda a dica quando não traz outra.
 */
function juntar(...partes: ExplicacoesExtras[]): ExplicacoesExtras {
  const saida: ExplicacoesExtras = {}
  for (const parte of partes) {
    for (const [slug, rotulos] of Object.entries(parte)) {
      const destino = (saida[slug] ??= {})
      for (const [rotulo, valor] of Object.entries(rotulos)) {
        destino[rotulo] = { explicacao: valor.explicacao, dica: valor.dica ?? destino[rotulo]?.dica }
      }
    }
  }
  return saida
}

export const EXPLICACOES_TC: ExplicacoesExtras = juntar(EXPLICACOES_TC_1, EXPLICACOES_TC_2, EXPLICACOES_TC_3)
