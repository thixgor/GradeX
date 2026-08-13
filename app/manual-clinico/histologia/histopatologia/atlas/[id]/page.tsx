import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { GaleriaRemota } from '@/components/histopatologia/galeria-remota'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { AVISO_ACERVO_INDISPONIVEL, inventarioDaEntrada } from '@/lib/histopatologia/acervo'
import { FONTES } from '@/lib/histopatologia/direitos'
import {
  obterEntradaCatalogada,
  obterSistemaComContagem,
  resumoDaDoenca,
} from '@/lib/histopatologia/repositorio'
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

export const dynamic = 'force-dynamic'

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
      `Capítulo visual em ${FONTES[entrada.fonteId].nome}, com ` +
      `${entrada.midias} lâminas para estudo no Domine Aqui.`,
    caminho: rotaDaEntradaCatalogada(entrada.id),
    // Inventário nunca é indexável: são 2.917 páginas sem conteúdo editorial.
    estadoDeRevisao: 'rascunho',
  })
}

export default async function PaginaDaEntradaCatalogada({ params, searchParams }: Props) {
  await exigirAcessoAHistologia()

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
  const sistema = obterSistemaComContagem(entrada.sistemaId)
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
                  {sistema?.nome ?? entrada.sistemaCatalogado}
                </Link>
              </li>
            </ol>
          </nav>

          <header className="mb-5">
            <p className="editorial-mark mb-2">Capítulo visual · {entrada.capituloNome}</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {entrada.nomeCompleto}
            </h1>

            {entrada.descricao && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {entrada.descricao}
              </p>
            )}

            <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
                {entrada.midias.toLocaleString('pt-BR')}{' '}
                {entrada.midias === 1 ? 'lâmina catalogada' : 'lâminas catalogadas'}
              </li>
              <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
                {entrada.midiasElegiveis.toLocaleString('pt-BR')} disponíveis no Domine Aqui
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

          <section aria-labelledby="referencias-entrada">
            <h2 id="referencias-entrada" className="mb-2 font-heading text-lg font-semibold">
              Lâminas no Domine Aqui
            </h2>

            {!inventario.acervoDisponivel ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                {AVISO_ACERVO_INDISPONIVEL}
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  Mostrando {inventario.itens.length} de {inventario.total.toLocaleString('pt-BR')}{' '}
                  lâminas disponíveis para abrir e ampliar aqui.
                  {inventario.descartadasPorAllowlist > 0 && (
                    <>
                      {' '}
                      Itens técnicos sem imagem foram omitidos.
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

          <section
            aria-labelledby="fonte-entrada"
            className="mt-10 border-t border-border pt-5"
          >
            <h2 id="fonte-entrada" className="font-heading text-base font-semibold">
              Fonte e crédito
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {fonte.nome} · {fonte.atribuicaoCatalogada}
            </p>
            {entrada.nomeOriginal !== entrada.nomeCompleto && (
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-bold">Nome original do catálogo: </span>
                {entrada.nomeOriginal}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-bold">Classificação original: </span>
              {entrada.sistemaCatalogado}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {entrada.paginasFonte.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[36px] items-center gap-1.5 text-[11px] font-semibold text-muted-foreground underline transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    Consultar fonte original
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
