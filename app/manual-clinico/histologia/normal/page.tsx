import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { AreaNormal } from '@/components/histologia/catalogo/area-normal'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Área **Histologia** — o tecido normal, inteiro, numa página. O desenho e o
 * porquê dele estão em `components/histologia/catalogo/area-normal.tsx`.
 *
 * Casco estático: as fileiras chegam de `/api/manual-clinico/histologia/catalogo/normal`,
 * depois do portão. A página lia a sessão e saía da função a cada visita, com
 * ~450 KB de HTML sem compressão.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Histologia — tecido normal',
  descricao:
    'Histologia normal: atlas por assunto com estruturas marcadas e lâminas inteiras com zoom interativo, ' +
    'organizadas por setor do curso e por sistema.',
  caminho: `${BASE}/normal`,
})

export default function CascoDaAreaNormal() {
  preload(rotaDosDadosDoCatalogo(['normal']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <AreaNormal comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
