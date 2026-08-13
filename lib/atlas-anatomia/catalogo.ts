import rawCatalog from '@/data/atlas-anatomia/catalogo.json'

export interface AtlasMarker {
  title: string
  description: string
  x: number
  y: number
  placement: string
  color: string
}

export interface AtlasPiece {
  id: string
  title: string
  image: string
  sourceImage: string
  markers: AtlasMarker[]
}

export interface AtlasCollection {
  slug: string
  title: string
  sourceUrl?: string
  pieces?: AtlasPiece[]
  children?: AtlasCollection[]
}

export interface AtlasSystem {
  slug: string
  title: string
  cover: string
  sourceUrl: string
  collections: AtlasCollection[]
}

interface AtlasCatalog {
  source: {
    name: string
    url: string
    authorization: string
  }
  systems: AtlasSystem[]
}

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

export function flattenCollections(
  collections: AtlasCollection[],
  parents: string[] = [],
): Array<AtlasCollection & { breadcrumb: string[] }> {
  return collections.flatMap(collection => {
    const breadcrumb = [...parents, collection.title]
    return [
      { ...collection, breadcrumb },
      ...flattenCollections(collection.children || [], breadcrumb),
    ]
  })
}

export function getAtlasCollection(system: AtlasSystem, slug: string | null | undefined) {
  return flattenCollections(system.collections).find(collection => collection.slug === slug)
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
