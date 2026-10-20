import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaSemiologia } from '@/components/semiologia/area'
import { QuizSemiologia, type QuestaoComMidia } from '@/components/semiologia/quiz-semiologia'
import { fonteDaMidia, urlDaMidia } from '@/lib/semiologia/midia'
import { QUIZZES_SEMIOLOGIA, midiaDaQuestao, nomeDaFicha, quizPorId } from '@/lib/semiologia/quiz'

export const dynamicParams = false

export function generateStaticParams() {
  return QUIZZES_SEMIOLOGIA.map((quiz) => ({ id: quiz.id }))
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const quiz = quizPorId(params.id)
  if (!quiz) return {}
  return { title: `Quiz: ${quiz.titulo} | Manual de Semiologia`, description: quiz.descricao }
}

export default async function QuizSemiologiaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const quiz = quizPorId(params.id)
  if (!quiz) notFound()

  // A mídia é resolvida aqui: o cliente recebe a URL servível e o crédito, e
  // não o acervo inteiro da ficha.
  const questoes: QuestaoComMidia[] = quiz.questoes.map((questao) => {
    const midia = midiaDaQuestao(questao)
    const src = midia ? urlDaMidia(midia) : null
    return {
      ...questao,
      nomeDaFicha: nomeDaFicha(questao),
      midiaResolvida:
        midia && src
          ? { midia, src, credito: [midia.autoria, fonteDaMidia(midia).creditoCurto].filter(Boolean).join(' · ') }
          : null,
    }
  })

  return (
    <AreaSemiologia alvo={`Quiz: ${quiz.titulo}`}>
      <div className="surface-page min-h-screen">
        <QuizSemiologia titulo={quiz.titulo} descricao={quiz.descricao} questoes={questoes} />
      </div>
    </AreaSemiologia>
  )
}
