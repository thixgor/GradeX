import rawCatalog from '@/data/atlas-anatomia/catalogo.json'
import { flattenCollections, type AtlasCatalog } from './estrutura'

/**
 * O acervo inteiro, em memória.
 *
 * Este é o único módulo do projeto que importa o JSON das 418 pranchas — e por
 * isso é de uso do servidor: as rotas de API, que servem o acervo por sistema,
 * e os metadados das páginas. No navegador, importar daqui traz 66 KB
 * comprimidos de dado junto; use `estrutura.ts` para os tipos e a travessia, e
 * `acervo-cliente.ts` para buscar um sistema.
 */

export type {
  AtlasCatalog,
  AtlasCollection,
  AtlasMarker,
  AtlasPiece,
  AtlasSystem,
} from './estrutura'
export { flattenCollections, getAtlasCollection } from './estrutura'

export const ATLAS_CATALOG = rawCatalog as AtlasCatalog

const preferredOrder = [
  'circulatorio',
  'respiratorio',
  'digestorio',
  'nervoso',
  'muscular',
  'articular',
  'urinario',
  'genital-masculino',
  'genital-feminino',
  'esqueletico',
]

export const ATLAS_SYSTEMS = [...ATLAS_CATALOG.systems].sort(
  (a, b) => preferredOrder.indexOf(a.slug) - preferredOrder.indexOf(b.slug),
)

export function getAtlasSystem(slug: string | null | undefined) {
  return ATLAS_SYSTEMS.find(system => system.slug === slug)
}

export const ATLAS_TOTALS = ATLAS_SYSTEMS.reduce(
  (totals, system) => {
    for (const collection of flattenCollections(system.collections)) {
      for (const piece of collection.pieces || []) {
        totals.pieces += 1
        totals.markers += piece.markers.length
      }
    }
    return totals
  },
  { pieces: 0, markers: 0 },
)
