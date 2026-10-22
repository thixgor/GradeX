'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Circle, Maximize, PawPrint, QrCode, SlidersHorizontal, Target } from 'lucide-react'

import { BuscaDoZoom } from '@/components/histologia-zoom/busca'
import { IconeDoSistema } from '@/components/histologia-zoom/icone-do-sistema'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { BASE } from '@/lib/histologia/rotas'
import { RODAPE_DO_ACERVO } from '@/lib/histologia-zoom/fonte'
import { rotaDosDadosDoZoom, type DadosDoCatalogoDoZoom } from '@/lib/histologia-zoom/paginas-tipos'
import { BASE_ZOOM, rotaDaLaminaZoom, rotaDoOrgao, rotaDoSistema } from '@/lib/histologia-zoom/rotas'

/**
 * Catálogo da Histologia com Zoom. O casco é estático; o catálogo e o índice da
 * busca vêm da rota de dados do zoom, depois do portão.
 */
export function CatalogoDoZoom({ comPatologia }: { comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDoCatalogoDoZoom> url={rotaDosDadosDoZoom([])}>
      {(dados) => <Conteudo dados={dados} comPatologia={comPatologia} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados, comPatologia }: { dados: DadosDoCatalogoDoZoom; comPatologia: boolean }) {
  const { totais } = dados

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Link
          href={`${BASE}/normal`}
          className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Histologia
        </Link>

        <header className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <div>
            <p className="editorial-mark mb-2">Histologia · Lâminas com zoom</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              A lâmina inteira, do panorama à célula
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {totais.laminas} lâminas digitalizadas em alta resolução, com zoom contínuo até a objetiva de
              imersão. Role para ampliar, arraste para percorrer, abra em tela cheia — e consulte, em cada
              uma, os tecidos, o epitélio e as células que você deveria estar vendo.
            </p>
            <p className="mt-3 flex max-w-xl gap-2 rounded-lg border border-amber-500/35 bg-amber-500/[0.07] px-3 py-2 text-xs leading-relaxed">
              <PawPrint className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
              <span>
                <span className="font-semibold">Transparência sobre a origem:</span> {totais.humanas} peças
                humanas, {totais.naoHumanas} não humanas ({dados.especiesNaoHumanas}) e {totais.naoInformadas} cuja espécie a fonte não registra. Toda lâmina não humana
                traz a comparação com a peça humana.
              </span>
            </p>
            <Link
              href={`${BASE_ZOOM}/quiz`}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-800"
            >
              <Target className="h-4 w-4" aria-hidden /> Quiz de identificação
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              <Numero valor={totais.laminas} rotulo="lâminas" />
              <Numero valor={totais.orgaos} rotulo="órgãos e preparações" />
              <Numero valor={totais.sistemas} rotulo="sistemas" />
            </dl>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4 lg:grid-cols-2">
            <Recurso icone={<Maximize className="h-4 w-4" aria-hidden />} texto="Tela cheia com características" />
            <Recurso icone={<SlidersHorizontal className="h-4 w-4" aria-hidden />} texto="Brilho, contraste, saturação e luz" />
            <Recurso icone={<Circle className="h-4 w-4" aria-hidden />} texto="Ocular circular e retícula" />
            <Recurso icone={<QrCode className="h-4 w-4" aria-hidden />} texto="QR code para projetar em aula" />
          </ul>
        </header>

        {dados.destaques.length > 0 && (
          <section aria-labelledby="destaques" className="mt-8">
            <h2 id="destaques" className="sr-only">
              Lâminas em destaque
            </h2>
            <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
              {dados.destaques.map((l) => (
                <li key={l.slug} className="w-40 shrink-0 snap-start sm:w-auto">
                  <Link
                    href={rotaDaLaminaZoom(l.sistema, l.slug)}
                    className="group block overflow-hidden rounded-xl border border-border bg-[#101614] transition-shadow hover:shadow-lg"
                  >
                    <span className="relative block aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={l.miniatura}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5 pt-8">
                        <span className="block truncate text-[13px] font-semibold text-white">{l.titulo}</span>
                        <span className="block truncate text-[11px] text-white/70">{l.coloracao}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          <BuscaDoZoom indice={dados.indice} sistemas={dados.sistemas.map((s) => ({ id: s.id, nome: s.nome }))}>
            <section aria-labelledby="por-sistema" className="mt-4">
              <h2 id="por-sistema" className="mb-4 font-heading text-xl font-semibold tracking-tight">
                Por sistema
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dados.sistemas.map((s) => (
                  <li key={s.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                    <Link href={rotaDoSistema(s.id)} className="group flex items-stretch gap-3 p-3 pb-2">
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#101614]">
                        {s.capa && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={s.capa} alt="" loading="lazy" className="h-full w-full object-cover" />
                        )}
                        <span
                          className="absolute bottom-1 left-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-white shadow"
                          style={{ backgroundColor: s.cor }}
                        >
                          <IconeDoSistema nome={s.icone} className="h-3.5 w-3.5" />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 font-heading text-[15px] font-semibold leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-300">
                          {s.nome}
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {s.orgaos.length} {s.orgaos.length === 1 ? 'órgão' : 'órgãos'} · {s.laminas}{' '}
                          {s.laminas === 1 ? 'lâmina' : 'lâminas'}
                        </span>
                      </span>
                    </Link>
                    <ul className="flex flex-wrap gap-1 px-3 pb-3">
                      {s.orgaos.map((o) => (
                        <li key={o.id}>
                          <Link
                            href={rotaDoOrgao(s.id, o.id)}
                            className="inline-flex min-h-[28px] items-center rounded-md bg-muted/70 px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-teal-500/10 hover:text-foreground"
                          >
                            {o.nome}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          </BuscaDoZoom>
        </div>

        <p className="mt-10 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          {RODAPE_DO_ACERVO} As fichas de características trazem estimativas didáticas e estão em revisão
          biomédica.
        </p>
      </div>
    </div>
  )
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div>
      <dt className="sr-only">{rotulo}</dt>
      <dd className="font-heading text-2xl font-semibold tabular-nums">
        {valor}
        <span className="ml-1.5 text-sm font-normal text-muted-foreground">{rotulo}</span>
      </dd>
    </div>
  )
}

function Recurso({ icone, texto }: { icone: React.ReactNode; texto: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-card/70 px-3 py-2.5">
      <span className="text-teal-700 dark:text-teal-300">{icone}</span>
      <span className="leading-snug">{texto}</span>
    </li>
  )
}
