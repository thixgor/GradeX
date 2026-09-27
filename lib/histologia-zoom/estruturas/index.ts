import anotacoes from '@/data/histologia-zoom/anotacoes.gerado.json'

import { ESTRUTURAS_CARDIOVASCULAR } from './glossario/cardiovascular'
import { ESTRUTURAS_CELULA } from './glossario/celula'
import { ESTRUTURAS_COMUNS } from './glossario/comuns'
import { ESTRUTURAS_CONJUNTIVO } from './glossario/conjuntivo'
import { ESTRUTURAS_MEDULA_ESPINAL } from './glossario/medula-espinal'
import { ESTRUTURAS_NERVOSO } from './glossario/nervoso'
import { ESTRUTURAS_DIGESTORIO } from './glossario/digestorio'
import { ESTRUTURAS_EMBRIOLOGIA_SENTIDOS } from './glossario/embriologia-sentidos'
import { ESTRUTURAS_ENDOCRINO } from './glossario/endocrino'
import { ESTRUTURAS_GLANDULAS } from './glossario/glandulas'
import { ESTRUTURAS_LINFOIDE } from './glossario/linfoide'
import { ESTRUTURAS_MUSCULO } from './glossario/musculo'
import { ESTRUTURAS_NEURONIOS } from './glossario/neuronios'
import { ESTRUTURAS_ORAL } from './glossario/oral'
import { ESTRUTURAS_OSSO } from './glossario/osso'
import { ESTRUTURAS_PELE } from './glossario/pele'
import { ESTRUTURAS_REPRODUTOR_FEMININO } from './glossario/reprodutor-feminino'
import { ESTRUTURAS_REPRODUTOR_MASCULINO } from './glossario/reprodutor-masculino'
import { ESTRUTURAS_RESPIRATORIO } from './glossario/respiratorio'
import { ESTRUTURAS_SANGUE } from './glossario/sangue'
import { ESTRUTURAS_SNC } from './glossario/snc'
import { ESTRUTURAS_SNP } from './glossario/snp'
import { ESTRUTURAS_TECIDOS } from './glossario/tecidos'
import { ESTRUTURAS_URINARIO } from './glossario/urinario'
import type { AnotacaoDaLamina, Estrutura, EstruturaMarcada } from './tipos'

/**
 * Glossário de estruturas e marcações por lâmina.
 *
 * O glossário é leve e vai ao cliente só o que a lâmina aberta usa; as
 * marcações consolidadas ficam no servidor e são entregues por lâmina.
 */

export const GLOSSARIO: Estrutura[] = [
  ...ESTRUTURAS_NERVOSO,
  ...ESTRUTURAS_MEDULA_ESPINAL,
  ...ESTRUTURAS_NEURONIOS,
  ...ESTRUTURAS_SNC,
  ...ESTRUTURAS_SNP,
  ...ESTRUTURAS_TECIDOS,
  ...ESTRUTURAS_CELULA,
  ...ESTRUTURAS_CONJUNTIVO,
  ...ESTRUTURAS_PELE,
  ...ESTRUTURAS_URINARIO,
  ...ESTRUTURAS_SANGUE,
  ...ESTRUTURAS_OSSO,
  ...ESTRUTURAS_MUSCULO,
  ...ESTRUTURAS_CARDIOVASCULAR,
  ...ESTRUTURAS_LINFOIDE,
  ...ESTRUTURAS_RESPIRATORIO,
  ...ESTRUTURAS_ORAL,
  ...ESTRUTURAS_DIGESTORIO,
  ...ESTRUTURAS_GLANDULAS,
  ...ESTRUTURAS_ENDOCRINO,
  ...ESTRUTURAS_REPRODUTOR_MASCULINO,
  ...ESTRUTURAS_REPRODUTOR_FEMININO,
  ...ESTRUTURAS_EMBRIOLOGIA_SENTIDOS,
  ...ESTRUTURAS_COMUNS,
]

const POR_ID = new Map(GLOSSARIO.map((e) => [e.id, e]))

export function estruturaPorId(id: string): Estrutura | undefined {
  return POR_ID.get(id)
}

const ANOTACOES = anotacoes as unknown as Record<string, AnotacaoDaLamina>

export function anotacaoDaLamina(slug: string): AnotacaoDaLamina | null {
  return ANOTACOES[slug] ?? null
}

/** Marcações da lâmina com o verbete resolvido, na ordem em que foram registradas. */
export function estruturasDaLamina(slug: string): EstruturaMarcada[] {
  const a = ANOTACOES[slug]
  if (!a) return []
  return a.estruturas
    .map((m) => {
      const verbete = POR_ID.get(m.estrutura)
      return verbete ? { ...m, verbete } : null
    })
    .filter((x): x is EstruturaMarcada => x !== null)
}

export function todasAsAnotacoes(): Record<string, AnotacaoDaLamina> {
  return ANOTACOES
}
