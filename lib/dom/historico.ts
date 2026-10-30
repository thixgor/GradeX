import 'server-only'

/**
 * Histórico das conversas com o Dom no servidor — para o admin revisar
 * (`/admin/dom/conversas`): qualidade das respostas, abuso, dúvidas comuns.
 *
 * Leve de propósito (o pedido foi "extremamente leve"):
 * - um documento por conversa, com as últimas 40 falas (`$slice`);
 * - no máximo 25 conversas por pessoa: abrir a 26ª apaga as mais antigas;
 * - gravado depois da resposta sair (`after`), sem somar tempo à conversa.
 *
 * A cópia do aparelho (`components/dom/arquivo-de-conversas.ts`) continua
 * sendo a que a pessoa vê e apaga; esta é a da equipe — apagar no aparelho
 * não apaga aqui (senão quem tenta um exploit apagaria a prova).
 */

import type { Db } from 'mongodb'
import type { ModoDoDom } from './config'

export const COLECAO_CONVERSAS = 'dom_conversas'
export const MAX_CONVERSAS_POR_PESSOA = 25
export const MAX_FALAS_GUARDADAS = 40
const MAX_CARACTERES_DA_FALA = 4000

export interface FalaGuardada {
  papel: 'aluno' | 'dom'
  texto: string
  em: Date
  /** Motor que respondeu (gemini, gateway, local). Só nas falas do Dom. */
  motor?: string
  /** Tipo do ataque, quando a guarda barrou a mensagem do aluno. */
  alerta?: string
}

export interface ConversaNoServidor {
  userId: string
  conversaId: string
  nome: string
  email: string
  modo: ModoDoDom
  titulo: string
  criadaEm: Date
  atualizadaEm: Date
  falas: FalaGuardada[]
  totalDeFalas: number
  alertas: number
  rota?: string
  materialId?: string
}

/** Id que o navegador manda (`novoIdDeConversa`); qualquer outra coisa vira o "avulso" do dia. */
export function idDeConversaValido(v: unknown): string | null {
  return typeof v === 'string' && /^[a-z0-9]{6,32}$/i.test(v) ? v : null
}

export function tituloDaConversa(mensagem: string, tema?: string | null): string {
  if (tema) return `Socrático: ${tema}`.slice(0, 80)
  const t = mensagem.replace(/\s+/g, ' ').trim()
  return t.length > 60 ? `${t.slice(0, 57)}…` : t || 'Conversa'
}

export interface TrocaDoDom {
  userId: string
  nome: string
  email: string
  conversaId: string | null
  modo: ModoDoDom
  tema?: string | null
  aluno: string
  dom: string
  motor: string
  alerta?: string | null
  rota?: string
  materialId?: string
}

/** Grava uma pergunta + resposta. Erros só vão para o log: o histórico nunca derruba a conversa. */
export async function registrarTroca(db: Db, t: TrocaDoDom): Promise<void> {
  try {
    const agora = new Date()
    const conversaId = t.conversaId || `avulsa${agora.toISOString().slice(0, 10).replace(/-/g, '')}`
    const falas: FalaGuardada[] = [
      { papel: 'aluno', texto: t.aluno.slice(0, MAX_CARACTERES_DA_FALA), em: agora, ...(t.alerta ? { alerta: t.alerta } : {}) },
      { papel: 'dom', texto: t.dom.slice(0, MAX_CARACTERES_DA_FALA), em: agora, motor: t.motor },
    ]
    const r = await db.collection<ConversaNoServidor>(COLECAO_CONVERSAS).updateOne(
      { userId: t.userId, conversaId },
      {
        $setOnInsert: { userId: t.userId, conversaId, modo: t.modo, titulo: tituloDaConversa(t.aluno, t.tema), criadaEm: agora },
        $set: { atualizadaEm: agora, nome: t.nome, email: t.email, ...(t.rota ? { rota: t.rota } : {}), ...(t.materialId ? { materialId: t.materialId } : {}) },
        $push: { falas: { $each: falas, $slice: -MAX_FALAS_GUARDADAS } },
        $inc: { totalDeFalas: 2, alertas: t.alerta ? 1 : 0 },
      },
      { upsert: true },
    )
    // Conversa nova: as que passaram de 25 saem (as mais antigas).
    if (r.upsertedCount) await podarConversas(db, t.userId)
  } catch (erro) {
    console.error('[dom] histórico:', erro instanceof Error ? erro.message : erro)
  }
}

export async function podarConversas(db: Db, userId: string): Promise<number> {
  const sobras = await db
    .collection(COLECAO_CONVERSAS)
    .find({ userId })
    .sort({ atualizadaEm: -1 })
    .skip(MAX_CONVERSAS_POR_PESSOA)
    .project({ _id: 1 })
    .toArray()
  if (!sobras.length) return 0
  const r = await db.collection(COLECAO_CONVERSAS).deleteMany({ _id: { $in: sobras.map((s) => s._id) } })
  return r.deletedCount
}
