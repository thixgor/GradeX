/**
 * Forma do acervo do Atlas, sem o acervo.
 *
 * Este módulo existe para separar o *formato* dos dados dos *dados*. Quem só
 * precisa percorrer a árvore de coleções — a área de estudo, o recorte do quiz,
 * a ficha — importa daqui. Quem precisa do arquivo inteiro importa de
 * `catalogo.ts`, que é o único ponto do projeto que traz o JSON.
 *
 * A distinção não é estética: `flattenCollections` estava em `catalogo.ts`, e
 * como importar uma função de um módulo traz o módulo inteiro, a área de estudo
 * arrastava 66 KB comprimidos de acervo para dentro do pacote — justamente o
 * acervo que ela busca por sistema, sob demanda, para não ter que baixar tudo.
 */

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
  /** Caminho na UFJF. Só existe no arquivo bruto; a interface não usa. */
  sourceImage?: string
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

export interface AtlasCatalog {
  source: {
    name: string
    url: string
    authorization: string
  }
  systems: AtlasSystem[]
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
