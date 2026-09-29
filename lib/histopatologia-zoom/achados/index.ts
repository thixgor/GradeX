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
