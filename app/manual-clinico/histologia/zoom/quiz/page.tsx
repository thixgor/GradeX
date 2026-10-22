import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { QuizDoZoom } from '@/components/histologia-zoom/paginas/quiz'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { rotaDosDadosDoZoom } from '@/lib/histologia-zoom/paginas-tipos'
import { BASE_ZOOM } from '@/lib/histologia-zoom/rotas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Quiz de identificação — casco estático. As contagens do banco chegam de
 * `/api/manual-clinico/histologia/zoom/quiz`, depois do portão; as questões,
 * da rota do quiz, que já tinha o mesmo portão.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Quiz de identificação — Histologia com Zoom',
  descricao:
    'Identifique estruturas e órgãos em lâminas inteiras anônimas, com alternativas difíceis e resposta comentada em profundidade.',
  caminho: `${BASE_ZOOM}/quiz`,
})

export default function CascoDoQuizDoZoom() {
  preload(rotaDosDadosDoZoom(['quiz']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <QuizDoZoom comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
