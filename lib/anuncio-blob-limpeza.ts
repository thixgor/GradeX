import 'server-only'

import { del } from '@vercel/blob'
import type { Db } from 'mongodb'
import { urlsDaMidia, type AnuncioMidia } from '@/lib/anuncio-midia'

/**
 * Faxina do Blob: arquivo de anúncio que nenhum anúncio usa mais é apagado.
 *
 * Sem isto, cada troca de arte ou de vídeo deixava o arquivo antigo pago no
 * armazenamento para sempre — e vídeo pesa. A regra é conservadora: só apaga o
 * que (1) está no store público, (2) mora em `anuncios/` e (3) não aparece em
 * NENHUM documento da coleção, nem mesmo em outro anúncio que reaproveitou a
 * mesma URL colada à mão.
 */

const BLOB_DE_ANUNCIO = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/anuncios\//i

export function ehBlobDeAnuncio(url: unknown): url is string {
  return typeof url === 'string' && BLOB_DE_ANUNCIO.test(url)
}

interface DocComMidia {
  imagemUrl?: string
  midia?: AnuncioMidia
  midiaCelular?: AnuncioMidia
  modalMidia?: AnuncioMidia
}

/** Todas as URLs de arquivo que um anúncio usa. */
export function urlsDoAnuncio(doc: DocComMidia | null | undefined): string[] {
  if (!doc) return []
  return [
    doc.imagemUrl,
    ...urlsDaMidia(doc.midia),
    ...urlsDaMidia(doc.midiaCelular),
    ...urlsDaMidia(doc.modalMidia),
  ].filter((u): u is string => !!u)
}

const CAMPOS_DE_URL = [
  'imagemUrl',
  'midia.url',
  'midia.posterUrl',
  'midiaCelular.url',
  'midiaCelular.posterUrl',
  'modalMidia.url',
  'modalMidia.posterUrl',
] as const

/**
 * Apaga do Blob as candidatas que nenhum anúncio referencia. Nunca lança: uma
 * falha aqui deixa um arquivo órfão, não pode derrubar o salvamento.
 */
export async function apagarMidiasSemUso(db: Db, candidatas: string[]): Promise<void> {
  const urls = Array.from(new Set(candidatas.filter(ehBlobDeAnuncio)))
  if (urls.length === 0) return

  const token = process.env.BLOB_READ_WRITE_TOKEN_MIDIA
  if (!token) return

  try {
    const emUsoDocs = await db
      .collection('anuncios')
      .find(
        { $or: CAMPOS_DE_URL.map((campo) => ({ [campo]: { $in: urls } })) },
        { projection: { imagemUrl: 1, midia: 1, midiaCelular: 1, modalMidia: 1 } },
      )
      .toArray()

    const emUso = new Set(emUsoDocs.flatMap((doc) => urlsDoAnuncio(doc as DocComMidia)))
    const apagar = urls.filter((url) => !emUso.has(url))
    if (apagar.length > 0) await del(apagar, { token })
  } catch (error) {
    console.warn('[anuncios] não foi possível apagar mídia sem uso', error)
  }
}
