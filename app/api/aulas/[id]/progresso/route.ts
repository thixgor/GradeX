import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { lerProgresso, salvarBatida } from '@/lib/aulas/repositorio-progresso'
import { podeRetomar } from '@/lib/aulas/progresso'
import type { AulaPostagem } from '@/lib/types'
import { ObjectId, type Db } from 'mongodb'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Progresso do aluno numa aula.
 *
 * GET devolve onde ele parou; PUT registra uma batida do player.
 *
 * O PUT é chamado com frequência (a cada poucos segundos de reprodução), então
 * é deliberadamente barato: valida, grava um documento e responde. Nada de
 * agregação nem de leitura da árvore do curso aqui.
 */

const BatidaSchema = z.object({
  posicaoSegundos: z.number().min(0).max(60 * 60 * 24),
  duracaoSegundos: z.number().min(0).max(60 * 60 * 24).optional(),
})

/** Só quem pode assistir pode registrar progresso — senão dá para forjar conclusão de aula bloqueada. */
async function garantirAcesso(db: Db, aulaId: string, session: any) {
  const aula = await db.collection<AulaPostagem>('aulas_postagens').findOne({
    _id: new ObjectId(aulaId) as any,
  })
  if (!aula) return { erro: NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 }) }

  const usuario = await montarContextoDoUsuario(db, session)
  const veredito = avaliarAcessoAula(aula as any, usuario)
  if (!veredito.liberado) {
    return { erro: NextResponse.json({ error: 'Sem acesso a esta aula' }, { status: 403 }) }
  }
  return { aula }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const progresso = await lerProgresso(db, session.userId, params.id)

    return NextResponse.json({
      progresso,
      retomar: podeRetomar(progresso),
    })
  } catch (error) {
    console.error('[aulas/progresso] erro ao ler:', error)
    return NextResponse.json({ error: 'Erro ao ler progresso' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }
    const parsed = BatidaSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    const db = await getDb()
    const guarda = await garantirAcesso(db, params.id, session)
    if (guarda.erro) return guarda.erro

    const progresso = await salvarBatida(db, session.userId, params.id, parsed.data)
    return NextResponse.json({ progresso })
  } catch (error) {
    console.error('[aulas/progresso] erro ao salvar:', error)
    return NextResponse.json({ error: 'Erro ao salvar progresso' }, { status: 500 })
  }
}
