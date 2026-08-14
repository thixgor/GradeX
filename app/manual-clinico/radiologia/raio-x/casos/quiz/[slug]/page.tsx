import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { QuizCasoClinicoView } from '@/components/radiologia/quiz-caso-clinico'
import {
  QUIZZES_CLINICOS,
  getQuizCasoClinico,
  type ResumoQuizClinico,
} from '@/lib/radiologia/quiz-casos-raio-x'

export const dynamicParams = false

/**
 * Um quiz por capítulo, mais o plantão que mistura todos — todos estáticos.
 *
 * O banco inteiro é catálogo em código, então cada rodada pode ser servida como
 * HTML pronto. Sortear a rodada é trabalho do navegador (ver
 * `quiz-caso-clinico.tsx`); a página só precisa entregar os casos já
 * comentados.
 */
export function generateStaticParams() {
  return QUIZZES_CLINICOS.map((quiz) => ({ slug: quiz.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const quiz = QUIZZES_CLINICOS.find((item) => item.slug === params.slug)
  if (!quiz) return { title: 'Quiz não encontrado | Manual de Radiologia' }
  return {
    title: `Casos clínicos — ${quiz.titulo} | Raio-X de tórax`,
    description: `${quiz.total} casos clínicos com radiografia de tórax, apresentados como consulta e com resposta comentada aprofundada. ${quiz.descricao}`,
  }
}

/**
 * Vizinhos oferecidos ao fim da rodada.
 *
 * Terminar uma rodada e cair num beco é perder o aluno no momento em que ele
 * está mais disposto a continuar. Quem fez um capítulo recebe os outros e o
 * plantão; quem fez o plantão recebe os capítulos por onde recomeçar.
 */
function irmaosDoQuiz(quiz: ResumoQuizClinico): ResumoQuizClinico[] {
  const plantao = QUIZZES_CLINICOS.filter((item) => item.tipo === 'plantao')
  const capitulos = QUIZZES_CLINICOS.filter(
    (item) => item.tipo === 'categoria' && item.slug !== quiz.slug,
  )
  return quiz.tipo === 'plantao' ? capitulos.slice(0, 6) : [...capitulos.slice(0, 5), ...plantao]
}

export default function QuizCasoClinicoPage({ params }: { params: { slug: string } }) {
  const quiz = getQuizCasoClinico(params.slug)
  if (!quiz) notFound()

  return (
    <AreaRadiologia alvo={`O quiz de casos clínicos — ${quiz.titulo}`}>
      <QuizCasoClinicoView quiz={quiz} irmaos={irmaosDoQuiz(quiz)} />
    </AreaRadiologia>
  )
}
