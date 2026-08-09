import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { Lamina } from '@/components/histologia/lamina'
import { SecaoDoCurriculo } from '@/components/histologia/secao'
import { buildJsonLd } from '@/lib/seo'
import {
  LARGURA_LAMINA,
  LARGURA_MINIATURA,
  LARGURA_PREVIA,
  urlDaMidia,
  urlOtimizada,
} from '@/lib/histologia/midia'
import {
  RESUMO_DE_QUIZZES,
  obterFragmento,
  obterNo,
  obterPagina,
  vizinhas,
} from '@/lib/histologia/repositorio'
import { jsonLdDeLamina, jsonLdDeTrilha, metadadosDoModulo, rotaDaPagina } from '@/lib/histologia/seo'

/**
 * Rota única para as 1.524 páginas do currículo.
 *
 * **Sem `generateStaticParams`, deliberadamente.** Pré-renderizar 1.524 páginas
 * no primeiro build custaria dezenas de minutos e nada disso muda com
 * frequência. A rota é renderizada sob demanda e revalidada por ISR: a primeira
 * visita paga o custo, todas as outras leem do cache da borda.
 *
 * `dynamicParams` fica ligado (padrão) porque não há lista pré-declarada; rota
 * inexistente cai em `notFound()`, não em página vazia.
 *
 * A rota também **não** pode ser `force-static`: ela lê `?estrutura=` para abrir
 * a lâmina já com a camada certa ligada, vindo da busca. Com `revalidate` o
 * resultado ainda é cacheado por variante de URL.
 */

export const revalidate = 86400

interface Props {
  params: { slug: string[] }
  /**
   * `?estrutura=<id>` vem da busca por estrutura: abre a lâmina com a camada
   * correta já ligada e o dossiê aberto. Não prometemos centralizar o campo no
   * marcador — o acervo não fornece a geometria dele, e fingir um enquadramento
   * levaria o aluno ao lugar errado com ar de precisão.
   */
  searchParams: { estrutura?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pagina = await obterPagina(params.slug)
  if (!pagina) return { title: 'Página não encontrada — Manual da Histologia' }

  const imagem = pagina.base ? urlDaMidia(pagina.base) : null
  const trilha = pagina.trilha.map((t) => t.titulo).join(' › ')

  return metadadosDoModulo({
    titulo: pagina.titulo,
    descricao:
      pagina.descricaoOriginal ||
      `${pagina.titulo} no Manual da Histologia. ${trilha}. ` +
        `${pagina.overlays.filter((o) => o.classe === 'estrutura').length} estruturas marcadas.`,
    caminho: rotaDaPagina(pagina.caminho),
    imagem,
  })
}

export default async function PaginaDoCurriculo({ params, searchParams }: Props) {
  const pagina = await obterPagina(params.slug)
  if (!pagina) notFound()

  const no = obterNo(params.slug)

  /* ── Nó de índice: 204 páginas do acervo não são lâminas ── */
  if (pagina.tipo === 'secao') {
    return (
      <AppShell allowGuest showHeader={false} guestNotice={false}>
        <div className="surface-page min-h-screen">
          <SecaoDoCurriculo
            pagina={pagina}
            filhos={no?.filhos ?? []}
            miniaturas={await miniaturasDe(params.slug)}
          />
          <DadosEstruturados dados={jsonLdDeTrilha(pagina.trilha)} />
        </div>
      </AppShell>
    )
  }

  /* ── Lâmina ── */
  const irmas = await obterFragmento(params.slug)
  const bandeja = irmas
    .filter((p) => p.tipo === 'lamina' && p.base && ehIrma(p.caminho, pagina.caminho))
    .slice(0, 24)
    .map((p) => ({ rota: p.caminho.join('/'), titulo: p.titulo, miniatura: p.base }))

  const { anterior, proxima } = vizinhas(params.slug)
  const quizzes = RESUMO_DE_QUIZZES.filter((q) => pagina.quizzes.includes(q.slug))
  const imagem = pagina.base ? urlDaMidia(pagina.base) : null

  /*
   * Pré-carregamento da lâmina, emitido pelo servidor.
   *
   * O microscópio é `ssr: false` — ele precisa de `ResizeObserver` e das
   * dimensões naturais da imagem, que só existem no navegador. A consequência é
   * que, sem isto, a busca da imagem só começava depois de o JavaScript baixar,
   * o chunk do microscópio chegar e o componente hidratar: uma corrente em
   * série, e o aluno olhando para um retângulo cinza o tempo todo.
   *
   * Estas duas linhas quebram a corrente. O navegador enxerga o `preload` ainda
   * ao analisar o HTML e busca a imagem **em paralelo** com o JavaScript, de
   * modo que a prévia já está no cache quando o microscópio finalmente monta.
   */
  const preLamina = urlOtimizada(imagem, LARGURA_LAMINA)
  const prePrevia = urlOtimizada(imagem, LARGURA_PREVIA, 45)

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      {prePrevia && <link rel="preload" as="image" href={prePrevia} fetchPriority="high" />}
      {preLamina && <link rel="preload" as="image" href={preLamina} />}
      <div className="surface-page min-h-screen">
        <Lamina
          pagina={pagina}
          vizinhas={{
            anterior: anterior && { titulo: anterior.titulo, caminho: anterior.caminho },
            proxima: proxima && { titulo: proxima.titulo, caminho: proxima.caminho },
          }}
          bandeja={bandeja}
          quizzes={quizzes.map((q) => ({ slug: q.slug, titulo: q.titulo, questoes: q.questoes }))}
          estruturaInicial={
            // Só aceitamos o parâmetro se ele nomear uma camada que existe nesta
            // lâmina. Vindo da URL, é entrada não confiável.
            pagina.overlays.some((o) => o.id === searchParams.estrutura)
              ? searchParams.estrutura
              : undefined
          }
        />
        <DadosEstruturados dados={jsonLdDeLamina(pagina, imagem)} />
        <DadosEstruturados dados={jsonLdDeTrilha(pagina.trilha)} />
      </div>
    </AppShell>
  )
}

/** Lâminas do mesmo pai — é o conjunto que a bandeja do microscópio oferece. */
function ehIrma(candidata: string[], atual: string[]): boolean {
  if (candidata.length !== atual.length) return false
  return candidata.slice(0, -1).join('/') === atual.slice(0, -1).join('/')
}

async function miniaturasDe(caminho: string[]) {
  const paginas = await obterFragmento(caminho)
  const mapa: Record<string, string> = {}
  for (const p of paginas) {
    if (!p.base) continue
    // São miniaturas de índice, exibidas a poucas dezenas de pixels. Servir a
    // lâmina original de 1 MB em cada uma tornava o índice de setor a página
    // mais pesada do módulo.
    const url = urlOtimizada(urlDaMidia(p.base), LARGURA_MINIATURA, 60)
    if (url) mapa[p.caminho.join('/')] = url
  }
  return mapa
}

function DadosEstruturados({ dados }: { dados: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // `buildJsonLd` escapa `<`, então nada aqui pode fechar a tag e injetar
      // markup — é a mesma função que o resto do aplicativo usa.
      dangerouslySetInnerHTML={{ __html: buildJsonLd(dados) }}
    />
  )
}
