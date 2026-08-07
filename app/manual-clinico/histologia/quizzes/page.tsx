import Link from 'next/link'
import { ArrowLeft, ListChecks } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESUMO_DE_QUIZZES, TOTAIS } from '@/lib/histologia/repositorio'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'

export const revalidate = 86400

export const metadata = metadadosDoModulo({
  titulo: 'Quizzes de identificação',
  descricao:
    `${TOTAIS.questoes} questões sobre fotomicrografias reais, em ${TOTAIS.quizzes} quizzes por ` +
    'assunto. Modo prática com devolutiva imediata ou modo prova com relatório de erros.',
  caminho: `${BASE}/quizzes`,
})

export default function PaginaDeQuizzes() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <Link
            href={BASE}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Manual da Histologia
          </Link>

          <header className="mb-6">
            <p className="editorial-mark mb-2">Avaliação</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Quizzes de identificação
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {TOTAIS.questoes} questões sobre fotomicrografias reais. Em <strong>prática</strong>,
              a devolutiva vem a cada resposta e explica o critério. Em <strong>prova</strong>, as
              questões são embaralhadas, você declara sua confiança e o relatório mostra em que
              assuntos o reconhecimento ainda não está firme — com destaque para os erros em que
              você tinha certeza.
            </p>
          </header>

          <ul className="grid gap-2.5 sm:grid-cols-2">
            {RESUMO_DE_QUIZZES.map((quiz) => (
              <li key={quiz.slug}>
                <Link
                  href={`${BASE}/quizzes/${quiz.slug}`}
                  className="group flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-rose-500/45"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-snug">{quiz.titulo}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {quiz.questoes} questões · {quiz.comImagem} com fotomicrografia
                    </span>
                  </span>
                  <ListChecks
                    className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-rose-600"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            Questões e devolutivas ainda aguardam revisão biomédica; os enunciados sem tradução
            aparecem marcados. Créditos e licença na página de cada quiz.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
