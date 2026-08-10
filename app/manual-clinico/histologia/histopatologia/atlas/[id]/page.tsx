import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { GaleriaRemota } from '@/components/histopatologia/galeria-remota'
import { AVISO_ACERVO_INDISPONIVEL, inventarioDaEntrada } from '@/lib/histopatologia/acervo'
import { FONTES } from '@/lib/histopatologia/direitos'
import { obterEntradaCatalogada, resumoDaDoenca } from '@/lib/histopatologia/repositorio'
import {
  BASE,
  rotaDaDoenca,
  rotaDaEntradaCatalogada,
  rotaDoAtlas,
  rotaDoSistema,
} from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

/**
 * Página de inventário de uma entrada catalogada.
 *
 * ## O que ela deliberadamente não é
 *
 * Não é uma página de doença. O título aqui é o **nome catalogado** — o texto
 * que estava na página do atlas de origem, que às vezes é um diagnóstico e às
 * vezes é um parágrafo inteiro capturado do corpo da página. Ele é exibido como
 * veio, e a interface diz o que ele é. Transformá-lo em capítulo científico
 * seria criar diagnóstico a partir de nome de arquivo, que é a proibição mais
 * repetida da documentação.
 *
 * ## Paginação no servidor
 *
 * Uma entrada chega a 5.369 referências. A primeira página traz 24, lidas do
 * fragmento comprimido correspondente — um arquivo, não os dezoito. As demais
 * são navegáveis por `?pagina=`.
 */

export const revalidate = 86400

interface Props {
  params: { id: string }
  searchParams: { pagina?: string; modalidade?: string; coloracao?: string }
}

const POR_PAGINA = 24

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entrada = await obterEntradaCatalogada(decodeURIComponent(params.id))
  if (!entrada) return { title: 'Entrada não encontrada — Histopatologia' }

  return metadadosDoModulo({
    titulo: entrada.nome,
    descricao:
      `Entrada catalogada em ${FONTES[entrada.fonteId].nome}, com ` +
      `${entrada.midias} referências de mídia. Inventário de proveniência; conteúdo médico não revisado.`,
    caminho: rotaDaEntradaCatalogada(entrada.id),
    // Inventário nunca é indexável: são 2.917 páginas sem conteúdo editorial.
    estadoDeRevisao: 'rascunho',
  })
}

