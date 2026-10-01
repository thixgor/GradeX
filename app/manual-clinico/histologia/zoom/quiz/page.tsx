import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { QuizDeIdentificacao } from '@/components/histologia-zoom/quiz/quiz'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { BANCO, contagemDoBanco } from '@/lib/histologia-zoom/quiz/banco'
import { BASE_ZOOM } from '@/lib/histologia-zoom/rotas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

export const dynamic = 'force-dynamic'

export const metadata = metadadosDoModulo({
  titulo: 'Quiz de identificação — Histologia com Zoom',
  descricao:
    'Identifique estruturas e órgãos em lâminas inteiras anônimas, com alternativas difíceis e resposta comentada em profundidade.',
  caminho: `${BASE_ZOOM}/quiz`,
})

export default async function PaginaDoQuiz() {
  await exigirAcessoAHistologia()
  const sistemas = contagemDoBanco()
  const estruturas = BANCO.filter((d) => d.tipo === 'estrutura').length
  const orgaos = BANCO.filter((d) => d.tipo === 'orgao').length

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
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
    </AppShell>
  )
}
