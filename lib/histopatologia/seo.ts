import type { Metadata } from 'next'

import { absoluteUrl, privateNoIndexRobots, publicIndexingRobots, sanitizeSeoText } from '@/lib/seo'
import type { DoencaCanonica, EstadoDeRevisao } from './esquemas'
import { ALTERACOES_EDITORIAIS, AVISO_EDUCACIONAL, CREDITO_BASE, podeIndexar } from './direitos'
import { BASE, rotaDaDoenca } from './rotas'

export { BASE }

/**
 * Metadados e dados estruturados da Histopatologia.
 *
 * O detalhe que não pode escapar: **nada aqui é indexável por padrão**. O plano
 * (§17) proíbe expor 2.917 páginas de inventário ao buscador e exige `noindex`
 * em conteúdo em revisão. Como nenhuma doença está publicada, na prática o
 * módulo inteiro é `noindex` hoje — e continuará sendo até a primeira revisão
 * médica concluída, sem que ninguém precise lembrar de mexer aqui.
 */

export function robotsDaPagina(estadoDeRevisao?: EstadoDeRevisao): Metadata['robots'] {
  return podeIndexar(estadoDeRevisao) ? publicIndexingRobots : privateNoIndexRobots
}

export function metadadosDoModulo({
  titulo,
  descricao,
  caminho,
  estadoDeRevisao,
}: {
  titulo: string
  descricao: string
  caminho: string
  estadoDeRevisao?: EstadoDeRevisao
}): Metadata {
  const url = absoluteUrl(caminho)
  const limpo = sanitizeSeoText(descricao, '', 300)

  return {
    title: `${titulo} — Histopatologia | Manual da Histologia`,
    description: limpo,
    robots: robotsDaPagina(estadoDeRevisao),
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: `${titulo} — Histopatologia`,
      description: limpo,
      url,
      siteName: 'DomineAqui',
      locale: 'pt_BR',
      // Sem `images`: as únicas imagens do módulo são remotas, de terceiros e
      // com direitos pendentes. Anunciá-las como imagem de compartilhamento
      // seria redistribuí-las sob a marca do GradeX.
    },
    twitter: {
      card: 'summary',
      title: `${titulo} — Histopatologia`,
      description: limpo,
    },
  }
}

/**
 * JSON-LD de uma doença.
 *
 * Usamos `LearningResource`, e não `MedicalWebPage`, mesmo tratando de doença. A
 * distinção importa: `MedicalWebPage` convida buscadores a tratar o conteúdo
 * como orientação de saúde, e este material ensina a reconhecer padrões
 * morfológicos — não orienta conduta clínica. `PLANO_IMPLEMENTACAO.md` §17 pede
 * cautela exatamente aqui.
 *
 * `creativeWorkStatus` reflete o estado editorial real. Enquanto a doença
 * estiver em revisão médica, é isso que sai nos dados estruturados: anunciar
 * conteúdo revisado sem revisor seria mentir para máquina e para pessoa ao mesmo
 * tempo. E `image` nunca é emitida — as imagens não são nossas.
 */
export function jsonLdDeDoenca(doenca: DoencaCanonica) {
  const url = absoluteUrl(rotaDaDoenca(doenca.slug))
  const publicado = doenca.revisao.estado === 'publicado'

  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: doenca.nome,
    alternateName: doenca.sinonimos,
    description: sanitizeSeoText(doenca.conteudo.definicao, doenca.nome, 300),
    url,
    inLanguage: 'pt-BR',
    learningResourceType: 'Capítulo de histopatologia com atlas de referência',
    educationalLevel: 'Ensino superior — ciências da saúde',
    isAccessibleForFree: true,
    creativeWorkStatus: publicado ? 'Published' : 'Draft',
    dateModified: doenca.revisao.atualizadoEm,
    version: doenca.revisao.versao,
    ...(publicado && doenca.revisao.revisor
      ? { reviewedBy: { '@type': 'Person', name: doenca.revisao.revisor } }
      : {}),
    about: [
      { '@type': 'Thing', name: doenca.nome },
      ...doenca.orgaos.map((o) => ({ '@type': 'Thing', name: o })),
    ],
    teaches: doenca.conteudo.objetivos.slice(0, 12),
    citation: doenca.conteudo.referencias.slice(0, 10).map((r) => r.citacao),
    publisher: { '@type': 'Organization', name: 'DomineAqui' },
    disclaimer: AVISO_EDUCACIONAL,
    copyrightNotice: CREDITO_BASE,
    /** Obrigação de transparência: o que é trabalho editorial do GradeX. */
    creditText: ALTERACOES_EDITORIAIS.join(' '),
  }
}

export function jsonLdDeTrilha(itens: Array<{ titulo: string; caminho: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.titulo,
      item: absoluteUrl(item.caminho),
    })),
  }
}
