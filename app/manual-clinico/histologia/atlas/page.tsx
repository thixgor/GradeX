import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { AtlasPesquisavel } from '@/components/histologia/atlas'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { TOTAIS } from '@/lib/histologia/repositorio'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Atlas pesquisável — casco estático. O mapa do currículo chega de
 * `/api/manual-clinico/histologia/catalogo/atlas`, depois do portão; a página
 * lia a sessão e saía da função a cada visita com ~490 KB de HTML. Ver
 * `components/histologia/atlas.tsx`.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Atlas pesquisável',
  descricao:
    `Busque entre ${TOTAIS.laminas} lâminas e ${TOTAIS.estruturas} estruturas por nome anatômico, ` +
    'tecido, órgão, sistema ou coloração. A busca funciona sem acento e cobre também os termos em inglês.',
  caminho: `${BASE}/atlas`,
})

export default function CascoDoAtlas() {
  preload(rotaDosDadosDoCatalogo(['atlas']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <AtlasPesquisavel comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
