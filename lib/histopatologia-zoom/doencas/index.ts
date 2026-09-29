import type { DoencaZoom } from '../tipos'

import { DOENCAS_RESPIRATORIO } from './respiratorio'
import { DOENCAS_CARDIOVASCULAR } from './cardiovascular'
import { DOENCAS_DIGESTORIO } from './digestorio'
import { DOENCAS_ENDOCRINO } from './endocrino'
import { DOENCAS_INFECCOES } from './infeccoes'
import { DOENCAS_LINFOIDE } from './linfoide'
import { DOENCAS_MAMA } from './mama'
import { DOENCAS_PELE } from './pele'
import { DOENCAS_REPRODUTOR_FEMININO } from './reprodutor-feminino'
import { DOENCAS_REPRODUTOR_MASCULINO } from './reprodutor-masculino'
import { DOENCAS_URINARIO } from './urinario'

/** Doenças da Histopatologia com Zoom, em ordem de prioridade (mais comuns primeiro). */
export const DOENCAS: DoencaZoom[] = [...DOENCAS_DIGESTORIO, ...DOENCAS_CARDIOVASCULAR, ...DOENCAS_INFECCOES, ...DOENCAS_PELE, ...DOENCAS_MAMA, ...DOENCAS_ENDOCRINO, ...DOENCAS_REPRODUTOR_MASCULINO, ...DOENCAS_REPRODUTOR_FEMININO, ...DOENCAS_LINFOIDE, ...DOENCAS_URINARIO, ...DOENCAS_RESPIRATORIO].sort((a, b) => a.prioridade - b.prioridade)

const POR_ID = new Map(DOENCAS.map((d) => [d.id, d]))

export function doencaPorId(id: string): DoencaZoom | undefined {
  return POR_ID.get(id)
}
