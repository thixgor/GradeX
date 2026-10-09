import 'server-only'

/**
 * Códigos de 6 dígitos por e-mail — a "caneta" da assinatura eletrônica e a
 * trava da troca de chave PIX.
 *
 * Por que e-mail e não senha: quem entra com Google não tem senha. E por que
 * um código e não só um clique: quem pegou a sessão de outra pessoa (cookie
 * roubado, computador emprestado) não tem a caixa de entrada dela.
 *
 * Guardamos só o hash (`lib/login-code.ts`), com validade de 10 min e no
 * máximo 5 tentativas — chute aleatório tem 5 em 1.000.000 de chance.
 */

import { generateLoginCode, hashLoginCode, verifyLoginCode } from '@/lib/login-code'
import { obterColecoes } from './db'

const VALIDADE_MS = 10 * 60_000
const MAX_TENTATIVAS = 5

export type FinalidadeCodigo = `assinar:${string}` | 'pix' | `oferta:${string}`

export async function emitirCodigo(userId: string, finalidade: FinalidadeCodigo): Promise<string> {
  const { codigos } = await obterColecoes()
  const codigo = generateLoginCode()
  const agora = new Date()
  await codigos.updateOne(
    { userId, finalidade },
    {
      $set: { hash: hashLoginCode(codigo), tentativas: 0, expiraEm: new Date(agora.getTime() + VALIDADE_MS), createdAt: agora },
    },
    { upsert: true },
  )
  return codigo
}

export type ResultadoCodigo = 'ok' | 'invalido' | 'expirado' | 'bloqueado'

/** Confere e CONSOME o código (uso único). */
export async function conferirCodigo(userId: string, finalidade: FinalidadeCodigo, codigo: string): Promise<ResultadoCodigo> {
  const { codigos } = await obterColecoes()
  const limpo = String(codigo || '').replace(/\D/g, '')
  // Incrementa a tentativa ANTES de conferir: duas requisições paralelas não
  // ganham tentativas extras.
  const doc = await codigos.findOneAndUpdate(
    { userId, finalidade },
    { $inc: { tentativas: 1 } },
    { returnDocument: 'after' },
  )
  if (!doc) return 'invalido'
  if (doc.expiraEm.getTime() < Date.now()) return 'expirado'
  if (doc.tentativas > MAX_TENTATIVAS) return 'bloqueado'
  if (limpo.length !== 6 || !verifyLoginCode(limpo, doc.hash)) return 'invalido'
  await codigos.deleteOne({ _id: doc._id })
  return 'ok'
}

export function mensagemDoCodigo(resultado: ResultadoCodigo): string {
  if (resultado === 'expirado') return 'O código expirou. Peça um novo.'
  if (resultado === 'bloqueado') return 'Muitas tentativas. Peça um novo código.'
  return 'Código incorreto.'
}
