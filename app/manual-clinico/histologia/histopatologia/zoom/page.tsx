import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { CatalogoDaPatologiaComZoom } from '@/components/histopatologia-zoom/paginas/catalogo'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { rotaDosDadosDaPatologiaComZoom } from '@/lib/histopatologia-zoom/paginas-tipos'
import { BASE_PATOZOOM } from '@/lib/histopatologia-zoom/rotas'

/**
 * Catálogo da Histopatologia com Zoom — casco estático. As doenças chegam de
 * `/api/manual-clinico/histologia/histopatologia/zoom`, depois do portão; ver
 * `components/histologia/portao.tsx`.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Histopatologia com Zoom',
  descricao:
    'Lâminas inteiras de doenças reais, com zoom profundo, achados histopatológicos marcados na própria lâmina e comparação lado a lado com o tecido normal.',
  caminho: BASE_PATOZOOM,
})

export default function CascoDoCatalogoDaPatologiaComZoom() {
  preload(rotaDosDadosDaPatologiaComZoom([]), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <CatalogoDaPatologiaComZoom />
    </AppShell>
  )
}
