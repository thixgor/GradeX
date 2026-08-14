import type { Metadata } from 'next'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoQuizClinico } from '@/components/radiologia/catalogo-quiz-clinico'
import { QUIZZES_CLINICOS, TOTAL_QUESTOES_CLINICAS } from '@/lib/radiologia/quiz-casos-raio-x'

export const metadata: Metadata = {
  title: 'Quiz de casos clínicos no Raio-X de tórax | Manual de Radiologia',
  description:
    'Casos clínicos completos com radiografia de tórax: a consulta inteira — queixa, história, antecedentes, sinais vitais e exame físico —, o filme limpo para você identificar o achado e a resposta comentada aprofundada com o mesmo filme marcado, mecanismo da imagem, sinais, armadilhas e conduta.',
}

/**
 * Índice dos quizzes clínicos.
 *
 * Só os resumos atravessam a rede: as consultas e as respostas comentadas são
 * montadas na página de cada quiz. O catálogo não tem por que carregar os 72
 * dossiês do acervo para desenhar oito cartões.
 */
export default function QuizzesClinicosRaioXPage() {
  return (
    <AreaRadiologia alvo="Os quizzes de casos clínicos do Raio-X de tórax">
      <CatalogoQuizClinico quizzes={QUIZZES_CLINICOS} totalCasos={TOTAL_QUESTOES_CLINICAS} />
    </AreaRadiologia>
  )
}