export default async function PaginaDaEntradaCatalogada({ params, searchParams }: Props) {
  const entrada = await obterEntradaCatalogada(decodeURIComponent(params.id))
  if (!entrada) notFound()

  const pagina = Math.max(1, Number(searchParams.pagina) || 1)
  const inventario = await inventarioDaEntrada(entrada, {
    pagina,
    porPagina: POR_PAGINA,
    modalidade: searchParams.modalidade,
    coloracao: searchParams.coloracao,
  })

  const fonte = FONTES[entrada.fonteId]
  const doenca = entrada.doencaSlug ? resumoDaDoenca(entrada.doencaSlug) : undefined
  const totalDePaginas = Math.max(1, Math.ceil(inventario.total / POR_PAGINA))

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <nav aria-label="Trilha de navegação" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link href={BASE} className="transition-colors hover:text-foreground">
                  Histopatologia
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link href={rotaDoAtlas()} className="transition-colors hover:text-foreground">
                  Atlas
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link
                  href={rotaDoSistema(entrada.sistemaId)}
                  className="transition-colors hover:text-foreground"
                >
                  {entrada.sistemaCatalogado}
                </Link>
              </li>
            </ol>
          </nav>

          <header className="mb-5">
            <p className="editorial-mark mb-2">Entrada catalogada · {fonte.creditoCurto}</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {entrada.nomeCompleto}
            </h1>

            {!entrada.tituloConfiavel && (
              <p className="mt-2 inline-flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs leading-relaxed">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
                <span>
                  Este título é longo e foi extraído do corpo da página de origem — ele não é o nome
                  de uma entidade nosológica. Está preservado exatamente como veio, por
                  proveniência.
                </span>
              </p>
            )}

            <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
                {entrada.midias.toLocaleString('pt-BR')} referências catalogadas
              </li>
              <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
                {entrada.midiasElegiveis.toLocaleString('pt-BR')} elegíveis para exibição
              </li>
              {entrada.temLaminaVirtual && (
                <li className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 font-semibold text-violet-800 dark:text-violet-300">
                  Com lâmina virtual
                </li>
              )}
            </ul>
          </header>

          {doenca && (
            <aside className="mb-6 rounded-xl border border-teal-600/30 bg-teal-500/5 p-4">
              <p className="text-sm font-bold">Esta entrada foi consolidada num capítulo</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                A edição do Domine Aqui reuniu esta e outras entradas sob o nome canônico{' '}
                <strong>{doenca.nome}</strong>. O capítulo traz mecanismo, roteiro por aumento e
                diferenciais; esta página continua sendo o registro de proveniência.
              </p>
              <Link
                href={rotaDaDoenca(doenca.slug)}
                className="mt-2.5 inline-flex min-h-[40px] items-center rounded-md border border-border bg-card px-3.5 text-xs font-bold transition-colors hover:border-teal-600/60"
              >
                Abrir {doenca.nome}
              </Link>
            </aside>
          )}

          <section aria-labelledby="proveniencia-entrada" className="mb-6">
            <h2 id="proveniencia-entrada" className="mb-2 font-heading text-lg font-semibold">
              Proveniência
            </h2>
            <div className="rounded-xl border border-border bg-card p-3.5 text-xs leading-relaxed">
              <p>
                <span className="font-bold">Fonte: </span>
                {fonte.nome} — {fonte.atribuicaoCatalogada}
              </p>
              <p className="mt-1.5">
                <span className="font-bold">Classificação de origem: </span>
                {entrada.sistemaCatalogado}
              </p>
              <ul className="mt-2 space-y-1">
                {entrada.paginasFonte.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[36px] items-center gap-1.5 font-bold underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      Abrir página de origem
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="referencias-entrada">
            <h2 id="referencias-entrada" className="mb-2 font-heading text-lg font-semibold">
              Referências de mídia
            </h2>

            {!inventario.acervoDisponivel ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                {AVISO_ACERVO_INDISPONIVEL}
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  Mostrando {inventario.itens.length} de {inventario.total.toLocaleString('pt-BR')}{' '}
                  referências elegíveis.
                  {inventario.descartadasPorAllowlist > 0 && (
                    <>
                      {' '}
                      {inventario.descartadasPorAllowlist.toLocaleString('pt-BR')} referências desta
                      entrada apontam para domínios fora da allowlist da fonte (selos, contadores de
                      visita e conteúdo de terceiros capturados junto das lâminas) e não são
                      exibidas.
                    </>
                  )}
                </p>
                <GaleriaRemota
                  midias={inventario.itens}
                  titulo={`Referências de ${entrada.nome}`}
                  porPagina={POR_PAGINA}
                  comFiltros
                />
              </>
            )}

            {totalDePaginas > 1 && (
              <nav
                className="mt-4 flex flex-wrap items-center justify-between gap-2"
                aria-label="Paginação do inventário"
              >
                {pagina > 1 ? (
                  <Link
                    href={`${rotaDaEntradaCatalogada(entrada.id)}?pagina=${pagina - 1}`}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-bold transition-colors hover:border-teal-600/50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    Página anterior
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs font-semibold text-muted-foreground">
                  Página {pagina} de {totalDePaginas}
                </span>
                {pagina < totalDePaginas ? (
                  <Link
                    href={`${rotaDaEntradaCatalogada(entrada.id)}?pagina=${pagina + 1}`}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-bold transition-colors hover:border-teal-600/50"
                  >
                    Próxima página
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
