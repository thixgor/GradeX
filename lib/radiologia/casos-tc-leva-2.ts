import type { ConteudoCaso } from './casos-imagem-tipos'
import { CASOS_TC_L2_NEURO } from './casos-tc-leva-2-neuro'
import { CASOS_TC_L2_NEURO_2 } from './casos-tc-leva-2-neuro-2'
import { CASOS_TC_L2_NEURO_3 } from './casos-tc-leva-2-neuro-3'
import { CASOS_TC_L2_CABECA_PESCOCO } from './casos-tc-leva-2-cabeca-pescoco'
import { CASOS_TC_L2_CABECA_PESCOCO_2 } from './casos-tc-leva-2-cabeca-pescoco-2'
import { CASOS_TC_L2_TORAX } from './casos-tc-leva-2-torax'
import { CASOS_TC_L2_TORAX_2 } from './casos-tc-leva-2-torax-2'
import { CASOS_TC_L2_TORAX_3 } from './casos-tc-leva-2-torax-3'
import { CASOS_TC_L2_ABDOME } from './casos-tc-leva-2-abdome'
import { CASOS_TC_L2_ABDOME_2 } from './casos-tc-leva-2-abdome-2'
import { CASOS_TC_L2_ABDOME_3 } from './casos-tc-leva-2-abdome-3'
import { CASOS_TC_L2_ABDOME_4 } from './casos-tc-leva-2-abdome-4'
import { CASOS_TC_L2_ABDOME_5 } from './casos-tc-leva-2-abdome-5'
import { CASOS_TC_L2_TRAUMA } from './casos-tc-leva-2-trauma'
import { CASOS_TC_L3_NEURO_TORAX } from './casos-tc-leva-3-neuro-torax'
import { CASOS_TC_L3_ABDOME } from './casos-tc-leva-3-abdome'
import { CASOS_TC_L3_TRAUMA } from './casos-tc-leva-3-trauma'

/** Segunda leva de casos de TC, com séries múltiplas e setas comentadas em profundidade. */
export const CASOS_TC_LEVA_2: Record<string, ConteudoCaso> = {
  ...CASOS_TC_L2_NEURO,
  ...CASOS_TC_L2_NEURO_2,
  ...CASOS_TC_L2_NEURO_3,
  ...CASOS_TC_L2_CABECA_PESCOCO,
  ...CASOS_TC_L2_CABECA_PESCOCO_2,
  ...CASOS_TC_L2_TORAX,
  ...CASOS_TC_L2_TORAX_2,
  ...CASOS_TC_L2_TORAX_3,
  ...CASOS_TC_L2_ABDOME,
  ...CASOS_TC_L2_ABDOME_2,
  ...CASOS_TC_L2_ABDOME_3,
  ...CASOS_TC_L2_ABDOME_4,
  ...CASOS_TC_L2_ABDOME_5,
  ...CASOS_TC_L2_TRAUMA,
  ...CASOS_TC_L3_NEURO_TORAX,
  ...CASOS_TC_L3_ABDOME,
  ...CASOS_TC_L3_TRAUMA,
}
