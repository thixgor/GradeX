import type { AchadoPatologico } from '../tipos'

import { ACHADOS_ADAPTACAO } from './adaptacao'
import { ACHADOS_INFLAMACAO } from './inflamacao'
import { ACHADOS_LESAO_CELULAR } from './lesao-celular'
import { ACHADOS_NEOPLASIA } from './neoplasia'

/** Glossário de achados histopatológicos: um verbete por achado, reusado em todas as lâminas. */
export const ACHADOS: AchadoPatologico[] = [
  ...ACHADOS_INFLAMACAO,
  ...ACHADOS_LESAO_CELULAR,
  ...ACHADOS_NEOPLASIA,
  ...ACHADOS_ADAPTACAO,
]

const POR_ID = new Map(ACHADOS.map((a) => [a.id, a]))

export function achadoPorId(id: string): AchadoPatologico | undefined {
  return POR_ID.get(id)
}

/**
 * Nome de cada achado que a ficha de uma doença cita — o recorte que
 * `FichaDaDoenca` recebe, no lugar do glossário inteiro.
 */
export function nomesDosAchadosDe(doenca: { achados: Array<{ achado: string }> }): Record<string, string> {
  const nomes: Record<string, string> = {}
  for (const { achado } of doenca.achados) {
    const verbete = POR_ID.get(achado)
    if (verbete) nomes[achado] = verbete.nome
  }
  return nomes
}
