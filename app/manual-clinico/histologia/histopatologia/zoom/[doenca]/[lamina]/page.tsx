import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight, Columns2 } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { FichaDaDoenca } from '@/components/histopatologia-zoom/ficha-da-doenca'
import { LaminaPatologicaInterativa, type LinhaDeAchado } from '@/components/histopatologia-zoom/lamina-patologica'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { rotaDaLaminaZoom } from '@/lib/histologia-zoom/rotas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { achadoPorId } from '@/lib/histopatologia-zoom/achados'
import { doencaPorId } from '@/lib/histopatologia-zoom/doencas'
import { REFERENCIA_ABNT_LEEDS, RODAPE_LEEDS } from '@/lib/histopatologia-zoom/fonte'
import {
  LAMINAS_PATOLOGICAS,
  achadosDaLamina,
  anotacaoPatologica,
  laminaNormalPara,
  laminaPatologicaPorSlug,
  marcacoesDaLamina,
} from '@/lib/histopatologia-zoom/repositorio'
import { BASE_PATOZOOM, rotaDaComparacao, rotaDaDoencaZoom, rotaDaLaminaPatologica } from '@/lib/histopatologia-zoom/rotas'
import { textoDoCaso } from '@/lib/histopatologia-zoom/texto'
import { absoluteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type Parametros = { params: { doenca: string; lamina: string } }

export async function generateMetadata({ params }: Parametros) {
  const l = laminaPatologicaPorSlug(params.lamina)
  if (!l) return {}
  const d = doencaPorId(l.doenca)
  return metadadosDoModulo({
    titulo: `${l.titulo}${l.subtitulo ? ` — ${l.subtitulo}` : ''} (lâmina com zoom)`,
    descricao: anotacaoPatologica(l.slug)?.resumo || d?.resumo || `Lâmina de ${l.titulo} com zoom profundo.`,
    caminho: rotaDaLaminaPatologica(l.doenca, l.slug),
    imagem: l.piramide.miniatura.url,
  })
}

export default async function PaginaDaLaminaPatologica({ params }: Parametros) {
  await exigirAcessoAHistologia()
  const lamina = laminaPatologicaPorSlug(params.lamina)
  if (!lamina) notFound()
  if (lamina.doenca !== params.doenca) redirect(rotaDaLaminaPatologica(lamina.doenca, lamina.slug))
  const doenca = doencaPorId(lamina.doenca)!
  const anotacao = anotacaoPatologica(lamina.slug)
  const marcacoes = marcacoesDaLamina(lamina.slug)
  const rotuloDe = new Map(marcacoes.map((m) => [m.id, m.rotulo ?? m.verbete.nome]))
  const fichaPorId = new Map(doenca.achados.map((a) => [a.achado, a]))

  const linhas: LinhaDeAchado[] = achadosDaLamina(lamina.slug, doenca).flatMap((a) => {
    const achado = achadoPorId(a.achado)
    if (!achado) return []
    const f = fichaPorId.get(a.achado)
    return [
      {
        achado,
        tipo: f?.tipo ?? 'extra',
        peso: f?.peso ?? null,
        comoAparece: f?.comoAparece ?? null,
        status: a.status,
        nota: a.nota ?? null,
        marcacoes: (a.marcacoes ?? []).map((id) => ({ id, rotulo: rotuloDe.get(id) ?? id })),
      },
    ]
  })

  const normal = laminaNormalPara(lamina, doenca)
  const posicao = LAMINAS_PATOLOGICAS.findIndex((l) => l.slug === lamina.slug)
  const anterior = LAMINAS_PATOLOGICAS[posicao - 1]
  const proxima = LAMINAS_PATOLOGICAS[posicao + 1]
  const rotulo = (l: (typeof LAMINAS_PATOLOGICAS)[number]) => `${l.titulo}${l.subtitulo ? ` — ${l.subtitulo}` : ''}`

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
        <div className="container mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
          <nav aria-label="Trilha" className="mb-2 overflow-x-auto">
            <ol className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link href={BASE_PATOZOOM} className="rounded px-1 py-1 hover:text-foreground">
                  Histopatologia com Zoom
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link href={rotaDaDoencaZoom(doenca.id)} className="rounded px-1 py-1 font-medium text-foreground">
                  {doenca.nome}
                </Link>
              </li>
            </ol>
          </nav>

          <header className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {lamina.titulo}
                {lamina.subtitulo && <span className="font-normal text-muted-foreground"> — {lamina.subtitulo}</span>}
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{textoDoCaso(lamina.caso.sexo, lamina.caso.idade)}</span>
                <span>{lamina.coloracao}</span>
                <span>Scan em {lamina.objetiva}×</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {normal && (
                <Link
                  href={rotaDaComparacao(doenca.id, lamina.slug)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-rose-700 px-3 text-xs font-bold text-white hover:bg-rose-800"
                >
                  <Columns2 className="h-4 w-4" aria-hidden /> Comparar com o normal
                </Link>
              )}
              {anterior && (
                <Link
                  href={rotaDaLaminaPatologica(anterior.doenca, anterior.slug)}
                  title={rotulo(anterior)}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-rose-500/40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
                </Link>
              )}
              {proxima && (
                <Link
                  href={rotaDaLaminaPatologica(proxima.doenca, proxima.slug)}
                  title={rotulo(proxima)}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-rose-500/40"
                >
                  Próxima <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          </header>

          {anotacao?.resumo && <p className="mb-3 max-w-4xl text-[15px] leading-relaxed">{anotacao.resumo}</p>}

          <link rel="preload" as="image" href={lamina.piramide.miniatura.url} crossOrigin="anonymous" />
          <LaminaPatologicaInterativa
            nomeDaDoenca={doenca.nome}
            estruturas={marcacoes}
            achados={linhas}
            lamina={{
              slug: `patologia-${lamina.slug}`,
              titulo: lamina.titulo,
              subtitulo: lamina.subtitulo,
              coloracao: lamina.coloracao,
              especie: 'Humana',
              categoriaDeOrigem: 'humana',
              fonte: 'leeds',
              credito: null,
              objetiva: `${lamina.objetiva}×`,
              ampliacaoMaxima: lamina.objetiva,
              piramide: lamina.piramide,
            }}
            caracteristicas={<FichaDaDoenca doenca={doenca} compacto />}
            urlDaLamina={absoluteUrl(rotaDaLaminaPatologica(doenca.id, lamina.slug))}
            anterior={anterior ? { href: rotaDaLaminaPatologica(anterior.doenca, anterior.slug), rotulo: rotulo(anterior) } : null}
            proxima={proxima ? { href: rotaDaLaminaPatologica(proxima.doenca, proxima.slug), rotulo: rotulo(proxima) } : null}
          />

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article aria-labelledby="titulo-ficha">
              <h2 id="titulo-ficha" className="mb-4 font-heading text-xl font-semibold tracking-tight">
                {doenca.nome}
              </h2>
              <FichaDaDoenca doenca={doenca} />
            </article>

            <aside className="space-y-6">
              <section aria-labelledby="caso" className="rounded-xl border border-border bg-card p-4">
                <h2 id="caso" className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  O caso
                </h2>
                <dl className="space-y-2 text-sm">
                  <Linha rotulo="Paciente" valor={textoDoCaso(lamina.caso.sexo, lamina.caso.idade)} />
                  {lamina.caso.historia && <Linha rotulo="História clínica" valor={lamina.caso.historia} />}
                  <Linha rotulo="Diagnóstico de origem" valor={lamina.caso.diagnosticoOriginal} />
                  <Linha rotulo="Coloração" valor={lamina.coloracao} />
                  <Linha rotulo="Objetiva do scan" valor={`${lamina.objetiva}×${lamina.mpp ? ` (${lamina.mpp} µm/pixel)` : ''}`} />
                  <Linha
                    rotulo="Resolução máxima"
                    valor={`${lamina.largura.toLocaleString('pt-BR')} × ${lamina.altura.toLocaleString('pt-BR')} px`}
                  />
                </dl>
              </section>

              {normal && (
                <section aria-labelledby="normal" className="rounded-xl border border-teal-500/30 bg-teal-500/[0.04] p-4">
                  <h2 id="normal" className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Histologia normal
                  </h2>
                  <p className="text-sm leading-relaxed">
                    Estude primeiro o órgão sadio:{' '}
                    <Link href={rotaDaLaminaZoom(normal.sistema, normal.slug)} className="font-semibold underline underline-offset-2">
                      {normal.titulo} ({normal.coloracao})
                    </Link>
                    .
                  </p>
                  <Link
                    href={rotaDaComparacao(doenca.id, lamina.slug)}
                    className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-teal-600/40 px-3 text-xs font-bold text-teal-800 hover:bg-teal-500/10 dark:text-teal-200"
                  >
                    <Columns2 className="h-4 w-4" aria-hidden /> Lado a lado, mesma ampliação
                  </Link>
                </section>
              )}

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {RODAPE_LEEDS} {REFERENCIA_ABNT_LEEDS}
                {anotacao && ` Marcações conferidas em ${anotacao.revisao.conferencias} passagens pela lâmina, em vários aumentos.`}{' '}
                O texto está em revisão por patologista.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium leading-snug">{valor}</dd>
    </div>
  )
}
