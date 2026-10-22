'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { QuizDeIdentificacao } from '@/components/histologia-zoom/quiz/quiz'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { rotaDosDadosDoZoom, type DadosDoQuizDoZoom } from '@/lib/histologia-zoom/paginas-tipos'

/**
 * Quiz de identificação da Histologia com Zoom. O casco é estático; as
 * contagens do banco vêm da rota de dados do zoom (e as questões, como sempre,
 * da rota do quiz), as duas depois do portão.
 */
export function QuizDoZoom({ comPatologia }: { comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDoQuizDoZoom> url={rotaDosDadosDoZoom(['quiz'])}>
      {({ sistemas, estruturas, orgaos }) => (
        <div className="surface-page min-h-screen">
          <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <Link
              href="/manual-clinico/histologia/praticar"
              className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Praticar
            </Link>
            <header className="mb-6 max-w-2xl">
              <p className="editorial-mark mb-2">Quiz de identificação</p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">O que é isto?</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {estruturas + orgaos} questões sobre lâminas inteiras, sem nome, sem órgão, sem legenda: {estruturas}{' '}
                estruturas apontadas por seta ou contorno e {orgaos} lâminas para reconhecer o órgão. Depois de cada
                resposta, o comentário explica como reconhecer, por que as outras alternativas não servem, a função e a
                correlação clínica.
              </p>
            </header>
            <QuizDeIdentificacao sistemas={sistemas} />
          </div>
        </div>
      )}
    </PortaoDaHistologia>
  )
}
