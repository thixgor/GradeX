import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { NextResponse } from 'next/server'

/**
 * Compressão feita DENTRO da função, antes de a resposta sair dela.
 *
 * ## Por que não deixar para a borda
 *
 * No Vercel o Next roda em "minimal mode" e não comprime nada: a função
 * entrega o corpo cru, e quem comprime é o CDN, já do lado de fora. Só que o
 * trecho função → CDN é cobrado como Fast Origin Transfer (US$ 0,41/GB em
 * São Paulo) sobre os bytes que saem da função — crus. A compressão da borda
 * economiza o trecho CDN → aluno; a daqui economiza os dois.
 *
 * E o CDN só comprime uma lista fechada de tipos. `application/pdf` não está
 * nela: a página de um PDF de texto (cabeçalhos de objeto, tabela xref,
 * dicionários) viajava inteira sem compressão, quando cai pela metade com
 * gzip. Num PDF escaneado o ganho é ~1% (o JPEG já é comprimido) e aí não se
 * comprime — ver `economiaMinima`.
 *
 * Uma resposta que já sai com `Content-Encoding` atravessa o CDN como está.
 */

export type Codificacao = 'br' | 'gzip'

/**
 * A melhor codificação que o cliente aceita. Respeita `q=0` ("não quero").
 * Sem `Accept-Encoding` (curl, bots), nada é comprimido.
 */
export function codificacaoAceita(headers: Headers): Codificacao | null {
  const aceitas = new Set<string>()
  for (const parte of (headers.get('accept-encoding') || '').toLowerCase().split(',')) {
    const [nome, ...params] = parte.trim().split(';')
    const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
    if (q && Number(q.slice(2)) === 0) continue
    if (nome) aceitas.add(nome.trim())
  }
  if (aceitas.has('br')) return 'br'
  if (aceitas.has('gzip')) return 'gzip'
  return null
}

function comprimir(bytes: Uint8Array, codificacao: Codificacao): Uint8Array {
  if (codificacao === 'br') {
    // Qualidade 5: perto do gzip em velocidade, ~10% menor no texto.
    return brotliCompressSync(bytes, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 5,
        [constants.BROTLI_PARAM_SIZE_HINT]: bytes.byteLength,
      },
    })
  }
  return gzipSync(bytes, { level: 6 })
}

export interface OpcoesDeCompressao {
  /** Abaixo disto não compensa (o cabeçalho do formato come o ganho). */
  tamanhoMinimo?: number
  /** Fração mínima de economia para mandar comprimido. */
  economiaMinima?: number
}

/**
 * O corpo a enviar e os cabeçalhos que acompanham. Sem ganho que valha, o
 * corpo volta como veio e só `Vary` é acrescentado (a resposta continua
 * dependendo do `Accept-Encoding` para caches intermediários).
 */
export function corpoComprimido(
  headers: Headers,
  bytes: Uint8Array,
  opcoes: OpcoesDeCompressao = {}
): { corpo: Uint8Array; cabecalhos: Record<string, string> } {
  const tamanhoMinimo = opcoes.tamanhoMinimo ?? 1024
  const economiaMinima = opcoes.economiaMinima ?? 0.04
  const cabecalhos: Record<string, string> = { Vary: 'Accept-Encoding' }
  const codificacao = codificacaoAceita(headers)
  if (!codificacao || bytes.byteLength < tamanhoMinimo) {
    return { corpo: bytes, cabecalhos: { ...cabecalhos, 'Content-Length': String(bytes.byteLength) } }
  }

  const comprimido = comprimir(bytes, codificacao)
  if (comprimido.byteLength > bytes.byteLength * (1 - economiaMinima)) {
    return { corpo: bytes, cabecalhos: { ...cabecalhos, 'Content-Length': String(bytes.byteLength) } }
  }
  return {
    corpo: comprimido,
    cabecalhos: {
      ...cabecalhos,
      'Content-Encoding': codificacao,
      'Content-Length': String(comprimido.byteLength),
    },
  }
}

/**
 * `NextResponse.json`, comprimido quando o cliente aceita. Para as rotas que
 * devolvem listas grandes: JSON costuma cair a 10–20% do tamanho.
 */
export function jsonComprimido(
  request: { headers: Headers },
  dados: unknown,
  init: { status?: number; headers?: HeadersInit } = {}
): NextResponse {
  const texto = new TextEncoder().encode(JSON.stringify(dados))
  const { corpo, cabecalhos } = corpoComprimido(request.headers, texto)
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  for (const [nome, valor] of Object.entries(cabecalhos)) headers.set(nome, valor)
  return new NextResponse(Buffer.from(corpo), { status: init.status ?? 200, headers })
}
