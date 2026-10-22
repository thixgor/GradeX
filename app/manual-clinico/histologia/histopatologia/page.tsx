import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { InicioDaHistopatologia } from '@/components/histopatologia/inicio'
import { ROTA_DA_HISTOPATOLOGIA } from '@/lib/histopatologia/inicio-tipos'

/**
 * Home da Histopatologia — casco estático.
 *
 * Lia a sessão (portão de assinatura) e por isso saía da função a cada visita,
 * com ~500 KB de HTML sem compressão: era a página mais pesada do módulo. O
 * casco agora sai do CDN e o catálogo de doenças chega de
 * `/api/manual-clinico/histologia/histopatologia`, que passa pelo portão — ver
 * `components/histologia/portao.tsx`. `?q=` (a ponte da busca da Histologia) é
 * lido no navegador.
 *
 * O portão de ambiente (`histopatologiaHabilitada`) continua no layout da área.
 */
export default function HomeDaHistopatologia() {
  preload(ROTA_DA_HISTOPATOLOGIA, { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <InicioDaHistopatologia />
    </AppShell>
  )
}
