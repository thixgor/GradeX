import { COMPARADORES, TOTAL_DE_COMPARADORES } from './comparadores'
import { SINAIS, TOTAL_DE_SINAIS } from './sinais'
import { JANELAS_ULTRASSOM, TOTAL_DE_CENAS_ULTRASSOM, TOTAL_DE_JANELAS } from './ultrassom'
import { TITULOS_DE_SISTEMA, type SistemaSemiologico } from './esquemas'
import {
  TOTAL_DE_CENAS,
  TOTAL_DE_ESTRUTURAS_DE_VISTA,
  TOTAL_DE_VISTAS,
  VISTAS,
} from './vistas'
import { midiasDaCena, midiasDoSinal } from './acervo'
import { urlDaMidia, type MidiaClinica } from './midia'
import type { CenaClinica } from './esquemas'

/**
 * A capa fotográfica de um card, quando o acervo tem uma.
 *
 * É resolvida aqui, no servidor, pelo mesmo motivo que o resto do catálogo:
 * `urlDaMidia` decide entre espelho e origem lendo o ambiente, e o cliente só
 * precisa da URL final. Onde não há foto o campo fica ausente e o card cai no
 * esquema — a lacuna é visível, não disfarçada.
 */
export interface CapaReal {
  src: string
  tipo: 'imagem' | 'clipe'
  legenda: string
  /** Título da cena de onde a foto veio, quando não é a cena normal. */
  cena?: string
}

function capaDeMidias(midias: MidiaClinica[], cena?: string): CapaReal | undefined {
  // Fotografia antes de clipe: o card é estático e um vídeo pausado no
  // primeiro quadro costuma ser um retângulo preto.
  const ordenadas = [...midias].sort((a, b) => Number(a.tipo === 'clipe') - Number(b.tipo === 'clipe'))
  for (const midia of ordenadas) {
    const src = urlDaMidia(midia)
    if (src) return { src, tipo: midia.tipo, legenda: midia.legenda, cena }
  }
  return undefined
}

/** A capa de uma janela: a cena normal se tiver foto, senão a primeira que tiver. */
function capaDaJanela(slug: string, cenas: CenaClinica[], normal: CenaClinica): CapaReal | undefined {
  const daNormal = capaDeMidias(midiasDaCena(slug, normal))
  if (daNormal) return daNormal
  for (const cena of cenas) {
    if (cena === normal) continue
    const capa = capaDeMidias(midiasDaCena(slug, cena), cena.titulo)
    if (capa) return capa
  }
  return undefined
}

/**
 * Recorte magro do acervo para as telas de navegação.
 *
 * Mesma lição do catálogo de Raio-X: os módulos de conteúdo somam centenas de
 * KB de fonte, e um componente `'use client'` que os importasse mandaria tudo
 * para o navegador — inclusive o mecanismo fisiopatológico de cada sinal, que
 * nenhum card mostra. O que atravessa a rede é isto: nome, resumo, contagem e
 * a referência da ilustração.
 *
 * Quem monta é o servidor. O cliente recebe pronto por prop.
 */

export interface SinalResumo {
  slug: string
  nome: string
  sinonimos: string[]
  sistema: SistemaSemiologico
  sistemaTitulo: string
  resumo: string
  /** Só o id e os parâmetros: o desenho é resolvido no componente. */
  ilustracao?: { id: string; params?: Record<string, number | string | boolean>; alt: string }
  capaReal?: CapaReal
  comparador?: string
  temDesempenho: boolean
  totalCausas: number
}

export interface VistaResumo {
  slug: string
  nome: string
  instrumento: string
  resumo: string
  paraQue: string
  totalCenas: number
  totalEstruturas: number
  capa?: { id: string; params?: Record<string, number | string | boolean>; alt: string }
  capaReal?: CapaReal
  cenas: CenaResumo[]
}

export interface CenaResumo {
  id: string
  titulo: string
  estado: 'normal' | 'alterado'
  diagnostico: string
  /** Há fotografia ou clipe real desta cena no acervo. */
  temCasoReal: boolean
}

export interface JanelaResumo {
  slug: string
  nome: string
  protocolo: string
  transdutor: string
  pergunta: string
  totalCenas: number
  capa?: { id: string; params?: Record<string, number | string | boolean>; alt: string }
  capaReal?: CapaReal
  cenas: CenaResumo[]
}

export interface ComparadorResumo {
  slug: string
  titulo: string
  pergunta: string
  totalColunas: number
  totalEixos: number
  colunas: string[]
}

export interface CatalogoSemiologia {
  sinais: SinalResumo[]
  vistas: VistaResumo[]
  janelas: JanelaResumo[]
  comparadores: ComparadorResumo[]
  totais: TotaisSemiologia
}

