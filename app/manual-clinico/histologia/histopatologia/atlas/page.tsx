import Link from 'next/link'
import { ArrowLeft, ArrowRight, Microscope } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BuscaDaHistopatologia } from '@/components/histopatologia/busca'
import { LISTA_DE_FONTES } from '@/lib/histopatologia/direitos'
import { SISTEMAS_COM_CONTAGEM, TOTAIS } from '@/lib/histopatologia/repositorio'
import { BASE, rotaDoCapituloWebPathUtah, rotaDoSistema } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'
import {
  CAPITULOS_WEBPATH_UTAH,
  TOTAL_ENTRADAS_WEBPATH_UTAH,
} from '@/lib/histopatologia/webpath-utah/catalogo'

/**
 * Atlas de inventário.
 *
 * O que esta página é: um índice único das entradas catalogadas em todas as
 * coleções, com busca e navegação por sistema e capítulo. O que ela **não** é:
 * uma galeria carregada de uma vez. Renderizar
 * 202 mil cartões de mídia não é acesso ao acervo, é a aparência dele — e as
 * mídias de cada entrada são carregadas sob demanda, na página da entrada.
 *
 * A distinção entre entrada catalogada e doença canônica aparece na interface,
 * não só nos dados: uma entrada é um título de página do atlas de origem, e
 * pode ser uma doença, uma variante, uma técnica ou um caso. Apresentá-las
 * todas como diagnósticos seria inventar 2.917 entidades nosológicas.
 */

export const revalidate = 86400

const TOTAL_DE_ITENS_DO_ATLAS = TOTAIS.capitulosVisuais + TOTAL_ENTRADAS_WEBPATH_UTAH

export const metadata = metadadosDoModulo({
  titulo: 'Atlas de lâminas',
  descricao:
    `${TOTAL_DE_ITENS_DO_ATLAS} capítulos e referências visuais, incluindo ` +
    `${TOTAL_ENTRADAS_WEBPATH_UTAH} registros do WebPath/Utah no mesmo atlas do Domine Aqui.`,
  caminho: `${BASE}/atlas`,
})

export default function PaginaDoAtlas() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
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
              {TOTAL_DE_ITENS_DO_ATLAS.toLocaleString('pt-BR')} itens de atlas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Explore doenças, lesões, controles, colorações, marcadores, peças e casos dos atlas da
              FCM/Unicamp, Histopathology Atlas e WebPath/Utah em um único índice. Os títulos foram
              normalizados para leitura, e cada item preserva identificação e crédito da coleção
              responsável.
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
              As {TOTAL_ENTRADAS_WEBPATH_UTAH.toLocaleString('pt-BR')} referências patológicas do
              WebPath/Utah estão indexadas aqui junto às demais coleções. Abra um capítulo para
              pesquisar títulos traduzidos, separar macro e microscopia e estudar o roteiro
              morfológico no Domine Aqui.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CAPITULOS_WEBPATH_UTAH.map((capitulo) => (
                <li key={capitulo.id}>
                  <Link
                    href={rotaDoCapituloWebPathUtah(capitulo.id)}
                    className="group flex h-full min-h-[112px] flex-col rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-teal-600/50"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <Microscope
                        className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400"
                        aria-hidden
                      />
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {capitulo.total} referências
                      </span>
                    </span>
                    <span className="mt-2 text-sm font-bold leading-snug">{capitulo.nome}</span>
                    <span className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                      {capitulo.descricao}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-400">
                      Abrir capítulo
                      <ArrowRight
                        className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
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
              A organização editorial combina sistema, assunto e tipo de material. Cada sistema
              abre um sumário paginado de capítulos visuais.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {SISTEMAS_COM_CONTAGEM.map((sistema) => (
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
              {LISTA_DE_FONTES.map((fonte) => (
                <li key={fonte.id} className="rounded-xl border border-border bg-card p-3.5">
                  <p className="text-sm font-bold">{fonte.nome}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {fonte.atribuicaoCatalogada}
                  </p>
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
              {TOTAIS.falhasDeColeta} páginas de origem não puderam ser lidas durante a coleta. Elas
              estão registradas no catálogo e <strong>não foram preenchidas com suposições</strong>:
              uma página ilegível é uma lacuna conhecida, não conteúdo a inventar.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
