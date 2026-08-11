import {
  SECOES,
  TODAS_SUBSECOES,
  TOTAL_CORTES,
  TOTAL_ESTRUTURAS,
  TOTAL_QUESTOES,
  TOTAL_SUBSECOES,
  caminhoDoCorte,
} from './index'
import type { CatalogoTC } from './catalogo'

/**
 * Monta o recorte do atlas para a tela de índice. Roda só no servidor: é aqui
 * que os 780 KB de conteúdo são lidos, e é por isso que este arquivo vive
 * separado do contrato em `catalogo.ts`, que o navegador carrega.
 */

/** O resumo da ficha é longo; a lista de resultados corta em duas linhas. */
const LIMITE_RESUMO = 180

export function montarCatalogoTC(): CatalogoTC {
  return {
    secoes: SECOES.map((secao) => ({
      id: secao.id,
      titulo: secao.titulo,
      descricao: secao.descricao,
      icone: secao.icone,
      cor: secao.cor,
      totalEstruturas: secao.subsecoes.reduce((n, sub) => n + sub.estruturas.length, 0),
      totalCortes: secao.subsecoes.reduce((n, sub) => n + sub.totalCortes, 0),
      series: secao.subsecoes.map((sub) => ({
        id: sub.id,
        titulo: sub.titulo,
        subtitulo: sub.subtitulo,
        icone: sub.icone,
        cor: sub.cor,
        totalCortes: sub.totalCortes,
        totalEstruturas: sub.estruturas.length,
        capa: caminhoDoCorte(sub, Math.max(1, Math.round(sub.totalCortes / 2))),
      })),
    })),
    indice: TODAS_SUBSECOES.flatMap((sub) =>
      sub.estruturas.map((estrutura) => ({
        id: estrutura.id,
        nome: estrutura.nome,
        resumo:
          estrutura.resumo.length > LIMITE_RESUMO
            ? `${estrutura.resumo.slice(0, LIMITE_RESUMO).trimEnd()}…`
            : estrutura.resumo,
        categoria: estrutura.categoria,
        sinonimos: estrutura.sinonimos ?? [],
        serieId: sub.id,
        serieTitulo: sub.titulo,
      })),
    ),
    totais: {
      series: TOTAL_SUBSECOES,
      estruturas: TOTAL_ESTRUTURAS,
      cortes: TOTAL_CORTES,
      questoes: TOTAL_QUESTOES,
    },
  }
}
