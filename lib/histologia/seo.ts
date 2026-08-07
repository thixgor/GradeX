import type { Metadata } from 'next'

import { absoluteUrl, privateNoIndexRobots, publicIndexingRobots, sanitizeSeoText } from '@/lib/seo'
import { AVISO_EDUCACIONAL, CREDITO_BASE, LICENCA, podeIndexar } from './licenca'
import { BASE, rotaDaPagina } from './rotas'
import type { Pagina } from './esquemas'

export { BASE, rotaDaPagina }

/**
 * Metadados e dados estruturados do Manual da Histologia.
 *
 * O detalhe que não pode escapar: enquanto o portão de licença estiver pendente,
 * **nada aqui é indexável**. `podeIndexar()` decide, e todas as rotas do módulo
 * passam por esta função — não há página que possa esquecer o `robots`.
 */

export function robotsDoModulo(): Metadata['robots'] {
  return podeIndexar() ? publicIndexingRobots : privateNoIndexRobots
}

export function metadadosDoModulo({
  titulo,
  descricao,
  caminho,
  imagem,
}: {
  titulo: string
  descricao: string
  caminho: string
  imagem?: string | null
}): Metadata {
  const url = absoluteUrl(caminho)
  const limpo = sanitizeSeoText(descricao, '', 300)

  return {
    title: `${titulo} — Manual da Histologia`,
    description: limpo,
    robots: robotsDoModulo(),
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: `${titulo} — Manual da Histologia`,
      description: limpo,
      url,
      siteName: 'DomineAqui',
      locale: 'pt_BR',
      ...(imagem ? { images: [{ url: imagem, alt: titulo }] } : {}),
    },
    twitter: {
      card: imagem ? 'summary_large_image' : 'summary',
      title: `${titulo} — Manual da Histologia`,
      description: limpo,
    },
  }
}

/**
 * JSON-LD de uma lâmina.
 *
 * Usamos `LearningResource` e não `MedicalWebPage`. A distinção importa: o
 * módulo ensina a reconhecer tecido normal ao microscópio, não orienta conduta
 * clínica. Declarar-se recurso médico convidaria buscadores a tratar o conteúdo
 * como orientação de saúde — e as correlações clínicas aqui existem para dar
 * sentido à morfologia, não para guiar decisão.
 *
 * `creativeWorkStatus` reflete o estado editorial real. Enquanto a lâmina
 * estiver pendente de revisão biomédica, é isso que sai nos dados estruturados
 * — anunciar conteúdo revisado sem revisor seria mentir para máquina e para
 * pessoa ao mesmo tempo.
 */
export function jsonLdDeLamina(pagina: Pagina, urlDaImagem: string | null) {
  const url = absoluteUrl(rotaDaPagina(pagina.caminho))
  const publicado = pagina.revisao.estado === 'publicado'

  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: pagina.titulo,
    description: sanitizeSeoText(pagina.descricaoOriginal, pagina.titulo, 300),
    url,
    inLanguage: 'pt-BR',
    learningResourceType: 'Atlas histológico interativo',
    educationalLevel: 'Ensino superior — ciências da saúde',
    isAccessibleForFree: true,
    creativeWorkStatus: publicado ? 'Published' : 'Draft',
    ...(urlDaImagem ? { image: urlDaImagem } : {}),
    license: LICENCA.url,
    isBasedOn: pagina.proveniencia.urlOrigem,
    sourceOrganization: {
      '@type': 'Organization',
      name: 'Digital Histology — Virginia Commonwealth University School of Medicine',
      url: LICENCA.urlCreditos,
    },
    ...(publicado && pagina.revisao.revisor
      ? {
          reviewedBy: { '@type': 'Person', name: pagina.revisao.revisor },
          dateModified: pagina.revisao.revisadoEm,
        }
      : {}),
    about: pagina.trilha.map((t) => ({ '@type': 'Thing', name: t.titulo })),
    teaches: pagina.overlays
      .filter((o) => o.classe === 'estrutura')
      .slice(0, 40)
      .map((o) => o.rotulo),
    publisher: { '@type': 'Organization', name: 'DomineAqui' },
    disclaimer: AVISO_EDUCACIONAL,
    copyrightNotice: CREDITO_BASE,
  }
}

export function jsonLdDeTrilha(trilha: Array<{ titulo: string; slug: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Manual da Histologia',
        item: absoluteUrl(BASE),
      },
      ...trilha.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: t.titulo,
        item: absoluteUrl(rotaDaPagina(t.slug)),
      })),
    ],
  }
}

export function jsonLdDeQuiz(quiz: { titulo: string; slug: string; questoes: unknown[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `Quiz de ${quiz.titulo}`,
    url: absoluteUrl(`${BASE}/quizzes/${quiz.slug}`),
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    educationalLevel: 'Ensino superior — ciências da saúde',
    numberOfQuestions: quiz.questoes.length,
    license: LICENCA.url,
    about: { '@type': 'Thing', name: quiz.titulo },
  }
}
