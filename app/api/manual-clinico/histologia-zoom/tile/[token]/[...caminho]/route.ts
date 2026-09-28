import { NextResponse } from 'next/server'

import { HOSTS_DE_TILES, decifrar } from '@/lib/histologia-zoom/quiz/cifra'

/**
 * Proxy dos tiles do quiz de identificação.
 *
 * No quiz o aluno não pode descobrir a lâmina pelo endereço — e os tiles do
 * HistoViewer trazem o órgão no caminho ("…/imgsets/Kidney/Sample7/20x/12.jpg").
 * O navegador só vê `/tile/<token>/20x/12.jpg`; o token (AES-GCM) guarda a
 * origem real e só esta rota o abre.
 *
 * Edge e cache imutável: o mesmo tile é o mesmo token para sempre, então a CDN
 * responde a partir da segunda requisição sem chegar aqui.
 */

export const runtime = 'edge'

const SEGMENTO = /^[A-Za-z0-9_.-]+$/

export async function GET(_req: Request, { params }: { params: { token: string; caminho: string[] } }) {
  const origem = await decifrar(params.token)
  if (!origem) return new NextResponse(null, { status: 404 })

  let alvo: string
  if (origem.startsWith('!')) {
    alvo = origem.slice(1)
  } else {
    if (!params.caminho.every((s) => SEGMENTO.test(s) && s !== '..' && s !== '.')) {
      return new NextResponse(null, { status: 400 })
    }
    alvo = origem + params.caminho.join('/')
  }

  let url: URL
  try {
    url = new URL(alvo)
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  if (url.protocol !== 'https:' || !HOSTS_DE_TILES.has(url.host)) {
    return new NextResponse(null, { status: 403 })
  }

  const resposta = await fetch(url, {
    headers: { 'User-Agent': 'DomineAqui-Histologia/1.0 (+https://domineaqui.com.br)', Accept: 'image/*' },
  })
  if (!resposta.ok || !resposta.body) {
    return new NextResponse(null, { status: resposta.status === 404 ? 404 : 502 })
  }
  return new NextResponse(resposta.body, {
    headers: {
      'Content-Type': resposta.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
