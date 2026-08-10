import 'server-only'

import type {
  EntradaBusca,
  FragmentoDeDoenca,
  MecanismoGeral,
  Relatorio,
  ResumoDeDoenca,
  ResumoDeEntrada,
  Sistema,
} from './esquemas'

import { FRAGMENTOS_DE_DOENCA, INVENTARIO_POR_SISTEMA } from './carregadores.gerado'
import { vinculosPorRotaNormal } from './editorial'

import doencasBrutas from '@/data/histopatologia/doencas.json'
import mecanismosBrutos from '@/data/histopatologia/mecanismos.json'
import relatorioBruto from '@/data/histopatologia/relatorio.json'
import sistemasBrutos from '@/data/histopatologia/sistemas.json'

/**
 * Acesso aos dados da Histopatologia — **somente no servidor**.
 *
 * Segue o padrão de `lib/histologia/repositorio.ts`, e pela mesma razão: o mapa
 * de `import()` em `carregadores.gerado.ts` é literal para que o rastreamento de
 * arquivos da Vercel enxergue cada especificador. Um `import()` com caminho
 * montado em variável funciona em desenvolvimento e devolve 404 em produção.
 *
 * O que **é** diferente aqui: os índices leves (doenças, sistemas, mecanismos)
 * são importados de cima, porque somam 20 KB e toda página precisa deles; os
 * inventários por sistema e os fragmentos de doença são carregados sob demanda,
 * um por requisição. Uma página de doença nunca toca o inventário de 738 KB do
 * sistema "não classificado", e a home não toca nenhum dos dois.
 *
 * Os `as` sobre os JSON são deliberados, como no módulo da Histologia: o
 * TypeScript infere `estado: string` onde o schema declara uma união fechada, e
 * nenhuma anotação faz um arquivo de dados provar sua própria forma. Quem prova
 * é `__tests__/histopatologia/dados.test.ts`, que roda cada arquivo contra o
 * schema Zod.
 */

export const SISTEMAS_COM_CONTAGEM = sistemasBrutos as unknown as Array<
  Sistema & { entradas: number; midias: number; doencas: number }
>
export const MECANISMOS_PUBLICADOS = mecanismosBrutos as unknown as MecanismoGeral[]
export const DOENCAS_RESUMIDAS = doencasBrutas as unknown as ResumoDeDoenca[]
export const RELATORIO = relatorioBruto as unknown as Relatorio

export const TOTAIS = {
  entradasCatalogadas: RELATORIO.catalogo.patologias,
  referenciasDeMidia: RELATORIO.catalogo.midias,
  fragmentos: RELATORIO.catalogo.fragmentos,
  doencas: DOENCAS_RESUMIDAS.length,
  doencasPublicadas: RELATORIO.editorial.doencasPublicadas,
  doencasEmRevisao: RELATORIO.editorial.doencasEmRevisao,
  sistemas: SISTEMAS_COM_CONTAGEM.length,
  mecanismos: MECANISMOS_PUBLICADOS.length,
  entradasConsolidadas: RELATORIO.editorial.entradasConsolidadas,
  entradasSemCuradoria: RELATORIO.editorial.entradasNaoConsolidadas,
  falhasDeColeta: RELATORIO.catalogo.falhasDeColeta,
}

/* ─────────────────────────── doenças ─────────────────────────── */

/**
 * Fragmento completo de uma doença: conteúdo científico, entradas consolidadas e
 * galeria curada. Devolve `null` para slug inexistente — quem chama transforma
 * isso em 404, sem inventar página vazia.
 */
export async function obterDoenca(slug: string): Promise<FragmentoDeDoenca | null> {
  const carregar = FRAGMENTOS_DE_DOENCA[slug]
  if (!carregar) return null
  return (await carregar()).default as FragmentoDeDoenca
}

export function listarSlugsDeDoenca(): string[] {
  return Object.keys(FRAGMENTOS_DE_DOENCA)
}

export function resumoDaDoenca(slug: string): ResumoDeDoenca | undefined {
  return DOENCAS_RESUMIDAS.find((d) => d.slug === slug)
}

