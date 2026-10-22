import 'server-only'

import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'

import { jsonComprimido } from '@/lib/resposta-comprimida'

/**
 * Resposta das rotas que entregam o conteúdo das páginas do módulo.
 *
 * As páginas da Histologia são cascos estáticos (saem do CDN) e o conteúdo
 * chega por rota, **depois do portão**. Esta é a forma comum dessas respostas:
 *
 * - `private, no-cache`: depende de quem pergunta, então nunca entra em cache
 *   compartilhado; e o navegador sempre pergunta de novo, para quem perdeu o
 *   acesso não continuar lendo da cópia local;
 * - **ETag** sobre o próprio JSON: o conteúdo só muda a cada deploy, então a
 *   volta a uma página já vista responde `304` sem corpo — nada de Fast Origin
 *   Transfer. O 304 só sai depois de o portão ter liberado esta requisição;
 * - comprimida dentro da função (`jsonComprimido`), porque é o byte que sai
 *   dela que é cobrado.
 */
export function respostaDoAcervo(request: Request, dados: unknown): NextResponse {
  const etag = `W/"${createHash('sha1').update(JSON.stringify(dados)).digest('base64url')}"`
  const cabecalhos = { 'Cache-Control': 'private, no-cache', ETag: etag }

  const pedidas = request.headers.get('if-none-match')
  if (pedidas && pedidas.split(',').some((valor) => valor.trim() === etag)) {
    return new NextResponse(null, { status: 304, headers: cabecalhos })
  }
  return jsonComprimido(request, dados, { headers: cabecalhos })
}

/** O "não" das rotas de conteúdo: 404 seco, como o resto do módulo. */
export function semAcessoAoAcervo(): NextResponse {
  return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } })
}
