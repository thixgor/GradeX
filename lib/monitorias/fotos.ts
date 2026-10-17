import 'server-only'

import { del } from '@vercel/blob'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { avatarPorId, retratoQueVence, type Avatar } from './avatares'
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
 * Grava o retrato da CONTA (users.avatar) e, se a pessoa já é monitora, o do
 * perfil de monitor também: uma foto só, escolhida no /profile ou no painel.
 * Recebe o retrato já validado pelo catálogo; a URL nunca vem do cliente.
 */
export async function definirRetratoDaConta(userId: string, escolhido: Avatar): Promise<void> {
  const db = await getDb()
  const c = colecoes(db)
  const agora = new Date()
  const [, tutor] = await Promise.all([
    db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { avatar: escolhido.id } }),
    c.tutores.findOneAndUpdate(
      { userId },
      { $set: { avatar: escolhido.id, fotoUrl: escolhido.url, updatedAt: agora } },
      { returnDocument: 'before', projection: { fotoUrl: 1 } },
    ),
  ])
  if (tutor?.fotoUrl && tutor.fotoUrl !== escolhido.url) await apagarFotoEnviada(tutor.fotoUrl)
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

/** Sobe quando a regra de `retratoQueVence` mudar: todos os monitores são conferidos de novo. */
const VERSAO_DA_CONFERENCIA = 1

/**
 * Varredura: deixa o retrato do perfil de monitor igual ao da conta (o mesmo do
 * /profile e da sala de aula). Daqui para frente `definirRetratoDaConta` já grava
 * os dois juntos; isto acerta os dados antigos, em lotes, uma vez por monitor.
 */
export async function sincronizarRetratos(lote: number): Promise<number> {
  const db = await getDb()
  const c = colecoes(db)
  const tutores = await c.tutores
    .find({ retratoConferido: { $ne: VERSAO_DA_CONFERENCIA } } as any, { projection: { userId: 1, avatar: 1 } })
    .limit(lote)
    .toArray()
  if (!tutores.length) return 0
  const ids = tutores.map((t) => t.userId).filter((id) => ObjectId.isValid(id))
  const contas = await db
    .collection('users')
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }, { projection: { avatar: 1 } })
    .toArray()
  const avatarDaConta = new Map(contas.map((u) => [String(u._id), u.avatar as string | undefined]))
  const agora = new Date()
  const nosMonitores: any[] = []
  const nasContas: any[] = []
  let acertados = 0
  for (const t of tutores) {
    const vence = avatarDaConta.has(t.userId) ? retratoQueVence(avatarDaConta.get(t.userId), t.avatar) : null
    const $set: Record<string, unknown> = { retratoConferido: VERSAO_DA_CONFERENCIA }
    if (vence?.monitor) Object.assign($set, { avatar: vence.monitor.id, fotoUrl: vence.monitor.url, updatedAt: agora })
    if (vence?.conta) nasContas.push({ updateOne: { filter: { _id: new ObjectId(t.userId) }, update: { $set: { avatar: vence.conta.id } } } })
    if (vence) acertados++
    nosMonitores.push({ updateOne: { filter: { _id: t._id }, update: { $set } } })
  }
  await Promise.all([c.tutores.bulkWrite(nosMonitores, { ordered: false }), nasContas.length ? db.collection('users').bulkWrite(nasContas, { ordered: false }) : null])
  return acertados
}