export function doencasDoSistema(sistemaId: string): ResumoDeDoenca[] {
  return DOENCAS_RESUMIDAS.filter((d) => d.sistemaId === sistemaId)
}

export function doencasDoMecanismo(mecanismoId: string): ResumoDeDoenca[] {
  return DOENCAS_RESUMIDAS.filter((d) => d.mecanismoIds.includes(mecanismoId))
}

/* ─────────────────────────── inventário ─────────────────────────── */

export async function obterInventario(sistemaId: string): Promise<ResumoDeEntrada[]> {
  const carregar = INVENTARIO_POR_SISTEMA[sistemaId]
  if (!carregar) return []
  return (await carregar()).default as ResumoDeEntrada[]
}

/**
 * Localiza uma entrada catalogada pelo id.
 *
 * Percorre os inventários por sistema em vez de manter um índice global de
 * 2.917 entradas carregado em memória. O id catalogado começa pelo `fonteId`,
 * mas não carrega o sistema — então não há como adivinhar o arquivo; a busca
 * varre os 14 inventários, e cada um é um `import()` cacheado pelo runtime após
 * a primeira leitura.
 */
export async function obterEntradaCatalogada(id: string): Promise<ResumoDeEntrada | null> {
  for (const sistemaId of Object.keys(INVENTARIO_POR_SISTEMA)) {
    const lista = await obterInventario(sistemaId)
    const achada = lista.find((e) => e.id === id)
    if (achada) return achada
  }
  return null
}

/* ─────────────────────────── busca ─────────────────────────── */

/**
 * Índice completo — doenças, sistemas, mecanismos **e** as 2.917 entradas
 * catalogadas. Fica no servidor: são 915 KB, e o navegador recebe apenas a
 * lista de resultados. O índice de cliente (7 KB) é servido pela rota de API
 * própria.
 */
export async function indiceDeBuscaDoServidor(): Promise<EntradaBusca[]> {
  const modulo = await import('@/data/histopatologia/busca-servidor.json')
  return modulo.default as unknown as EntradaBusca[]
}

export async function indiceDeBuscaDoCliente(): Promise<EntradaBusca[]> {
  const modulo = await import('@/data/histopatologia/busca-cliente.json')
  return modulo.default as unknown as EntradaBusca[]
}

/* ─────────────────── ponte com a Histologia normal ─────────────────── */

/**
 * Doenças que citam determinada rota do currículo de Histologia normal.
 *
 * É a metade "normal → patológico" do vínculo bidirecional, e ela é **derivada**
 * do que cada doença declara em `histologiaNormalDeReferencia`. Um segundo mapa
 * mantido à mão discordaria do primeiro na primeira doença nova.
 */
export function doencasRelacionadasA(caminhoNormal: string[] | string): Array<{
  slug: string
  nome: string
  estadoDeRevisao: ResumoDeDoenca['estadoDeRevisao']
}> {
  const chave = Array.isArray(caminhoNormal) ? caminhoNormal.join('/') : caminhoNormal
  const mapa = vinculosPorRotaNormal()

  // Casamento por prefixo: uma doença ancorada em "…/liver" também é relevante
  // na página de "…/liver/liver-3". O contrário não vale — uma doença ancorada
  // numa lâmina específica não aparece no índice do setor inteiro.
  const encontrados = new Map<string, { slug: string; nome: string }>()
  for (const [rota, doencas] of mapa) {
    if (chave === rota || chave.startsWith(`${rota}/`)) {
      for (const d of doencas) encontrados.set(d.slug, d)
    }
  }

  return [...encontrados.values()]
    .map((d) => ({
      ...d,
      estadoDeRevisao: resumoDaDoenca(d.slug)?.estadoDeRevisao ?? ('rascunho' as const),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function obterSistemaComContagem(id: string) {
  return SISTEMAS_COM_CONTAGEM.find((s) => s.id === id)
}

export function obterMecanismoPublicado(id: string): MecanismoGeral | undefined {
  return MECANISMOS_PUBLICADOS.find((m) => m.id === id)
}
