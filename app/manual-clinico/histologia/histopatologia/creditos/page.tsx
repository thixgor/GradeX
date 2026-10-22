import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { CreditosDaHistopatologia } from '@/components/histopatologia/creditos'
import { rotaDosDadosDaHistopatologia } from '@/lib/histopatologia/paginas-tipos'
import { rotaDosCreditos } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

/**
 * Créditos e atribuições das fontes usadas no módulo — casco estático. O
 * conteúdo chega de `/api/manual-clinico/histologia/histopatologia/creditos`,
 * depois do portão.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Créditos, proveniência e direitos',
  descricao: 'Créditos das fontes catalogadas e declaração das alterações editoriais feitas pelo Domine Aqui.',
  caminho: rotaDosCreditos(),
})

export default function CascoDosCreditos() {
  preload(rotaDosDadosDaHistopatologia(['creditos']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <CreditosDaHistopatologia />
    </AppShell>
  )
}
