import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { CartaoDeDoenca } from '@/components/histopatologia/cartao-doenca'
import { CLASSE_DE_FAMILIA } from '@/components/histopatologia/tema'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { FAMILIAS_DE_MECANISMO } from '@/lib/histopatologia/editorial/mecanismos'
import {
  MECANISMOS_PUBLICADOS,
  doencasDoMecanismo,
  obterMecanismoPublicado,
} from '@/lib/histopatologia/repositorio'
import { rotaDoMecanismo, rotaDosMecanismos } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mecanismo = obterMecanismoPublicado(params.id)
  if (!mecanismo) return { title: 'Mecanismo não encontrado — Histopatologia' }
  return metadadosDoModulo({
    titulo: mecanismo.nome,
    descricao: mecanismo.conceito,
    caminho: rotaDoMecanismo(mecanismo.id),
    estadoDeRevisao: 'revisao-medica',
  })
}

/** Catorze mecanismos estáveis: pré-renderizar é barato e todos são visitados. */
export function generateStaticParams() {
  return MECANISMOS_PUBLICADOS.map((m) => ({ id: m.id }))
}

export default async function PaginaDoMecanismo({ params }: Props) {
  await exigirAcessoAHistologia()

  const mecanismo = obterMecanismoPublicado(params.id)
  if (!mecanismo) notFound()

  const familia = FAMILIAS_DE_MECANISMO.find((f) => f.id === mecanismo.familia)
  const doencas = doencasDoMecanismo(mecanismo.id)
  const irmaos = MECANISMOS_PUBLICADOS.filter(
    (m) => m.familia === mecanismo.familia && m.id !== mecanismo.id,
  )

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
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
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {mecanismo.nome}
            </h1>
            {mecanismo.sinonimos.length > 0 && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Também chamado de {mecanismo.sinonimos.join('; ')}
              </p>
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
              A assinatura morfológica é a ponte entre o processo e a lâmina — é o que procurar
              quando se suspeita deste mecanismo, em qualquer órgão.
            </p>
            <ul className="space-y-1.5">
              {mecanismo.assinaturaMorfologica.map((assinatura) => (
                <li
                  key={assinatura}
                  className="rounded-lg border border-border bg-card p-3 text-sm leading-relaxed"
                >
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
                Nenhum capítulo escrito usa este mecanismo ainda. Ele permanece publicado porque é
                vocabulário — e porque a próxima doença curada provavelmente vai apontar para ele.
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
    </AppShell>
  )
}
