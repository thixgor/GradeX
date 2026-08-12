import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { QuizRaioXView } from '@/components/radiologia/quiz-raio-x'
import {
  QUIZZES_RAIO_X,
  getQuizRaioX,
  type ResumoQuizRaioX,
} from '@/lib/radiologia/quiz-raio-x'

export const dynamicParams = false

/**
 * Um quiz por incidência, um por região e o simulado geral — todos estáticos.
 *
 * O banco inteiro é catálogo em código, então cada rodada pode ser servida como
 * HTML pronto. Sortear a rodada é trabalho do navegador (ver `quiz-raio-x.tsx`);
 * a página só precisa entregar as questões já comentadas.
 */
export function generateStaticParams() {
  return QUIZZES_RAIO_X.map((quiz) => ({ slug: quiz.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const quiz = QUIZZES_RAIO_X.find((item) => item.slug === params.slug)
  if (!quiz) return { title: 'Quiz não encontrado | Manual de Radiologia' }
  return {
    title: `Quiz — ${quiz.titulo} (${quiz.subtitulo}) | Atlas de Raio-X`,
    description: `${quiz.total} questões de identificação de estruturas marcadas na radiografia, com resposta comentada aprofundada. ${quiz.descricao}`,
  }
}

/**
 * Vizinhos oferecidos ao fim da rodada.
 *
 * Terminar um quiz e cair num beco é perder o aluno no momento em que ele está
 * mais disposto a continuar. A escolha segue o que ele acabou de treinar: quem
 * fez uma incidência recebe as outras da mesma região; quem fez uma região
 * recebe as regiões vizinhas e o simulado geral.
 */
function irmaosDoQuiz(quiz: ResumoQuizRaioX): ResumoQuizRaioX[] {
  const geral = QUIZZES_RAIO_X.filter((item) => item.tipo === 'geral')

  if (quiz.tipo === 'estudo') {
    const mesmaRegiao = QUIZZES_RAIO_X.filter(
      (item) => item.slug !== quiz.slug && item.regiao === quiz.regiao,
    )
    return [...mesmaRegiao, ...geral].slice(0, 6)
  }

  if (quiz.tipo === 'regiao') {
    const doEstudo = QUIZZES_RAIO_X.filter(
      (item) => item.tipo === 'estudo' && item.regiao === quiz.regiao,
    )
    const outrasRegioes = QUIZZES_RAIO_X.filter(
      (item) => item.tipo === 'regiao' && item.slug !== quiz.slug,
    )
    return [...doEstudo.slice(0, 3), ...outrasRegioes.slice(0, 2), ...geral].slice(0, 6)
  }

  return QUIZZES_RAIO_X.filter((item) => item.tipo === 'regiao').slice(0, 6)
}

export default function QuizRaioXPage({ params }: { params: { slug: string } }) {
  const quiz = getQuizRaioX(params.slug)
  if (!quiz) notFound()

  return (
    <AreaRadiologia alvo={`O quiz de identificação — ${quiz.titulo}`}>
      <QuizRaioXView quiz={quiz} irmaos={irmaosDoQuiz(quiz)} />
    </AreaRadiologia>
  )
}
