import type { MetadataRoute } from 'next'

import { CANONICAL_ORIGIN } from '@/lib/seo'
import { podeIndexar } from './licenca'
import { MODULOS_DE_LABORATORIO } from './laboratorio'
import { CURRICULO, TODOS_OS_QUIZZES, achatarCurriculo } from './repositorio'
import { BASE } from './seo'

/**
 * Entradas do Manual da Histologia no sitemap.
 *
 * ## Duas decisões
 *
 * 1. **Nada entra enquanto o portão de licença estiver pendente.** Um sitemap é
 *    um convite explícito à indexação; oferecê-lo para conteúdo que ainda não
 *    pode ser publicado seria contornar o próprio bloqueio.
 *
 * 2. **Nem tudo entra depois.** 1.524 páginas num sitemap único estouram o
 *    limite prático e diluem o orçamento de rastreamento entre lâminas que, no
 *    estado editorial atual, têm pouco texto próprio. Entram a home, o atlas, os
 *    laboratórios, os quizzes e os nós do currículo até o terceiro nível — que é
 *    o que efetivamente tem conteúdo indexável hoje. Quando o aprofundamento em
 *    português estiver escrito e revisado, as lâminas entram por um sitemap
 *    próprio, paginado.
 */

function canonico(caminho: string): string {
  return `${CANONICAL_ORIGIN}${caminho.startsWith('/') ? caminho : `/${caminho}`}`
}

export function entradasDaHistologia(agora = new Date()): MetadataRoute.Sitemap {
  if (!podeIndexar()) return []

  const fixas: MetadataRoute.Sitemap = [
    { url: canonico(BASE), lastModified: agora, changeFrequency: 'weekly', priority: 0.8 },
    { url: canonico(`${BASE}/atlas`), lastModified: agora, changeFrequency: 'weekly', priority: 0.7 },
    {
      url: canonico(`${BASE}/laboratorio`),
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: canonico(`${BASE}/quizzes`),
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  const laboratorios: MetadataRoute.Sitemap = MODULOS_DE_LABORATORIO.map((modulo) => ({
    url: canonico(`${BASE}/laboratorio/${modulo.id}`),
    lastModified: agora,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  const quizzes: MetadataRoute.Sitemap = TODOS_OS_QUIZZES.map((quiz) => ({
    url: canonico(`${BASE}/quizzes/${quiz.slug}`),
    lastModified: agora,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  const curriculo: MetadataRoute.Sitemap = achatarCurriculo(CURRICULO)
    .filter((no) => no.caminho.length <= 3 && no.tipo === 'secao')
    .map((no) => ({
      url: canonico(`${BASE}/${no.caminho.join('/')}`),
      lastModified: agora,
      changeFrequency: 'monthly' as const,
      // Setor pesa mais que subsetor, que pesa mais que assunto.
      priority: 0.7 - (no.caminho.length - 1) * 0.1,
    }))

  return [...fixas, ...laboratorios, ...quizzes, ...curriculo]
}
