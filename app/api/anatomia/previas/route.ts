import { NextRequest, NextResponse } from 'next/server'
import { MODELOS } from '@/lib/anatomia-3d/modelos'

/**
 * Miniaturas dos modelos 3D.
 *
 * A vitrine de Anatomia 3D mostrava um ícone genérico na capa de cada card — o
 * aluno só descobria a peça depois de abrir o modelo. O Sketchfab publica a
 * miniatura oficial de cada modelo pelo endpoint oEmbed, que é público e não
 * exige chave; esta rota busca essas miniaturas no servidor (o navegador do
 * aluno não precisa falar com o Sketchfab) e devolve um mapa `uid → imagem`.
 *
 * O cache é agressivo de propósito: a miniatura de um modelo publicado não muda,
 * e são ~100 modelos. Um mapa em memória serve as requisições seguintes da mesma
 * instância, e o `s-maxage` deixa a CDN guardar a resposta por um dia.
 */

export const runtime = 'nodejs'
export const revalidate = 86400

const UIDS_VALIDOS = new Set(MODELOS.map(modelo => modelo.sketchfabId).filter(Boolean) as string[])

/** Miniaturas já resolvidas nesta instância — inclusive as falhas, como `null`. */
const memoria = new Map<string, string | null>()

const TEMPO_LIMITE_MS = 4000
const LOTE = 8

async function buscarMiniatura(uid: string): Promise<string | null> {
  if (memoria.has(uid)) return memoria.get(uid) ?? null

  try {
    const alvo = `https://sketchfab.com/oembed?url=${encodeURIComponent(`https://sketchfab.com/models/${uid}`)}`
    const resposta = await fetch(alvo, {
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      next: { revalidate: 604800 },
    })
    if (!resposta.ok) {
      memoria.set(uid, null)
      return null
    }
    const dados = (await resposta.json()) as { thumbnail_url?: unknown }
    const url = typeof dados.thumbnail_url === 'string' ? dados.thumbnail_url : null
    // Só aceitamos a CDN do próprio Sketchfab: a resposta é de terceiro e vai
    // direto para o `src` de uma imagem no cliente.
    const valida = url && /^https:\/\/[a-z0-9-]+\.sketchfab\.com\//i.test(url) ? url : null
    memoria.set(uid, valida)
    return valida
  } catch {
    memoria.set(uid, null)
    return null
  }
}

export async function GET(request: NextRequest) {
  const pedidos = (request.nextUrl.searchParams.get('uids') || '')
    .split(',')
    .map(uid => uid.trim())
    .filter(uid => UIDS_VALIDOS.has(uid))

  const uids = pedidos.length > 0 ? pedidos.slice(0, 120) : [...UIDS_VALIDOS]
  const miniaturas: Record<string, string> = {}

  // Em lotes para não abrir cem conexões simultâneas contra o Sketchfab.
  for (let inicio = 0; inicio < uids.length; inicio += LOTE) {
    const fatia = uids.slice(inicio, inicio + LOTE)
    const resultados = await Promise.all(fatia.map(uid => buscarMiniatura(uid)))
    fatia.forEach((uid, posicao) => {
      const url = resultados[posicao]
      if (url) miniaturas[uid] = url
    })
  }

  return NextResponse.json(
    { miniaturas },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}
