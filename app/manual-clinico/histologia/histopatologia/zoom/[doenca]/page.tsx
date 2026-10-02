import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, BookOpen, Columns2 } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { FichaDaDoenca } from '@/components/histopatologia-zoom/ficha-da-doenca'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { capituloDaDoencaZoom } from '@/lib/histologia/catalogo'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { orgaoPorId } from '@/lib/histologia-zoom/repositorio'
import { rotaDaLaminaZoom } from '@/lib/histologia-zoom/rotas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { BASE as BASE_PATOLOGIA, rotaDaDoenca } from '@/lib/histopatologia/rotas'
import { doencaPorId } from '@/lib/histopatologia-zoom/doencas'
import { REFERENCIA_ABNT_LEEDS, RODAPE_LEEDS } from '@/lib/histopatologia-zoom/fonte'
import { laminaNormalPara, laminasDaDoenca, resumirPatologica } from '@/lib/histopatologia-zoom/repositorio'
import { BASE_PATOZOOM, rotaDaComparacao, rotaDaLaminaPatologica } from '@/lib/histopatologia-zoom/rotas'
import { textoDoCaso } from '@/lib/histopatologia-zoom/texto'
import { ConexoesDoManual } from '@/components/manual-clinico/integracao/conexoes-do-manual'

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
  const capitulo = capituloDaDoencaZoom(doenca)

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo
          histopatologiaHabilitada={histopatologiaHabilitada()}
          visto={{
            href: capitulo ? rotaDaDoenca(capitulo) : `${BASE_PATOZOOM}/${doenca.id}`,
            titulo: doenca.nome,
            categoria: `Histopatologia · ${orgao?.nome ?? 'Doença'}`,
            area: 'histopatologia',
            imagem: resumirPatologica(laminas[0]).miniatura,
            zoom: true,
          }}
        />
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <nav aria-label="Trilha" className="mb-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link href={BASE_PATOLOGIA} className="rounded px-1 py-1 hover:text-foreground">
              Histopatologia
            </Link>
            <span aria-hidden>›</span>
            <Link href={BASE_PATOZOOM} className="rounded px-1 py-1 hover:text-foreground">
              Lâminas com zoom
            </Link>
          </nav>
          <header className="mb-6">
            <p className="editorial-mark mb-1 text-rose-700 dark:text-rose-300">{orgao?.nome ?? 'Doença'}</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{doenca.nome}</h1>
            {doenca.sinonimos.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">Também: {doenca.sinonimos.join(', ')}</p>
            )}
            {/* A mesma doença tem capítulo escrito: um link, não uma página concorrente. */}
            {capitulo && (
              <Link
                href={rotaDaDoenca(capitulo)}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#E8763A]/50 bg-[#E8763A]/10 px-4 text-sm font-bold transition-colors hover:bg-[#E8763A]/20"
              >
                <BookOpen className="h-4 w-4 text-[#E8763A]" aria-hidden />
                Ler o capítulo aprofundado
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
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

          <ConexoesDoManual refOrigem={`patozoom:${doenca.id}`} titulo={doenca.nome} className="px-0 pb-0" />

          <footer className="mt-10 space-y-1.5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            <p>{RODAPE_LEEDS}</p>
            <p>{REFERENCIA_ABNT_LEEDS}</p>
          </footer>
        </div>
      </div>
    </AppShell>
  )
}
