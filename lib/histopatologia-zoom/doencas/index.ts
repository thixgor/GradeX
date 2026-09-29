import type { DoencaZoom } from '../tipos'

import { DOENCAS_DIGESTORIO } from './digestorio'

/** Doenças da Histopatologia com Zoom, em ordem de prioridade (mais comuns primeiro). */
export const DOENCAS: DoencaZoom[] = [...DOENCAS_DIGESTORIO].sort((a, b) => a.prioridade - b.prioridade)

const POR_ID = new Map(DOENCAS.map((d) => [d.id, d]))

export function doencaPorId(id: string): DoencaZoom | undefined {
  return POR_ID.get(id)
}
