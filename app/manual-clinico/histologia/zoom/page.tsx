import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { CatalogoDoZoom } from '@/components/histologia-zoom/paginas/catalogo'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { rotaDosDadosDoZoom } from '@/lib/histologia-zoom/paginas-tipos'
import { TOTAIS } from '@/lib/histologia-zoom/repositorio'
import { BASE_ZOOM } from '@/lib/histologia-zoom/rotas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Catálogo da Histologia com Zoom — casco estático.
 *
 * Lia a sessão (portão de assinatura) e saía da função a cada visita com
 * ~470 KB de HTML, quase tudo o índice da busca. O casco agora sai do CDN e o
 * catálogo chega de `/api/manual-clinico/histologia/zoom`, depois do portão —
 * ver `components/histologia/portao.tsx`.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Histologia com Zoom',
  descricao:
    `${TOTAIS.laminas} lâminas histológicas digitalizadas em alta resolução, com zoom profundo até 60×, ` +
    `organizadas em ${TOTAIS.sistemas} sistemas e ${TOTAIS.orgaos} órgãos, com ficha de características de cada uma.`,
  caminho: BASE_ZOOM,
})

export default function CascoDoCatalogoDoZoom() {
  preload(rotaDosDadosDoZoom([]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <CatalogoDoZoom comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
