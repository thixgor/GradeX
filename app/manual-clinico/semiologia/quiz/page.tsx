import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, GraduationCap } from 'lucide-react'
import { AreaSemiologia } from '@/components/semiologia/area'
import { QUIZZES_SEMIOLOGIA, TOTAL_QUESTOES_SEMIOLOGIA } from '@/lib/semiologia/quiz'
import { ROTAS } from '@/lib/semiologia/rotas'

export const metadata: Metadata = {
  title: 'Quizzes de casos clínicos | Manual de Semiologia',
  description:
    'Casos clínicos completos com fotografia, vídeo ou ausculta real: queixa, história, antecedentes pessoais, gestacionais, familiares e fatores de risco, exame físico e resposta comentada com apontamento na imagem, mecanismo e conduta.',
}

export default function QuizzesSemiologiaPage() {
  return (
    <AreaSemiologia alvo="Quizzes de casos clínicos">
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <header className="mb-8">
            <Link href={ROTAS.raiz} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ChevronRight className="h-3 w-3 rotate-180" />
              Manual de Semiologia
            </Link>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Quizzes de casos clínicos</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {TOTAL_QUESTOES_SEMIOLOGIA} consultas inteiras, cada uma com a mídia real do achado. Leia a história, olhe a foto,
              assista ao vídeo ou ouça a ausculta e decida. A legenda e o apontamento do que olhar só aparecem depois da resposta.
            </p>
          </header>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUIZZES_SEMIOLOGIA.map((quiz) => (
              <li key={quiz.id}>
                <Link
                  href={ROTAS.quiz(quiz.id)}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-sky-500/50"
                >
                  <GraduationCap className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  <p className="mt-3 text-base font-semibold">{quiz.titulo}</p>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{quiz.descricao}</p>
                  <p className="mt-4 text-xs font-medium text-sky-700 dark:text-sky-400">{quiz.questoes.length} casos clínicos →</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AreaSemiologia>
  )
}
