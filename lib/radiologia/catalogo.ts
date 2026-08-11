import {
  ESTUDOS_RAIO_X,
  GUIAS_RAIO_X,
  REGIOES_RAIO_X,
  TOTAL_ESTRUTURAS_RAIO_X,
  type RegiaoRaioX,
} from './raio-x'

/**
 * Recorte magro do atlas de Raio-X para as telas de navegação.
 *
 * O acervo completo (`lib/radiologia/raio-x.ts` + `estruturas.ts`) tem 172 KB de
 * fonte: os 28 exames, as ~200 demarcações e o dossiê aprofundado de cada
 * estrutura. Quando um componente `'use client'` importava esse módulo, os
 * 172 KB inteiros iam para o bundle do navegador — inclusive os dossiês, que o
 * catálogo nunca mostra — e o aluno pagava download, parse e execução de tudo
 * isso antes de ver o primeiro pixel.
 *
 * Estes tipos são o contrato do que de fato atravessa a rede: nomes, capas e
 * contagens. Quem monta é o servidor; o cliente recebe pronto por prop, e o
 * bundle do catálogo passa a não conter dado nenhum.
 */

export interface EstruturaResumo {
  nome: string
  original: string
  slug: string
}

export interface EstudoResumo {
  id: string
  regiao: RegiaoRaioX
  regiaoTitulo: string
  titulo: string
  incidencia: string
  camada: string
  resumo: string
  imagem: string
  /** Só o necessário para buscar e listar — sem o caminho da sobreposição. */
  estruturas: EstruturaResumo[]
}

export interface RegiaoResumo {
  id: RegiaoRaioX
  titulo: string
  resumo: string
  /** Primeiro parágrafo do guia da região, exibido ao abrir a região. */
  contexto: string
  capa: string
  totalEstudos: number
  totalEstruturas: number
  incidencias: string[]
}

export interface CatalogoRaioX {
  regioes: RegiaoResumo[]
  estudos: EstudoResumo[]
  totalEstruturas: number
}

/** Vizinhas de um exame dentro da mesma região, para a trilha do cabeçalho. */
export interface IrmaoEstudo {
  id: string
  camada: string
  incidencia: string
}

export function montarCatalogoRaioX(): CatalogoRaioX {
  return {
    regioes: REGIOES_RAIO_X.map((regiao) => ({
      id: regiao.id,
      titulo: regiao.titulo,
      resumo: regiao.resumo,
      contexto: GUIAS_RAIO_X[regiao.id].contexto,
      capa: regiao.capa,
      totalEstudos: regiao.totalEstudos,
      totalEstruturas: regiao.totalEstruturas,
      incidencias: regiao.incidencias,
    })),
    estudos: ESTUDOS_RAIO_X.map((estudo) => ({
      id: estudo.id,
      regiao: estudo.regiao,
      regiaoTitulo: estudo.regiaoTitulo,
      titulo: estudo.titulo,
      incidencia: estudo.incidencia,
      camada: estudo.camada,
      resumo: estudo.resumo,
      imagem: estudo.imagem,
      estruturas: estudo.estruturas.map((estrutura) => ({
        nome: estrutura.nome,
        original: estrutura.original,
        slug: estrutura.slug,
      })),
    })),
    totalEstruturas: TOTAL_ESTRUTURAS_RAIO_X,
  }
}

export function irmaosDoEstudo(regiao: RegiaoRaioX): IrmaoEstudo[] {
  return ESTUDOS_RAIO_X.filter((estudo) => estudo.regiao === regiao).map((estudo) => ({
    id: estudo.id,
    camada: estudo.camada,
    incidencia: estudo.incidencia,
  }))
}
