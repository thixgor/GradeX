import Link from 'next/link'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { AvisoDeContexto, Fluxo } from '@/components/exames-laboratoriais/folha'
import { PADRAO_POR_ID, SISTEMAS, marcadoresPorIds } from '@/lib/exames-laboratoriais'

export const metadata: Metadata = {
  title: 'Exames por sistema do organismo | DomineAqui Lab',
  description:
    'Cada sistema organizado por eixo funcional, com mapas fisiológicos que desenham a cadeia órgão → processo → marcador: hepatobiliar, renal, cardiovascular, endócrino, respiratório e os demais.',
}

/**
 * Exames por sistema.
 *
 * A grade de sistemas responde a uma pergunta que a lista alfabética nunca
 * responde: *o que este órgão entrega ao laboratório, e por quê?* Por isso cada
 * sistema é organizado por eixo funcional — no fígado, lesão × colestase ×
 * síntese; no rim, filtração × túbulo × repercussão — e traz mapas que desenham
 * a cadeia causal inteira.
 */
export default function PaginaDeSistemas() {
  return (
    <AreaDosExames alvo="a navegação por sistemas">
      <CabecalhoDaSecao
        titulo="Exames por sistema"
        subtitulo="Cada sistema organizado por eixo funcional, com o mapa que liga órgão, processo fisiológico e marcador."
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        <nav className="flex flex-wrap gap-1.5" aria-label="Ir para um sistema">
          {SISTEMAS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs transition hover:border-primary/35"
            >
              {s.nome}
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-12">
          {SISTEMAS.map((sistema) => (
            <section key={sistema.id} id={sistema.id} className="scroll-mt-24">
              <p className="lab-rubrica">Sistema</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">{sistema.nome}</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{sistema.chamada}</p>

              {/* Eixos funcionais */}
              <div className="mt-5 space-y-4">
                {sistema.eixos.map((eixo) => {
                  const marcadores = marcadoresPorIds(eixo.marcadores)
                  if (marcadores.length === 0) return null
                  return (
                    <div key={eixo.titulo} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-sm font-bold">{eixo.titulo}</p>
                      {eixo.descricao && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{eixo.descricao}</p>}
                      <ul className="mt-2.5 flex flex-wrap gap-1.5">
                        {marcadores.map((m) => (
                          <li key={m.id}>
                            <Link
                              href={`/manual-clinico/exames-laboratoriais/marcador/${m.id}`}
                              prefetch={false}
                              className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium transition hover:border-primary/40"
                            >
                              {m.sigla ?? m.nome}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>

              {/* Mapas fisiológicos */}
              {sistema.mapas && sistema.mapas.length > 0 && (
                <div className="mt-6 space-y-4">
                  <p className="lab-rubrica">Mapa fisiológico</p>
                  {sistema.mapas.map((mapa) => (
                    <article key={mapa.titulo} className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                      <h3 className="font-heading text-base font-semibold tracking-tight">{mapa.titulo}</h3>
                      <div className="mt-3">
                        <Fluxo etapas={mapa.etapas} />
                      </div>
                      {mapa.leitura && (
                        <p className="mt-3 border-t border-dashed border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">O que o mapa ensina: </span>
                          {mapa.leitura}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {/* Padrões do sistema */}
              {sistema.padroes && sistema.padroes.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Padrões deste sistema</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {sistema.padroes.map((id) => {
                      const p = PADRAO_POR_ID.get(id)
                      if (!p) return null
                      return (
                        <li key={id}>
                          <Link
                            href={`/manual-clinico/exames-laboratoriais/padroes#${id}`}
                            prefetch={false}
                            className="inline-flex rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition hover:border-primary/45"
                          >
                            {p.nome}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <div className="lab-regua mt-8" />
            </section>
          ))}
        </div>

        <AvisoDeContexto />
      </div>
    </AreaDosExames>
  )
}
