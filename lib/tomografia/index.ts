import type { SecaoTC, SubsecaoTC, EstruturaTC, SecaoId } from './tipos'
import { CORTES_POR_ESTRUTURA } from './cortes'

import { toraxCoracao } from './conteudo/torax-coracao'
import { toraxPulmaoPleura } from './conteudo/torax-pulmao-pleura'
import { toraxMediastino } from './conteudo/torax-mediastino'
import { toraxPartesMolesOssos } from './conteudo/torax-partes-moles-ossos'

import { abdomeSistemaVenosoCaval } from './conteudo/abdome-sistema-venoso-caval'
import { abdomeSistemaVenosoPortal } from './conteudo/abdome-sistema-venoso-portal'
import { abdomeSistemaArterial } from './conteudo/abdome-sistema-arterial'
import { abdomeMusculatura } from './conteudo/abdome-musculatura'
import { abdomeOssos } from './conteudo/abdome-ossos'
import { abdomePelveFeminina } from './conteudo/abdome-pelve-feminina'
import { abdomePelveMasculina } from './conteudo/abdome-pelve-masculina'
import { abdomeTratoUrinario } from './conteudo/abdome-trato-urinario'
import { abdomeViscerasOcas } from './conteudo/abdome-visceras-ocas'
import { abdomeViscerasParenquimatosas } from './conteudo/abdome-visceras-parenquimatosas'

import { cranioOssos } from './conteudo/cranio-ossos'
import { cranioParenquimaEncefalico } from './conteudo/cranio-parenquima-encefalico'
import { cranioPartesMoles } from './conteudo/cranio-partes-moles'
import { cranioSistemaArterial } from './conteudo/cranio-sistema-arterial'
import { cranioSistemaVenoso } from './conteudo/cranio-sistema-venoso'
import { cranioViasLiquoricas } from './conteudo/cranio-vias-liquoricas'

export * from './tipos'

/**
 * Cola o mapa de cortes (extraído por OCR das imagens) em cada estrutura.
 *
 * O conteúdo clínico e o mapa de cortes nascem de fontes diferentes — um é
 * escrito, o outro é lido das imagens — e por isso vivem em arquivos separados.
 * A junção acontece aqui, uma única vez, no carregamento do módulo. Estrutura
 * sem entrada no mapa fica sem `cortes`, e a interface trata isso como normal.
 */
function comCortes(sub: SubsecaoTC): SubsecaoTC {
  const mapa = CORTES_POR_ESTRUTURA[sub.id]
  if (!mapa) return sub
  return {
    ...sub,
    estruturas: sub.estruturas.map((e) => {
      const cortes = mapa[e.id]
      return cortes && cortes.length ? { ...e, cortes } : e
    }),
  }
}

export const SECOES: SecaoTC[] = [
  {
    id: 'torax',
    titulo: 'TC de Tórax',
    subtitulo: 'Coração, pulmões, mediastino e parede torácica',
    descricao:
      'O tórax é a região em que a tomografia mais supera a radiografia: o mesmo corte, lido em duas janelas diferentes, revela dois exames distintos. Aqui você percorre o coração câmara por câmara, aprende a nomear lobos e fissuras pelo mapa das cisuras, monta o mediastino a partir de quatro cortes de referência e treina o esqueleto e as partes moles que quase todo mundo pula.',
    icone: 'heart',
    cor: 'vermelho',
    subsecoes: [toraxCoracao, toraxPulmaoPleura, toraxMediastino, toraxPartesMolesOssos].map(comCortes),
  },
  {
    id: 'abdome',
    titulo: 'TC de Abdome',
    subtitulo: 'Vasos, vísceras, musculatura e esqueleto do abdome e da pelve',
    descricao:
      'O abdome é o território onde o tempo do contraste define o diagnóstico: a mesma lesão aparece, some ou muda de cara conforme a fase. Esta seção percorre os três sistemas vasculares, todo o tubo digestivo, as vísceras sólidas, o trato urinário, a pelve masculina e feminina, a musculatura e o esqueleto — dez séries que, juntas, cobrem a leitura completa de uma TC de abdome e pelve.',
    icone: 'layers',
    cor: 'violeta',
    subsecoes: [
      abdomeSistemaVenosoCaval,
      abdomeSistemaVenosoPortal,
      abdomeSistemaArterial,
      abdomeViscerasParenquimatosas,
      abdomeViscerasOcas,
      abdomeTratoUrinario,
      abdomePelveFeminina,
      abdomePelveMasculina,
      abdomeMusculatura,
      abdomeOssos,
    ].map(comCortes),
  },
  {
    id: 'cranio',
    titulo: 'TC de Crânio',
    subtitulo: 'Parênquima, vasos, liquor, ossos e partes moles da cabeça',
    descricao:
      'A TC de crânio é o exame mais pedido do mundo e um dos mais difíceis de ler bem — tudo o que importa está separado por poucas unidades Hounsfield, e só a janela certa revela. Aqui você aprende a ler por simetria, a reconhecer os territórios vasculares, a seguir o caminho do líquor e a distinguir sutura de fratura.',
    icone: 'brain',
    cor: 'azul',
    subsecoes: [
      cranioParenquimaEncefalico,
      cranioSistemaArterial,
      cranioSistemaVenoso,
      cranioViasLiquoricas,
      cranioOssos,
      cranioPartesMoles,
    ].map(comCortes),
  },
]

