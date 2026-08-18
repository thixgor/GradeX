import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { histologiaHabilitada, motivoDoBloqueio } from '@/lib/histologia/licenca'
import { metadadosDoModulo } from '@/lib/histologia/seo'

/**
 * Portão de licença do Manual da Histologia.
 *
 * Todo o módulo passa por aqui, e é aqui que o bloqueio de licença é aplicado —
 * um único ponto, em vez de uma checagem por rota que alguém esqueceria de
 * copiar na próxima página.
 *
 * A resposta é **404 seco**, nunca "indisponível por questões de licença":
 * anunciar que existe conteúdo escondido convida ao contorno e não beneficia
 * ninguém. O motivo real vai para o log do servidor, onde quem opera vê.
 *
 * ## O portão de assinatura NÃO fica aqui
 *
 * O módulo é privativo de assinantes (ADR 0003), mas essa checagem vive nas
 * páginas, via `lib/histologia/acesso.ts`. A razão é técnica e foi medida: um
 * layout que escolhe entre `children` e a vitrine não impede a página de
 * renderizar — no App Router a árvore da página é prop de um componente de
 * cliente e vai serializada no payload RSC de qualquer jeito. O HTML mostrava a
 * landing e o `<script>` seguinte entregava a lâmina.
 *
 * Licença é diferente: `notFound()` lança aqui e derruba a resposta inteira,
 * então o 404 continua valendo para a árvore toda.
 *
 * Ver `docs/adr/0001-licenca-manual-histologia.md` e
 * `docs/adr/0003-histologia-privativa-assinantes.md`.
 *
 * ## Onde a barra de seções **não** fica
 *
 * `NavegacaoDoModulo` seria natural aqui — um só lugar para toda a árvore. Não
 * funciona: este layout envolve o `AppShell` de cada página, e o `AppShell` tem
 * barra lateral `fixed` de 280 px e controles flutuantes nos cantos superiores.
 * Uma barra montada aqui nasceria por baixo dos dois. Ela é montada por cada
 * página, dentro da área de conteúdo — ver `components/histologia/navegacao.tsx`.
 */

export const metadata: Metadata = metadadosDoModulo({
  titulo: 'Manual da Histologia',
  descricao:
    'Atlas de histologia interativo: microscópio virtual com camadas de marcação, laboratório de ' +
    'preparação e coloração, atlas pesquisável por estrutura e quizzes nativos. Privativo para ' +
    'assinantes do Manual Clínico e contas DomineAqui Plus+.',
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
  return (
    <div className="histologia-superficie min-h-screen">
      {/*
        As lâminas são buscadas pelo otimizador no digitalhistology.org. Abrir a
        conexão junto com o HTML tira o custo de DNS e TLS do caminho crítico da
        primeira imagem — que é sempre a lâmina, o elemento mais pesado da tela.
      */}
      <link rel="preconnect" href="https://digitalhistology.org" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://digitalhistology.org" />
      {children}
    </div>
  )
}
