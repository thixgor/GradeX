import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { exigirAdmin } from '@/lib/embaixadores/admin'
import { salvarConfigDoPrograma } from '@/lib/embaixadores/servidor'
import { linkSeguro } from '@/lib/embaixadores/regras'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Salva a configuração do programa (sócio, cupom padrão, janela, formulário). */
export async function PUT(request: NextRequest) {
  const { session, recusa } = await exigirAdmin()
  if (recusa) return recusa
  let corpo: any
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  if (typeof corpo?.linkInscricao === 'string' && corpo.linkInscricao.trim() && !linkSeguro(corpo.linkInscricao.trim())) {
    return NextResponse.json({ error: 'O link do formulário precisa ser um caminho do site (/forms/…) ou uma URL https.' }, { status: 400 })
  }
  try {
    const db = await getDb()
    const config = await salvarConfigDoPrograma(db, corpo || {}, session!.userId)
    return NextResponse.json({ config })
  } catch (erro) {
    console.error('[admin/embaixadores/config]', erro)
    return NextResponse.json({ error: 'Erro ao salvar a configuração' }, { status: 500 })
  }
}
