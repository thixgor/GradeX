'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { DadosEstruturados, useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { QuizRunner } from '@/components/histologia/quiz'
import { rotaDosDadosDoCatalogo, type DadosDoQuiz } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE } from '@/lib/histologia/rotas'

/**
 * Um quiz de identificação. O casco é estático; `?modo=prova` é lido aqui e
 * repassado à rota de dados, que entrega o quiz já sem gabarito nesse modo —
 * a remoção continua no servidor, antes de qualquer byte chegar ao navegador.
 */
export function PaginaDoQuiz({ slug, comPatologia }: { slug: string; comPatologia: boolean }) {
  const modo = useSearchParams()?.get('modo') === 'prova' ? 'prova' : 'pratica'
  return (
    <PortaoDaHistologia<DadosDoQuiz> url={`${rotaDosDadosDoCatalogo(['quizzes', slug])}?modo=${modo}`}>
      {(dados) => <Conteudo dados={dados} comPatologia={comPatologia} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados, comPatologia }: { dados: DadosDoQuiz; comPatologia: boolean }) {
  const { quiz, modo } = dados
  useTituloDaAba(`Quiz de ${quiz.titulo}`)

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />
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
              Questões montadas pela edição do Manual a partir das camadas de marcação das lâminas deste tema. A
              fotomicrografia, a marcação e o nome da estrutura são do acervo <strong>Digital Histology</strong> (CC
              BY-NC-SA 4.0); o enunciado, as alternativas erradas e a devolutiva são nossos — e ainda não passaram por
              revisão biomédica. Cada questão leva de volta à lâmina de origem depois que você responde.
            </p>
          )}
        </header>

        <QuizRunner quiz={quiz} modoInicial={modo} comGabarito={modo === 'pratica'} />
      </div>

      <DadosEstruturados dados={[dados.jsonLd]} />
    </div>
  )
}
