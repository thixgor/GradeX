'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, ExternalLink, Microscope } from 'lucide-react'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { BuscaDaHistopatologia } from '@/components/histopatologia/busca'
import { GaleriaRemota } from '@/components/histopatologia/galeria-remota'
import {
  rotaDosDadosDaHistopatologia,
  type DadosDaEntradaDoAtlas,
  type DadosDoAtlasDaPatologia,
} from '@/lib/histopatologia/paginas-tipos'
import {
  BASE,
  rotaDaDoenca,
  rotaDaEntradaCatalogada,
  rotaDoAtlas,
  rotaDoCapituloWebPathUtah,
  rotaDoSistema,
} from '@/lib/histopatologia/rotas'

/**
 * Atlas de inventário.
 *
 * O que esta página é: um índice único das entradas catalogadas em todas as
 * coleções, com busca e navegação por sistema e capítulo. O que ela **não** é:
 * uma galeria carregada de uma vez. Renderizar 202 mil cartões de mídia não é
 * acesso ao acervo, é a aparência dele — e as mídias de cada entrada são
 * carregadas sob demanda, na página da entrada.
 *
 * A distinção entre entrada catalogada e doença canônica aparece na interface,
 * não só nos dados: uma entrada é um título de página do atlas de origem, e
 * pode ser uma doença, uma variante, uma técnica ou um caso. Apresentá-las
 * todas como diagnósticos seria inventar 2.917 entidades nosológicas.
 *
 * Os cascos são estáticos; o conteúdo vem da rota de dados da Histopatologia,
 * depois do portão.
 */
export function AtlasDaPatologia() {
  return (
    <PortaoDaHistologia<DadosDoAtlasDaPatologia> url={rotaDosDadosDaHistopatologia(['atlas'])}>
      {(dados) => <ConteudoDoAtlas dados={dados} />}
    </PortaoDaHistologia>
  )
}

