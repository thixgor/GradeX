import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { MecanismosGerais } from '@/components/histopatologia/mecanismos'
import { rotaDosDadosDaHistopatologia } from '@/lib/histopatologia/paginas-tipos'
import { rotaDosMecanismos } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

/**
 * Mecanismos patológicos gerais — casco estático. O mapa chega de
 * `/api/manual-clinico/histologia/histopatologia/mecanismos`, depois do portão.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Mecanismos patológicos gerais',
  descricao:
    'Lesão celular, inflamação, distúrbios hemodinâmicos, imunopatologia, infecção, reparo, ' +
    'alterações genéticas e neoplasia — os processos reutilizáveis que explicam a morfologia em ' +
    'qualquer órgão.',
  caminho: rotaDosMecanismos(),
})

export default function CascoDosMecanismos() {
  preload(rotaDosDadosDaHistopatologia(['mecanismos']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <MecanismosGerais />
    </AppShell>
  )
}
