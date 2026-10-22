'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { CartaoDeDoenca } from '@/components/histopatologia/cartao-doenca'
import { MapaDeMecanismos } from '@/components/histopatologia/mapa-mecanismos'
import { CLASSE_DE_FAMILIA } from '@/components/histopatologia/tema'
import {
  rotaDosDadosDaHistopatologia,
  type DadosDoMecanismo,
  type DadosDosMecanismos,
} from '@/lib/histopatologia/paginas-tipos'
import { BASE, rotaDoMecanismo, rotaDosMecanismos } from '@/lib/histopatologia/rotas'

/**
 * Os mecanismos patológicos gerais: o mapa e cada mecanismo. Os cascos são
 * estáticos; o conteúdo vem da rota de dados da Histopatologia, depois do
 * portão.
 */
export function MecanismosGerais() {
  return (
    <PortaoDaHistologia<DadosDosMecanismos> url={rotaDosDadosDaHistopatologia(['mecanismos'])}>
      {(dados) => (
        <div className="surface-page min-h-screen">
          <NavegacaoDoModulo histopatologiaHabilitada />
          <div className="container mx-auto max-w-4xl px-4 py-6">
            <Link
              href={BASE}
              className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Histopatologia
            </Link>

            <header className="mb-6">
              <p className="editorial-mark mb-2">Mecanismos gerais</p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                O vocabulário que atravessa os órgãos
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {dados.total} mecanismos, agrupados em oito famílias. Nenhum deles menciona órgão ou doença: é isso que
                os torna reutilizáveis. A aplicação concreta — qual célula, qual sequência temporal, qual consequência
                funcional — vive na página de cada doença.
              </p>
            </header>

            <MapaDeMecanismos mecanismos={dados.mecanismos} contagemPorMecanismo={dados.contagemPorMecanismo} />
          </div>
        </div>
      )}
    </PortaoDaHistologia>
  )
}

export function Mecanismo({ id }: { id: string }) {
  return (
    <PortaoDaHistologia<DadosDoMecanismo> url={rotaDosDadosDaHistopatologia(['mecanismos', id])}>
      {(dados) => <ConteudoDoMecanismo dados={dados} />}
    </PortaoDaHistologia>
  )
}

function ConteudoDoMecanismo({ dados }: { dados: DadosDoMecanismo }) {
  const { mecanismo, familia, doencas, irmaos } = dados
  useTituloDaAba(mecanismo.nome, ' — Histopatologia | Manual da Histologia')

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada />
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Link
          href={rotaDosMecanismos()}
          className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Mecanismos
        </Link>

        <header className="mb-6">
          {familia && (
            <span
              className={`mb-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${CLASSE_DE_FAMILIA[mecanismo.familia]}`}
            >
              {familia.nome}
            </span>
          )}
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{mecanismo.nome}</h1>
          {mecanismo.sinonimos.length > 0 && (
            <p className="mt-1.5 text-sm text-muted-foreground">Também chamado de {mecanismo.sinonimos.join('; ')}</p>
          )}
        </header>

        <section aria-labelledby="conceito" className="mb-8">
          <h2 id="conceito" className="mb-2 font-heading text-lg font-semibold">
            O conceito
          </h2>
          <p className="text-sm leading-relaxed">{mecanismo.conceito}</p>
        </section>

        <section aria-labelledby="assinatura" className="mb-8">
          <h2 id="assinatura" className="mb-2 font-heading text-lg font-semibold">
            O que ele deixa escrito no tecido
          </h2>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            A assinatura morfológica é a ponte entre o processo e a lâmina — é o que procurar quando se suspeita deste
            mecanismo, em qualquer órgão.
          </p>
          <ul className="space-y-1.5">
            {mecanismo.assinaturaMorfologica.map((assinatura) => (
              <li key={assinatura} className="rounded-lg border border-border bg-card p-3 text-sm leading-relaxed">
                {assinatura}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="doencas-mecanismo" className="mb-8">
          <h2 id="doencas-mecanismo" className="mb-3 font-heading text-lg font-semibold">
            Onde este mecanismo aparece
          </h2>
          {doencas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
              Nenhum capítulo escrito usa este mecanismo ainda. Ele permanece publicado porque é vocabulário — e porque a
              próxima doença curada provavelmente vai apontar para ele.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {doencas.map((doenca) => (
                <li key={doenca.slug}>
                  <CartaoDeDoenca doenca={doenca} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {irmaos.length > 0 && (
          <section aria-labelledby="irmaos">
            <h2 id="irmaos" className="mb-2 font-heading text-lg font-semibold">
              Outros mecanismos da mesma família
            </h2>
            <ul className="flex flex-wrap gap-2">
              {irmaos.map((m) => (
                <li key={m.id}>
                  <Link
                    href={rotaDoMecanismo(m.id)}
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-border bg-card px-3.5 text-sm font-semibold transition-colors hover:border-violet-600/50"
                  >
                    {m.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
