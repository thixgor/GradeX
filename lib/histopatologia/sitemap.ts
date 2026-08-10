import type { MetadataRoute } from 'next'

import { CANONICAL_ORIGIN } from '@/lib/seo'
import { podeIndexar } from './direitos'
import { DOENCAS_RESUMIDAS } from './repositorio'
import { BASE, rotaDaDoenca } from './rotas'

/**
 * Entradas da Histopatologia no sitemap.
 *
 * ## Só conteúdo publicado entra — e hoje isso significa nada
 *
 * `PLANO_IMPLEMENTACAO.md` §17 é explícito em dois pontos: páginas em revisão
 * usam `noindex`, e as 2.917 páginas de inventário não vão para o buscador. Um
 * sitemap é um convite explícito à indexação; oferecê-lo para conteúdo que a
 * própria página marca como `noindex` seria contornar o bloqueio por outro
 * caminho.
 *
 * Como nenhuma doença está publicada — todas aguardam revisão por profissional
 * habilitado —, esta função devolve lista vazia. Ela não é código morto: é o
 * ponto onde a primeira doença revisada passa a ser anunciada, sem que ninguém
 * precise lembrar de acrescentá-la à mão.
 *
 * A home do módulo entra junto da primeira doença publicada, e não antes: uma
 * home indexada que aponta só para páginas `noindex` gasta orçamento de
 * rastreamento sem entregar nada.
 */

function canonico(caminho: string): string {
  return `${CANONICAL_ORIGIN}${caminho.startsWith('/') ? caminho : `/${caminho}`}`
}

export function entradasDaHistopatologia(agora = new Date()): MetadataRoute.Sitemap {
  const publicadas = DOENCAS_RESUMIDAS.filter((d) => podeIndexar(d.estadoDeRevisao))
  if (publicadas.length === 0) return []

  return [
    { url: canonico(BASE), lastModified: agora, changeFrequency: 'weekly', priority: 0.7 },
    ...publicadas.map((doenca) => ({
      url: canonico(rotaDaDoenca(doenca.slug)),
      lastModified: agora,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
