/**
 * Varredura genérica de documentos do Mongo em busca de URLs de imagem.
 *
 * ## Por que genérica, e não uma lista de campos
 *
 * As imagens do site estão em toda parte: `imagemUrl` da questão,
 * `imagensAlternativas[].url`, `coverImage` da prova, `capa.imagem` da aula,
 * `imagens_mecanismo[]` da patologia, `images[]` do produto da loja,
 * `blocks[].cardImageUrl` da campanha de leads, `front.image` do flashcard,
 * `prizeImageUrl` do sorteio — e, pior, embeds `!image[legenda](url)` e
 * `<img src>` dentro de campos de texto longo que ninguém chamaria de campo de
 * imagem.
 *
 * Manter um catálogo desses caminhos significaria que toda seção nova nasce
 * fora da migração e volta a depender do Imgur em silêncio. Percorrer o
 * documento inteiro custa CPU (barata, e só durante a migração) e não esquece
 * nada — nem o campo que ainda não existe.
 *
 * ## O que sai daqui
 *
 * Um `$set` em dot-notation com apenas as folhas que mudaram. Nada de reescrever
 * o documento inteiro: um `replaceOne` sobrescreveria qualquer escrita
 * concorrente feita entre a leitura e a gravação, e a migração roda com o site
 * no ar.
 */

import { encontrarImagensExternas, substituirUrls, type OpcoesDeClassificacao } from './urls.ts'

/** Uma URL externa encontrada, e onde ela está dentro do documento. */
export interface Achado {
  /** Caminho em dot-notation, pronto para `$set` (ex.: `imagensAlternativas.0.url`). */
  caminho: string
  url: string
}

export interface OpcoesDeVarredura extends OpcoesDeClassificacao {
  /** Profundidade máxima de recursão. Protege contra documentos patológicos. */
  profundidadeMaxima?: number
  /** Campos de primeiro nível a ignorar (ex.: histórico bruto de importação). */
  camposIgnorados?: readonly string[]
}

const PROFUNDIDADE_PADRAO = 12

/**
 * Só descemos em objeto simples e array.
 *
 * `Date`, `ObjectId`, `Binary`, `Decimal128` e afins têm protótipo próprio e são
 * pulados: não guardam URL e enumerar suas propriedades internas geraria
 * caminhos de `$set` que não existem no documento.
 */
function ehObjetoSimples(valor: unknown): boolean {
  if (valor === null || typeof valor !== 'object') return false
  const proto = Object.getPrototypeOf(valor)
  return proto === Object.prototype || proto === null
}

/** Chaves que não podem virar caminho de `$set` sem corromper a atualização. */
function chaveUtilizavel(chave: string): boolean {
  return chave.length > 0 && !chave.startsWith('$') && !chave.includes('.')
}

/** Toda URL de imagem externa do documento, com o caminho de cada uma. */
export function coletarUrls(documento: unknown, opcoes: OpcoesDeVarredura = {}): Achado[] {
  const achados: Achado[] = []
  const profundidadeMaxima = opcoes.profundidadeMaxima ?? PROFUNDIDADE_PADRAO
  const ignorados = new Set(opcoes.camposIgnorados || [])

  function visitar(valor: unknown, caminho: string, profundidade: number): void {
    if (profundidade > profundidadeMaxima) return

    if (typeof valor === 'string') {
      for (const url of encontrarImagensExternas(valor, opcoes)) {
        achados.push({ caminho, url })
      }
      return
    }

    if (Array.isArray(valor)) {
      for (let i = 0; i < valor.length; i += 1) {
        visitar(valor[i], caminho ? `${caminho}.${i}` : String(i), profundidade + 1)
      }
      return
    }

    if (ehObjetoSimples(valor)) {
      for (const [chave, filho] of Object.entries(valor as Record<string, unknown>)) {
        if (chave === '_id') continue
        if (!chaveUtilizavel(chave)) continue
        if (profundidade === 0 && ignorados.has(chave)) continue
        visitar(filho, caminho ? `${caminho}.${chave}` : chave, profundidade + 1)
      }
    }
  }

  visitar(documento, '', 0)
  return achados
}

export interface Reescrita {
  /** `$set` pronto: caminho → novo valor da folha. */
  sets: Record<string, string>
  /** Valor anterior de cada caminho, para o diário de reversão. */
  originais: Record<string, string>
  /** URLs efetivamente substituídas neste documento. */
  urlsSubstituidas: string[]
  /** URLs encontradas para as quais ainda não há caminho interno. */
  urlsPendentes: string[]
}

/**
 * Monta a atualização de um documento a partir do mapa `URL externa → caminho
 * interno`.
 *
 * Uma folha só entra no `$set` se **todas** as URLs dela estiverem no mapa? Não:
 * entra se pelo menos uma estiver, e as demais continuam como estão. Um campo de
 * texto com dez figuras não deve ficar refém da única que o Imgur apagou — as
 * nove que migraram passam a ser servidas por nós, e a décima aparece em
 * `urlsPendentes` do relatório.
 */
export function planejarReescrita(
  documento: unknown,
  mapa: Map<string, string>,
  opcoes: OpcoesDeVarredura = {},
): Reescrita {
  const achados = coletarUrls(documento, opcoes)
  const sets: Record<string, string> = {}
  const originais: Record<string, string> = {}
  const substituidas = new Set<string>()
  const pendentes = new Set<string>()

  const porCaminho = new Map<string, string[]>()
  for (const { caminho, url } of achados) {
    if (!mapa.has(url)) {
      pendentes.add(url)
      continue
    }
    const lista = porCaminho.get(caminho)
    if (lista) lista.push(url)
    else porCaminho.set(caminho, [url])
  }

  for (const [caminho, urls] of porCaminho) {
    const atual = lerCaminho(documento, caminho)
    if (typeof atual !== 'string') continue

    const parcial = new Map<string, string>()
    for (const url of urls) parcial.set(url, mapa.get(url) as string)

    const novo = substituirUrls(atual, parcial)
    if (novo === atual) continue

    sets[caminho] = novo
    originais[caminho] = atual
    for (const url of urls) substituidas.add(url)
  }

  return {
    sets,
    originais,
    urlsSubstituidas: Array.from(substituidas),
    urlsPendentes: Array.from(pendentes),
  }
}

/** Lê um caminho em dot-notation dentro do documento. `undefined` se não existir. */
export function lerCaminho(documento: unknown, caminho: string): unknown {
  let atual: unknown = documento
  for (const parte of caminho.split('.')) {
    if (atual === null || typeof atual !== 'object') return undefined
    atual = (atual as Record<string, unknown>)[parte]
  }
  return atual
}
