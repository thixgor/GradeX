import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { Praticar } from '@/components/histologia/catalogo/praticar'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Praticar — tudo o que testa ou treina, num lugar só.
 *
 * Quizzes, quiz das lâminas com zoom e laboratório eram três abas e um botão
 * escondido no catálogo do zoom. São a mesma intenção ("quero treinar"), então
 * viram uma página com uma fileira por formato. As listagens completas
 * continuam nas rotas de sempre.
 *
 * Casco estático: as fileiras chegam de `/api/manual-clinico/histologia/catalogo/praticar`,
 * depois do portão — ver `components/histologia/portao.tsx`.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Praticar',
  descricao: 'Quizzes de identificação com fotomicrografias e lâminas inteiras, e o laboratório virtual de preparação e coloração.',
  caminho: `${BASE}/praticar`,
})

export default function CascoDePraticar() {
  preload(rotaDosDadosDoCatalogo(['praticar']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Praticar comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
