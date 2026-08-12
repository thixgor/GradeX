import type { Metadata } from 'next'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoQuizRaioX } from '@/components/radiologia/catalogo-quiz-raio-x'
import { QUIZZES_RAIO_X, TOTAL_QUESTOES_RAIO_X } from '@/lib/radiologia/quiz-raio-x'

export const metadata: Metadata = {
  title: 'Quizzes de identificação no Raio-X | Manual de Radiologia',
  description:
    'Treine reconhecer estruturas em radiografias: a demarcação do atlas abre acesa e você identifica a estrutura, com resposta comentada aprofundada — o que é, como reconhecer sem a marcação, o que se avalia e por que cada alternativa errada era tentadora.',
}

/**
 * Índice dos quizzes.
 *
 * Só os resumos atravessam a rede: as questões, com comentário completo, são
 * montadas na página de cada quiz. O catálogo não tem por que carregar as 221
 * demarcações do acervo para desenhar cartões.
 */
export default function QuizzesRaioXPage() {
  return (
    <AreaRadiologia alvo="Os quizzes de identificação do Atlas de Raio-X">
      <CatalogoQuizRaioX quizzes={QUIZZES_RAIO_X} totalDemarcacoes={TOTAL_QUESTOES_RAIO_X} />
    </AreaRadiologia>
  )
}