export const TODAS_SUBSECOES: SubsecaoTC[] = SECOES.flatMap((s) => s.subsecoes)

export const TOTAL_SUBSECOES = TODAS_SUBSECOES.length
export const TOTAL_ESTRUTURAS = TODAS_SUBSECOES.reduce((n, s) => n + s.estruturas.length, 0)
export const TOTAL_CORTES = TODAS_SUBSECOES.reduce((n, s) => n + s.totalCortes, 0)
export const TOTAL_QUESTOES = TODAS_SUBSECOES.reduce((n, s) => n + s.quiz.length, 0)

export function getSubsecao(slug: string): SubsecaoTC | undefined {
  return TODAS_SUBSECOES.find((s) => s.id === slug)
}

export function getSecao(id: SecaoId): SecaoTC | undefined {
  return SECOES.find((s) => s.id === id)
}

export function getSecaoDaSubsecao(sub: SubsecaoTC): SecaoTC | undefined {
  return getSecao(sub.secaoId)
}

/** Subseção anterior e próxima, na ordem de navegação global. */
export function getVizinhas(slug: string): { anterior?: SubsecaoTC; proxima?: SubsecaoTC } {
  const i = TODAS_SUBSECOES.findIndex((s) => s.id === slug)
  if (i < 0) return {}
  return {
    anterior: i > 0 ? TODAS_SUBSECOES[i - 1] : undefined,
    proxima: i < TODAS_SUBSECOES.length - 1 ? TODAS_SUBSECOES[i + 1] : undefined,
  }
}

export interface ResultadoBusca {
  estrutura: EstruturaTC
  subsecao: SubsecaoTC
}

/**
 * Busca por estrutura em todo o manual. Procura no nome, nos sinônimos e no
 * resumo — não no texto completo, de propósito: buscar no corpo inteiro
 * devolveria quase tudo para termos comuns como "artéria" ou "realce".
 */
export function buscarEstruturas(termo: string, limite = 40): ResultadoBusca[] {
  const q = termo
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  if (q.length < 2) return []
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  const resultados: { r: ResultadoBusca; peso: number }[] = []
  for (const sub of TODAS_SUBSECOES) {
    for (const estrutura of sub.estruturas) {
      const nome = norm(estrutura.nome)
      const sinonimos = (estrutura.sinonimos || []).map(norm).join(' ')
      const resumo = norm(estrutura.resumo)
      let peso = 0
      if (nome.startsWith(q)) peso = 3
      else if (nome.includes(q)) peso = 2
      else if (sinonimos.includes(q)) peso = 1.5
      else if (resumo.includes(q)) peso = 1
      if (peso > 0) resultados.push({ r: { estrutura, subsecao: sub }, peso })
    }
  }
  return resultados
    .sort((a, b) => b.peso - a.peso)
    .slice(0, limite)
    .map((x) => x.r)
}
