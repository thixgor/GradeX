import 'server-only'

/**
 * Acesso às coleções das monitorias e utilidades de servidor comuns às rotas.
 */

import { ObjectId, type Db } from 'mongodb'
import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/mongodb'
import type { User } from '@/lib/types'
import type {
  AceiteTermos,
  Anuncio,
  Bloqueio,
  CodigoConfirmacao,
  Contrato,
  DevolucaoAvulsa,
  Lancamento,
  Mensagem,
  Participacao,
  Payout,
  Pergunta,
  Repasse,
  Reserva,
  Tutor,
} from './tipos'

export const COLECOES = {
  tutores: 'monitorias_tutores',
  anuncios: 'monitorias_anuncios',
  perguntas: 'monitorias_perguntas',
  reservas: 'monitorias_reservas',
  mensagens: 'monitorias_mensagens',
  participacoes: 'monitorias_participacoes',
  bloqueios: 'monitorias_bloqueios',
  repasses: 'monitorias_repasses',
  lancamentos: 'monitorias_lancamentos',
  payouts: 'monitorias_payouts',
  termos: 'monitorias_termos_aceites',
  contratos: 'monitorias_contratos',
  codigos: 'monitorias_codigos',
  cotasGratis: 'monitorias_cotas_gratis',
  devolucoes: 'monitorias_devolucoes',
} as const

export function colecoes(db: Db) {
  return {
    tutores: db.collection<Tutor>(COLECOES.tutores),
    anuncios: db.collection<Anuncio>(COLECOES.anuncios),
    perguntas: db.collection<Pergunta>(COLECOES.perguntas),
    reservas: db.collection<Reserva>(COLECOES.reservas),
    mensagens: db.collection<Mensagem>(COLECOES.mensagens),
    participacoes: db.collection<Participacao>(COLECOES.participacoes),
    bloqueios: db.collection<Bloqueio>(COLECOES.bloqueios),
    repasses: db.collection<Repasse>(COLECOES.repasses),
    lancamentos: db.collection<Lancamento>(COLECOES.lancamentos),
    payouts: db.collection<Payout>(COLECOES.payouts),
    termos: db.collection<AceiteTermos>(COLECOES.termos),
    contratos: db.collection<Contrato>(COLECOES.contratos),
    codigos: db.collection<CodigoConfirmacao>(COLECOES.codigos),
    cotasGratis: db.collection<{ alunoId: string; tutorId: string; reservaId: string; em: Date }>(COLECOES.cotasGratis),
    devolucoes: db.collection<DevolucaoAvulsa>(COLECOES.devolucoes),
    users: db.collection<User>('users'),
  }
}

export async function obterColecoes() {
  return colecoes(await getDb())
}

export function oid(id: string): ObjectId {
  return new ObjectId(id)
}

/** `_id` de um documento como string. */
export function idDe(doc: { _id?: unknown } | null | undefined): string {
  return doc?._id ? String(doc._id) : ''
}

export function erro(status: number, mensagem: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: mensagem, ...extra }, { status })
}

/** 404 para "não existe" e para "não é seu": não confirmamos a existência de recurso alheio. */
export const naoEncontrado = () => erro(404, 'Não encontrado.')

export function ipDe(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'desconhecido'
  )
}

export function userAgentDe(request: NextRequest): string {
  return (request.headers.get('user-agent') || '').slice(0, 300)
}

export async function lerJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function primeiroNome(nome: string): string {
  return (nome || '').trim().split(/\s+/)[0] || 'Usuário'
}

/** Erro de chave duplicada do Mongo (índice único). */
export function ehDuplicada(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.domineaqui.com.br').replace(/\/$/, '')
}
