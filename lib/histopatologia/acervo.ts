import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'

import type { EntradaCatalogada, MidiaCatalogada, MidiaExibivel } from './esquemas'
import { esquemaMidiaCatalogada } from './esquemas'
import { midiaElegivel, ordenarParaGaleria, paraExibicao } from './midia'

/**
 * Leitura sob demanda do catálogo-fonte — **somente no servidor**.
 *
 * ## Por que ler o `.json.gz` em vez de derivar tudo no build
 *
 * As 202.593 referências ocupam 5,7 MB comprimidos em `public/patologia`.
 * Expandi-las em derivados JSON em `data/` acrescentaria dezenas de megabytes de
 * conteúdo **duplicado** ao repositório — o mesmo dado, duas vezes, com duas
 * chances de divergir. Como o inventário completo de uma entrada só é consultado
 * quando alguém abre aquela entrada específica, ele é lido aqui, do próprio
 * catálogo, e mantido em cache no processo.
 *
 * O pipeline continua sendo o dono dos **contadores** e das doenças curadas: ele
 * é quem prova, no build, que os números fecham. Este módulo serve a cauda longa
 * das 2.892 entradas ainda sem curadoria editorial.
 *
 * ## O que ele não faz
 *
 * Não faz requisição de rede, não toca em bytes de imagem, não escreve nada. Lê
 * um arquivo local de texto comprimido e devolve objetos JavaScript — e devolve
 * inventário vazio, com estado explícito, se o arquivo não estiver disponível no
 * ambiente. O módulo continua navegável com o acervo indisponível; era um
 * requisito, não um efeito colateral.
 */

const RAIZ_DO_CATALOGO = path.join(process.cwd(), 'public/patologia/catalogo')

/**
 * Cache de fragmentos já descompactados, por processo.
 *
 * Limitado a três fragmentos: cada um custa entre 8 MB e 10 MB descompactado, e
 * uma função serverless com memória modesta não sobrevive a dezoito deles. Três
 * cobre o padrão de navegação real (abrir uma entrada e percorrer as vizinhas,
 * que compartilham fragmento) sem transformar cache em vazamento.
 */
const LIMITE_DE_CACHE = 3
const cache = new Map<string, MidiaCatalogada[]>()

async function lerFragmento(nome: string): Promise<MidiaCatalogada[]> {
  const emCache = cache.get(nome)
  if (emCache) {
    // Renova a posição na ordem de inserção: o Map preserva ordem, e reinserir
    // transforma-o num LRU sem estrutura adicional.
    cache.delete(nome)
    cache.set(nome, emCache)
    return emCache
  }

  // O nome vem de `fragmentosDeMidia`, campo validado do catálogo, mas ele
  // chega aqui depois de passar por uma rota — então é tratado como entrada não
  // confiável. Só o formato exato do manifesto passa.
  if (!/^midias\/[a-z0-9-]+\.json\.gz$/.test(nome)) return []

  let bytes: Buffer
  try {
    bytes = await readFile(path.join(RAIZ_DO_CATALOGO, nome))
  } catch {
    // Acervo ausente neste ambiente. A interface mostra o estado; não quebra.
    return []
  }

  const cru = JSON.parse(gunzipSync(bytes).toString('utf8')) as unknown[]
  const registros: MidiaCatalogada[] = []
  for (const item of cru) {
    const resultado = esquemaMidiaCatalogada.safeParse(item)
    if (resultado.success) registros.push(resultado.data)
  }

  cache.set(nome, registros)
  while (cache.size > LIMITE_DE_CACHE) {
    const maisAntigo = cache.keys().next().value
    if (maisAntigo === undefined) break
    cache.delete(maisAntigo)
  }
  return registros
}

export interface PaginaDeInventario {
  itens: MidiaExibivel[]
  total: number
  /** Total antes da filtragem por modalidade/coloração. */
  totalCatalogado: number
  /** Mídias descartadas por estarem fora da allowlist de domínios da fonte. */
  descartadasPorAllowlist: number
  /** O acervo-fonte está acessível neste ambiente? */
  acervoDisponivel: boolean
}

export interface FiltrosDeInventario {
  modalidade?: string
  coloracao?: string
  apenasLaminaVirtual?: boolean
  pagina?: number
  porPagina?: number
}

/**
 * Inventário de mídias de uma entrada catalogada, paginado e já passado pelo
 * portão de direitos.
 *
 * Recebe a entrada inteira (e não só o id) porque é ela que declara em quais
 * fragmentos suas mídias vivem — é assim que se lê um arquivo em vez de dezoito.
 */
export async function inventarioDaEntrada(
  entrada: Pick<EntradaCatalogada, 'id' | 'fragmentosDeMidia'>,
  filtros: FiltrosDeInventario = {},
): Promise<PaginaDeInventario> {
  const { pagina = 1, porPagina = 24 } = filtros

  let acervoDisponivel = false
  const brutas: MidiaCatalogada[] = []
  for (const nome of entrada.fragmentosDeMidia) {
    const registros = await lerFragmento(nome)
    if (registros.length > 0) acervoDisponivel = true
    for (const midia of registros) {
      if (midia.patologiaId === entrada.id) brutas.push(midia)
    }
  }

  const totalCatalogado = brutas.length
  const elegiveis = brutas.filter(midiaElegivel)
  const descartadasPorAllowlist = totalCatalogado - elegiveis.length

  const filtradas = elegiveis.filter((m) => {
    if (filtros.modalidade && m.modalidade !== filtros.modalidade) return false
    if (filtros.coloracao && m.coloracao !== filtros.coloracao) return false
    if (filtros.apenasLaminaVirtual && m.modalidade !== 'Lâmina virtual (WSI)') return false
    return true
  })

  const ordenadas = ordenarParaGaleria(filtradas)
  const inicio = Math.max(0, (pagina - 1) * porPagina)
  const itens = ordenadas
    .slice(inicio, inicio + porPagina)
    .map((m) => paraExibicao(m))
    .filter((m): m is MidiaExibivel => m !== null)

  return {
    itens,
    total: filtradas.length,
    totalCatalogado,
    descartadasPorAllowlist,
    acervoDisponivel,
  }
}

/** Facetas disponíveis para os filtros da galeria de uma entrada. */
export async function facetasDaEntrada(
  entrada: Pick<EntradaCatalogada, 'id' | 'fragmentosDeMidia'>,
): Promise<{ modalidades: string[]; coloracoes: string[] }> {
  const modalidades = new Set<string>()
  const coloracoes = new Set<string>()
  for (const nome of entrada.fragmentosDeMidia) {
    for (const midia of await lerFragmento(nome)) {
      if (midia.patologiaId !== entrada.id) continue
      if (!midiaElegivel(midia)) continue
      modalidades.add(midia.modalidade)
      if (midia.coloracao && midia.coloracao !== 'Não informado') coloracoes.add(midia.coloracao)
    }
  }
  return {
    modalidades: [...modalidades].sort(),
    coloracoes: [...coloracoes].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  }
}

export const AVISO_ACERVO_INDISPONIVEL =
  'O catálogo de referências não está disponível neste ambiente. A navegação e o conteúdo ' +
  'editorial continuam funcionando; o inventário de lâminas desta entrada volta assim que o ' +
  'acervo for publicado.'
