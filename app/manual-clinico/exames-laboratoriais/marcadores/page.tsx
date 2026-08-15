import Link from 'next/link'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { BuscaInteligente } from '@/components/exames-laboratoriais/busca-inteligente'
import { MARCADORES, ROTULO_DO_GRUPO, gruposComConteudo, indiceCompleto, marcadoresDoGrupo } from '@/lib/exames-laboratoriais'

export const metadata: Metadata = {
  title: 'Marcadores laboratoriais — o acervo completo | DomineAqui Lab',
  description:
    'Todos os marcadores da central, organizados por grupo. Cada um com fisiologia, mecanismos de aumento e redução, causas, diagnósticos diferenciais e como tende a normalizar.',
}

/**
 * O acervo de marcadores, agrupado.
 *
 * A busca fica no topo porque quem chega a esta tela normalmente já sabe o que
 * procura. Os grupos abaixo servem a outro gesto — o de passear pelo acervo — e
 * têm âncora própria, para que os atalhos da home caiam no lugar certo.
 */
export default function PaginaDeMarcadores() {
  const grupos = gruposComConteudo()
  const indice = indiceCompleto()

  return (
    <AreaDosExames alvo="a biblioteca de marcadores">
      <CabecalhoDaSecao
        titulo="Marcadores laboratoriais"
        subtitulo={`${MARCADORES.length} fichas completas: o que o exame mede, por que sobe, por que cai, o que confunde e como diferenciar.`}
      />

      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-6">
        <BuscaInteligente indice={indice} />

        <nav className="mt-6 flex flex-wrap gap-1.5" aria-label="Ir para um grupo">
          {grupos.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs transition hover:border-primary/35"
            >
              {g.nome}
              <span className="font-mono text-[11px] font-bold text-primary">{g.total}</span>
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-10">
          {grupos.map((grupo) => (
            <section key={grupo.id} id={grupo.id} className="scroll-mt-24">
              <p className="lab-rubrica">{ROTULO_DO_GRUPO[grupo.id]}</p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
                {grupo.nome}
                <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">{grupo.total}</span>
              </h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {marcadoresDoGrupo(grupo.id).map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/manual-clinico/exames-laboratoriais/marcador/${m.id}`}
                      prefetch={false}
                      className="lab-cartao lab-cartao-link block h-full p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold leading-snug">{m.nome}</p>
                        {m.sigla && <span className="lab-etiqueta lab-etiqueta-neutro shrink-0">{m.sigla}</span>}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-3">{m.resumo}</p>
                      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                        {m.referencias[0]?.texto ?? `${m.referencias[0]?.minimo ?? '—'} – ${m.referencias[0]?.maximo ?? '—'}`}{' '}
                        {m.unidade}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </AreaDosExames>
  )
}
