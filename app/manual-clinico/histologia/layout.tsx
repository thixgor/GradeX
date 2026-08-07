import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { histologiaHabilitada, motivoDoBloqueio } from '@/lib/histologia/licenca'
import { metadadosDoModulo } from '@/lib/histologia/seo'

/**
 * Portão de entrada do Manual da Histologia.
 *
 * Todo o módulo passa por aqui, e é aqui que o bloqueio de licença é aplicado —
 * um único ponto, em vez de uma checagem por rota que alguém esqueceria de
 * copiar na próxima página.
 *
 * A resposta é **404 seco**, nunca "indisponível por questões de licença":
 * anunciar que existe conteúdo escondido convida ao contorno e não beneficia
 * ninguém. O motivo real vai para o log do servidor, onde quem opera vê.
 *
 * Ver `docs/adr/0001-licenca-manual-histologia.md`.
 */

export const metadata: Metadata = metadadosDoModulo({
  titulo: 'Manual da Histologia',
  descricao:
    'Atlas de histologia interativo e gratuito: microscópio virtual com camadas de marcação, ' +
    'laboratório de preparação e coloração, atlas pesquisável por estrutura e quizzes nativos.',
  caminho: '/manual-clinico/histologia',
})

export default function LayoutDaHistologia({ children }: { children: React.ReactNode }) {
  if (!histologiaHabilitada()) {
    // eslint-disable-next-line no-console
    console.warn(`[histologia] rota bloqueada — ${motivoDoBloqueio()}`)
    notFound()
  }
  // A superfície do módulo é aplicada aqui, num só lugar: luz transmitida e
  // grão microscópico atrás de toda tela da Histologia, sem cada página ter de
  // lembrar de vestir o material.
  return <div className="histologia-superficie min-h-screen">{children}</div>
}
