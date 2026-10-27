import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import type { PerfilAntifraude } from './antifraude'

/**
 * Telefone e data de cadastro do comprador logado, para o antifraude do
 * Mercado Pago (ver lib/payments/antifraude.ts). Só no cartão, só uma leitura
 * por `_id` com projeção. Nunca lança nem segura a cobrança: qualquer falha ou
 * demora devolve `undefined` e o pagamento segue sem esses dados.
 */
export async function perfilAntifraudeDoComprador(
  userId: string | null | undefined,
  opcoes: { hasCardToken: boolean; telefoneInformado?: string }
): Promise<PerfilAntifraude | undefined> {
  if (!opcoes.hasCardToken) return undefined
  // Telefone digitado no checkout (compra sem login, entrega) vale quando o
  // cadastro não tem um.
  const informado = (opcoes.telefoneInformado || '').trim() || undefined
  if (!userId || !ObjectId.isValid(userId)) return informado ? { phone: informado } : undefined
  const perfil = await lerDoCadastro(userId)
  if (!perfil) return informado ? { phone: informado } : undefined
  return { ...perfil, phone: perfil.phone || informado }
}

async function lerDoCadastro(userId: string): Promise<PerfilAntifraude | undefined> {
  try {
    const leitura = (async () => {
      const db = await getDb()
      const user = await db
        .collection('users')
        .findOne({ _id: new ObjectId(userId) as any }, { projection: { phone: 1, createdAt: 1 } })
      if (!user) return undefined
      const registeredAt = user.createdAt ? new Date(user.createdAt) : undefined
      return {
        phone: typeof user.phone === 'string' ? user.phone : undefined,
        registeredAt: registeredAt && !Number.isNaN(registeredAt.getTime()) ? registeredAt : undefined,
      }
    })()
    let timer: ReturnType<typeof setTimeout> | undefined
    const limite = new Promise<undefined>(resolve => {
      timer = setTimeout(() => resolve(undefined), 1500)
    })
    try {
      return await Promise.race([leitura.catch(() => undefined), limite])
    } finally {
      if (timer) clearTimeout(timer)
    }
  } catch {
    return undefined
  }
}
