import type { ConteudoCaso } from './casos-imagem-tipos'
import { CASOS_RX_TORAX } from './casos-rx-apontados-torax'
import { CASOS_RX_CARDIO } from './casos-rx-apontados-cardio'
import { CASOS_RX_CARDIO_2 } from './casos-rx-apontados-cardio-2'
import { CASOS_RX_PEDIATRICO } from './casos-rx-apontados-pediatrico'
import { CASOS_RX_OSSO } from './casos-rx-apontados-osso'
import { CASOS_RX_OSSO_2 } from './casos-rx-apontados-osso-2'
import { CASOS_RX_OSSO_3 } from './casos-rx-apontados-osso-3'
import { CASOS_RX_OSSO_4 } from './casos-rx-apontados-osso-4'

/** Casos de raio-X com setas comentadas, vinheta clínica e quiz. */
export const CASOS_RX_APONTADOS: Record<string, ConteudoCaso> = {
  ...CASOS_RX_TORAX,
  ...CASOS_RX_CARDIO,
  ...CASOS_RX_CARDIO_2,
  ...CASOS_RX_PEDIATRICO,
  ...CASOS_RX_OSSO,
  ...CASOS_RX_OSSO_2,
  ...CASOS_RX_OSSO_3,
  ...CASOS_RX_OSSO_4,
}
