import 'server-only'

/**
 * Avisos das monitorias: notificação no sino + e-mail, num lugar só.
 *
 * Cada evento (pedido novo, proposta, pagamento, repasse…) chama `avisar` com
 * o texto já pronto. O e-mail sai ANTES da rota responder (ver
 * `deliverTransactionalEmails`: em serverless não existe "depois").
 */

import { ObjectId } from 'mongodb'
import { deliverTransactionalEmails, sendMonitoriaEmail } from '@/lib/mail'
import { getDb } from '@/lib/mongodb'
import { appUrl } from './db'

export interface Aviso {
  userId: string
  titulo: string
  /** Frase curta do sino. */
  mensagem: string
  /** Caminho interno ("/monitorias/reservas/…"). */
  url: string
  email?: {
    assunto: string
    paragrafos: string[]
    linhas?: Array<[string, string]>
    botao?: string
    aviso?: string
    anexos?: Array<{ filename: string; content: Buffer | string; contentType: string }>
  }
}

export async function avisar(avisos: Aviso[]): Promise<void> {
  if (!avisos.length) return
  const db = await getDb()
  const agora = new Date()
  const ids = Array.from(new Set(avisos.map((a) => a.userId))).filter((id) => ObjectId.isValid(id))
  const [usuarios] = await Promise.all([
    db
      .collection('users')
      .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }, { projection: { email: 1, name: 1 } })
      .toArray(),
    db.collection('notifications').insertMany(
      avisos.map((a) => ({
        userId: a.userId,
        type: 'monitoria',
        title: a.titulo,
        message: a.mensagem,
        actionUrl: a.url,
        read: false,
        createdAt: agora,
      })),
    ),
  ])
  const porId = new Map(usuarios.map((u) => [String(u._id), u]))
  const envios = avisos
    .filter((a) => a.email && porId.get(a.userId)?.email)
    .map((a) => {
      const u = porId.get(a.userId)!
      return sendMonitoriaEmail({
        to: u.email,
        assunto: a.email!.assunto,
        titulo: a.titulo,
        saudacaoNome: u.name,
        paragrafos: a.email!.paragrafos,
        linhas: a.email!.linhas,
        aviso: a.email!.aviso,
        botao: { texto: a.email!.botao || 'Abrir no DomineAqui', url: `${appUrl()}${a.url}` },
        anexos: a.email!.anexos,
      })
    })
  await deliverTransactionalEmails(envios)
}

/** Alerta para a equipe (admins) no sino — divergências financeiras, por exemplo. */
export async function avisarEquipe(titulo: string, mensagem: string, url = '/admin/monitorias'): Promise<void> {
  const db = await getDb()
  const admins = await db.collection('users').find({ role: 'admin' }, { projection: { _id: 1 } }).limit(20).toArray()
  if (admins.length) await avisar(admins.map((a) => ({ userId: String(a._id), titulo, mensagem, url })))
}

/** Código de confirmação (assinatura / PIX) — só por e-mail, nunca no sino. */
export async function enviarCodigoPorEmail(input: {
  email: string
  nome: string
  codigo: string
  finalidade: string
}): Promise<boolean> {
  return sendMonitoriaEmail({
    to: input.email,
    assunto: `${input.codigo} é o seu código de confirmação`,
    titulo: 'Código de confirmação',
    saudacaoNome: input.nome,
    paragrafos: [
      `Use o código abaixo para ${input.finalidade}. Ele vale por 10 minutos e só pode ser usado uma vez.`,
      `Código: ${input.codigo}`,
    ],
    aviso: 'Não foi você? Ignore este e-mail e troque sua senha. Nunca passe este código para ninguém — nem para o suporte.',
  })
}
