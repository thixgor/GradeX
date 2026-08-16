import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { secureApiEndpoint, isValidObjectId } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Favoritos de aula (§21).
 *
 * Coleção própria (`aulas_favoritos`), um registro por (usuário, aula), e não um
 * array dentro do usuário: o array cresceria dentro de um documento que é lido
 * em toda requisição autenticada, e favoritar uma aula passaria a custar uma
 * reescrita do usuário inteiro.
 *
 * Diferente das Ferramentas Clínicas, onde o favorito mora no aparelho: aula é
 * conteúdo pago, o aluno assiste no computador e no celular, e um favorito que
 * não atravessa aparelhos seria descoberto como defeito na primeira troca.
 */

const COLECAO = 'aulas_favoritos'

const Schema = z.object({
  aulaId: z.string().min(1),
  /** Ausente alterna; presente força o estado (para a tela ser idempotente). */
  favorito: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'READ',
    auth: { requireAuth: true },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  try {
    const db = await getDb()
    const usuarioId = security.session!.userId

    const registros = await db
      .collection(COLECAO)
      .find({ usuarioId }, { projection: { aulaId: 1 } })
      .limit(500)
      .toArray()

    return NextResponse.json(
      { aulaIds: registros.map((r) => String(r.aulaId)) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[aulas/favoritos] erro ao listar:', error)
    return NextResponse.json({ error: 'Erro ao carregar favoritos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'WRITE',
    auth: { requireAuth: true },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  if (!isValidObjectId(parsed.data.aulaId)) {
    return NextResponse.json({ error: 'Aula inválida' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const usuarioId = security.session!.userId
    const { aulaId } = parsed.data

    /*
     * Favoritar não checa acesso de propósito.
     *
     * Salvar uma aula que ainda está bloqueada é justamente o gesto de "quero
     * ver isto quando eu tiver" — e a lista de favoritos passa pelo mesmo motor
     * de acesso que todo o resto na hora de exibir, então guardar o id aqui não
     * libera nada. O que a rota NÃO pode fazer é confirmar que a aula existe
     * para alguém sondando ids, e por isso ela não responde diferente para id
     * inexistente.
     */
    const existente = await db.collection(COLECAO).findOne({ usuarioId, aulaId })
    const querFavoritar = parsed.data.favorito ?? !existente

    if (querFavoritar) {
      await db
        .collection(COLECAO)
        .updateOne(
          { usuarioId, aulaId },
          { $set: { usuarioId, aulaId, criadoEm: existente?.criadoEm || new Date() } },
          { upsert: true },
        )
    } else {
      await db.collection(COLECAO).deleteOne({ usuarioId, aulaId })
    }

    return NextResponse.json({ success: true, favorito: querFavoritar })
  } catch (error) {
    console.error('[aulas/favoritos] erro ao salvar:', error)
    return NextResponse.json({ error: 'Erro ao salvar favorito' }, { status: 500 })
  }
}
