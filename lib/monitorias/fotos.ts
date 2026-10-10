import 'server-only'

import { del } from '@vercel/blob'
import { getDb } from '@/lib/mongodb'
import { avatarPorId } from './avatares'
import { colecoes } from './db'

/** Foto que veio de envio (Vercel Blob), e não do catálogo de retratos. */
export function ehFotoEnviada(url: string | null | undefined): boolean {
  return !!url && /\.blob\.vercel-storage\.com\//i.test(url)
}

/** Apaga do Blob uma foto enviada antes da galeria. Nunca lança. */
export async function apagarFotoEnviada(url: string): Promise<boolean> {
  if (!ehFotoEnviada(url)) return false
  const token = process.env.BLOB_READ_WRITE_TOKEN_MIDIA
  if (!token) return false
  try {
    await del(url, { token })
    return true
  } catch (err) {
    console.warn('[monitorias] não foi possível apagar foto enviada', err)
    return false
  }
}

/**
 * Varredura: monitores que ainda têm foto enviada (de antes da galeria). A foto
 * sai do Blob e do perfil; quem já escolheu um retrato fica com ele. Também
 * acerta a URL de quem tem retrato, se o catálogo mudou o endereço.
 */
export async function limparFotosEnviadas(lote: number): Promise<number> {
  const c = colecoes(await getDb())
  const antigos = await c.tutores
    .find({ fotoUrl: { $regex: 'blob\\.vercel-storage\\.com' } } as any, { projection: { fotoUrl: 1, avatar: 1 } })
    .limit(lote)
    .toArray()
  let n = 0
  for (const t of antigos) {
    await apagarFotoEnviada(t.fotoUrl!)
    const retrato = avatarPorId(t.avatar)
    await c.tutores.updateOne(
      { _id: t._id as any, fotoUrl: t.fotoUrl },
      retrato ? { $set: { fotoUrl: retrato.url, updatedAt: new Date() } } : { $unset: { fotoUrl: '' }, $set: { updatedAt: new Date() } },
    )
    n++
  }
  return n
}
