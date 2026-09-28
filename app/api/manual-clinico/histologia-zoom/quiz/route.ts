import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { montarQuiz, type ConfiguracaoDoQuiz, type TipoDeQuestao } from '@/lib/histologia-zoom/quiz/banco'
import { SISTEMAS } from '@/lib/histologia-zoom/sistemas'
import type { SistemaId } from '@/lib/histologia-zoom/tipos'

/** Monta um quiz de identificação. Nada na resposta revela lâmina nem gabarito. */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SISTEMAS_VALIDOS = new Set<string>(SISTEMAS.map((s) => s.id))

export async function POST(requisicao: Request) {
  if (!histologiaHabilitada() || !(await histologiaLiberadaNaRequisicao())) {
    return new NextResponse(null, { status: 404 })
  }
  let corpo: Partial<ConfiguracaoDoQuiz>
  try {
    corpo = await requisicao.json()
  } catch {
    return NextResponse.json({ erro: 'corpo inválido' }, { status: 400 })
  }
  const tipos = (Array.isArray(corpo.tipos) ? corpo.tipos : []).filter((t): t is TipoDeQuestao =>
    ['estrutura', 'orgao'].includes(t as string),
  )
  const formato = ['objetiva', 'escrita', 'misto'].includes(corpo.formato as string)
    ? (corpo.formato as ConfiguracaoDoQuiz['formato'])
    : 'objetiva'
  const sistemas = (Array.isArray(corpo.sistemas) ? corpo.sistemas : []).filter((s): s is SistemaId =>
    SISTEMAS_VALIDOS.has(s as string),
  )
  const quantidade = Math.min(100, Math.max(1, Math.floor(Number(corpo.quantidade) || 20)))
  const semente = Number.isFinite(Number(corpo.semente)) ? Number(corpo.semente) >>> 0 : (Math.random() * 2 ** 32) >>> 0

  const questoes = await montarQuiz({ tipos, formato, sistemas, quantidade, semente })
  return NextResponse.json({ questoes }, { headers: { 'Cache-Control': 'private, no-store' } })
}
