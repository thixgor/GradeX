import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { BASE, metadadosDoModulo } from '@/lib/histopatologia/seo'

/**
 * Portão de entrada da Histopatologia.
 *
 * Dois portões independentes governam este módulo, e é importante não
 * confundi-los:
 *
 * 1. **este layout** decide se a *rota* existe. Fora de produção ela sempre
 *    existe (é preciso poder revisar); em produção exige
 *    `HISTOPATOLOGIA_HABILITADO=1`;
 * 2. **`resolverDireitos`** decide, mídia a mídia, se a imagem pode ser exibida.
 *    Ele continua fechado mesmo com o módulo aberto — hoje, para as duas fontes.
 *
 * Habilitar o módulo não libera imagem nenhuma. Foi desenhado assim de propósito:
 * a decisão de publicar a área é editorial e a de exibir mídia é jurídica, e uma
 * não pode arrastar a outra.
 *
 * A resposta é 404 seco, como no módulo da Histologia normal: anunciar que
 * existe conteúdo escondido convida ao contorno e não beneficia ninguém.
 */

export const metadata: Metadata = metadadosDoModulo({
  titulo: 'Histopatologia',
  descricao:
    'Área de anatomia patológica do Manual da Histologia: mecanismos de doença, cadeia ' +
    'fisiopatológica, roteiro microscópico por aumento e atlas de referências catalogadas, com ' +
    'crédito e proveniência por item.',
  caminho: BASE,
})

export default function LayoutDaHistopatologia({ children }: { children: React.ReactNode }) {
  if (!histopatologiaHabilitada()) {
    // eslint-disable-next-line no-console
    console.warn('[histopatologia] rota bloqueada — HISTOPATOLOGIA_HABILITADO não está em "1".')
    notFound()
  }

  /*
   * Sem `preconnect` para os atlas de origem.
   *
   * No módulo de Histologia normal o `preconnect` faz sentido: as lâminas vêm
   * daquele host em toda página. Aqui, enquanto os direitos estiverem pendentes,
   * **nenhuma** imagem remota é requisitada — abrir conexão TLS com anatpat e
   * patolojiatlasi em toda visita revelaria a navegação do aluno a servidores de
   * terceiros sem que nada fosse buscado deles. Quando a incorporação for
   * autorizada, este é o lugar de acrescentar as duas linhas.
   */
  return <div className="histologia-superficie min-h-screen">{children}</div>
}
