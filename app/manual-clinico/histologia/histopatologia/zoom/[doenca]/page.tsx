import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Columns2 } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { FichaDaDoenca } from '@/components/histopatologia-zoom/ficha-da-doenca'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { orgaoPorId } from '@/lib/histologia-zoom/repositorio'
import { rotaDaLaminaZoom } from '@/lib/histologia-zoom/rotas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { doencaPorId } from '@/lib/histopatologia-zoom/doencas'
import { REFERENCIA_ABNT_LEEDS, RODAPE_LEEDS } from '@/lib/histopatologia-zoom/fonte'
import { laminaNormalPara, laminasDaDoenca, resumirPatologica } from '@/lib/histopatologia-zoom/repositorio'
import { BASE_PATOZOOM, rotaDaComparacao, rotaDaLaminaPatologica } from '@/lib/histopatologia-zoom/rotas'
import { textoDoCaso } from '@/lib/histopatologia-zoom/texto'

export const dynamic = 'force-dynamic'

type Parametros = { params: { doenca: string } }

export async function generateMetadata({ params }: Parametros) {
  const d = doencaPorId(params.doenca)
  if (!d) return {}
  return metadadosDoModulo({
    titulo: `${d.nome} — Histopatologia com Zoom`,
    descricao: d.resumo,
    caminho: `${BASE_PATOZOOM}/${d.id}`,
  })
}

export default async function PaginaDaDoenca({ params }: Parametros) {
  await exigirAcessoAHistologia()
  const doenca = doencaPorId(params.doenca)
  if (!doenca) notFound()
  const laminas = laminasDaDoenca(doenca.id)
  if (!laminas.length) notFound()
  const normal = laminaNormalPara(laminas[0], doenca)
  const orgao = orgaoPorId(doenca.orgao)

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <nav aria-label="Trilha" className="mb-2 text-sm text-muted-foreground">
            <Link href={BASE_PATOZOOM} className="rounded px-1 py-1 hover:text-foreground">
              Histopatologia com Zoom
            </Link>
          </nav>
          <header className="mb-6">
            <p className="editorial-mark mb-1 text-rose-700 dark:text-rose-300">{orgao?.nome ?? 'Doença'}</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{doenca.nome}</h1>
            {doenca.sinonimos.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">Também: {doenca.sinonimos.join(', ')}</p>
            )}
          </header>

          <section aria-labelledby="laminas" className="mb-10">
            <h2 id="laminas" className="mb-3 font-heading text-xl font-semibold tracking-tight">
              {laminas.length === 1 ? 'Lâmina' : `Lâminas (${laminas.length})`}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {laminas.map((l) => {
                const r = resumirPatologica(l)
                return (
                  <li key={l.slug} className="overflow-hidden rounded-xl border border-border bg-card">
                    <Link href={rotaDaLaminaPatologica(doenca.id, l.slug)} className="group block">
                      <span className="block aspect-[4/3] overflow-hidden bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.miniatura}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </span>
                      <span className="block p-3">
                        <span className="flex items-center gap-1 font-semibold group-hover:text-rose-700 dark:group-hover:text-rose-300">
                          {l.subtitulo ?? l.titulo}
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {textoDoCaso(l.caso.sexo, l.caso.idade)} · {r.achadosPresentes} achados presentes
                        </span>
                      </span>
                    </Link>
                    {normal && (
                      <Link
                        href={rotaDaComparacao(doenca.id, l.slug)}
                        className="flex min-h-[40px] items-center gap-2 border-t border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Columns2 className="h-3.5 w-3.5" aria-hidden /> Comparar com o normal
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
            {normal && (
              <p className="mt-3 text-sm text-muted-foreground">
                Histologia normal de referência:{' '}
                <Link href={rotaDaLaminaZoom(normal.sistema, normal.slug)} className="font-semibold underline underline-offset-2">
                  {normal.titulo}
                  {normal.subtitulo ? ` — ${normal.subtitulo}` : ''} ({normal.coloracao})
                </Link>
              </p>
            )}
          </section>

          <article aria-label={`Ficha de ${doenca.nome}`}>
            <FichaDaDoenca doenca={doenca} />
          </article>

          <footer className="mt-10 space-y-1.5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            <p>{RODAPE_LEEDS}</p>
            <p>{REFERENCIA_ABNT_LEEDS}</p>
          </footer>
        </div>
      </div>
    </AppShell>
  )
}
