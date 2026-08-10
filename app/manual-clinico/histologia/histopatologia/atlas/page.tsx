import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BuscaDaHistopatologia } from '@/components/histopatologia/busca'
import { LISTA_DE_FONTES } from '@/lib/histopatologia/direitos'
import { SISTEMAS_COM_CONTAGEM, TOTAIS } from '@/lib/histopatologia/repositorio'
import { BASE, rotaDoSistema } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

/**
 * Atlas de inventário.
 *
 * O que esta página é: um índice honesto de 2.917 entradas catalogadas, com
 * busca e navegação por sistema. O que ela **não** é: uma galeria. Renderizar
 * 202 mil cartões de mídia não é acesso ao acervo, é a aparência dele — e as
 * mídias de cada entrada são carregadas sob demanda, na página da entrada.
 *
 * A distinção entre entrada catalogada e doença canônica aparece na interface,
 * não só nos dados: uma entrada é um título de página do atlas de origem, e
 * pode ser uma doença, uma variante, uma técnica ou um caso. Apresentá-las
 * todas como diagnósticos seria inventar 2.917 entidades nosológicas.
 */

export const revalidate = 86400

export const metadata = metadadosDoModulo({
  titulo: 'Atlas de lâminas',
  descricao:
    `${TOTAIS.capitulosVisuais} capítulos visuais e ` +
    `${TOTAIS.referenciasDeMidia} referências de lâmina organizadas para estudo no Domine Aqui.`,
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
              {TOTAIS.capitulosVisuais.toLocaleString('pt-BR')} capítulos visuais
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Explore doenças, lesões, controles, colorações, marcadores, peças e casos dos atlas da
              FCM/Unicamp e do Histopathology Atlas. Os títulos foram normalizados para leitura e as
              imagens abrem primeiro dentro do Domine Aqui; a identificação original permanece na
              área de crédito de cada capítulo.
            </p>
          </header>

          <BuscaDaHistopatologia
            variante="pagina"
            filtrosVisiveis
            autoFoco
            placeholder="adenocarcinoma, granuloma, necrose coagulativa, HE…"
          />

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
