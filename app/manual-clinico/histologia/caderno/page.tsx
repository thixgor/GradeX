import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { PaginaDoCaderno } from '@/components/histologia/pagina-do-caderno'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Caderno e meus dados — casco estático. O conteúdo vive no navegador; a rota
 * de dados só confirma o acesso, como o portão da página fazia no servidor.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Caderno e meus dados',
  descricao:
    'Suas lâminas concluídas, favoritas, notas privadas e estruturas a revisar — guardadas ' +
    'apenas neste dispositivo, com exportação e apagamento em um clique.',
  caminho: `${BASE}/caderno`,
})

export default function CascoDoCaderno() {
  preload(rotaDosDadosDoCatalogo(['caderno']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <PaginaDoCaderno comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