function ConteudoDoAtlas({ dados }: { dados: DadosDoAtlasDaPatologia }) {
  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada />
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Link
          href={BASE}
          className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Histopatologia
        </Link>

        <header className="mb-5">
          <p className="editorial-mark mb-2">Atlas</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {dados.totalDeItens.toLocaleString('pt-BR')} itens de atlas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Explore doenças, lesões, controles, colorações, marcadores, peças e casos dos atlas da FCM/Unicamp,
            Histopathology Atlas e WebPath/Utah em um único índice. Os títulos foram normalizados para leitura, e cada
            item preserva identificação e crédito da coleção responsável.
          </p>
        </header>

        <BuscaDaHistopatologia
          variante="pagina"
          filtrosVisiveis
          autoFoco
          placeholder="adenocarcinoma, granuloma, necrose coagulativa, HE…"
        />

        <section aria-labelledby="capitulos-webpath" className="mt-10">
          <h2 id="capitulos-webpath" className="mb-2 font-heading text-lg font-semibold">
            Mais capítulos no Atlas de lâminas
          </h2>
          <p className="mb-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            As {dados.totalWebPath.toLocaleString('pt-BR')} referências patológicas do WebPath/Utah estão indexadas aqui
            junto às demais coleções. Abra um capítulo para pesquisar títulos traduzidos, separar macro e microscopia e
            estudar o roteiro morfológico no Domine Aqui.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dados.capitulosWebPath.map((capitulo) => (
              <li key={capitulo.id}>
                <Link
                  href={rotaDoCapituloWebPathUtah(capitulo.id)}
                  className="group flex h-full min-h-[112px] flex-col rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-teal-600/50"
                >
                  <span className="flex items-start justify-between gap-3">
                    <Microscope className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {capitulo.total} referências
                    </span>
                  </span>
                  <span className="mt-2 text-sm font-bold leading-snug">{capitulo.nome}</span>
                  <span className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">{capitulo.descricao}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-400">
                    Abrir capítulo
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="por-sistema" className="mt-10">
          <h2 id="por-sistema" className="mb-2 font-heading text-lg font-semibold">
            Por sistema
          </h2>
          <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            A organização editorial combina sistema, assunto e tipo de material. Cada sistema abre um sumário paginado
            de capítulos visuais.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {dados.sistemas.map((sistema) => (
              <li key={sistema.id}>
                <Link
                  href={rotaDoSistema(sistema.id)}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-teal-600/50"
                >
                  <span className="text-sm font-semibold">{sistema.nome}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {sistema.entradas.toLocaleString('pt-BR')} capítulos
                    <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="fontes" className="mt-10">
          <h2 id="fontes" className="mb-3 font-heading text-lg font-semibold">
            De onde vêm as referências
          </h2>
          <ul className="space-y-2">
            {dados.fontes.map((fonte) => (
              <li key={fonte.id} className="rounded-xl border border-border bg-card p-3.5">
                <p className="text-sm font-bold">{fonte.nome}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{fonte.atribuicaoCatalogada}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-bold">Política inicial: </span>
                  {fonte.politicaInicial}
                </p>
                <a
                  href={fonte.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11px] font-bold transition-colors hover:border-teal-600/50"
                >
                  Consultar acervo original
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="falhas" className="mt-10">
          <h2 id="falhas" className="mb-2 font-heading text-lg font-semibold">
            O que não pôde ser catalogado
          </h2>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {dados.falhasDeColeta} páginas de origem não puderam ser lidas durante a coleta. Elas estão registradas no
            catálogo e <strong>não foram preenchidas com suposições</strong>: uma página ilegível é uma lacuna
            conhecida, não conteúdo a inventar.
          </p>
        </section>
      </div>
    </div>
  )
}

/**
 * Página de inventário de uma entrada catalogada.
 *
 * Não é uma página de doença. O título aqui é o **nome catalogado** — o texto
 * que estava na página do atlas de origem, que às vezes é um diagnóstico e às
 * vezes é um parágrafo inteiro capturado do corpo da página. Ele é exibido como
 * veio, e a interface diz o que ele é. Transformá-lo em capítulo científico
 * seria criar diagnóstico a partir de nome de arquivo.
 *
 * A paginação continua no servidor: `?pagina=` (e os filtros) são lidos aqui e
 * repassados à rota, que lê só o fragmento comprimido da entrada.
 */
export function EntradaDoAtlas({ id }: { id: string }) {
  const busca = useSearchParams()
  const url = rotaDosDadosDaHistopatologia(['atlas', id], {
    pagina: busca?.get('pagina'),
    modalidade: busca?.get('modalidade'),
    coloracao: busca?.get('coloracao'),
  })
  return (
    <PortaoDaHistologia<DadosDaEntradaDoAtlas> url={url}>
      {(dados) => <ConteudoDaEntrada dados={dados} />}
    </PortaoDaHistologia>
  )
}

function ConteudoDaEntrada({ dados }: { dados: DadosDaEntradaDoAtlas }) {
  const { entrada, inventario, pagina, totalDePaginas, doenca, fonte } = dados
  useTituloDaAba(entrada.nome, ' — Histopatologia | Manual da Histologia')

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada />
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
              <Link href={rotaDoSistema(entrada.sistemaId)} className="transition-colors hover:text-foreground">
                {dados.sistema ?? entrada.sistemaCatalogado}
              </Link>
            </li>
          </ol>
        </nav>

        <header className="mb-5">
          <p className="editorial-mark mb-2">Capítulo visual · {entrada.capituloNome}</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{entrada.nomeCompleto}</h1>

          {entrada.descricao && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{entrada.descricao}</p>
          )}

          <ul className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            <li className="rounded-full border border-border bg-card px-2.5 py-1 font-semibold">
              {entrada.midias.toLocaleString('pt-BR')} {entrada.midias === 1 ? 'lâmina catalogada' : 'lâminas catalogadas'}
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
              A edição do Domine Aqui reuniu esta e outras entradas sob o nome canônico <strong>{doenca.nome}</strong>. O
              capítulo traz mecanismo, roteiro por aumento e diferenciais; esta página continua sendo o registro de
              proveniência.
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
              {dados.avisoDeAcervoIndisponivel}
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Mostrando {inventario.itens.length} de {inventario.total.toLocaleString('pt-BR')} lâminas disponíveis
                para abrir e ampliar aqui.
                {inventario.descartadasPorAllowlist > 0 && <> Itens técnicos sem imagem foram omitidos.</>}
              </p>
              <GaleriaRemota
                midias={inventario.itens}
                titulo={`Referências de ${entrada.nome}`}
                porPagina={dados.porPagina}
                comFiltros
              />
            </>
          )}

          {totalDePaginas > 1 && (
            <nav className="mt-4 flex flex-wrap items-center justify-between gap-2" aria-label="Paginação do inventário">
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

        <section aria-labelledby="fonte-entrada" className="mt-10 border-t border-border pt-5">
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
  )
}
