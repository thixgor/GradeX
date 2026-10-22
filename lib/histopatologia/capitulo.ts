import 'server-only'

import type { AplicacaoDeMecanismoResolvida } from '@/components/histopatologia/tipos'
import { doencaZoomDoCapitulo } from '@/lib/histologia/catalogo'
import { laminasDaDoenca, resumirPatologica } from '@/lib/histopatologia-zoom/repositorio'

import { LISTA_DE_FONTES } from './direitos'
import { referenciasVisuaisDaDoenca } from './editorial/referencias-visuais'
import { MIDIAS_PRINCIPAIS_MAXIMO, paraExibicao } from './midia'
import { MECANISMOS_PUBLICADOS, SISTEMAS_COM_CONTAGEM, obterDoenca } from './repositorio'
import { BASE, BASE_HISTOLOGIA, rotaDaDoenca, rotaDoSistema } from './rotas'
import { jsonLdDeDoenca, jsonLdDeTrilha } from './seo'
import type { MidiaExibivel } from './esquemas'
import type { DadosDoCapitulo } from './capitulo-tipos'

/**
 * O capítulo de uma doença, como dado — o que
 * `app/manual-clinico/histologia/histopatologia/doencas/[slug]/page.tsx`
 * montava no servidor, agora entregue por
 * `/api/manual-clinico/histologia/histopatologia/doencas/<slug>` depois do
 * portão. Um único fragmento é carregado (`obterDoenca`), como antes.
 */
export async function dadosDoCapitulo(slug: string): Promise<DadosDoCapitulo | null> {
  const fragmento = await obterDoenca(slug)
  if (!fragmento) return null

  const { doenca, entradas, galeria } = fragmento
  const sistema = SISTEMAS_COM_CONTAGEM.find((s) => s.id === doenca.sistemaId)
  const c = doenca.conteudo

  const mecanismos: AplicacaoDeMecanismoResolvida[] = c.mecanismoPatologicoGeral
    .map((aplicacao) => {
      const mecanismo = MECANISMOS_PUBLICADOS.find((m) => m.id === aplicacao.mecanismoId)
      return mecanismo ? { ...mecanismo, aplicacao: aplicacao.aplicacao } : null
    })
    .filter((m): m is AplicacaoDeMecanismoResolvida => m !== null)

  /* Seleção editorial primeiro; o restante da galeria vem depois, agrupado. */
  const selecionadas = new Map(doenca.midiasPrincipais.map((m) => [m.midiaId, m]))
  const midiasExibiveis: MidiaExibivel[] = galeria
    .map((midia) => {
      const selecao = selecionadas.get(midia.id)
      return paraExibicao(midia, {
        aumento: selecao?.aumento,
        legendaEditorial: selecao?.legendaEditorial,
        alt: selecao?.alt,
      })
    })
    .filter((m): m is MidiaExibivel => m !== null)

  const referenciasVisuaisExternas = referenciasVisuaisDaDoenca(doenca.slug)

  // A mesma doença com lâmina de zoom: entra no alto do capítulo, e a capa
  // dela é o que o "Continue estudando" mostra.
  const doencaComZoom = doencaZoomDoCapitulo(doenca.slug)
  const laminas = doencaComZoom ? laminasDaDoenca(doencaComZoom.id) : []
  const primeiraLamina = laminas[0]

  const trilha = [
    { titulo: 'Manual da Histologia', caminho: BASE_HISTOLOGIA },
    { titulo: 'Histopatologia', caminho: BASE },
    ...(sistema ? [{ titulo: sistema.nome, caminho: rotaDoSistema(sistema.id) }] : []),
    { titulo: doenca.nome, caminho: rotaDaDoenca(doenca.slug) },
  ]

  return {
    doenca,
    sistema: sistema ? { id: sistema.id, nome: sistema.nome } : null,
    trilha,
    mecanismos,
    principais: midiasExibiveis.filter((m) => selecionadas.has(m.id)).slice(0, MIDIAS_PRINCIPAIS_MAXIMO),
    restantes: midiasExibiveis.filter((m) => !selecionadas.has(m.id)),
    referenciasVisuaisExternas,
    entradas,
    fontes: LISTA_DE_FONTES.filter(
      (fonte) =>
        entradas.some((entrada) => entrada.fonteId === fonte.id) ||
        referenciasVisuaisExternas.some((referencia) => referencia.fonteId === fonte.id),
    ).map((fonte) => ({
      id: fonte.id,
      creditoCurto: fonte.creditoCurto,
      atribuicaoCatalogada: fonte.atribuicaoCatalogada,
      url: fonte.url,
    })),
    zoom: doencaComZoom
      ? {
          doenca: doencaComZoom.id,
          laminas: laminas.map((l) => {
            const resumo = resumirPatologica(l)
            return {
              slug: l.slug,
              nome: l.subtitulo ?? l.titulo,
              miniatura: resumo.miniatura,
              achadosPresentes: resumo.achadosPresentes,
            }
          }),
        }
      : null,
    mecanismosDoRodape: doenca.mecanismoIds.flatMap((id) => {
      const mecanismo = MECANISMOS_PUBLICADOS.find((m) => m.id === id)
      return mecanismo ? [{ id, nome: mecanismo.nome }] : []
    }),
    visto: {
      href: rotaDaDoenca(doenca.slug),
      titulo: doenca.nome,
      categoria: `Histopatologia · ${sistema?.nome ?? 'Doença'}`,
      area: 'histopatologia',
      imagem: primeiraLamina ? resumirPatologica(primeiraLamina).miniatura : null,
      zoom: Boolean(primeiraLamina),
    },
    jsonLd: [jsonLdDeDoenca(doenca), jsonLdDeTrilha(trilha)],
  }
}
