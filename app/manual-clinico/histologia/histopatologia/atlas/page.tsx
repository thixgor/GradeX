import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { AtlasDaPatologia } from '@/components/histopatologia/atlas'
import { rotaDosDadosDaHistopatologia } from '@/lib/histopatologia/paginas-tipos'
import { TOTAIS } from '@/lib/histopatologia/repositorio'
import { BASE } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'
import { TOTAL_ENTRADAS_WEBPATH_UTAH } from '@/lib/histopatologia/webpath-utah/catalogo'

/**
 * Atlas de inventário — casco estático. O índice chega de
 * `/api/manual-clinico/histologia/histopatologia/atlas`, depois do portão; ver
 * `components/histopatologia/atlas.tsx`.
 */

const TOTAL_DE_ITENS_DO_ATLAS = TOTAIS.capitulosVisuais + TOTAL_ENTRADAS_WEBPATH_UTAH

export const metadata = metadadosDoModulo({
  titulo: 'Atlas de lâminas',
  descricao:
    `${TOTAL_DE_ITENS_DO_ATLAS} capítulos e referências visuais, incluindo ` +
    `${TOTAL_ENTRADAS_WEBPATH_UTAH} registros do WebPath/Utah no mesmo atlas do Domine Aqui.`,
  caminho: `${BASE}/atlas`,
})

export default function CascoDoAtlasDaPatologia() {
  preload(rotaDosDadosDaHistopatologia(['atlas']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <AtlasDaPatologia />
    </AppShell>
  )
}
