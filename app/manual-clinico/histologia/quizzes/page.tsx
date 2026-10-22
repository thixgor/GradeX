import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { ListaDeQuizzes } from '@/components/histologia/quizzes'
import { rotaDosDadosDoCatalogo } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { TOTAIS } from '@/lib/histologia/repositorio'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Lista dos quizzes de identificação — casco estático. A lista chega de
 * `/api/manual-clinico/histologia/catalogo/quizzes`, depois do portão; ver
 * `components/histologia/quizzes.tsx`.
 */

export const metadata = metadadosDoModulo({
  titulo: 'Quizzes de identificação',
  descricao:
    `${TOTAIS.questoes} questões sobre fotomicrografias reais, em ${TOTAIS.quizzes} quizzes por ` +
    'assunto e por tema. Modo prática com devolutiva imediata ou modo prova com relatório de erros.',
  caminho: `${BASE}/quizzes`,
})

export default function CascoDosQuizzes() {
  preload(rotaDosDadosDoCatalogo(['quizzes']), { as: 'fetch', crossOrigin: 'anonymous' })

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <ListaDeQuizzes comPatologia={histopatologiaHabilitada()} />
    </AppShell>
  )
}
