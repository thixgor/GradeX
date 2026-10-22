import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { Laboratorio } from '@/components/histologia/pagina-do-laboratorio'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Laboratório virtual — casco estático. A lista dos módulos chega de
 * `/api/manual-clinico/histologia/catalogo/laboratorio`, depois do portão.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Laboratório virtual',
  descricao:
    'Da coleta à lâmina: fixação, desidratação, diafanização, inclusão, microtomia, banho-maria, ' +
    'coloração e montagem — e o diagnóstico dos artefatos que cada etapa produz quando falha.',
  caminho: `${BASE}/laboratorio`,
})

export default function CascoDoLaboratorio() {
  preload(rotaDosDadosDoCatalogo(['laboratorio']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Laboratorio comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