export interface TotaisSemiologia {
  sinais: number
  vistas: number
  cenas: number
  estruturas: number
  janelas: number
  cenasUltrassom: number
  comparadores: number
}

export const TOTAIS: TotaisSemiologia = {
  sinais: TOTAL_DE_SINAIS,
  vistas: TOTAL_DE_VISTAS,
  cenas: TOTAL_DE_CENAS,
  estruturas: TOTAL_DE_ESTRUTURAS_DE_VISTA,
  janelas: TOTAL_DE_JANELAS,
  cenasUltrassom: TOTAL_DE_CENAS_ULTRASSOM,
  comparadores: TOTAL_DE_COMPARADORES,
}

/** Todas as cenas desenháveis do módulo, das duas alas de imagem. */
export const TOTAL_DE_FIGURAS = TOTAL_DE_CENAS + TOTAL_DE_CENAS_ULTRASSOM + TOTAL_DE_SINAIS

export function resumosDeSinais(): SinalResumo[] {
  return SINAIS.map((sinal) => ({
    slug: sinal.slug,
    nome: sinal.nome,
    sinonimos: sinal.sinonimos,
    sistema: sinal.sistema,
    sistemaTitulo: TITULOS_DE_SISTEMA[sinal.sistema],
    resumo: sinal.resumo,
    ilustracao: sinal.ilustracao,
    capaReal: capaDeMidias(midiasDoSinal(sinal)),
    comparador: sinal.comparador,
    temDesempenho: Boolean(sinal.desempenho?.length),
    totalCausas: sinal.causas.reduce((total, grupo) => total + grupo.itens.length, 0),
  }))
}

export function resumosDeVistas(): VistaResumo[] {
  return VISTAS.map((vista) => {
    const normal = vista.cenas.find((cena) => cena.estado === 'normal') ?? vista.cenas[0]
    return {
      slug: vista.slug,
      nome: vista.nome,
      instrumento: vista.instrumento,
      resumo: vista.resumo,
      paraQue: vista.paraQue,
      totalCenas: vista.cenas.length,
      totalEstruturas: vista.estruturas.length,
      capa: normal.ilustracao ?? vista.cenas.find((cena) => cena.ilustracao)?.ilustracao,
      capaReal: capaDaJanela(vista.slug, vista.cenas, normal),
      cenas: vista.cenas.map((cena) => ({
        id: cena.id,
        titulo: cena.titulo,
        estado: cena.estado,
        diagnostico: cena.diagnostico,
        temCasoReal: midiasDaCena(vista.slug, cena).length > 0,
      })),
    }
  })
}

export function resumosDeJanelas(): JanelaResumo[] {
  return JANELAS_ULTRASSOM.map((janela) => {
    const normal = janela.cenas.find((cena) => cena.estado === 'normal') ?? janela.cenas[0]
    return {
      slug: janela.slug,
      nome: janela.nome,
      protocolo: janela.protocolo,
      transdutor: janela.transdutor,
      pergunta: janela.pergunta,
      totalCenas: janela.cenas.length,
      capa: normal.ilustracao ?? janela.cenas.find((cena) => cena.ilustracao)?.ilustracao,
      capaReal: capaDaJanela(janela.slug, janela.cenas, normal),
      cenas: janela.cenas.map((cena) => ({
        id: cena.id,
        titulo: cena.titulo,
        estado: cena.estado,
        diagnostico: cena.diagnostico,
        temCasoReal: midiasDaCena(janela.slug, cena).length > 0,
      })),
    }
  })
}

export function resumosDeComparadores(): ComparadorResumo[] {
  return COMPARADORES.map((comparador) => ({
    slug: comparador.slug,
    titulo: comparador.titulo,
    pergunta: comparador.pergunta,
    totalColunas: comparador.colunas.length,
    totalEixos: comparador.eixos.length,
    colunas: comparador.colunas.map((coluna) => coluna.titulo),
  }))
}

export function montarCatalogo(): CatalogoSemiologia {
  return {
    sinais: resumosDeSinais(),
    vistas: resumosDeVistas(),
    janelas: resumosDeJanelas(),
    comparadores: resumosDeComparadores(),
    totais: TOTAIS,
  }
}

/** Sistemas presentes no acervo, com a contagem de sinais de cada um. */
export function sistemasComSinais(): { id: SistemaSemiologico; titulo: string; total: number }[] {
  const contagem = new Map<SistemaSemiologico, number>()
  for (const sinal of SINAIS) {
    contagem.set(sinal.sistema, (contagem.get(sinal.sistema) ?? 0) + 1)
  }
  return [...contagem.entries()]
    .map(([id, total]) => ({ id, titulo: TITULOS_DE_SISTEMA[id], total }))
    .sort((a, b) => b.total - a.total || a.titulo.localeCompare(b.titulo, 'pt-BR'))
}
