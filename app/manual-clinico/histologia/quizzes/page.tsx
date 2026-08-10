import Link from 'next/link'
import { ArrowLeft, ListChecks, Microscope } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  RESUMO_DE_QUIZZES,
  RESUMO_DE_QUIZZES_PROPRIOS,
  TOTAIS,
  type ResumoDeQuiz,
} from '@/lib/histologia/repositorio'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'

export const revalidate = 86400

export const metadata = metadadosDoModulo({
  titulo: 'Quizzes de identificação',
  descricao:
    `${TOTAIS.questoes} questões sobre fotomicrografias reais, em ${TOTAIS.quizzes} quizzes por ` +
    'assunto e por tema. Modo prática com devolutiva imediata ou modo prova com relatório de erros.',
  caminho: `${BASE}/quizzes`,
})

/** Setores na ordem do currículo — a mesma que o aluno já viu no índice. */
const ORDEM_DOS_SETORES = ['histologia-basica', 'celulas', 'tecidos', 'orgaos-e-sistemas']

function agruparPorSetor(quizzes: ResumoDeQuiz[]): Array<[string, ResumoDeQuiz[]]> {
  const grupos = new Map<string, ResumoDeQuiz[]>()
  for (const quiz of quizzes) {
    const setor = quiz.setor ?? ''
    const lista = grupos.get(setor) ?? []
    lista.push(quiz)
    grupos.set(setor, lista)
  }
  return [...grupos.entries()].sort(
    ([a], [b]) => ORDEM_DOS_SETORES.indexOf(a) - ORDEM_DOS_SETORES.indexOf(b),
  )
}

function CartaoDeQuiz({ quiz, contexto }: { quiz: ResumoDeQuiz; contexto?: string }) {
  return (
    <Link
      href={`${BASE}/quizzes/${quiz.slug}`}
      className="group flex min-h-[44px] items-center justify-between gap-3 histologia-cartao p-4 transition-colors hover:border-rose-500/45"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-snug">{quiz.titulo}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {contexto && <span className="block truncate">{contexto}</span>}
          {quiz.questoes} questões ·{' '}
          {quiz.autoria === 'proprio'
            ? `${quiz.laminas} lâminas do atlas`
            : `${quiz.comImagem} com fotomicrografia`}
        </span>
      </span>
      {quiz.autoria === 'proprio' ? (
        <Microscope
          className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-rose-600"
          aria-hidden
        />
      ) : (
        <ListChecks
          className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-rose-600"
          aria-hidden
        />
      )}
    </Link>
  )
}

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

          {/* ── Quizzes por tema, montados sobre as lâminas do atlas ── */}
          <section aria-labelledby="quizzes-proprios" className="mb-10">
            <h2 id="quizzes-proprios" className="font-heading text-lg font-semibold">
              Identificação nas lâminas · por tema
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {TOTAIS.questoesProprias} questões em {TOTAIS.quizzesProprios} temas, montadas sobre
              as próprias lâminas do atlas: cada questão mostra a fotomicrografia com a camada de
              marcação do acervo acesa e pergunta o que está ali. Depois de responder, dá para
              abrir a lâmina no microscópio com a estrutura já destacada.{' '}
              <strong>As imagens e os nomes são do acervo; as perguntas são nossas</strong> — e
              ainda não passaram por revisão biomédica.
            </p>

            <div className="mt-4 space-y-5">
              {agruparPorSetor(RESUMO_DE_QUIZZES_PROPRIOS).map(([setor, quizzes]) => (
                <div key={setor}>
                  <h3 className="editorial-mark mb-2">{quizzes[0]?.trilha?.split(' › ')[0]}</h3>
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {quizzes.map((quiz) => (
                      <li key={quiz.slug}>
                        <CartaoDeQuiz
                          quiz={quiz}
                          // A trilha sem o setor: ele já é o título do grupo, e
                          // repeti-lo em cada cartão só gastaria a linha que
                          // diz onde o tema fica.
                          contexto={quiz.trilha?.split(' › ').slice(1, -1).join(' › ')}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Quizzes do acervo ── */}
          <section aria-labelledby="quizzes-acervo">
            <h2 id="quizzes-acervo" className="font-heading text-lg font-semibold">
              Do acervo Digital Histology · por assunto
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {TOTAIS.questoesDoAcervo} questões dos {TOTAIS.quizzesDoAcervo} quizzes originais do
              acervo, com as imagens que eles já traziam. Enunciados e devolutivas que ainda não
              têm tradução escrita aparecem marcados, no original.
            </p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {RESUMO_DE_QUIZZES.map((quiz) => (
                <li key={quiz.slug}>
                  <CartaoDeQuiz quiz={quiz} />
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            Nenhum destes quizzes passou por revisão biomédica, e nenhum deles vale nota: são de
            autoavaliação. As imagens vêm das lâminas do atlas, então quem quiser conferir a
            resposta antes de responder consegue — não fingimos o contrário. Créditos e licença na
            página de cada quiz.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
