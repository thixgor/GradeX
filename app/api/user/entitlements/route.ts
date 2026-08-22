/**
 * O que o plano desta conta libera, e quanto dele já foi usado.
 *
 * Existe para a interface parar de adivinhar. Antes das permissões modulares,
 * "é assinante" respondia tudo e o cliente podia decidir sozinho; agora duas
 * contas com o mesmo cargo têm áreas diferentes, e só o servidor sabe quais.
 *
 * O que sai daqui é para MOSTRAR — esconder um botão, exibir o saldo, trocar o
 * texto do bloqueio. Toda decisão de acesso continua sendo tomada na rota que
 * entrega o recurso; nada aqui é autorização.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  montarResumoDePermissoes,
  resolverPermissoesPorUsuario,
} from '@/lib/plan-entitlements-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const contexto = await resolverPermissoesPorUsuario(db, session.userId)
    const resumo = await montarResumoDePermissoes(db, contexto)

    return NextResponse.json(resumo, {
      // Saldo de cota muda a cada ação da própria pessoa — servir uma cópia
      // guardada mostraria um número que já não é verdade.
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('Erro ao montar permissões do usuário:', error)
    return NextResponse.json({ error: 'Erro ao obter permissões' }, { status: 500 })
  }
}
