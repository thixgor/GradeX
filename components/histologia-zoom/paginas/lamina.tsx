'use client'

import Link from 'next/link'
import { preload } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { CartaoDeLamina } from '@/components/histologia-zoom/cartao'
import { FichaDaLamina } from '@/components/histologia-zoom/ficha'
import { LaminaInterativa } from '@/components/histologia-zoom/lamina-interativa'
import { OrigemDaPecaBloco, SeloDeOrigem } from '@/components/histologia-zoom/origem'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { BASE } from '@/lib/histologia/rotas'
import { FONTES_DO_ACERVO, RODAPE_DO_ACERVO } from '@/lib/histologia-zoom/fonte'
import { rotaDosDadosDoZoom, type DadosDaLaminaDoZoom } from '@/lib/histologia-zoom/paginas-tipos'
import { BASE_ZOOM, rotaDaLaminaZoom, rotaDoOrgao, rotaDoSistema } from '@/lib/histologia-zoom/rotas'

/**
 * Uma lâmina da Histologia com Zoom. O casco é estático; a lâmina, a ficha e as
 * marcações vêm da rota de dados do zoom, depois do portão.
 */
export function LaminaDoZoom({
  sistema,
  lamina,
  comPatologia,
}: {
  sistema: string
  lamina: string
  comPatologia: boolean
}) {
  return (
    <PortaoDaHistologia<DadosDaLaminaDoZoom> url={rotaDosDadosDoZoom([sistema, lamina])}>
      {(dados) => <Conteudo dados={dados} comPatologia={comPatologia} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados, comPatologia }: { dados: DadosDaLaminaDoZoom; comPatologia: boolean }) {
  const { lamina, orgao, sistema, irmas, outrosOrgaos, anterior, proxima } = dados
  useTituloDaAba(`${lamina.titulo}${lamina.subtitulo ? ` — ${lamina.subtitulo}` : ''} (${lamina.coloracao})`)

  // A miniatura é o nível-base da pirâmide: pedi-la assim que os dados chegam
  // faz a lâmina aparecer inteira antes de o visualizador terminar de montar.
  preload(lamina.piramide.miniatura.url, { as: 'image', crossOrigin: 'anonymous' })

  // A origem vem antes das características: quem abre uma lâmina de gato
  // precisa saber disso antes de decorar o que está vendo.
  const ficha = (compacto: boolean, idBase: string) => (
    <div className="space-y-6">
      <OrigemDaPecaBloco origem={lamina.origem} idBase={`${idBase}-origem`} />
      <FichaDaLamina
        orgao={orgao}
        descricoes={dados.descricoes}
        sistemaNome={sistema.nome}
        coloracao={dados.coloracao ?? undefined}
        notaDaLamina={lamina.nota}
        compacto={compacto}
        idBase={idBase}
      />
    </div>
  )

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} visto={dados.visto} />
      <div className="container mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        <nav aria-label="Trilha" className="mb-2 overflow-x-auto">
          <ol className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
            <li>
              <Link href={`${BASE}/normal`} className="rounded px-1 py-1 hover:text-foreground">
                Histologia
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href={BASE_ZOOM} className="rounded px-1 py-1 hover:text-foreground">
                Lâminas com zoom
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href={rotaDoSistema(sistema.id)} className="rounded px-1 py-1 hover:text-foreground">
                {sistema.nome}
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href={rotaDoOrgao(sistema.id, orgao.id)} className="rounded px-1 py-1 font-medium text-foreground">
                {orgao.nome}
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
              <SeloDeOrigem categoria={lamina.origem.categoria} especie={lamina.especie} />
              <span>{lamina.coloracao}</span>
              <span>Scan até {lamina.ampliacaoMaxima}×</span>
            </p>
          </div>
          <div className="flex gap-1.5">
            {anterior && (
              <Link
                href={anterior.href}
                title={anterior.rotulo}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-teal-500/40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
              </Link>
            )}
            {proxima && (
              <Link
                href={proxima.href}
                title={proxima.rotulo}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-teal-500/40"
              >
                Próxima <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        </header>

        <LaminaInterativa
          estruturas={dados.estruturas}
          lamina={{
            slug: lamina.slug,
            titulo: lamina.titulo,
            subtitulo: lamina.subtitulo,
            coloracao: lamina.coloracao,
            especie: lamina.especie,
            categoriaDeOrigem: lamina.origem.categoria,
            fonte: lamina.fonte,
            credito: lamina.credito,
            objetiva: lamina.objetiva,
            ampliacaoMaxima: lamina.ampliacaoMaxima,
            piramide: lamina.piramide,
          }}
          caracteristicas={ficha(true, 'ficha-painel')}
          urlDaLamina={dados.urlDaLamina}
          anterior={anterior}
          proxima={proxima}
        />

        {irmas.length > 1 && (
          <section aria-labelledby="irmas" className="mt-5">
            <h2 id="irmas" className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Outras preparações de {orgao.nome.toLowerCase()} ({irmas.length})
            </h2>
            <ul className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0">
              {irmas.map((l) => (
                <li key={l.slug} className="w-36 shrink-0 sm:w-40">
                  <CartaoDeLamina lamina={l} href={rotaDaLaminaZoom(l.sistema, l.slug)} atual={l.slug === lamina.slug} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article aria-labelledby="titulo-ficha">
            <h2 id="titulo-ficha" className="mb-4 font-heading text-xl font-semibold tracking-tight">
              Características de {orgao.nome.toLowerCase()}
            </h2>
            {ficha(false, 'ficha')}
          </article>

          <aside className="space-y-6">
            <section aria-labelledby="dados" className="rounded-xl border border-border bg-card p-4">
              <h2 id="dados" className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dados da lâmina
              </h2>
              <dl className="space-y-2 text-sm">
                <Linha rotulo="Coloração" valor={lamina.coloracao} />
                <Linha
                  rotulo="Espécie"
                  valor={
                    lamina.origem.categoria === 'nao-informada'
                      ? 'Não informada pela fonte original'
                      : `${lamina.especie}${lamina.origem.cientifico ? ` (${lamina.origem.cientifico})` : ''}`
                  }
                />
                <Linha rotulo="Objetiva do scan" valor={lamina.objetiva} />
                <Linha
                  rotulo="Resolução máxima"
                  valor={`${lamina.largura.toLocaleString('pt-BR')} × ${lamina.altura.toLocaleString('pt-BR')} px`}
                />
              </dl>
            </section>

            {outrosOrgaos.length > 0 && (
              <section aria-labelledby="mesmo-sistema">
                <h2 id="mesmo-sistema" className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mais em {sistema.nome.toLowerCase()}
                </h2>
                <ul className="flex flex-wrap gap-1.5">
                  {outrosOrgaos.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={o.href}
                        className="inline-flex min-h-[34px] items-center rounded-full border border-border bg-card px-3 text-xs font-semibold hover:border-teal-500/40"
                      >
                        {o.nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {RODAPE_DO_ACERVO}{' '}
              {lamina.fonte === 'gtex' && `${FONTES_DO_ACERVO.gtex.creditoLongo} `}
              {lamina.credito && (
                <>
                  Fotomicrografia de campo único (não é a lâmina inteira):{' '}
                  <a href={lamina.credito.urlFonte} target="_blank" rel="noopener noreferrer" className="underline">
                    {lamina.credito.autor}
                  </a>
                  ,{' '}
                  {lamina.credito.urlLicenca ? (
                    <a href={lamina.credito.urlLicenca} target="_blank" rel="noopener noreferrer license" className="underline">
                      {lamina.credito.licenca}
                    </a>
                  ) : (
                    lamina.credito.licenca
                  )}
                  , via {lamina.credito.acervo}; exibida sem modificação.{' '}
                </>
              )}
              As porcentagens são estimativas didáticas; o conteúdo está em revisão biomédica.
            </p>
          </aside>
        </div>
      </div>
    </div>
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
