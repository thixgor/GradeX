import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import type { MidiaExibivel, ReferenciaNormal } from '@/lib/histopatologia/esquemas'
import { rotaDaDoenca, rotaNormal } from '@/lib/histopatologia/rotas'
import { GaleriaRemota } from './galeria-remota'
import { TabelaNormalPatologico } from './tabela-normal-patologico'

/**
 * Comparador normal × patológico.
 *
 * Duas colunas em telas largas, empilhadas no celular — nessa ordem: normal em
 * cima. Empilhar patológico primeiro inverteria o raciocínio que a página
 * inteira defende, e num celular a ordem do DOM *é* a ordem de leitura.
 *
 * A coluna normal não incorpora lâminas do acervo da Histologia aqui: ela
 * descreve o que procurar e leva à página real, com o microscópio virtual e as
 * camadas de marcação. Duplicar o visualizador criaria duas experiências
 * parecidas e divergentes para a mesma lâmina.
 */
export function Comparador({
  doenca,
  referencia,
  midias,
  linhasComparativas,
}: {
  doenca: { slug: string; nome: string }
  referencia: ReferenciaNormal
  midias: MidiaExibivel[]
  linhasComparativas: Array<{ aspecto: string; normal: string; patologico: string }>
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="lado-normal"
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="editorial-mark mb-1.5">Histologia normal</p>
          <h2 id="lado-normal" className="font-heading text-lg font-semibold tracking-tight">
            {referencia.titulo}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {referencia.oQueObservar}
          </p>
          {referencia.aproximado && referencia.notaDeAproximacao && (
            <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[11px] leading-relaxed">
              <span className="font-bold">Aproximação: </span>
              {referencia.notaDeAproximacao}
            </p>
          )}
          <Link
            href={rotaNormal(referencia.caminhoNormal)}
            className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-bold transition-colors hover:border-teal-600/50"
          >
            Abrir a lâmina normal no microscópio
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </section>

        <section
          aria-labelledby="lado-patologico"
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="editorial-mark mb-1.5">Histopatologia</p>
          <h2 id="lado-patologico" className="font-heading text-lg font-semibold tracking-tight">
            {doenca.nome}
          </h2>
          <div className="mt-3">
            <GaleriaRemota
              midias={midias.slice(0, 3)}
              titulo={`Referências de ${doenca.nome}`}
              porPagina={3}
              comFiltros={false}
            />
          </div>
          <Link
            href={rotaDaDoenca(doenca.slug)}
            className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-bold transition-colors hover:border-teal-600/50"
          >
            Abrir o capítulo completo
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </section>
      </div>

      {linhasComparativas.length > 0 && (
        <section aria-labelledby="quadro-comparativo">
          <h2
            id="quadro-comparativo"
            className="mb-2 font-heading text-lg font-semibold tracking-tight"
          >
            O que exatamente mudou
          </h2>
          <p className="mb-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            O quadro resume; ele não substitui a explicação do mecanismo. Cada linha responde a uma
            pergunta só: o que foi perdido, o que foi acrescentado e o que foi reorganizado.
          </p>
          <TabelaNormalPatologico linhas={linhasComparativas} />
        </section>
      )}
    </div>
  )
}
