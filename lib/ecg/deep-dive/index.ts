/**
 * Explicações aprofundadas dos traçados — um arquivo por categoria do catálogo.
 *
 * A chave de cada entrada é o `id` do padrão em `ECG_CATALOG`. O conteúdo mora
 * aqui, e não dentro do catálogo, por dois motivos: o catálogo já é grande e
 * carrega os parâmetros de síntese do sinal, e assim a redação didática pode
 * crescer sem tornar impraticável a edição dos padrões.
 */
import type { DeepDiveMap, EcgDeepDive } from './types'
import { DEEP_DIVE_SINUSAIS } from './ritmos-sinusais'
import { DEEP_DIVE_ESCAPE } from './escape-acelerados'
import { DEEP_DIVE_SUPRAVENTRICULARES } from './supraventriculares'
import { DEEP_DIVE_VENTRICULARES } from './ventriculares'
import { DEEP_DIVE_BLOQUEIOS_AV } from './bloqueios-av'
import { DEEP_DIVE_BLOQUEIOS_RAMO } from './bloqueios-ramo'
import { DEEP_DIVE_PRE_EXCITACAO } from './pre-excitacao'
import { DEEP_DIVE_ISQUEMIA } from './isquemia-infarto'
import { DEEP_DIVE_HIPERTROFIAS } from './hipertrofias'
import { DEEP_DIVE_ELETROLITOS } from './eletrolitos-drogas'
import { DEEP_DIVE_ESPECIAIS } from './especiais-dispositivos'

export type { EcgDeepDive, DeepDiveSection, WaveRow, DiffRow, DeepDiveMap } from './types'

export const ECG_DEEP_DIVE: DeepDiveMap = {
  ...DEEP_DIVE_SINUSAIS,
  ...DEEP_DIVE_ESCAPE,
  ...DEEP_DIVE_SUPRAVENTRICULARES,
  ...DEEP_DIVE_VENTRICULARES,
  ...DEEP_DIVE_BLOQUEIOS_AV,
  ...DEEP_DIVE_BLOQUEIOS_RAMO,
  ...DEEP_DIVE_PRE_EXCITACAO,
  ...DEEP_DIVE_ISQUEMIA,
  ...DEEP_DIVE_HIPERTROFIAS,
  ...DEEP_DIVE_ELETROLITOS,
  ...DEEP_DIVE_ESPECIAIS,
}

/** Explicação aprofundada de um padrão, ou `undefined` se ainda não escrita. */
export function getDeepDive(id: string): EcgDeepDive | undefined {
  return ECG_DEEP_DIVE[id]
}
