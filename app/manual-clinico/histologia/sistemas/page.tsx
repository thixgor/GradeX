import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { IndiceDosSistemas } from '@/components/histologia/catalogo/sistemas'
import { BASE_DOS_SISTEMAS } from '@/lib/histologia/catalogo'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { metadadosDoModulo } from '@/lib/histologia/seo'

/**
 * Explorar por sistemas — casco estático. Os cartões chegam de
 * `/api/manual-clinico/histologia/catalogo/sistemas`, depois do portão; ver
 * `components/histologia/catalogo/sistemas.tsx`.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Sistemas',
  descricao: 'Histologia normal e histopatologia de cada sistema do corpo, lado a lado, com lâminas de zoom interativo.',
  caminho: BASE_DOS_SISTEMAS,
})

export default function CascoDosSistemas() {
  preload(rotaDosDadosDoCatalogo(['sistemas']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <IndiceDosSistemas />
    </AppShell>
  )
}
