import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { AvisoDeContexto, TabelaComparativa } from '@/components/exames-laboratoriais/folha'
import { COMPARACOES } from '@/lib/exames-laboratoriais'

export const metadata: Metadata = {
  title: 'Comparar diagnósticos lado a lado | DomineAqui Lab',
  description:
    'Ferropriva × talassemia × doença crônica, hepatocelular × colestático, pré-renal × NTA × pós-renal, hipotireoidismo primário × central e outras comparações — com a leitura do que separa cada coluna.',
}

/**
 * Comparar diagnósticos.
 *
 * A tabela existe para ser varrida com os olhos; a leitura abaixo dela é quem
 * explica. Essa divisão é deliberada: o valor da comparação não está em decorar
 * qual seta vai em qual coluna, mas em entender qual eixo fisiológico separa as
 * hipóteses — o estoque de ferro, a integridade tubular, a apropriação do
 * hormônio hipofisário.
 *
 * Os limites de cada tabela têm espaço próprio pelo mesmo motivo: uma tabela
 * que não diz o que não resolve ensina a confiar demais nela.
 */
export default function PaginaDeComparacoes() {
  return (
    <AreaDosExames alvo="as comparações de diagnóstico">
      <CabecalhoDaSecao
        titulo="Comparar diagnósticos"
        subtitulo="Hipóteses que compartilham o mesmo achado, lado a lado — e o eixo fisiológico que separa uma da outra."
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        <nav className="flex flex-wrap gap-1.5" aria-label="Ir para uma comparação">
          {COMPARACOES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs transition hover:border-primary/35"
            >
              {c.titulo}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-8">
          {COMPARACOES.map((c) => (
            <article key={c.id} id={c.id} className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 sm:p-6">
              <p className="lab-rubrica">Comparação</p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">{c.titulo}</h2>
              {c.pergunta && <p className="mt-1 text-sm text-muted-foreground">{c.pergunta}</p>}

              <div className="mt-4">
                <TabelaComparativa hipoteses={c.hipoteses} linhas={c.linhas} />
              </div>

              <div className="mt-4 rounded-lg border border-primary/25 bg-primary/[0.04] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">A leitura</p>
                <p className="mt-1 text-sm leading-relaxed">{c.leitura}</p>
              </div>

              {c.limites && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">O que essa tabela não resolve: </span>
                  {c.limites}
                </p>
              )}
            </article>
          ))}
        </div>

        <AvisoDeContexto className="mt-8" />
      </div>
    </AreaDosExames>
  )
}
