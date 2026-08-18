import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { QuizRunner } from '@/components/histologia/quiz'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { buildJsonLd } from '@/lib/seo'
import type { Modo } from '@/lib/histologia/quiz-engine'
import { quizParaCliente } from '@/lib/histologia/quiz-engine'
import { listarSlugsDeQuiz, obterQuiz } from '@/lib/histologia/repositorio'
import { BASE, jsonLdDeQuiz, metadadosDoModulo } from '@/lib/histologia/seo'

/**
 * São 84 quizzes — 19 do acervo e 65 gerados sobre as lâminas —, e eles não
 * mudam entre deploys: este é o único lugar do módulo onde pré-renderizar tudo
 * faz sentido. (As 1.524 páginas do currículo continuam sob demanda; ver o
 * comentário em `[...slug]/page.tsx`.)
 */
export function generateStaticParams() {
  return listarSlugsDeQuiz().map((slug) => ({ slug }))
}

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
  searchParams: { modo?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quiz = await obterQuiz(params.slug)
  if (!quiz) return { title: 'Quiz não encontrado — Manual da Histologia' }

  return metadadosDoModulo({
    titulo: `Quiz de ${quiz.titulo}`,
    descricao:
      `${quiz.questoes.length} questões de identificação sobre ${quiz.titulo.toLowerCase()} em ` +
      'fotomicrografias reais, com devolutiva explicativa e relatório de erros por assunto.',
    caminho: `${BASE}/quizzes/${quiz.slug}`,
  })
}

export default async function PaginaDoQuiz({ params, searchParams }: Props) {
  await exigirAcessoAHistologia()

  const quiz = await obterQuiz(params.slug)
  if (!quiz) notFound()

  const modo: Modo = searchParams.modo === 'prova' ? 'prova' : 'pratica'

  /*
   * No modo prova o gabarito é removido **aqui**, no servidor, antes da
   * serialização. É a diferença entre "o gabarito não aparece na tela" e "o
   * gabarito não existe no HTML" — só a segunda resiste a um Ctrl+U.
   */
  const paraCliente = quizParaCliente(quiz, modo)

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <Link
            href={`${BASE}/quizzes`}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Todos os quizzes
          </Link>

          <header className="mb-5">
            <p className="editorial-mark mb-2">Quiz de identificação</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{quiz.titulo}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {quiz.questoes.length} questões
              {quiz.autoria === 'acervo' && ` · no acervo original: ${quiz.tituloOriginal}`}
            </p>

            {/*
              Quem escreveu as perguntas é informação do aluno, não nota de
              rodapé: muda o quanto ele deve confiar no gabarito e para onde
              reclamar quando discordar dele.
            */}
            {quiz.autoria === 'proprio' && (
              <p className="mt-3 rounded-lg border border-border bg-muted/25 p-3 text-xs leading-relaxed text-muted-foreground">
                Questões montadas pela edição do Manual a partir das camadas de marcação das
                lâminas deste tema. A fotomicrografia, a marcação e o nome da estrutura são do
                acervo <strong>Digital Histology</strong> (CC BY-NC-SA 4.0); o enunciado, as
                alternativas erradas e a devolutiva são nossos — e ainda não passaram por revisão
                biomédica. Cada questão leva de volta à lâmina de origem depois que você responde.
              </p>
            )}
          </header>

          <QuizRunner quiz={paraCliente} modoInicial={modo} comGabarito={modo === 'pratica'} />
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJsonLd(jsonLdDeQuiz(quiz)) }}
        />
      </div>
    </AppShell>
  )
}
