'use client'

import Link from 'next/link'
import { ArrowLeft, ListChecks, Microscope } from 'lucide-react'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import {
  rotaDosDadosDoCatalogo,
  type DadosDosQuizzes,
  type QuizDaLista,
} from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE } from '@/lib/histologia/rotas'

/**
 * A lista dos quizzes de identificação: os próprios, por tema, e os do acervo.
 * O casco é estático; a lista vem de `/api/manual-clinico/histologia/catalogo/quizzes`,
 * depois do portão.
 */
export function ListaDeQuizzes({ comPatologia }: { comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDosQuizzes> url={rotaDosDadosDoCatalogo(['quizzes'])}>
      {(dados) => <Conteudo dados={dados} comPatologia={comPatologia} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados, comPatologia }: { dados: DadosDosQuizzes; comPatologia: boolean }) {
  const { totais } = dados

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />
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
            {totais.questoes} questões sobre fotomicrografias reais. Em <strong>prática</strong>,
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
            {totais.questoesProprias} questões em {totais.quizzesProprios} temas, montadas sobre
            as próprias lâminas do atlas: cada questão mostra a fotomicrografia com a camada de
            marcação do acervo acesa e pergunta o que está ali. Depois de responder, dá para
            abrir a lâmina no microscópio com a estrutura já destacada.{' '}
            <strong>As imagens e os nomes são do acervo; as perguntas são nossas</strong> — e
            ainda não passaram por revisão biomédica.
          </p>

          <div className="mt-4 space-y-5">
            {dados.proprios.map((grupo) => (
              <div key={grupo.setor}>
                <h3 className="editorial-mark mb-2">{grupo.titulo}</h3>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {grupo.quizzes.map((quiz) => (
                    <li key={quiz.slug}>
                      <CartaoDeQuiz quiz={quiz} />
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
            {totais.questoesDoAcervo} questões dos {totais.quizzesDoAcervo} quizzes originais do
            acervo, com as imagens que eles já traziam. Enunciados e devolutivas que ainda não
            têm tradução escrita aparecem marcados, no original.
          </p>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {dados.doAcervo.map((quiz) => (
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
  )
}

function CartaoDeQuiz({ quiz }: { quiz: QuizDaLista }) {
  return (
    <Link
      href={`${BASE}/quizzes/${quiz.slug}`}
      className="group flex min-h-[44px] items-center justify-between gap-3 histologia-cartao p-4 transition-colors hover:border-rose-500/45"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-snug">{quiz.titulo}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {quiz.contexto && <span className="block truncate">{quiz.contexto}</span>}
          {quiz.questoes} questões ·{' '}
          {quiz.autoria === 'proprio' ? `${quiz.laminas} lâminas do atlas` : `${quiz.comImagem} com fotomicrografia`}
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
