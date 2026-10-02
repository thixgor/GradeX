import type { ResumoCaso } from '@/components/radiologia/catalogo-casos-imagem'
import { urlDoCorte, type CasoImagem } from './casos-imagem'
import type { ColecaoCasos } from './casos-imagem-colecao'

/**
 * O que atravessa a rede para o catálogo: título, queixa e contagens. A
 * consulta inteira e o comentário das setas ficam na página de cada caso.
 */
export function resumosDaColecao(colecao: ColecaoCasos): ResumoCaso[] {
  return colecao.casos.map((caso, i) => {
    const vinheta = colecao.vinheta(caso.slug)!
    const capa = caso.series[0]
    return {
      slug: caso.slug,
      numero: i + 1,
      titulo: caso.titulo,
      categoria: caso.categoria,
      tema: caso.tema,
      queixa: vinheta.queixa,
      identificacao: vinheta.identificacao,
      cortes: caso.totalFatias,
      imagens: caso.series.length,
      apontamentos: caso.apontamentos.length,
      capa: urlDoCorte(capa, capa.corteInicial + 1),
    }
  })
}

export function urlsDasSeries(caso: CasoImagem): string[][] {
  return caso.series.map((s) => Array.from({ length: s.totalFatias }, (_, i) => urlDoCorte(s, i + 1)))
}

/**
 * Vizinhos levam só número e região: o título entregaria o diagnóstico do
 * próximo caso antes de o aluno ler a consulta.
 */
export function vizinhosDoCaso(colecao: ColecaoCasos, slug: string) {
  const indice = colecao.casos.findIndex((c) => c.slug === slug)
  const vizinho = (passo: 1 | -1) => {
    const outro = colecao.vizinho(slug, passo)
    return outro ? { slug: outro.slug, titulo: `Caso ${indice + 1 + passo} · ${outro.categoriaTitulo}` } : null
  }
  return { anterior: vizinho(-1), proximo: vizinho(1), posicao: { indice: indice + 1, total: colecao.casos.length } }
}
