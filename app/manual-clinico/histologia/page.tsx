import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { InicioDaHistologia } from '@/components/histologia/inicio'
import { ROTA_DO_INICIO } from '@/lib/histologia/inicio-tipos'

/**
 * Home do Manual da Histologia — casco estático.
 *
 * A home lia a sessão para escolher entre o catálogo e a vitrine de vendas, e
 * por isso cada visita rodava uma função: ~140 KB de HTML para o visitante e
 * ~300 KB para o assinante, sem compressão, em toda entrada no módulo. Agora:
 *
 * - **visitante sem sessão:** o middleware reescreve este endereço para a
 *   vitrine estática (`./vitrine`). A URL na barra continua esta, e o buscador
 *   indexa a mesma landing de antes;
 * - **quem tem sessão:** recebe este casco do CDN, e o que ele mostra vem de
 *   `/api/manual-clinico/histologia/inicio`, que passa pelo portão
 *   (`lib/histologia/acesso.ts`) — catálogo para quem assina, vitrine com preço
 *   e motivo para quem não assina.
 *
 * Nada do catálogo está aqui: nem no HTML, nem no payload RSC. Ver
 * `components/histologia/portao.tsx`.
 */
export default function HomeDaHistologia() {
  // A rota que decide a home começa a ser buscada junto com o HTML, em paralelo
  // com o JavaScript — e não só depois de o componente hidratar.
  preload(ROTA_DO_INICIO, { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    // `guestNotice` desligado: o aviso flutuante do shell fala de catálogo e
    // download, fora de contexto aqui, e cobre a barra de compra no celular.
    // A landing já explica, no lugar certo, o que está trancado e como abrir.
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <InicioDaHistologia />
    </AppShell>
  )
}
