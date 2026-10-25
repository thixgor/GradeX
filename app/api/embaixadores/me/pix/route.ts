import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { COLECAO_EMBAIXADORES, type Embaixador } from '@/lib/embaixadores/servidor'
import { validarChavePix } from '@/lib/embaixadores/regras'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * O embaixador remunerado cadastra (ou troca) a chave PIX onde recebe os
 * repasses. Só ele grava a própria chave; o admin apenas lê.
 */
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const limite = await checkRateLimit(session.userId, 'embaixador_pix', 20, 60_000)
  if (!limite.success) return NextResponse.json({ error: 'Muitas tentativas. Espere um minuto.' }, { status: 429 })

  let corpo: any
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const resultado = validarChavePix({ tipo: corpo?.tipo, chave: corpo?.chave, titular: corpo?.titular })
  if (!resultado.ok) return NextResponse.json({ error: resultado.erro }, { status: 400 })

  try {
    const db = await getDb()
    const embaixadores = db.collection<Embaixador>(COLECAO_EMBAIXADORES)
    const embaixador = await embaixadores.findOne({ userId: session.userId }, { projection: { tipo: 1 } })
    if (!embaixador) return NextResponse.json({ error: 'Você não é embaixador.' }, { status: 403 })
    if (embaixador.tipo !== 'remunerado') {
      return NextResponse.json({ error: 'A chave PIX é só para embaixadores remunerados.' }, { status: 403 })
    }
    const agora = new Date()
    const pix = { ...resultado.chave, atualizadoEm: agora }
    await embaixadores.updateOne({ userId: session.userId }, { $set: { pix, atualizadoEm: agora } })
    return NextResponse.json({ pix: { ...pix, atualizadoEm: agora.toISOString() } })
  } catch (erro) {
    console.error('[embaixadores/me/pix]', erro)
    return NextResponse.json({ error: 'Não foi possível salvar a chave.' }, { status: 500 })
  }
}
