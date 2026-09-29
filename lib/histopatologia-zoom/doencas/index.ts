import type { DoencaZoom } from '../tipos'

import { DOENCAS_CARDIOVASCULAR } from './cardiovascular'
import { DOENCAS_DIGESTORIO } from './digestorio'
import { DOENCAS_INFECCOES } from './infeccoes'
import { DOENCAS_MAMA } from './mama'
import { DOENCAS_PELE } from './pele'

/** Doenças da Histopatologia com Zoom, em ordem de prioridade (mais comuns primeiro). */
export const DOENCAS: DoencaZoom[] = [...DOENCAS_DIGESTORIO, ...DOENCAS_CARDIOVASCULAR, ...DOENCAS_INFECCOES, ...DOENCAS_PELE, ...DOENCAS_MAMA].sort((a, b) => a.prioridade - b.prioridade)

const POR_ID = new Map(DOENCAS.map((d) => [d.id, d]))

export function doencaPorId(id: string): DoencaZoom | undefined {
  return POR_ID.get(id)
}
